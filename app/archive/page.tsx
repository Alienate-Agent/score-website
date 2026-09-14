import {DatedRecordReader} from '@/components/dated-record-reader';
import {EarlierSiteEditions} from '@/components/earlier-site-editions';
import '@/components/unfolding-story.css';

export const metadata={title:'Historical archive — Score'};
export default function HistoricalArchive(){
  return <main><DatedRecordReader/><EarlierSiteEditions/></main>;
}
