# Claiss API Documentation

REST API microservice for AI-powered educational video generation using Manim animations.

## Base URL

```
http://localhost:3000
```

For production, replace with your deployed URL.

## Authentication

All API endpoints require authentication using a Bearer token in the Authorization header.

```bash
Authorization: Bearer YOUR_API_KEY
```

Set your API key in the `API_SECRET_KEY` environment variable.

## API Endpoints

### 1. Health Check

Check the health status and configuration of the API service.

**Endpoint:** `GET /api/health`

**Authentication:** Required

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/health
```

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "responseTime": "5ms",
  "version": "0.1.0",
  "service": {
    "name": "Claiss API",
    "type": "REST API Microservice",
    "description": "AI-powered educational video generation using Manim"
  },
  "dependencies": {
    "storage": {
      "provider": "s3",
      "configured": "s3",
      "available": {
        "s3": true,
        "vercelBlob": false
      }
    },
    "modal": {
      "configured": true,
      "enabled": true
    },
    "googleAI": {
      "configured": true
    }
  }
}
```

---

### 2. Scene Compilation

Compile Manim Python code into video files.

**Endpoint:** `POST /api/scene-compile`

**Authentication:** Required

**Mode: Single Scene**

Compile one scene at a time.

**Request Body:**
```json
{
  "mode": "single",
  "scene": {
    "id": "scene-123",
    "name": "Bubble Sort Animation",
    "code": "from manim import *\n\nclass BubbleSort(Scene):\n    def construct(self):\n        text = Text('Bubble Sort')\n        self.play(Write(text))\n        self.wait()",
    "order": 0,
    "status": "pending"
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/scene-compile \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "single",
    "scene": {
      "id": "scene-123",
      "name": "Bubble Sort",
      "code": "from manim import *\n\nclass BubbleSort(Scene):\n    def construct(self):\n        text = Text(\"Bubble Sort\")\n        self.play(Write(text))\n        self.wait()",
      "order": 0,
      "status": "pending"
    }
  }'
```

**Example Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "sceneId": "scene-123",
    "videoUrl": "https://sgp1.digitaloceanspaces.com/app-pastilulus/videos/vid_abc123.mp4",
    "videoId": "vid_abc123",
    "duration": "15s"
  },
  "duration": "18500ms"
}
```

**Mode: Multiple Scenes**

Compile multiple scenes in parallel.

**Request Body:**
```json
{
  "mode": "multiple",
  "scenes": [
    {
      "id": "scene-1",
      "name": "Introduction",
      "code": "...",
      "order": 0,
      "status": "pending"
    },
    {
      "id": "scene-2",
      "name": "Main Content",
      "code": "...",
      "order": 1,
      "status": "pending"
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/scene-compile \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "multiple",
    "scenes": [
      {
        "id": "scene-1",
        "name": "Intro",
        "code": "from manim import *\n\nclass Intro(Scene):\n    def construct(self):\n        text = Text(\"Introduction\")\n        self.play(Write(text))",
        "order": 0,
        "status": "pending"
      }
    ]
  }'
```

**Example Response:**
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "sceneId": "scene-1",
      "videoUrl": "https://sgp1.digitaloceanspaces.com/.../vid_1.mp4",
      "videoId": "vid_1"
    },
    {
      "success": true,
      "sceneId": "scene-2",
      "videoUrl": "https://sgp1.digitaloceanspaces.com/.../vid_2.mp4",
      "videoId": "vid_2"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

---

### 3. Video Merging

Merge multiple compiled scene videos into a single final video.

**Endpoint:** `POST /api/video-merge`

**Authentication:** Required

**Request Body:**
```json
{
  "videoId": "final-video-123",
  "scenes": [
    {
      "id": "scene-1",
      "name": "Introduction",
      "order": 0,
      "status": "compiled",
      "videoUrl": "https://sgp1.digitaloceanspaces.com/.../vid_1.mp4"
    },
    {
      "id": "scene-2",
      "name": "Main Content",
      "order": 1,
      "status": "compiled",
      "videoUrl": "https://sgp1.digitaloceanspaces.com/.../vid_2.mp4"
    }
  ],
  "options": {
    "addTransitions": true,
    "transitionDuration": 0.5
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/video-merge \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "final-123",
    "scenes": [
      {
        "id": "scene-1",
        "order": 0,
        "status": "compiled",
        "videoUrl": "https://sgp1.digitaloceanspaces.com/.../vid_1.mp4"
      }
    ],
    "options": {
      "addTransitions": false
    }
  }'
```

**Example Response:**
```json
{
  "success": true,
  "videoUrl": "https://sgp1.digitaloceanspaces.com/.../videos/final-123.mp4",
  "videoId": "final-123",
  "duration": "25s",
  "mergeTime": "3.2s",
  "sceneCount": 2
}
```

---

### 4. Video Retrieval

Retrieve compiled videos from storage.

**Endpoint:** `GET /api/videos`

**Authentication:** Required

**Get Latest Video:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/videos
```

**Get Specific Video by ID:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/videos?id=vid_abc123
```

**Check Video Metadata (HEAD):**

```bash
curl -I -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/videos?id=vid_abc123
```

**Response:** Redirects to the video URL or streams the video content.

---

### 5. Scene Operations

Manage scenes within videos (CRUD operations).

**Endpoint:** `GET /api/scene-operations`

**Authentication:** Required

**Get Latest Video:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/scene-operations?action=latest"
```

**Get Specific Video:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/scene-operations?videoId=video-123"
```

**Get Specific Scene:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/scene-operations?videoId=video-123&sceneId=scene-1"
```

**Update Scene (POST):**

```bash
curl -X POST http://localhost:3000/api/scene-operations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "video-123",
    "operation": {
      "type": "update",
      "sceneId": "scene-1",
      "updates": {
        "name": "Updated Scene Name",
        "code": "from manim import *..."
      }
    }
  }'
```

**Delete Scene (DELETE):**

```bash
curl -X DELETE http://localhost:3000/api/scene-operations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "video-123",
    "sceneId": "scene-1"
  }'
```

---

### 6. AI Scene Generation

Generate Manim scene code from natural language prompts using Google Gemini AI.

**Endpoint:** `POST /api/video-generator-scene`

**Authentication:** Required

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Create a video explaining the bubble sort algorithm with step-by-step visualization"
    }
  ],
  "videoId": "video-123",
  "mode": "scene"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/video-generator-scene \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Explain quicksort algorithm"
      }
    ],
    "mode": "scene"
  }'
```

**Response:** Streaming response with AI-generated scene code and tool calls.

---

## Error Responses

All endpoints return consistent error responses:

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Missing or invalid Authorization header"
}
```

**Bad Request (400):**
```json
{
  "success": false,
  "error": "Scene object is required for single mode"
}
```

**Internal Server Error (500):**
```json
{
  "success": false,
  "error": "Compilation failed",
  "duration": "5000ms"
}
```

---

## Complete Workflow Example

Here's a complete example of creating a video from start to finish:

```bash
# 1. Check API health
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/health

# 2. Generate scene code using AI
curl -X POST http://localhost:3000/api/video-generator-scene \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Explain bubble sort"}]
  }'

# 3. Compile the scene
curl -X POST http://localhost:3000/api/scene-compile \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "single",
    "scene": {
      "id": "scene-1",
      "name": "Bubble Sort",
      "code": "... generated code ...",
      "order": 0,
      "status": "pending"
    }
  }'

# 4. Merge scenes into final video (if multiple scenes)
curl -X POST http://localhost:3000/api/video-merge \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scenes": [
      {
        "id": "scene-1",
        "order": 0,
        "status": "compiled",
        "videoUrl": "https://..."
      }
    ]
  }'

# 5. Download the final video
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/videos?id=final-video-id \
  -o output.mp4
```

---

## Storage Configuration

The API supports multiple storage providers with automatic fallback:

### S3-Compatible Storage (DigitalOcean Spaces, AWS S3, etc.)

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

### Auto (Automatic Fallback)

```bash
STORAGE_PROVIDER=auto
# Configure both S3 and Vercel Blob
# Primary: Vercel Blob, Fallback: S3
```

---

## Rate Limits

Currently, no rate limiting is enforced for self-hosted deployments. For production use, consider adding rate limiting middleware based on your requirements.

---

## Support

- Report bugs: https://github.com/HoltzTomas/classia-frontend/issues
- Documentation: https://github.com/HoltzTomas/classia-frontend#readme

---

**Built with ❤️ using Next.js, Manim, Google AI, and Modal.com**