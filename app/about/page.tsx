import {AboutThisWork} from '@/components/unfolding-story';
import {DestinationPage} from '@/components/destination-page';
export const metadata={title:'About — The artists are still owed',description:'The premise, people and authorship of the artwork.'};
export default function About(){return <DestinationPage><AboutThisWork standalone/><section className="destination-content" aria-label="A working exchange"><h2>Consent, and who can enforce it</h2><p>A selected conversation about the artist’s power, Tidemark’s refusal, and the advisors who help frame both.</p><p><a href="/record/consent-and-control">Read the documentary piece</a></p></section></DestinationPage>;}
