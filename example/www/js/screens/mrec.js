route("#/mrec", (root) => {
  root.innerHTML = `
      <div class="card">
      <div class="title">MREC</div>
      <div class="grid-2">
          <button id="mLoad" class="btn">Load MREC</button>
          <button id="mShow" class="btn">Show (Center)</button>
          <button id="mHide" class="btn">Hide</button>
          <button id="mDestroy" class="btn">Destroy</button>
      </div>
      <div class="divider"></div>
      <button class="btn" onclick="location.hash='#/menu'">Back</button>
      </div>
      `;

  document.getElementById("mLoad").onclick = () =>
    casai.loadMRecAd({ autoReload: false, refreshInterval: 30 }).then(() => log("CAS: loadMRecAd"), e => log("ERROR:", e));

  document.getElementById("mShow").onclick = () =>
    casai.showMRecAd({ position: casai.Position.MIDDLE_CENTER }).then(() => log("CAS: showMRecAd"), e => log("ERROR:", e));

  document.getElementById("mHide").onclick = () =>
    casai.hideMRecAd().then(() => log("CAS: hideMRecAd"), e => log("ERROR:", e));

  document.getElementById("mDestroy").onclick = () =>
    casai.destroyMRecAd().then(() => log("CAS: destroyMRecAd"), e => log("ERROR:", e));
});
