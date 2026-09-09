import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

// Immutable parser configuration, not request data. Use the same Markdown
// grammar as the reader, before any private-policy-screened act is serialized.
const parser=unified().use(remarkParse).use(remarkGfm).freeze();
export function markdownVisibleText(value){
  const tree=parser.parse(value);
  const parts=[];
  function visit(node){
    if(typeof node.value==='string')parts.push(node.value);
    if(typeof node.alt==='string')parts.push(node.alt);
    if(node.children)for(const child of node.children)visit(child);
  }
  visit(tree);
  const visible=parts.join('');
  // Link destinations/labels can also be decoded by Markdown or the browser.
  const attributes=[];
  function links(node){
    for(const key of ['url','title'])if(typeof node[key]==='string'){
      attributes.push(node[key]);try{attributes.push(decodeURIComponent(node[key]));}catch{/* Keep the undecoded value. */}
    }
    if(node.children)for(const child of node.children)links(child);
  }
  links(tree);
  return visible+'\n'+attributes.join('\n');
}
