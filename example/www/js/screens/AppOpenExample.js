route('#/appopen', function (root) {
  renderTemplate('tmpl-appopen', root);
  var cas = window.casai;

  function onAppOpenLoad() {
    cas.appOpenAd.load({ autoReload: false, autoShow: false })
      .then(function (info) { console.log('AppOpen load()', info); })
      .catch(function (e) { console.log('AppOpen load() failed', e); });
  }
  function onAppOpenShow() {
    cas.appOpenAd.show()
      .then(function (info) { console.log('AppOpen closed', info); })
      .catch(function (e) { console.log('AppOpen show() failed', e); });
  }

  document.getElementById('oLoad').onclick = onAppOpenLoad;
  document.getElementById('oShow').onclick = onAppOpenShow;
});
