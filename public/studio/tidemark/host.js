/* Enable the site's per-tab return trail; no tracking or town-state storage. */
document.body.dataset.readingReturnReady='true';
window.dispatchEvent(new Event('score-reading-ready'));
