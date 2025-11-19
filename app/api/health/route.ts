import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage/storage-factory';

export const dynamic = 'force-dynamic';

/**
 * Health Check Endpoint
 * 
 * Returns the health status of the API service and its dependencies
 * 
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Get storage adapter info
    const storage = getStorageAdapter();
    const storageProvider = storage.getProviderName();

    // Check environment configuration
    const hasModalToken = !!process.env.MODAL_TOKEN_SECRET;
    const hasGoogleAI = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const hasAuth = !!process.env.API_SECRET_KEY;

    // Storage configuration
    const storageConfig = process.env.STORAGE_PROVIDER || 'auto';
    const hasS3 = !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_BUCKET);
    const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: '0.1.0',
      service: {
        name: 'Claiss API',
        type: 'REST API Microservice',
        description: 'AI-powered educational video generation using Manim'
      },
      dependencies: {
        storage: {
          provider: storageProvider,
          configured: storageConfig,
          available: {
            s3: hasS3,
            vercelBlob: hasVercelBlob
          }
        },
        modal: {
          configured: hasModalToken,
          enabled: process.env.USE_MODAL_COMPILATION !== 'false'
        },
        googleAI: {
          configured: hasGoogleAI
        },
        authentication: {
          enabled: hasAuth
        }
      },
      endpoints: [
        '/api/health',
        '/api/scene-compile',
        '/api/video-merge',
        '/api/videos',
        '/api/scene-operations',
        '/api/manim-compile',
        '/api/video-generator-scene'
      ]
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}