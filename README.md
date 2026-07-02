<p align="center">
  <samp><b>Next.js + Vercel AI SDK + Google Gemini + Modal.com + Context7 MCP</b></samp>
</p>

<p align="center">
  <a href="https://github.com/PastiLulus/claiss/actions"><img src="https://img.shields.io/badge/Build-passing-brightgreen?style=flat-square" alt="Build Status"></a>
  <a href="https://github.com/PastiLulus/claiss/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License"></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-14.2-black?style=flat-square" alt="Next.js"></a>
  <a href="https://modal.com"><img src="https://img.shields.io/badge/Modal.com-Serverless-green?style=flat-square" alt="Modal"></a>
</p>

# claiss-api

<p align="center">
  <b>claiss-api is an AI-powered REST microservice for self-hosted educational platforms that automates Manim animation generation and serverless video compilation.</b>
  <br>
  Turn natural language prompts into professional, high-fidelity math and science animations via modular scene rendering and cloud storage failovers.
</p>

---

```text
$ curl -X POST https://api.claiss.com/api/video-generator-scene \
    -H "Authorization: Bearer $API_SECRET_KEY" \
    -d '{ "videoId": "v-math-01", "messages": [{"role": "user", "content": "Explain binary search"}] }'

[STREAM] Initiating generation...
[MCP] Connecting to Context7 Manim MCP Server... Connected.
[AI]  Synthesizing Manim Scene: BinarySearchAnimation (Google Gemini-2.5-Pro)
[AI]  Found 3 relevant docs in Context7.
[AI]  Scene code written to scene-01.py.
[MODAL] Dispatching compilation to classia-manim-compiler (Serverless CPU/GPU)...
[MODAL] Rendering frame 0 to 120... Done (1.8s)
[S3] Uploading binary-search-scene-01.mp4... Done (0.4s)
[SUCCESS] Scene generated and compiled!

{
  "success": true,
  "scene": {
    "id": "scene-binary-01",
    "name": "Binary Search Intro",
    "videoUrl": "https://s3.amazonaws.com/claiss-bucket/videos/binary-search-scene-01.mp4",
    "duration": 4.5
  }
}
```

---

## Why claiss-api?

| Feature | Traditional Manim Pipeline | claiss-api Pipeline |
| :--- | :--- | :--- |
| **Authoring** | Manual Python scripting & long iteration | AI-driven prompt-to-scene via Gemini |
| **Accuracy** | Frequent compilation errors | Guided by Context7 Manim MCP Server |
| **Rendering** | Heavy local Python/FFmpeg rendering | Lightning-fast Serverless on Modal.com |
| **Pipeline** | Monolithic single-file builds | Independent modular Scene compilation |

## Minimum Viable Knowledge

- ✅ **Modular Scene Editing**: Never recompile the entire video; regenerate individual scenes and merge them on demand.
- ✅ **MCP Grounding**: The generator utilizes `Context7` (Manim API context) to prevent AI code hallucination and syntax errors.
- ✅ **Automatic Failover**: Configure both S3 and Vercel Blob; `STORAGE_PROVIDER=auto` falls back gracefully if S3 fails.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/PastiLulus/claiss.git && cd claiss

# Install Node.js dependencies
pnpm install

# Deploy the serverless Manim compilation engine
pip install modal && modal token new && modal deploy modal_manim.py

# Launch development API server
pnpm dev
```

## Project Architecture

```text
 Client Request ──→ Next.js API Middleware (Bearer Auth)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
  AI Scene Gen API              Scene Compile API
  (Gemini-2.5-Pro &              (Modal.com Serverless)
   Context7 MCP)                         │
             │                           ▼
             └───────────────────→ Cloud Storage
                             (S3 / Vercel Blob)
```

## Core API Endpoints

| Endpoint | Method | Input (JSON) / Notes |
| :--- | :--- | :--- |
| `/api/health` | GET | Real-time monitoring and dependency statuses |
| `/api/video-generator-scene` | POST | Generates scene code via LLM & Context7 MCP |
| `/api/scene-compile` | POST | Compiles standalone Manim scene code on Modal |
| `/api/video-merge` | POST | Concatenates compiled scene videos into final output |
| `/api/videos` | GET | Retrieves compiled videos from cloud storage |

---

<p align="center">
  <a href="./API-DOCUMENTATION.md">API Docs</a> · <a href="./VIDEO_GENERATION_FLOW.md">Video Generation Flow</a> · <a href="./DEPLOYMENT.md">Deployment Guide</a>
</p>

<p align="center">
  <sub>Licensed under the MIT License</sub>
</p>
