# Perion

Your on-call rotation shouldn't need to page a human at 3am to figure out why the auth service is down.

---

## The Problem

Production breaks. That's a fact. What shouldn't be a fact is the hour-long war room where five engineers are simultaneously staring at the same stack trace, arguing about whether it's a database issue or a memory leak. Or the new contributor who gets assigned "fix this P0" and has no context on the system, the service, or where to even start.

Right now, incident response looks like this:

1. Alert fires → someone gets paged
2. Engineer opens Datadog / Grafana / whatever
3. Manual log correlation, Slack threads, educated guesses
4. Someone eventually finds the root cause — or they deploy a fix and hope
5. No one documents it. The next incident is identical.

This loop is expensive, slow, and burns people out.

---

## What Perion Does

Perion is an intelligent engineering ops engine. When an incident hits your system — a crashed service, a failed auth check, a database timeout — Perion intercepts it, runs it through an AI diagnostic layer powered by Google Gemini, and immediately produces a structured analysis:

- **What happened** (in plain English, not stack trace soup)
- **Why it likely happened** (root cause hypothesis)
- **What to do about it** (concrete, actionable fix steps)
- **Who should own it** (Good First Issue → Core Maintainer routing)

The whole pipeline is async. The dashboard updates automatically. No one has to manually triage anything.

It's not trying to replace your engineers. It's trying to make sure they're never starting from zero.

---

## Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python) |
| AI Engine | Google Gemini 1.5 Flash |
| Frontend | React + Vite |
| Incident Simulator | Python / httpx |
| Data Layer | In-memory (swap for SQLite/Postgres in prod) |

---

## Installation

### Prerequisites

- Python 3.9+
- Node.js 18+
- A Google Gemini API key → [Get one here](https://aistudio.google.com/app/apikey)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/perion.git
cd perion
```

### 2. Configure the AI engine

Create a `.env` file inside `perion-api/`:

```bash
# perion-api/.env
GOOGLE_API_KEY=your_gemini_api_key_here
```

> **No API key?** Perion still runs. It falls back to a structured deterministic analysis instead of AI-generated output. Good for local testing.

### 3. Start everything

**On Windows** — just double-click `start-perion.bat` or run:

```bat
start-perion.bat
```

This opens three terminal windows:
- `Perion Backend` → FastAPI on [localhost:8000](http://localhost:8000)
- `Perion UI` → React dashboard on [localhost:5173](http://localhost:5173)
- `Perion Simulator` → Injects sample incidents so you can see the system in action immediately

**Manual start (any OS):**

```bash
# Terminal 1 — Backend
cd perion-api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd perion-ui
npm install
npm run dev

# Terminal 3 — Simulator (optional, seeds the dashboard with data)
python simulator.py
```

### 4. Open the dashboard

Navigate to [http://localhost:5173](http://localhost:5173)

Within a few seconds of the simulator running, you'll see incidents appear in the feed. Click any one to trigger the AI analysis pipeline.

---

## How an Incident Flows Through Perion

```
Your Service / Simulator
        │
        ▼
POST /incident ──► FastAPI ingests it instantly
        │
        ├──► Returns { incident_id } immediately (non-blocking)
        │
        └──► Background Task: Gemini analyzes it
                    │
                    ▼
              Analysis stored
                    │
                    ▼
         React dashboard polls
         and surfaces the report
```

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/incident` | `POST` | Ingest a new incident |
| `/incidents` | `GET` | List all incidents (newest first) |
| `/analysis/{id}` | `GET` | Fetch AI analysis for an incident |
| `/system-health` | `GET` | Overall system health snapshot |

---

## Roadmap

- [ ] WebSocket-based real-time feed (replace polling)
- [ ] SQLite persistence layer
- [ ] Slack / PagerDuty webhook integration
- [ ] Historical incident trend analysis
- [ ] Auth + multi-team support

---

## License

MIT
