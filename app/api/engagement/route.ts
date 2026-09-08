import { env } from 'cloudflare:workers';
import { ingest } from '@/lib/engagement.mjs';

export async function POST(request: Request) {
  return ingest(request, env.ENGAGEMENT);
}
