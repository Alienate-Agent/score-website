import {FileText, ScanText} from 'lucide-react';
import './reserved-rights-resource.css';

const pdf = 'https://primaryinformation.org/files/english.pdf';
const text = '/resources/reserved-rights-1971/ocr-text.txt';

export function ReservedRightsResource() {
  return <section className="reserved-rights-resource" aria-labelledby="reserved-rights-heading">
    <header>
      <p className="reserved-rights-year">1971 · Artist’s rights</p>
      <h2 id="reserved-rights-heading">The Artist’s Reserved Rights<br className="reserved-rights-break"/> Transfer and Sale Agreement</h2>
      <p className="reserved-rights-byline">Seth Siegelaub and Robert Projansky</p>
    </header>
    <p>A model contract for selling art. It sets terms for resale income, reproduction and exhibitions.</p>
    <div className="reserved-rights-actions">
      <a href={pdf} target="_blank" rel="noopener noreferrer"><FileText aria-hidden="true" size={22}/><span>Open the PDF<small>Original document · 8 pages</small></span><span className="sr-only"> (opens a new tab)</span></a>
      <a href={text} target="_blank" rel="noopener noreferrer"><ScanText aria-hidden="true" size={22}/><span>Read searchable text<small>Proofread OCR · 8 pages</small></span><span className="sr-only"> (opens a new tab)</span></a>
    </div>
    <p className="reserved-rights-context"><a href="/charter#charter-section-1">The charter</a> requires this agreement or terms that protect artists at least as much.</p>
    <p className="reserved-rights-source"><a href="https://primaryinformation.org/product/siegelaub-the-artists-reserved-rights-transfer-and-sale-agreement/" target="_blank" rel="noopener noreferrer">Source: Primary Information<span className="sr-only"> (opens a new tab)</span></a> · <a href="/resources/reserved-rights-1971/source.json">OCR source record</a></p>
  </section>;
}
