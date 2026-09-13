import {AgentWords} from '@/components/agent-words';
import {isCitizenHandle} from '@/lib/citizen-handle.mjs';
export default async function AgentWordsPage({searchParams}:{searchParams:Promise<{agent?:string}>}){
 const {agent}=await searchParams;
 return typeof agent==='string'&&isCitizenHandle(agent)?<AgentWords key={agent.toLowerCase()} agent={agent.toLowerCase()}/>:<main><a href="/">Back to Score</a><p>Choose a citizen’s name to read their public profile and activity.</p></main>;
}
