# Claiss API 🎬✨

> **REST API Microservice** - AI-powered educational video generation using Manim animations

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Manim](https://img.shields.io/badge/Manim-0.18.1-blue)](https://www.manim.community/)

Transform text prompts into stunning visual learning content via simple REST API calls.

## ✨ Features

- 🤖 **AI-Powered Scene Generation** - Generate Manim code from natural language using Google Gemini
- ⚡ **Serverless Compilation** - Fast Manim rendering via Modal.com
- 🗄️ **Flexible Storage** - S3-compatible storage with automatic Vercel Blob fallback
- 🔐 **API Key Authentication** - Simple bearer token auth for secure access
- 🚀 **Scene-Based Workflow** - Compile individual scenes, then merge into final video
- 📊 **Health Monitoring** - Built-in health check endpoint
- 🐳 **Docker Ready** - Optimized for containerized deployment

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ REST API Calls
       │ (Bearer Token Auth)
       ▼
┌─────────────────────────────┐
│   Claiss API Service        │
│  ┌────────────────────────┐ │
│  │  API Key Middleware    │ │
│  └────────────────────────┘ │
│  ┌────────────────────────┐ │
│  │  API Routes            │ │
│  │  • /health             │ │
│  │  • /scene-compile      │ │
│  │  • /video-merge        │ │
│  │  • /videos             │ │
│  │  • /scene-operations   │ │
│  └────────────────────────┘ │
└──────┬──────────────────┬───┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│  Modal.com   │   │   Storage    │
│   (Manim)    │   │  S3 Primary  │
│              │   │  Blob Backup │
└──────────────┘   └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- [Google AI API Key](https://makersuite.google.com/app/apikey)
- [Modal.com Account](https://modal.com) (free tier available)
- S3-compatible storage (DigitalOcean Spaces, AWS S3, etc.) OR [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)

### Installation

1. **Clone and checkout the api-only branch**
   ```bash
   git clone https://github.com/HoltzTomas/classia-frontend.git
   cd classia-frontend
   git checkout api-only
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```bash
   # API Authentication (generate with: openssl rand -base64 32)
   API_SECRET_KEY=your_secure_random_key_here
   
   # Google AI for scene generation
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
   
   # Modal.com for Manim compilation
   MODAL_TOKEN_SECRET=your_modal_token
   
   # Storage: S3-compatible (recommended)
   STORAGE_PROVIDER=s3
   S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
   S3_REGION=sgp1
   S3_ACCESS_KEY_ID=your_key
   S3_SECRET_ACCESS_KEY=your_secret
   S3_BUCKET=your-bucket
   S3_FORCE_PATH_STYLE=true
   ```

4. **Deploy Modal.com service**
   ```bash
   pip install modal
   modal token new
   modal deploy modal_manim.py
   ```

5. **Start the API server**
   ```bash
   pnpm dev
   ```

   API is now running at `http://localhost:3000` 🎉

## 📖 API Usage

### Health Check

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/health
```

### Compile a Scene

```bash
curl -X POST http://localhost:3000/api/scene-compile \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "single",
    "scene": {
      "id": "scene-1",
      "name": "Bubble Sort",
      "code": "from manim import *\n\nclass BubbleSort(Scene):\n    def construct(self):\n        text = Text(\"Bubble Sort\")\n        self.play(Write(text))\n        self.wait()",
      "order": 0,
      "status": "pending"
    }
  }'
```

### Merge Scenes into Final Video

```bash
curl -X POST http://localhost:3000/api/video-merge \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scenes": [
      {
        "id": "scene-1",
        "order": 0,
        "status": "compiled",
        "videoUrl": "https://your-storage.com/video.mp4"
      }
    ]
  }'
```

### Download Video

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/videos?id=video-123 \
  -o output.mp4
```

**📚 Full API documentation: [API-DOCUMENTATION.md](./API-DOCUMENTATION.md)**

## 🗄️ Storage Configuration

### S3-Compatible Storage (Recommended)

Supports DigitalOcean Spaces, AWS S3, Backblaze B2, and any S3-compatible service.

**Features:**
- ✅ 4x retry logic with exponential backoff
- ✅ Automatic failover to Vercel Blob
- ✅ Multi-region support
- ✅ Path-style and virtual-hosted URLs

```bash
STORAGE_PROVIDER=s3
S3_ENDPOINT=https://sgp1.digitaloceanspaces.com
S3_REGION=sgp1
S3_ACCESS_KEY_ID=your_key
S3_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=your-bucket
S3_FORCE_PATH_STYLE=true
```

### Vercel Blob Storage

```bash
STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=your_token
```

### Auto Mode (Recommended for Production)

Automatically uses available storage with intelligent fallback:
- Primary: Vercel Blob (if configured)
- Fallback: S3 (if configured)

```bash
STORAGE_PROVIDER=auto
# Configure both S3 and Vercel Blob
```

## 🐳 Docker Deployment

```bash
# Build the image
docker build -t claiss-api .

# Run the container
docker run -p 3000:3000 \
  -e API_SECRET_KEY=your_key \
  -e GOOGLE_GENERATIVE_AI_API_KEY=your_key \
  -e MODAL_TOKEN_SECRET=your_token \
  -e STORAGE_PROVIDER=s3 \
  -e S3_ENDPOINT=https://sgp1.digitaloceanspaces.com \
  -e S3_REGION=sgp1 \
  -e S3_ACCESS_KEY_ID=your_key \
  -e S3_SECRET_ACCESS_KEY=your_secret \
  -e S3_BUCKET=your-bucket \
  claiss-api
```

## 📁 Project Structure

```
claiss-api/
├── app/api/              # API route handlers
│   ├── health/           # Health check endpoint
│   ├── scene-compile/    # Scene compilation
│   ├── video-merge/      # Video merging
│   ├── videos/           # Video retrieval
│   └── scene-operations/ # Scene CRUD operations
├── lib/
│   ├── storage/          # Storage adapters (S3, Vercel Blob)
│   ├── manim-compiler.ts # Manim compilation logic
│   ├── scene-compiler.ts # Scene compilation
│   ├── scene-manager.ts  # Scene management
│   └── modal-client*.ts  # Modal.com API clients
├── middleware.ts         # API authentication
├── modal_manim.py        # Modal.com Manim service
└── .env                  # Environment configuration
```

## 🔐 Security

### API Key Authentication

All endpoints require authentication using a Bearer token:

```bash
Authorization: Bearer YOUR_API_KEY
```

Generate a secure API key:
```bash
openssl rand -base64 32
```

### Production Recommendations

- ✅ Use strong, random API keys (32+ characters)
- ✅ Rotate API keys periodically
- ✅ Use HTTPS in production
- ✅ Configure CORS appropriately
- ✅ Monitor API usage via `/api/health`
- ✅ Set up rate limiting if needed

## 📊 Monitoring

The `/api/health` endpoint provides real-time service status:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "responseTime": "5ms",
  "dependencies": {
    "storage": {
      "provider": "s3",
      "available": { "s3": true, "vercelBlob": false }
    },
    "modal": { "configured": true, "enabled": true },
    "googleAI": { "configured": true }
  }
}
```

## 🛠️ Development

```bash
# Development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check and service status |
| `/api/scene-compile` | POST | Compile Manim scenes (single/multiple) |
| `/api/video-merge` | POST | Merge compiled scenes into final video |
| `/api/videos` | GET | Retrieve videos from storage |
| `/api/scene-operations` | GET/POST/DELETE | CRUD operations for scenes |
| `/api/video-generator-scene` | POST | AI-powered scene generation |

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Manim Community](https://www.manim.community/) for the animation library
- [Modal.com](https://modal.com) for serverless Python execution
- [Google AI](https://ai.google.dev/) for Gemini API
- [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces) for S3-compatible storage

## 📞 Support

- 🐛 [Report a Bug](https://github.com/HoltzTomas/classia-frontend/issues)
- 💡 [Request a Feature](https://github.com/HoltzTomas/classia-frontend/issues)
- 💬 [Discussions](https://github.com/HoltzTomas/classia-frontend/discussions)

---

**Built with ❤️ for self-hosted deployments**

**API-only branch** - No frontend dependencies, ~70% smaller than full-stack version