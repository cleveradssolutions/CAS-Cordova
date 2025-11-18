route("#/menu", (root) => {
  root.innerHTML = `
      <div class="card">
      <div class="title">Examples</div>
      <p class="subtitle">Choose an ad format to test</p>

      <button class="btn" data-go="#/interstitial">Interstitial</button>
      <button class="btn" data-go="#/rewarded">Rewarded</button>
      <button class="btn" data-go="#/appopen">App Open</button>

      <div class="divider"></div>

      <button class="btn" data-go="#/banner">Banner (AdView)</button>
      <button class="btn" data-go="#/mrec">MREC (AdView)</button>
      <button class="btn" data-go="#/adaptive">Adaptive (AdView)</button>
  </div>
  `;
  root.querySelectorAll("[data-go]").forEach(b => (b.onclick = () => go(b.dataset.go)));
});
