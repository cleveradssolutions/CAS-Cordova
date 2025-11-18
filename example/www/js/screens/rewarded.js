route("#/rewarded", (root) => {
  root.innerHTML = `
      <div class="card">
      <div class="title">Rewarded</div>
      <div class="grid-2">
          <button id="rLoad" class="btn">Load</button>
          <button id="rShow" class="btn">Show</button>
      </div>
      <div class="divider"></div>
      <button class="btn" onclick="location.hash='#/menu'">Back</button>
      </div>
      `;

  document.getElementById("rLoad").onclick = () =>
    casai.loadRewardedAd({ autoReload:false }).then(() => log("CAS load rewarded"), e => log("ERROR:", e));
  document.getElementById("rShow").onclick = () =>
    casai.showRewardedAd().then(() => log("CAS: show rewarded"), e => log("ERROR:", e));
});
