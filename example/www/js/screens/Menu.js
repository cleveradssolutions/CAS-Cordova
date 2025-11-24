route('#/menu', function (root) {
  renderTemplate('tmpl-menu', root);

  function onMenuNavClicked(btn) {
    go(btn.dataset.go);
  }
  function onShowConsentClicked() {
    casai
      .showConsentFlow({ ifRequired: true, debugGeography: 'eea' })
      .then(function () {
        console.log('Consent flow finished');
      })
      .catch(function (e) {
        console.log('Consent flow failed: ' + (e && e.message));
      });
  }

  root.querySelectorAll('[data-go]').forEach(function (btn) {
    btn.onclick = function () {
      onMenuNavClicked(btn);
    };
  });

  var consentBtn = document.getElementById('btnConsent');
  if (consentBtn) consentBtn.onclick = onShowConsentClicked;
});
