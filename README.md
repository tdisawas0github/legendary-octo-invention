# Gateway — Local AI Aggregator

A minimal, beautiful self-hosted gateway for routing to local LLM backends. OpenAI-compatible.

## Features

- **OpenAI-Compatible API** — Drop-in replacement at `/api/v1/chat/completions`
- **Multi-Provider** — Connect Ollama, LM Studio, vLLM, text-generation-webui, or any OpenAI-compatible server
- **Model Registry** — Register, toggle, and manage models from the dashboard
- **Request Logging** — Full request history with latency, token counts, and error tracking
- **Playground** — Built-in chat UI to test models
- **Streaming** — Full SSE streaming support
- **Dashboard** — Real-time stats on requests, success rate, latency, and token usage

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Add a Provider

Go to **Providers** → **Add Provider**. Quick presets are available for:

| Provider   | Default URL             |
|-----------|-------------------------|
| Ollama    | `http://localhost:11434` |
| LM Studio | `http://localhost:1234`  |
| vLLM      | `http://localhost:8000`  |

### 2. Register a Model

Go to **Models** → **Add Model**. Set the model ID to match the name used by your provider (e.g., `llama3.1`, `mistral`, `codellama`).

### 3. Query the Gateway

Use the OpenAI-compatible endpoint:

```bash
curl http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-model-id",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

With streaming:

```bash
curl http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-model-id",
    "messages": [
      {"role": "user", "content": "Tell me a story"}
    ],
    "stream": true
  }'
```

### 4. Use with Existing Tools

Point any OpenAI-compatible client to `http://localhost:3000/api/v1`:

**Python (openai):**
```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:3000/api/v1", api_key="not-needed")
response = client.chat.completions.create(
    model="your-model-id",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**LangChain:**
```python
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(base_url="http://localhost:3000/api/v1", api_key="not-needed")
```

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│   Clients   │────▶│  Gateway (Next.js)│────▶│  LLM Backends  │
│  (OpenAI    │     │  /api/v1/chat/    │     │  Ollama, vLLM, │
│   compat)   │     │  completions      │     │  LM Studio...  │
└─────────────┘     └──────────────────┘     └────────────────┘
                           │
                    ┌──────┴──────┐
                    │   SQLite    │
                    │  (logs,     │
                    │   models,   │
                    │   providers)│
                    └─────────────┘
```

## Tech Stack

- **Next.js 14** — App Router with API routes
- **Tailwind CSS** — Dark theme UI
- **better-sqlite3** — Embedded database for models, providers, and logs
- **TypeScript** — Full type safety

## API Endpoints

| Method | Path                                | Description                    |
|--------|-------------------------------------|--------------------------------|
| GET    | `/api/v1/chat/completions`          | List available models (OpenAI) |
| POST   | `/api/v1/chat/completions`          | Chat completion (OpenAI)       |
| GET    | `/api/providers`                    | List providers                 |
| POST   | `/api/providers`                    | Create provider                |
| GET    | `/api/providers/[id]`               | Get provider                   |
| PATCH  | `/api/providers/[id]`               | Update provider                |
| DELETE | `/api/providers/[id]`               | Delete provider                |
| GET    | `/api/models`                       | List models                    |
| POST   | `/api/models`                       | Create model                   |
| GET    | `/api/models/[id]`                  | Get model                      |
| PATCH  | `/api/models/[id]`                  | Update model                   |
| DELETE | `/api/models/[id]`                  | Delete model                   |
| GET    | `/api/logs`                         | List request logs              |
| GET    | `/api/stats`                        | Get dashboard stats            |

## License

MIT
