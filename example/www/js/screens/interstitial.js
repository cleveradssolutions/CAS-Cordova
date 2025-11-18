route("#/interstitial", (root) => {
  root.innerHTML = `
      <div class="card">
      <div class="title">Interstitial</div>
      <div class="grid-2">
          <button id="iLoad" class="btn">Load</button>
          <button id="iShow" class="btn">Show</button>
      </div>
      <div class="divider"></div>
      <button class="btn" onclick="location.hash='#/menu'">Back</button>
      </div>
      `;
  document.getElementById("iLoad").onclick = () =>
    casai.loadInterstitialAd({ autoReload:false, autoShow:false, minInterval:0 }).then(() => log("CAS: load interstitial"), e => log("ERROR:", e));
  document.getElementById("iShow").onclick = () =>
    casai.showInterstitialAd().then(() => log("CAS show interstitial"), e => log("ERROR:", e));
});
