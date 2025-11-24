route('#/menu', function (root) {
  renderTemplate('tmpl-menu', root);

  function onMenuNavClick(btn) {
    go(btn.dataset.go);
  }
  function onShowConsent() {
    window.casai.showConsentFlow({ ifRequired: true, debugGeography: 'eea' })
      .then(function (res) { console.log('Consent flow result', res); })
      .catch(function (e) { console.log('Consent flow failed', e); });
  }

  root.querySelectorAll('[data-go]').forEach(function (btn) {
    btn.onclick = function () { onMenuNavClick(btn); };
  });

  var consentBtn = document.getElementById('btnConsent');
  if (consentBtn) consentBtn.onclick = onShowConsent;
});
