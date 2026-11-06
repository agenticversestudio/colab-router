# 🤖 Band ho gaya? Apne AI IDE ko bas ye bolo

Repo mein `AGENTS.md` hai (Antigravity, Claude Code, Codex, OpenCode, Cursor automatically padhte hain). Isliye **lamba prompt paste nahi karna.** Repo folder IDE mein kholo aur bolo:

> **`restart karo`**  &nbsp;|&nbsp; **`fix karo`** &nbsp;|&nbsp; **`kyun band hai`** &nbsp;|&nbsp; **`status`** &nbsp;|&nbsp; **`continue`**

Agent `python scripts/doctor.py` chalayega, saboot ke saath kaaran batayega, aur simple Hinglish mein bataega ki aapko kya karna hai.

Agar aapka IDE `AGENTS.md` nahi padhta, to ye ek line bolo:

> `AGENTS.md padho aur uske hisaab se python scripts/doctor.py chalao, phir mujhe batao kya karna hai.`

---

## (Fallback) Poora prompt, agar upar wala na chale
### Prompt

```
Tum is repo ke saath kaam kar rahe ho: Qwen 3.8 27B ko Google Colab (free T4) par
chalane ka setup, jisme Google Drive, Colab notebook, aur gateway/tunnel hai.
Mera maksad: abhi system ko chalu karna ya samajhna ki kyun band hai, aur simple
Hinglish mein mujhe guide karna. Main non-technical ho sakta hun.

Pehle RESEARCH karo (LIVE, apni yaadash/assume mat karo):
1. Google Colab ka official FAQ web par padho (research.google.com/colaboratory/faq.html)
   aur likho: abhi free runtime ki limits kya hain, kya mana hai, GPU guaranteed hai ya nahi.
   Har claim ke saath source link do. Jo verify na ho usse "pata nahi" likho.
2. Is repo ka README, RESTART_GUIDE.md, aur docs padho.
3. Repo ke scripts/check_status.py aur logs (logs/orchestrator.log ke
   aakhri 200 lines, state.json) padho. Koi key/token/passkey mujhe
   print mat karna.

Phir DIAGNOSE karo aur mujhe in mein se EK kaaran batao (saboot ke saath):
 A. Google ne GPU nahi diya ("Service Unavailable") -> wait karna padega
 B. Session khatam/idle timeout (Colab 12 ghante max, idle par timeout)
 C. Model load/VRAM/Drive issue
 D. Tunnel/ngrok issue
 E. Mera PC band/orchestrator band
 F. Koi code bug

Phir CONTINUE karne ke liye mujhe step-by-step simple Hinglish mein batao
(RESTART_GUIDE.md ke hisaab se). Jo kaam main khud karunga (jaise Colab mein
"Runtime -> Run all" dabana, Google login) wo mujhe saaf bolna.

Rules (zaroori):
- Multiple Google accounts ghuma kar Colab limits bypass mat karna. Colab FAQ isko mana karta hai.
- Koi bypass/keep-alive/CAPTCHA trick mat suggest karna jo Colab ke rules todta ho.
- Meri passwords/tokens/keys kabhi print ya commit mat karna. Google login mujhse mat maangna, main khud karunga.
- Koi bhi file badalne se pehle mujhe bataao kya badlega, aur original ka backup lo.
- Agar kuch "nahi ho sakta" ya limit hit hai, to seedha bolo. Jhooth ya gol-mol jawab mat do.
- GLM 5.3 aur DeepSeek V4.1 apne aap Colab T4 par nahi chalte (bahut bade hain). Agar
  wo kisi hosted route se chal rahe hain to saaf bolo ki asli model kahan chal raha hai.
```

---

## Ye prompt kyun kaam karta hai
- Pehle **live research** karwata hai, taaki purani/galat limits na maane.
- Phir **sach-sach kaaran** dhundhta hai (A–F), andaza nahi.
- Aur **rules ke andar** rakhta hai, taaki aapka Google account safe rahe.
