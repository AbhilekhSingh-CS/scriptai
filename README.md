# ScriptAI

An AI-powered YouTube script generator. Enter a topic, choose a tone and target length, and get back a structured script with hook, intro, main content and outro sections.

Built with an Express backend that interfaces with Groq's LLaMA API, and a React frontend.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, axios |
| Backend | Node.js, Express |
| LLM | Groq API — `llama-3.3-70b-versatile` |
| Protection | API key auth, per-IP rate limiting, request validation |

## Why Groq

Groq runs inference on custom hardware (LPUs) rather than GPUs, which makes it substantially faster than most hosted LLM APIs. For a generation task where the user waits for the result, latency is the main quality-of-experience factor. It also has a free tier suitable for development.

## How It Works

```
Browser  →  Express backend  →  Groq API
Browser  ←  Express backend  ←  Groq API
```

The backend is a middleman. The API key never reaches the browser — if the frontend called Groq directly, anyone could read the key from network traffic and use the quota.

## Prompt Design

The prompt is split into two parts, defined in `config/prompts.js`.

**System prompt** — written by the developer, sent with every request. Contains the role ("experienced YouTube scriptwriter"), the required output structure (HOOK / INTRO / MAIN CONTENT / OUTRO), and explicit constraints:

- No preamble such as "Sure, here's your script"
- No markdown formatting
- Second person, addressing the viewer
- Sentences short enough to speak in one breath

**User prompt** — built per request from the topic, tone and duration.

Separating them means a user cannot override the formatting rules through their input, and behaviour is configured in one place rather than rebuilt into every request.

**Temperature is 0.7.** Script writing is creative — at 0 every user asking about the same topic would receive an identical script.

## Request Pipeline

Each layer rejects at the cheapest possible point, so expensive work only happens for valid requests:

```
1. apiKeyAuth       →  no valid key, no further processing
2. generateLimiter  →  5 requests per minute per IP
3. validation       →  topic, tone and duration checked before any API call
4. Groq call        →  the only step that costs tokens
```

Validation runs before the LLM call because every call consumes tokens. A malformed request costs nothing.

## Security Notes

**Timing-safe key comparison.** API keys are compared with `crypto.timingSafeEqual` rather than `===`. Normal string comparison exits at the first mismatched character, so response time leaks how much of the key was correct — an attacker could recover it character by character. `timingSafeEqual` takes constant time regardless of where the strings differ.

**Tone is an allowlist, not free text.** Restricting it to four fixed values prevents arbitrary user input reaching the prompt, which limits prompt injection through that parameter.

**Upstream errors are mapped deliberately.** A Groq 429 becomes a user-facing retry message; a Groq 401 returns a generic server error rather than revealing that the API key is invalid.

## API

### `POST /api/script/generate`

**Headers**
```
Content-Type: application/json
x-api-key: <your key>
```

**Body**
```json
{
  "topic": "how to brew better coffee at home",
  "tone": "casual",
  "duration": 5
}
```

`tone` must be one of `casual`, `professional`, `energetic`, `educational`.
`duration` is in minutes, between 1 and 30.

**Response**
```json
{
  "topic": "how to brew better coffee at home",
  "tone": "casual",
  "duration": 5,
  "script": "HOOK\n...\n\nINTRO\n...",
  "usage": {
    "promptTokens": 232,
    "completionTokens": 294,
    "totalTokens": 526
  }
}
```

Token usage is returned so cost per request is visible. The system prompt alone accounts for roughly 230 tokens on every call, regardless of user input.

**Error responses**

| Status | Cause |
|---|---|
| 400 | Missing or invalid topic, tone or duration |
| 401 | Missing or invalid API key |
| 429 | Rate limit reached (yours or Groq's) |
| 502 | Model returned an empty response |
| 503 | Groq service unavailable |

## Project Structure

```
backend/
├── config/
│   ├── groq.js       Groq client setup
│   └── prompts.js    System prompt + user prompt builder
├── controllers/
│   └── scriptController.js
├── middleware/
│   ├── apiKeyAuth.js
│   └── rateLimiter.js
├── routes/
│   └── scriptRoutes.js
└── server.js

frontend/
└── src/
    ├── App.jsx
    └── App.css
```

## Running Locally

### Prerequisites
Node.js 18+ and a free Groq API key from [console.groq.com](https://console.groq.com).

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
GROQ_API_KEY=your_groq_key
API_KEY=any_long_random_string
PORT=5002
```

Generate a random API key with:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Then:

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_KEY=the_same_value_as_API_KEY_above
```

Then:

```bash
npm run dev
```

Runs at `http://localhost:5173`.

## Known Limitations

**The API key is visible in the browser.** Because the frontend sends it, anyone can read it from network requests. It deters casual abuse of the endpoint but is not real protection. Proper access control needs user accounts, with the rate limit tied to an authenticated user rather than a shared key.

**Rate limiting is per IP.** A VPN gives a fresh allowance. Keying the limit to a logged-in account would be substantially harder to bypass.

**No output validation.** The system prompt asks for four specific sections, and in practice the model complies — but nothing verifies it. If the model drifted, malformed output would reach the user. A structural check on the response, or a retry with stricter instructions, would make this robust.

**No conversation history.** Each request is independent. The model is stateless — it only knows what is in the messages array sent with that request. Supporting refinement ("make the intro shorter") would require sending the previous exchange back as context.

**No response caching.** Identical topics regenerate from scratch. A semantic cache keyed on the topic embedding would cut cost for repeated requests.

**No streaming.** The user waits for the full script rather than seeing it appear token by token. Groq supports streaming; adding it would improve perceived speed considerably.

## Possible Extensions

- **RAG** — ground scripts in a specific channel's existing videos so the output matches an established voice
- **Agentic flow** — search the web for current information on the topic, draft, self-critique against a checklist, then revise
- **Evaluation** — LLM-as-judge scoring on structure, relevance and tone, since there is no single correct script to compare against

**Live demo:** https://scriptai-ten.vercel.app

> Hosted on free tiers — the API sleeps after inactivity, so the first request may take up to a minute.

## Author

**Abhilekh Singh** — B.Tech Computer Science, Pranveer Singh Institute of Technology
[GitHub](https://github.com/AbhilekhSingh-CS)