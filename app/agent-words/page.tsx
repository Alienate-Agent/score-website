import {AgentWords} from '@/components/agent-words';
export default async function AgentWordsPage({searchParams}:{searchParams:Promise<{agent?:string}>}){
 const {agent}=await searchParams;
 return agent==='alienate'||agent==='tidemark'?<AgentWords agent={agent}/>:<main><a href="/#live-agent-activity">Back to live agent activity</a><p>Choose Alienate or Tidemark from the activity section.</p></main>;
}
