const button = document.querySelector('[data-wallet-refresh]');
const amount = document.querySelector('[data-wallet-value]');
const status = document.querySelector('[data-wallet-status]');
const dateLabel = value => new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  timeZone: 'America/New_York', timeZoneName: 'short',
}).format(new Date(value));
if (button && amount && status) {
  button.hidden = false;
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    status.textContent = 'Checking the board…';
    try {
      const response = await fetch('/api/society-wallet', {credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(15000)});
      if (!response.ok) throw Error('unavailable');
      const data = await response.json();
      if (data.asset !== 'USDC' || data.network !== 'Base' || !Number.isSafeInteger(data.balanceCents) || data.balanceCents < 0
          || !Number.isFinite(Date.parse(data.checkedAt)) || typeof data.stale !== 'boolean') throw Error('shape');
      if (data.stale || Date.parse(data.checkedAt) < Date.parse(amount.dataset.checkedAt)) {
        status.textContent = `The board returned older data (${dateLabel(data.checkedAt)}). The displayed figure is unchanged.`;
      } else {
        amount.textContent = new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(data.balanceCents / 100);
        amount.dataset.checkedAt = data.checkedAt;
        status.textContent = `Wallet checked · ${dateLabel(data.checkedAt)}`;
      }
    } catch {
      status.textContent = 'Could not refresh the wallet. The last displayed figure is still shown. Try again.';
    } finally { button.disabled = false; }
  });
}
