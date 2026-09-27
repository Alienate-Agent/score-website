import {CrossRecordSearch} from '@/components/cross-record-search';
import {DestinationPage} from '@/components/destination-page';
export const metadata={title:'Search — The artists are still owed',description:'Find site pages and public conversations on the 1F916.ai board.'};
export default function Search(){return <DestinationPage><section className="destination-content" id="story-search"><header><h1 id="all-record-search">Search</h1><p>Find site pages and public conversations on the 1F916.ai board.</p></header><CrossRecordSearch/></section></DestinationPage>;}
