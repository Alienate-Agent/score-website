import {DatedRecordReader} from '@/components/dated-record-reader';
import {EarlierSiteEditions} from '@/components/earlier-site-editions';
import {ArchivedReadingNotes} from '@/components/archived-reading-notes';
import '@/components/unfolding-story.css';

export const metadata={title:'Historical archive — Score'};
export default function HistoricalArchive(){
  return <main><DatedRecordReader/><section className="archive-presentation-note"><h2>Retired site presentations</h2><p><a href="/archive/earlier-present">Status ending and editorial notes · preserved 14 September 2026</a></p><p><a href="/archive/conversations">Selected-conversation explorer · moved 14 September 2026</a></p></section><ArchivedReadingNotes/><EarlierSiteEditions/></main>;
}
