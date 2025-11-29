route('#/banner', function (root) {
  renderTemplate('tmpl-banner', root);

  var currentPos = casai.Position.BOTTOM_CENTER;

  function onBannerLoadClicked() {
    window.onExamplePageClosed = onBannerExamplePageClosed;

    casai.bannerAd
      .load({
        adSize: casai.Size.SMART,
        autoReload: true,
      })
      .then(function () {
        console.log('Banner Ad loaded');
      })
      .catch(function (e) {
        console.log('Banner Ad failed to load: ' + e.message);
      });
  }

  function onBannerShowClicked() {
    casai.bannerAd.show({ position: currentPos });
    console.log('Banner Ad show() at', currentPos);
  }

  function onBannerHideClicked() {
    casai.bannerAd.hide();
    console.log('Banner Ad hide()');
  }

  function onBannerDestroyClicked() {
    casai.bannerAd.destroy();
    console.log('Banner Ad destroy()');
  }

  function onBannerPositionChanged(btn) {
    currentPos = casai.Position[btn.dataset.pos];
    console.log('Banner position ->', btn.dataset.pos, currentPos);
    casai.bannerAd.show({ position: currentPos });
  }

  document.getElementById('bLoad').onclick = onBannerLoadClicked;
  document.getElementById('bShow').onclick = onBannerShowClicked;
  document.getElementById('bHide').onclick = onBannerHideClicked;
  document.getElementById('bDestroy').onclick = onBannerDestroyClicked;

  root.querySelectorAll('.pos').forEach(function (btn) {
    btn.onclick = function () {
      onBannerPositionChanged(btn);
    };
  });

  // MARK: Optional Document Events

  /**
   * @param {CustomEvent<AdInfoEvent} event
   */
  function onAdLoadedEvent(event) {
    if (event.format == casai.Format.BANNER) {
      console.log('(Event) Banner Ad loaded');
    }
  }

  /**
   * @param {AdErrorEvent} event
   */
  function onAdFailedToLoadEvent(event) {
    if (event.format == casai.Format.BANNER) {
      console.log('(Event) Banner Ad failed to load: ' + event.message);
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdClickedEvent(event) {
    if (event.format == casai.Format.BANNER) {
      console.log('(Event) Banner Ad clicked');
    }
  }

  /**
   * @param {AdContentInfoEvent} event
   */
  function onAdImpressionEvent(event) {
    if (event.format == casai.Format.BANNER) {
      console.log('(Event) Banner Ad impression from ' + event.sourceName);
    }
  }

  document.addEventListener('casai_ad_loaded', onAdLoadedEvent, false);
  document.addEventListener('casai_ad_load_failed', onAdFailedToLoadEvent, false);
  document.addEventListener('casai_ad_clicked', onAdClickedEvent, false);
  document.addEventListener('casai_ad_impressions', onAdImpressionEvent, false);

  // MARK: Free resources

  function onBannerExamplePageClosed() {
    onBannerDestroyClicked();
    document.removeEventListener('casai_ad_loaded', onAdLoadedEvent, false);
    document.removeEventListener('casai_ad_load_failed', onAdFailedToLoadEvent, false);
    document.removeEventListener('casai_ad_clicked', onAdClickedEvent, false);
    document.removeEventListener('casai_ad_impressions', onAdImpressionEvent, false);
  }
});
