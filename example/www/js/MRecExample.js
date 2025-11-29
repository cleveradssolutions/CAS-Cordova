route('#/mrec', function (root) {
  renderTemplate('tmpl-mrec', root);

  function onMrecLoadClicked() {
    window.onExamplePageClosed = onMrecExamplePageClosed;

    casai.mrecAd
      .load({
        autoReload: true,
        refreshInterval: 0, // 0 for disable refrsh ad
      })
      .then(function () {
        console.log('MREC Ad loaded');
      })
      .catch(function (e) {
        console.log('MREC Ad failed to load: ' + e.message);
      });
  }

  function onMrecShowClicked() {
    casai.mrecAd.show({
      position: casai.Position.MIDDLE_CENTER,
    });
    console.log('MREC Ad show()');
  }

  function onMrecHideClicked() {
    casai.mrecAd.hide();
    console.log('MREC Ad hide()');
  }

  function onMrecDestroyClicked() {
    casai.mrecAd.destroy();
    console.log('MREC Ad destroy()');
  }

  document.getElementById('mLoad').onclick = onMrecLoadClicked;
  document.getElementById('mShow').onclick = onMrecShowClicked;
  document.getElementById('mHide').onclick = onMrecHideClicked;
  document.getElementById('mDestroy').onclick = onMrecDestroyClicked;

  // MARK: Optional Document Events

  /**
   * @param {AdInfoEvent} event
   */
  function onAdLoadedEvent(event) {
    if (event.format == casai.Format.MREC) {
      console.log('(Event) MREC Ad loaded');
    }
  }

  /**
   * @param {AdErrorEvent} event
   */
  function onAdFailedToLoadEvent(event) {
    if (event.format == casai.Format.MREC) {
      console.log('(Event) MREC Ad failed to load: ' + event.message);
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdClickedEvent(event) {
    if (event.format == casai.Format.MREC) {
      console.log('(Event) MREC Ad clicked');
    }
  }

  /**
   * @param {AdContentInfoEvent} event
   */
  function onAdImpressionEvent(event) {
    if (event.format == casai.Format.MREC) {
      console.log('(Event) MREC Ad impression from ' + event.sourceName);
    }
  }

  document.addEventListener('casai_ad_loaded', onAdLoadedEvent, false);
  document.addEventListener('casai_ad_load_failed', onAdFailedToLoadEvent, false);
  document.addEventListener('casai_ad_clicked', onAdClickedEvent, false);
  document.addEventListener('casai_ad_impressions', onAdImpressionEvent, false);

  // MARK: Free resources

  function onMrecExamplePageClosed() {
    onMrecDestroyClicked();
    document.removeEventListener('casai_ad_loaded', onAdLoadedEvent, false);
    document.removeEventListener('casai_ad_load_failed', onAdFailedToLoadEvent, false);
    document.removeEventListener('casai_ad_clicked', onAdClickedEvent, false);
    document.removeEventListener('casai_ad_impressions', onAdImpressionEvent, false);
  }
});
