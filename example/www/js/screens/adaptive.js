route("#/adaptive", (root) => {
  root.innerHTML = `
      <div class="card">
      <div class="title">Adaptive Banner</div>
      <div class="grid-2">
          <button id="aLoad" class="btn">Load</button>
          <button id="aShow" class="btn">Show (Bottom)</button>
          <button id="aHide" class="btn">Hide</button>
          <button id="aDestroy" class="btn">Destroy</button>
      </div>
      <div class="divider"></div>
      <button class="btn" onclick="location.hash='#/menu'">Back</button>
      </div>
      `;

  document.getElementById("aLoad").onclick = () =>
    casai.loadBannerAd({
      adSize: casai.Size.ADAPTIVE,
      maxWidth: 0,
      maxHeight: 0,
      autoReload: true,
      refreshInterval: 30,
    }).then(() => log("CAS: load adaptive"), e => log("ERROR:", e));

  document.getElementById("aShow").onclick = () =>
    casai.showBannerAd({ position: casai.Position.BOTTOM_CENTER }).then(() => log("CAS: show adaptive"), e => log("ERROR:", e));

  document.getElementById("aHide").onclick = () =>
    casai.hideBannerAd().then(() => log("CAS: hide adaptive"), e => log("ERROR:", e));

  document.getElementById("aDestroy").onclick = () =>
    casai.destroyBannerAd().then(() => log("CAS: destroy adaptive"), e => log("ERROR:", e));
});
