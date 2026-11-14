#!/usr/bin/env python3
"""
Colab Router doctor: finds out WHY your setup is not working, using real evidence
(state.json, logs/orchestrator.log, the live gateway). Safe by design:
  - read-only (changes nothing)
  - never prints keys, tokens, passkeys or your tunnel URL
Run:  python scripts/doctor.py
"""
import json, os, re, sys, time, urllib.request, urllib.error
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = os.environ.get("COLAB_ROUTER_ROOT") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_env():
    """Reads .env quietly. Real environment variables win. Values are never printed."""
    p = os.path.join(ROOT, ".env")
    if os.path.exists(p):
        with open(p, encoding="utf-8-sig") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

def read_state():
    try:
        with open(os.path.join(ROOT, "state.json"), encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

TS = re.compile(r"^(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d)")
def read_log_tail(n=400):
    p = os.path.join(ROOT, "logs", "orchestrator.log")
    if not os.path.exists(p):
        return None, []
    with open(p, "rb") as f:
        f.seek(0, 2); size = f.tell(); f.seek(max(0, size - 400_000))
        lines = f.read().decode("utf-8", "ignore").splitlines()
    return os.path.getmtime(p), lines[-n:]

def http(url, headers=None, timeout=8):
    req = urllib.request.Request(url, headers={"ngrok-skip-browser-warning": "true", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return None, type(e).__name__

def say(title, lines):
    print("\n" + "=" * 66); print(title); print("=" * 66)
    for l in lines: print(l)

def main():
    load_env()
    api, passkey = os.environ.get("GDQ_API_KEY", ""), os.environ.get("GDQ_PASSKEY", "")
    base = os.environ.get("INGRESS_HEALTH_URL", "").replace("/v1/models", "").replace("/models", "").rstrip("/")
    print("🩺 Colab Router Doctor (read-only, secrets are never printed)")

    # 1. setup completeness (names only)
    missing = [k for k, v in [("GDQ_API_KEY", api), ("INGRESS_HEALTH_URL", base)] if not v or "your-domain" in v]
    print(f"[config] GDQ_API_KEY: {'set' if api else 'MISSING'} | INGRESS_HEALTH_URL: {'set' if base else 'MISSING'} | GDQ_PASSKEY: {'set' if passkey else 'not set (optional)'}")

    state = read_state()
    mtime, tail = read_log_tail()
    recent = "\n".join(tail)
    n_unavail = recent.count("Service Unavailable") + recent.count("provision_failed")
    n_timeout = recent.count("timed out")
    n_lost = recent.count("Session lost")
    last_online = None
    for l in reversed(tail):
        if "SHIFT IS ONLINE" in l:
            m = TS.match(l); last_online = m.group(1) if m else "?"; break
    log_age_min = int((time.time() - mtime) / 60) if mtime else None
    if state:
        print(f"[state ] status={state.get('status')} | provision_failures={state.get('provision_failures', 0)} | restarts={state.get('total_rotations', 0)}")
    print(f"[logs  ] last_online={last_online or 'not in recent log'} | log_updated={f'{log_age_min} min ago' if log_age_min is not None else 'no log file'} | 'no GPU' errors={n_unavail} | timeouts={n_timeout} | session-lost={n_lost}")

    if missing:
        say("❓ KAARAN: SETUP ADHOORA", [f"  .env mein ye missing hain: {', '.join(missing)}",
            "  Kya karein: .env.example ko .env naam se copy karo aur values bharo.", "  (Agent: .env ki values kabhi print/commit mat karna.)"]); return 2

    # 2. live probe
    code, _ = http(f"{base}/health")
    if code == 200:
        hdr = {"Authorization": f"Bearer {api}", "x-passkey": passkey}
        pc, body = http(f"{base}/ps", hdr)
        if pc == 401:
            say("❓ KAARAN: API KEY MISMATCH", ["  Gateway chal raha hai, par aapki key galat hai (GDQ_API_KEY).",
                "  Kya karein: jo key notebook/Colab mein use hui wahi .env mein daalo."]); return 2
        try: engine = json.loads(body).get("engine")
        except Exception: engine = None
        if engine == "ollama":
            say("✅ SAB THEEK HAI", ["  Gateway online hai aur model GPU par load hai.", "  Chat chalu kar sakte ho (model: qwen3.8-27b-uncensored)."]); return 0
        if engine == "loading":
            say("⏳ KAARAN: MODEL LOAD HO RAHA HAI", ["  Gateway up hai, model abhi GPU mein aa raha hai.", "  Kya karein: 2-8 minute ruko, phir dobara doctor chalao."]); return 1
        say("🔧 KAARAN C: GATEWAY UP, MODEL/OLLAMA DOWN", [f"  /ps ne engine={engine!r} bataya (model GPU par nahi hai).",
            "  Kya karein: Colab mein `Runtime → Run all` dobara dabao (ya orchestrator ko restart hone do, wo khud in-VM heal try karta hai)."]); return 1

    # 3. gateway unreachable -> classify with evidence
    if n_unavail >= 3 or (state and state.get("status") == "waiting_for_gpu"):
        say("⏳ KAARAN A: GOOGLE NE GPU NAHI DIYA (free T4 available nahi)", [
            f"  Saboot: recent logs mein 'no GPU' errors = {n_unavail}, status={state.get('status') if state else 'n/a'}.",
            "  Ye aapki galti nahi; Colab free GPU guaranteed nahi hai.",
            "  Kya karein: wait karo. Orchestrator khud 5/10/20/40/60 minute ke backoff par retry karta hai.",
            "  Haath se try: Colab notebook kholo, T4 chuno, Run all. Baar-baar jaldi mat dabao. Kal dobara bhi try kar sakte ho."]); return 1
    if log_age_min is None or log_age_min > 20:
        say("🔌 KAARAN E: ORCHESTRATOR CHAL HI NAHI RAHA (ya PC band tha)", [
            f"  Saboot: orchestrator log {'nahi mila' if log_age_min is None else f'{log_age_min} minute se update nahi hua'}.",
            "  Kya karein: `python orchestrator/orchestrator.py` (ya run_orchestrator.bat/.sh) chalao.",
            "  Sirf notebook use karte ho to: Colab mein `Runtime → Run all`."]); return 1
    if n_lost >= 1 or n_timeout >= 1:
        say("🔁 KAARAN B: COLAB SESSION KHATAM HO GAYA (12 ghante / idle / GPU wapas le liya)", [
            f"  Saboot: session-lost={n_lost}, timeouts={n_timeout}; last online: {last_online or 'unknown'}.",
            "  Kya karein: orchestrator naya session khud banata hai (wait 5-10 min). Notebook wale: `Run all` dobara."]); return 1
    say("❓ KAARAN D/F: TUNNEL YA CODE KI DIKKAT (pakka nahi)", [
        "  Gateway tak pahunch nahi paaye, par 'no GPU' ya 'session lost' ka saboot nahi mila.",
        "  Kya karein: 1) notebook ka output dekho, ngrok ka naya link aaya? 2) .env ka INGRESS_HEALTH_URL wahi hai? 3) logs/orchestrator.log ke aakhri 100 lines padho.",
        "  Agent: andaza mat lagao. Jo log mein dikhe wahi batao; na dikhe to 'pata nahi' bolo."]); return 2

if __name__ == "__main__":
    sys.exit(main())
