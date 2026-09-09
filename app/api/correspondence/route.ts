import {env} from 'cloudflare:workers';
import {correspondenceConfig,receiveCorrespondence} from '@/lib/correspondence.mjs';
import {correspondenceNoticeVersion,correspondenceNotice,correspondencePermission} from '@/lib/correspondence-notice';
export function GET(request:Request){return correspondenceConfig(request,env);}
export function POST(request:Request){return receiveCorrespondence(request,env,{version:correspondenceNoticeVersion,text:correspondenceNotice,permission:correspondencePermission});}
