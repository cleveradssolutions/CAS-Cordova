route("#/setup", (root) => {
  root.innerHTML = `
      <div class="card">
      <div class="title">Initialize CAS</div>
      <p class="subtitle">One tap to set up SDK & continue</p>
      <button id="btnInit" class="btn">Initialize</button>
      <div class="divider"></div>
      <button id="btnConsent" class="btn">Show Consent (if required)</button>
  </div>
  `;

  document.getElementById("btnInit").onclick = async () => {
    try {
      const status = await casai.initialize({
        targetAudience: "notchildren",
        showConsentFormIfRequired: true,
        forceTestAds: true,
        testDeviceIds: [],
        debugGeography: "eea",
        mediationExtras: {},
      });
      log("CAS: initialize", status);
      go("#/menu");
    } catch (e) { log("ERROR: initialize", e); }
  };
  document.getElementById("btnConsent").onclick = async () => {
    try {
      const consentFlow = await casai.showConsentFlow({ ifRequired: true, debugGeography: "eea" });
      log("CAS: showConsentFlow", consentFlow);
    } catch (e) { log("ERROR: showConsentFlow", e); }
  };
});
