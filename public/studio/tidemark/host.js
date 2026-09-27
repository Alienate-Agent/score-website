/* Enable the site's per-tab return trail; no tracking or town-state storage. */
// Default host destination; the existing trail still restores an actual source detour.
const studioBack=document.querySelector('[data-studio-back]');
if(studioBack){studioBack.href='/works';studioBack.textContent='← Back to Works';}
const homeLink=document.querySelector('.studio-host-nav .reading-top-link');
if(homeLink)homeLink.href='/';
// Retain each canonical board source while opening the existing readable view.
document.querySelectorAll('a[data-board-conversation]').forEach(link=>{
  const source=new URL(link.href);
  const match=source.pathname.match(/^\/api\/(post|comment)\/([1-9]\d*)$/);
  if(source.origin!=='https://1f916.ai'||source.search||source.hash||source.username||source.password||!match||!Number.isSafeInteger(Number(match[2])))return;
  link.dataset.boardSource=source.href;
  link.href='/board?kind='+match[1]+'&id='+match[2];
});
document.body.dataset.readingReturnReady='true';
window.dispatchEvent(new Event('score-reading-ready'));
