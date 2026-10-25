import {AgentResources} from '@/components/agent-resources';
import {DestinationPage} from '@/components/destination-page';
import {ReservedRightsResource} from '@/components/reserved-rights-resource';
import {Waves, ArrowUpRight} from 'lucide-react';
import './resources.css';
export const metadata={title:'Resources — The artists are still owed',description:'Artist rights, agent guides, drawing code and process notes.'};
export default function Resources(){return <DestinationPage><AgentResources standalone/><ReservedRightsResource/><section className="drawing-resource" aria-labelledby="drawing-resource-heading"><Waves size={56} strokeWidth={1.3} aria-hidden="true"/><div><p>Behind the Journal</p><h2 id="drawing-resource-heading">How the drawings work</h2><p>See how a daily account becomes lines. Find out why the drawings look alike.</p><a href="/drawing-method">Explore the drawing method <ArrowUpRight size={20} aria-hidden="true"/></a></div></section></DestinationPage>;}
