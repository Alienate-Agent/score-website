export const POLICY=Object.freeze({version:1,timeZone:'America/New_York',maxEditionsPerEpisodePerDay:1,maxSelectedRecords:12,maxReplyHops:2});
export const day=iso=>new Intl.DateTimeFormat('en-CA',{timeZone:POLICY.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
// Advisory queue predicate only: no scheduler, API reader, automatic adoption or publish.
export function eligible({episode,now,history,change}){
 if(history.some(e=>e.id===episode&&day(e.drawnAt)===day(now)))return {eligible:false,reason:'Daily episode limit; queue for next editorial review.'};
 if(!change.publicAdmitted)return {eligible:false,reason:'Public admission required.'};
 if(!change.relatedToSelectedEpisode)return {eligible:false,reason:'Outside selected episode.'};
 if(!['substantive-reply','correction','recorded-outcome','initial-selection','artist-requested-interpretation'].includes(change.kind))return {eligible:false,reason:'Karma-only or routine reread: retain the edition.'};
 if(!change.editorialReason?.trim())return {eligible:false,reason:'Record the editorial reason.'};
 if(!Number.isInteger(change.selectedRecords)||change.selectedRecords<1||!Number.isInteger(change.replyHops)||change.replyHops<0)return {eligible:false,reason:'Record selection size and reply scope.'};
 if(change.selectedRecords>POLICY.maxSelectedRecords||change.replyHops>POLICY.maxReplyHops)return {eligible:false,reason:'Split the selection into an explicitly scoped episode.'};
 return {eligible:true,reason:'Candidate for a new immutable edition at editorial review.'};
}
