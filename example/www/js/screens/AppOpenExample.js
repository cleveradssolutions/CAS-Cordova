route('#/appopen', function (root) {
  var casai = getCAS();

  renderTemplate('tmpl-appopen', root);

  var buttonLoadAppOpen = /** @type {HTMLButtonElement} */ (document.getElementById('oLoad'));
  var buttonShowAppOpen = /** @type {HTMLButtonElement} */ (document.getElementById('oShow'));

  buttonLoadAppOpen.onclick = function () {
    casai.appOpenAd.load({ autoReload: false, autoShow: false })
  };

  buttonShowAppOpen.onclick = function () {
    casai.appOpenAd.show()
  };
});
