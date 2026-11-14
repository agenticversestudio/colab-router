# Models: Qwen (default), DeepSeek V4.1, GLM 5.3

Agentic Studio ek waqt mein **ek** model se baat karta hai. Header mein dropdown se model chuno,
aur **Models** (chaabi icon) button se uska Base URL / Model ID / API key set karo.

| Model | Kahan chalta hai | Base URL | Model ID | Key |
|---|---|---|---|---|
| **Qwen 3.8 27B** (default) | Tumhara Colab T4 (ngrok) | ngrok URL (login wala) | `qwen3.8-27b-uncensored` | login passkey / `sk-` key |
| **DeepSeek V4.1 Flash** | DeepSeek official API | `https://api.deepseek.com` | `deepseek-flash` | platform.deepseek.com |
| **GLM 5.3** | Z.ai official API | `https://api.z.ai/api/paas/v4` | `glm-5.3` | z.ai API keys page |

OpenRouter bhi chalega: Base URL `https://openrouter.ai/api/v1`, model `z-ai/glm-5.3` ya DeepSeek ka OpenRouter slug.

## Kyun DeepSeek/GLM Colab par nahi?
DeepSeek V4.1 Flash ~552B aur GLM 5.3 ~744B parameter ke MoE models hain. Free Colab T4 (15 GB VRAM)
par sirf Qwen 3.8 27B (IQ4_XS, ~14 GB) fit hota hai. Isliye DeepSeek/GLM unki API se chalte hain (paid per token).

## Kaise kaam karta hai
- Qwen: browser seedha Colab gateway (ngrok) ko call karta hai.
- DeepSeek / GLM: browser `/api/llm` (Vercel Edge function, `api/llm.ts`) ko call karta hai, jo request
  sirf allowlisted hosts (`api.deepseek.com`, `api.z.ai`, `open.bigmodel.cn`, `openrouter.ai`) ko forward karta hai.
  Wajah: in APIs se browser direct call CORS par atak sakti hai. Key kahin save/log nahi hoti.
- API keys sirf tumhare browser ke localStorage mein rehti hain, build/bundle mein nahi.
- Naya host chahiye to `api/llm.ts` ke `ALLOWED_HOSTS` mein jodo.
