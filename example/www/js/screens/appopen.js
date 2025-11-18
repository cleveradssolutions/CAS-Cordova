route("#/appopen", (root) => {
  root.innerHTML = `
      <div class="card">
      <div class="title">App Open</div>
      <div class="grid-2">
          <button id="oLoad" class="btn">Load</button>
          <button id="oShow" class="btn">Show</button>
      </div>
      <div class="divider"></div>
      <button class="btn" onclick="location.hash='#/menu'">Back</button>
      </div>
      `;

  document.getElementById("oLoad").onclick = () =>
    casai.loadAppOpenAd({ autoReload:false, autoShow:false }).then(() => log("CAS: load appopen"), e => log("ERROR:", e));
  document.getElementById("oShow").onclick = () =>
    casai.showAppOpenAd().then(() => log("CAS: show appopen"), e => log("ERROR:", e));
});
