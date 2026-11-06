# AGENTS.md — AI IDE ke liye standing instructions (Antigravity, Claude Code, Codex, OpenCode, Cursor...)

Ye file apne aap padhi jati hai. **User ko koi lamba prompt paste nahi karna padta.** Ek chhota message kaafi hai, jaise:
`restart`, `fix`, `chalu karo`, `continue`, `kyun band hai`, `status`.

## Project kya hai (1 line)
Free Google Colab ke T4 par **Qwen 3.8 27B** chalane ka toolkit (gateway + notebook + optional orchestrator). **24×7 guaranteed nahi hai.**

## Jab user "restart / fix / continue / status / kyun band" jaisa kuch bole — EXACT is order mein karo
1. `python scripts/doctor.py` chalao. (Read-only hai. Output hi sachchai hai.)
2. Doctor ka output user ko **simple Hinglish** mein 3 line mein batao:
   `Kaaran:` / `Saboot:` (doctor se) / `Ab kya karna hai:` (numbered, chhote steps).
3. Jo step user ko khud karna hai (Google login, Colab mein `Runtime → Run all`, ngrok dashboard) wo **saaf bolo**. Khud mat karo.
4. Jo tum kar sakte ho (orchestrator start karna, logs padhna, `.env` ka khali field batana) wo karne se pehle ek line mein bolo kya karoge.
5. Kaam ke baad dobara `python scripts/doctor.py` chalao aur result batao. Ho gaya tab hi "ho gaya" bolo.

## Sachchai ke niyam (inhe mat todna)
- **Andaza mat lagao.** Jo doctor/log/state mein dikhe wahi kaaran batao. Saboot na ho to bolo: "pata nahi, ye cheez dekhni padegi: ...".
- **Kuch bhi ko 24×7 / unlimited / guaranteed mat bolna.** Free Colab: session max 12 ghante, aksar kam; GPU kabhi "Service Unavailable". Source: Colab FAQ (research.google.com/colaboratory/faq.html). Limits badalti rehti hain; zaroorat ho to FAQ live padho.
- **Sirf Qwen 3.8 27B yahan chalta hai.** GLM-5 (744B) aur DeepSeek V4 (284B–1.6T) Colab T4 par nahi chalte (docs/MODELS_GUIDE.md). Unhe kisi aur naam se ya chhote model se replace karke "GLM/DeepSeek chal raha hai" mat bolna. Unke liye OpenCode app ke free hosted models batao (limited time).
- Kisi model ko chupke se doosre model par route mat karo. Jo model chal raha hai wahi naam do.

## Secrets (sabse zaroori)
- `.env`, API key, passkey, ngrok token, Groq key, OAuth `token.json`/`vault/`: **kabhi print, copy, log, commit ya chat mein paste mat karo.** Sirf "set / missing" batao.
- `.env` ya `vault/` ko git mein add mat karo. `git add -A` se pehle `git status` dekho.
- Naya secret chahiye to user se bolo ki wo khud `.env` mein daale.

## Jo KABHI nahi karna
- Colab ki limit bypass: multiple Google accounts ghumana, CAPTCHA/bot-detection tod-na, fake keep-alive trick, Colab ka idle timeout todne ki koshish.
- `ACCOUNT_COUNT` ko 1 se badhana, ya `KEEPALIVE_PULSE` on karna — sirf tab jab user khud likhe "main risk samajhta hun".
- Google account banana, password daalna, 2FA/CAPTCHA solve karna.
- Bina bataye code ke defaults badalna (auth fail-closed hai, wo waise hi rahe).
- Code badalna sirf tab jab user bole. Pehle backup (`.bak`) lo, aur badlav ka ek-line summary do.
- Kuch delete karna (logs, vault, state) bina puche.

## Kaun si cheez kya hai
- `colab/notebook.ipynb` — 1-click notebook (Option 1). `Runtime → Run all`.
- `orchestrator/orchestrator.py` — shift restart + health check + backoff (Option 2).
- `colab/hybrid_server.py` — gateway. `/ps` mein `engine: ollama` = model sach mein GPU par.
- `scripts/doctor.py` — diagnosis. `scripts/check_status.py` — GPU/model telemetry.
- `RESTART_GUIDE.md` — user ke liye simple guide.

## Jawab ka format (Hinglish, chhota)
```
Kaaran: <ek line>
Saboot: <doctor output ki 1-2 line>
Ab kya karna hai:
1. ...
2. ...
```
