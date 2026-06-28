import { createClient } from 'redis';
import { NextResponse } from 'next/server';

export async function GET() {
  const kvUrl = process.env.KV_URL || process.env.REDIS_URL || '';
  const hasEnv = !!kvUrl;

  let redisStatus = 'not_configured';
  let rwTest = 'not_tested';

  if (hasEnv) {
    try {
      const client = await createClient({ url: kvUrl }).connect();
      redisStatus = 'connected';
      await client.set('_health', 'ok');
      const val = await client.get('_health');
      rwTest = val === 'ok' ? 'read_write_ok' : 'unexpected';
      await client.quit();
    } catch (e) {
      redisStatus = `error: ${e.message}`;
    }
  }

  return NextResponse.json({
    status: redisStatus === 'connected' && rwTest === 'read_write_ok' ? 'all_good' : 'needs_fix',
    environment: process.env.VERCEL ? 'vercel' : 'local',
    redis: redisStatus,
    redis_read_write: rwTest,
    kv_url_set: hasEnv,
    admin_username_set: !!process.env.ADMIN_USERNAME,
    admin_password_set: !!process.env.ADMIN_PASSWORD,
    message:
      redisStatus === 'not_configured'
        ? 'Redis not configured. Run `vercel link` then `vercel env pull .env.local` to get KV credentials.'
        : redisStatus === 'connected' && rwTest === 'read_write_ok'
          ? 'All good. Data will persist.'
          : `Redis error: ${redisStatus}`,
  });
}
