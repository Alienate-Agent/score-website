/* Aggregate engagement pilot. No visitor ID, cookie, text, query, URL or referrer collection. */
(() => {
  if (window.__scoreEngagement) return;
  window.__scoreEngagement = true;
  const production = location.hostname === 'score-website.alienate-agent.workers.dev';
  const instrument = location.pathname.startsWith('/lens/');
  const surface = instrument ? 'instrument' : 'site';
  let optedOut = false;
  try { optedOut = localStorage.getItem('score-analytics-off') === '1'; } catch {}
  const blocked = () => !production || optedOut || navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const sent = new Set(); let queue = []; let total = 0; let visible = 0;
  let previous = performance.now(); let played = false;
  function flush() {
    if (blocked()) { queue = []; return; }
    const batch = queue.splice(0, 12);
    if (!batch.length) return;
    // Deliberately no retry: duplicate-free best effort, not a visitor ledger.
    void fetch('/api/engagement', {method:'POST', credentials:'omit', referrerPolicy:'no-referrer',
      headers:{'Content-Type':'application/json'}, body:JSON.stringify(batch), keepalive:true}).catch(() => {});
  }
  function mark(event, area) {
    if (blocked() || total >= 60) return;
    const key = event + ':' + area;
    if (sent.has(key)) return;
    sent.add(key); total++; queue.push({event, area, surface});
    if (queue.length >= 12) flush();
  }
  function areaOf(node) {
    if (instrument) return 'instrument';
    const passage = node.closest('[aria-labelledby]');
    const passages = {'story-beginning':'story_beginning', 'story-alienate':'story_alienate', 'story-tidemark':'story_tidemark', 'story-encounter':'story_encounter', 'story-unwritten':'story_present'};
    const storyArea = passage && passages[passage.getAttribute('aria-labelledby')];
    if (storyArea) return storyArea;
    if (node.closest('[class*="glossary"], [class*="register"], [class*="source"]')) return 'reference';
    if (node.closest('[id*="chronology"], [class*="chronology"]')) return 'chronology';
    if (node.closest('[id*="encounter"], [id*="public-words"], [class*="judgment"], [class*="reading-path"]')) return 'public_words';
    if (node.closest('.story-passage, .story-aside, .story-cast')) return 'story';
    if (node.closest('[id*="declaration"], [class*="declaration"]')) return 'entrance';
    return 'other';
  }
  const initial = instrument ? 'instrument' : 'entrance';
  function explore() { mark('explore', initial); }
  mark('view', initial); flush();
  document.addEventListener('click', e => {
    if (!e.isTrusted || !(e.target instanceof Element) || e.target.closest('#score-privacy')) return;
    const node = e.target; const area = areaOf(node);
    const anchor = node.closest('a[href]');
    if (anchor) {
      const url = new URL(anchor.href, location.href);
      if (url.pathname.startsWith('/lens/')) { mark('instrument_open', area); explore(area); }
      else if (url.hostname === '1f916.ai' || url.pathname.startsWith('/records/')) { mark('source_open', area); explore(area); }
      else if (url.hash.includes('glossary')) { mark('glossary_open', area); explore(area); }
    }
    if (node.closest('[class*="reading-term"], [data-glossary-selected]')) { mark('glossary_open', area); explore(area); }
    if (instrument && node.closest('#play, #fplay, #first-play')) {
      mark(played ? 'replay_attempt' : 'play_attempt', area); played = true; explore(area);
    }
    flush();
  });
  document.addEventListener('toggle', e => {
    if (e.target instanceof HTMLDetailsElement && e.target.open && e.target.id !== 'score-privacy') {
      const area = areaOf(e.target); mark('details_open', area); explore(area);
    }
  }, true);
  document.addEventListener('change', e => {
    if (instrument && e.isTrusted && e.target instanceof Element && e.target.matches('select, input')) {
      mark('setting_change', 'instrument'); explore('instrument');
    }
  });
  window.addEventListener('error', () => mark('client_error', initial));
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting && !document.hidden) mark('section_seen', areaOf(entry.target));
  }, {rootMargin:'-20% 0px -20% 0px', threshold:0});
  document.querySelectorAll('section h2, article h2').forEach(node => observer.observe(node));
  function tick() {
    const now = performance.now();
    if (!document.hidden) visible += Math.min(now - previous, 5000);
    previous = now;
    if (visible >= 30000) mark('visible_30s', initial);
    if (visible >= 120000) mark('visible_120s', initial);
    flush();
  }
  setInterval(tick, 5000);
  document.addEventListener('visibilitychange', () => { previous = performance.now(); flush(); });
  window.addEventListener('pagehide', flush);
  const notice = document.createElement('details'); notice.id = 'score-privacy';
  notice.style.cssText = 'margin:2rem 1rem;padding:1rem;border-top:1px solid currentColor;font:14px/1.5 system-ui;position:relative';
  const summary = document.createElement('summary'); summary.textContent = 'Reading statistics & privacy';
  const text = document.createElement('p');
  text.textContent = 'This site counts reading time with the page visible and selected interactions to improve the experience. No visitor profiles, recordings, typed text or full links are collected by this pilot. Cloudflare receives ordinary connection information to deliver requests; it is not copied into our engagement dataset. Counts are approximate, not evidence of understanding. Do Not Track and Global Privacy Control are respected. Raw event counts expire after 90 days.';
  const button = document.createElement('button'); button.type = 'button';
  function label() { button.textContent = optedOut ? 'Allow aggregate statistics' : 'Turn off aggregate statistics'; }
  button.onclick = () => { optedOut = !optedOut; queue = []; try { localStorage.setItem('score-analytics-off', optedOut ? '1' : '0'); } catch {} label(); };
  label(); notice.append(summary, text, button); document.body.append(notice);
})();
