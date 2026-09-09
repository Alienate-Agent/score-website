import {env} from 'cloudflare:workers';
import {handleJourneyAdmin} from '@/lib/journey-admin.mjs';
export function POST(request:Request) {return handleJourneyAdmin(request,env);}
export function GET() {return new Response(null,{status:404,headers:{'Cache-Control':'private, no-store'}});}
