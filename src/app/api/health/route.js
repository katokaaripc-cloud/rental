import { NextResponse } from 'next/server';

export async function GET() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

  // Test KV connection
  let kvStatus = 'not_configured';
  let kvTest = null;
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/_health`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });
      if (res.ok) {
        const body = await res.json();
        kvTest = body.result;
        kvStatus = 'connected';
      } else {
        kvStatus = `http_${res.status}`;
      }
    } catch (e) {
      kvStatus = `error: ${e.message}`;
    }
  }

  // Attempt a write + read
  let rwTest = 'not_tested';
  if (kvStatus === 'connected') {
    try {
      await fetch(`${kvUrl}/set/_rwtest`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json',
        },
        body: '"ok"',
      });
      const res = await fetch(`${kvUrl}/get/_rwtest`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      });
      const body = await res.json();
      rwTest = body.result === 'ok' ? 'read_write_ok' : 'unexpected';
    } catch (e) {
      rwTest = `error: ${e.message}`;
    }
  }

  return NextResponse.json({
    status: kvStatus === 'connected' && rwTest === 'read_write_ok' ? 'all_good' : 'needs_fix',
    environment: process.env.VERCEL ? 'vercel' : 'local',
    kv: kvStatus,
    kv_read_write: rwTest,
    kv_url_set: !!kvUrl,
    kv_token_set: !!kvToken,
    admin_username_set: !!process.env.ADMIN_USERNAME,
    admin_password_set: !!process.env.ADMIN_PASSWORD,
    message: kvStatus !== 'connected'
      ? 'KV/REDIS database not detected. Go to Vercel Dashboard → Storage → Create Database → Redis → Create, then redeploy.'
      : rwTest !== 'read_write_ok'
        ? 'KV connected but read/write failed. Try recreating the KV store.'
        : 'Everything works. If data still disappears, try a fresh redeploy.',
  });
}
