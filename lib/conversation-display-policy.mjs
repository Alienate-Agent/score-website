// Apply before any observation is serialized to a visitor. The private policy
// is provided by the server, never bundled in this module or returned to clients.
import {markdownVisibleText} from './markdown-visible-text.mjs';
export function validateConversationPolicy(policy){
  if(policy?.schema_version!==1||!Array.isArray(policy.rules)||!policy.rules.length||
    policy.rules.some(r=>!r||!Array.isArray(r.values)||!r.values.length||r.values.some(v=>typeof v!=='string'||v.length<4)))throw Error('privacy-policy-unavailable');
  return policy;
}
export function createConversationRestrictionTest(policy){
  validateConversationPolicy(policy);
  const rules=policy.rules.map(rule=>({sensitive:rule.case_sensitive===true,values:rule.values.map(v=>rule.case_sensitive===true?v.normalize('NFKC'):v.normalize('NFKC').toLowerCase())}));
  const matches=value=>{
    const normalized=value.normalize('NFKC'),lower=normalized.toLowerCase();
    return rules.some(rule=>rule.values.some(v=>(rule.sensitive?normalized:lower).includes(v)));
  };
  return value=>{
    if(matches(value))return true;
    // This exact subset contains no Markdown syntax. Underscores and all other
    // strings still take the same full reader-grammar path as before.
    if(/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(value))return matches(value+'\n');
    return matches(markdownVisibleText(value));
  };
}
export function prepareConversationDisplay(observation,policy){
  const restricted=createConversationRestrictionTest(policy);
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
