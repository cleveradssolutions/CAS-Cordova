route('#/setup', function (root) {
  renderTemplate('tmpl-setup', root);

  var buttonInit = /** @type {HTMLButtonElement} */ (document.getElementById('btnInit'));
  var buttonConsent = /** @type {HTMLButtonElement} */ (document.getElementById('btnConsent'));

  buttonInit.onclick = function () {
    var cas = window.casai;
    cas.initialize({
      targetAudience: 'notchildren',
      showConsentFormIfRequired: true,
      forceTestAds: true,
      testDeviceIds: [],
      debugGeography: 'eea',
      mediationExtras: {}
    })
    .then(function (status) {
      if (status && status.error) log('Initialize status with warning', status);
      log('CAS initialized', status);
      go('#/menu');
    })
    .catch(function (e) { log('Initialize failed', e); });
  };


  buttonConsent.onclick = function () {
    var cas = window.casai;
    cas.showConsentFlow({ ifRequired: true, debugGeography: 'eea' })
      .then(function (result) { log('Consent flow result', result); })
      .catch(function (e) { log('Consent flow failed', e); });
  };
});
