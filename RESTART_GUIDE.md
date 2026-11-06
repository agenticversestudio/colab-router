# 🔁 Band ho gaya? Restart kaise karein (Simple Guide)

Free Colab mein model **hamesha chalu nahi rehta**. Ye normal hai, aapki galti nahi.
Google khud kuch ghante baad session band kar deta hai, ya kabhi GPU hi nahi deta.

## Pehle samjho: kitna chalega?
- Ek session **max 12 ghante**, aur aksar kam (2–3 ghante bhi ho sakta hai).
- Idle rehne par Google band kar deta hai.
- GPU **guaranteed nahi** hai. Kabhi "GPU available nahi" aa sakta hai. Tab wait karna padta hai.
- Isliye ye **"jab chahiye tab on karo"** wala setup hai, 24×7 wala nahi.

## Restart ke 4 simple step
1. **Colab notebook kholo** (README mein "Open in Colab" button).
2. Upar menu: `Runtime → Change runtime type → T4 GPU`.
3. `Runtime → Run all` dabao. 5–10 minute wait karo (model load hota hai).
4. Jab output mein **"SHIFT IS ONLINE"** ya "Model ready" dikhe, tab kaam shuru karo.

Kaam khatam hone par: `Runtime → Disconnect and delete runtime`.

## Agar start nahi ho raha
| Kya dikh raha hai | Matlab | Kya karein |
|---|---|---|
| "Service Unavailable" / GPU nahi mila | Google ke paas abhi free T4 nahi hai | 10–60 minute baad dobara `Run all`. Baar-baar jaldi mat dabao. |
| Session beech mein kat gaya | 12 ghante ya idle limit | Dobara `Run all` |
| Model download atka | Internet / HF slow | Cell stop karke dobara chalao |
| Tunnel link kaam nahi kar raha | Tunnel naya link banata hai | Notebook output ka naya link use karo |

## Pehli baar setup (sirf ek baar)
1. **Sirf notebook use karna ho:** `colab/notebook.ipynb` kholo; pehle cell mein apna ngrok token aur ek API key daalo.
2. **Orchestrator (advanced):** `.env.example` ko copy karke `.env` naam do aur values bharo
   (`GDQ_API_KEY`, `NGROK_AUTHTOKEN`, `INGRESS_HEALTH_URL`...). **`.env` ko kabhi GitHub par mat daalo.**
3. API key set na ho to gateway sabko mana kar deta hai (ye jaan-boojh kar hai).
4. `python scripts/check_status.py` se status dekho.

## Orchestrator wale (PC/server par chalane waale)
Orchestrator ab apne aap sahi tarah se ruk-ruk ke retry karta hai:
- GPU na mile to **5, 10, 20, 40, 60 minute** ruk kar dobara koshish karta hai (60 min cap).
- Default mein **sirf 1 account** use hota hai (`ACCOUNT_COUNT=1`). Colab ke FAQ mein
  *"multiple accounts se limits bypass karna"* mana hai. Agar aap phir bhi 2–3 accounts
  chahte hain to `ACCOUNT_COUNT=2` ya `3` set karein. **Ye risk aapka hai, account ban ho sakta hai.**
- Heartbeat/keep-alive default band hai (`KEEPALIVE=1` se on kar sakte hain).
- Status dekhne ke liye: `python scripts/check_status.py`

## Phir bhi samajh na aaye?
Repo ko apne AI IDE mein kholo aur bas bolo: **`restart karo`** (ya `fix karo`, `kyun band hai`, `status`).
Repo ke `AGENTS.md` ki wajah se IDE khud `python scripts/doctor.py` chalata hai. Manual: `python scripts/doctor.py`.

Agar IDE `AGENTS.md` na padhe to `AGENT_PROMPT.md` mein ek line likhi hai, wo bol do.

## GLM 5.3 aur DeepSeek V4.1 kaise use karein
Ye is gateway par nahi chalte (bahut bade). **OpenCode app** mein inke free hosted models hain:
`glm-5.3-flash-free` aur `deepseek-v4.1-flash-free`. OpenCode ke docs ke hisaab se free models
sirf OpenCode ke andar chalte hain, doosre clients se API se nahi. "Limited time" free hain, kabhi bhi hat sakte hain.
Qwen 3.8 27B ke liye is gateway ka URL OpenCode mein custom provider ki tarah jodo.

## Zaroori sach
- GLM 5.3 aur DeepSeek V4.1 bahut bade models hain (GLM ~744B, DeepSeek V4 Flash ~284B, Pro ~1.6T).
  Free Colab T4 (15 GB VRAM) par ye **nahi chalte**. Sirf **Qwen 3.8 27B** T4 par fit hota hai.
- "24×7 unlimited free" ka koi tarika nahi hai. Ye sirf **on-demand free** hai.
