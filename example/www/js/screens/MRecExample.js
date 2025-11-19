route('#/mrec', function (root) {
  var casai = getCAS();

  renderTemplate('tmpl-mrec', root);

  var buttonLoadMrec = /** @type {HTMLButtonElement} */ (document.getElementById('mLoad'));
  var buttonShowMrec = /** @type {HTMLButtonElement} */ (document.getElementById('mShow'));
  var buttonHideMrec = /** @type {HTMLButtonElement} */ (document.getElementById('mHide'));
  var buttonDestroyMrec = /** @type {HTMLButtonElement} */ (document.getElementById('mDestroy'));

  buttonLoadMrec.onclick = function () {
    casai.mrecAd.load({ autoReload: false, refreshInterval: 30 })
  };

  buttonShowMrec.onclick = function () {
    casai.mrecAd.show({ position: casai.Position.MIDDLE_CENTER });
    log('MREC show');
  };

  buttonHideMrec.onclick = function () {
    casai.mrecAd.hide();
    log('MREC hide');
  };

  buttonDestroyMrec.onclick = function () {
    casai.mrecAd.destroy();
    log('MREC destroy');
  };
});
