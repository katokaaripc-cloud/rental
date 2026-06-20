import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET() {
  const checks = {
    vercel: !!process.env.VERCEL,
    admin_username_set: !!process.env.ADMIN_USERNAME,
    admin_password_set: !!process.env.ADMIN_PASSWORD,
    kv_rest_url_set: !!process.env.KV_REST_API_URL,
    kv_rest_token_set: !!process.env.KV_REST_API_TOKEN,
    upstash_url_set: !!process.env.UPSTASH_REDIS_REST_URL,
    upstash_token_set: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    kv_url_set: !!process.env.KV_URL,
  };

  // Try KV connection
  let kvStatus = 'not_configured';
  if (checks.kv_rest_url_set || checks.upstash_url_set) {
    try {
      const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
      if (url && token) {
        const redis = new Redis({ url, token });
        await redis.set('_healthcheck', 'ok');
        const val = await redis.get('_healthcheck');
        kvStatus = val === 'ok' ? 'connected' : 'unexpected_response';
      } else {
        kvStatus = 'missing_token_or_url';
      }
    } catch (e) {
      kvStatus = `error: ${e.message}`;
    }
  }

  return NextResponse.json({
    status: 'ok',
    environment: checks.vercel ? 'vercel' : 'local',
    kv: kvStatus,
    env_vars: checks,
  });
}
