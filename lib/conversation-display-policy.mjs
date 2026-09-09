// Apply before any observation is serialized to a visitor. The private policy
// is provided by the server, never bundled in this module or returned to clients.
import {markdownVisibleText} from './markdown-visible-text.mjs';
export function validateConversationPolicy(policy){
  if(policy?.schema_version!==1||!Array.isArray(policy.rules)||!policy.rules.length||
    policy.rules.some(r=>!r||!Array.isArray(r.values)||!r.values.length||r.values.some(v=>typeof v!=='string'||v.length<4)))throw Error('privacy-policy-unavailable');
  return policy;
}
export function prepareConversationDisplay(observation,policy){
  validateConversationPolicy(policy);
  const normalize=s=>s.normalize('NFKC');
  const matches=value=>policy.rules.some(rule=>{
    const haystack=rule.case_sensitive===true?normalize(value):normalize(value).toLowerCase();
    return rule.values.some(v=>haystack.includes(rule.case_sensitive===true?normalize(v):normalize(v).toLowerCase()));
  });
  const restricted=value=>matches(value)||matches(markdownVisibleText(value));
  let withheld=0;
  function row(act){
    const identity=restricted(act.author)||restricted(act.body)||restricted(act.title??'');
    const moderated=act.moderation!==null;
    const reason=identity?'concealment':moderated?'moderation':null;
    if(reason)withheld++;
    // A whole excluded act receives a fixed placeholder. No hidden source text,
    // length-dependent bars, upstream moderation explanation, or rule ID leaks.
    return {key:act.key,id:act.id,kind:act.kind,
      author:reason?'Withheld':act.author,title:reason?null:act.title,
      body:reason?'':act.body,occurred_at:act.occurred_at,
      parent_id:act.parent_id,intended_parent_id:act.intended_parent_id,
      parent_available:act.parent_available??null,url:act.url,withheld:reason};
  }
  const post=row(observation.post),comments=observation.comments.map(row);
  return {thread_id:observation.thread_id,source_time:observation.source_time,
    observed_at:observation.observed_at,comments_total:observation.comments_total,
    comments_returned:observation.comments_returned,partial:observation.partial,
    post,comments,withheld_count:withheld,edition:'fresh-public-observation'};
}
