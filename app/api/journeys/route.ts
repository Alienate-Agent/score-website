import { env } from 'cloudflare:workers';
import { journeyConfig, ingestJourney } from '@/lib/journeys.mjs';

export function GET(request: Request) { return journeyConfig(request, env); }
export function POST(request: Request) { return ingestJourney(request, env); }
