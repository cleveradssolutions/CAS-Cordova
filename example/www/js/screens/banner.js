route("#/banner", (root) => {
  let currentPos = casai.Position.BOTTOM_CENTER;

  root.innerHTML = `
      <div class="card">
      <div class="title">Banner</div>
      <div class="grid-2">
          <button id="bLoad" class="btn">Load Banner</button>
          <button id="bShow" class="btn">Show Banner</button>
          <button id="bHide" class="btn">Hide Banner</button>
          <button id="bDestroy" class="btn">Destroy Banner</button>
      </div>

      <div class="divider"></div>
      <p class="subtitle">Banner Position</p>
      <div class="grid-3">
          <button class="btn pos" data-pos="TOP_LEFT">Top Left</button>
          <button class="btn pos" data-pos="TOP_CENTER">Top Center</button>
          <button class="btn pos" data-pos="TOP_RIGHT">Top Right</button>
          <button class="btn pos" data-pos="BOTTOM_LEFT">Bottom Left</button>
          <button class="btn pos" data-pos="BOTTOM_CENTER">Bottom Center</button>
          <button class="btn pos" data-pos="BOTTOM_RIGHT">Bottom Right</button>
      </div>

      <div class="divider"></div>
      <button class="btn" onclick="location.hash='#/menu'">Back</button>
      </div>
      `;

  document.getElementById("bLoad").onclick = async () => {
    try {
      await casai.loadBannerAd({
        adSize: casai.Size.SMART,
        autoReload: false,
        refreshInterval: 30,
      });
      log("CAS: loadBannerAd");
    } catch (e) { log("ERROR: loadBannerAd", e); }
  };

  document.getElementById("bShow").onclick = async () => {
    try {
      await casai.showBannerAd({ position: currentPos });
      log("CAS: showBannerAd", currentPos);
    } catch (e) { log("ERROR: showBannerAd", e); }
  };

  document.getElementById("bHide").onclick = () =>
    casai.hideBannerAd().then(() => log("CAS: hideBannerAd"), e => log("ERROR:", e));

  document.getElementById("bDestroy").onclick = () =>
    casai.destroyBannerAd().then(() => log("CAS: destroyBannerAd"), e => log("ERROR:", e));

  root.querySelectorAll(".pos").forEach((btn) => {
    btn.onclick = async () => {
      currentPos = casai.Position[btn.dataset.pos];
      log("Position set:", btn.dataset.pos, currentPos);
      try {
        await casai.showBannerAd({ position: currentPos });
        log("OK: reposition banner");
      } catch (e) { }
    };
  });
});
