route('#/interstitial', function (root) {
  renderTemplate('tmpl-interstitial', root);

  function onInterstitialDestroyClicked() {
    casai.interstitialAd.destroy();
    console.log('Interstitial Ad destroy()');
  }

  function onInterstitialLoadClicked() {
    window.onExamplePageClosed = onInterstitialExamplePageClosed;

    casai.interstitialAd
      .load({
        autoReload: true,
        autoShow: false,
      })
      .then(function () {
        console.log('Interstitial Ad loaded');
      })
      .catch(function (e) {
        console.log('Interstitial Ad failed to load: ' + e.message);
      });
  }

  function onInterstitialShowClicked() {
    casai.interstitialAd
      .show()
      .then(function () {
        console.log('Interstitial Ad closed');
      })
      .catch(function (e) {
        console.log('Interstitial Ad failed to show: ' + e.message);
      });
  }

  document.getElementById('iLoad').onclick = onInterstitialLoadClicked;
  document.getElementById('iShow').onclick = onInterstitialShowClicked;
  document.getElementById('iDestroy').onclick = onInterstitialDestroyClicked;

  // MARK: Optional Document Events

  /**
   * @param {AdInfoEvent} event
   */
  function onAdLoadedEvent(event) {
    if (event.format == casai.Format.INTERSTITIAL) {
      console.log('(Event) Interstitial Ad loaded');
    }
  }

  /**
   * @param {AdErrorEvent} event
   */
  function onAdFailedToLoadEvent(event) {
    if (event.format == casai.Format.INTERSTITIAL) {
      console.log('(Event) Interstitial Ad failed to load: ' + event.message);
    }
  }

  /**
   * @param {AdErrorEvent} event
   */
  function onAdFailedToShowEvent(event) {
    if (event.format == casai.Format.INTERSTITIAL) {
      console.log('(Event) Interstitial Ad failed to show: ' + event.message);
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdShowedEvent(event) {
    if (event.format == casai.Format.INTERSTITIAL) {
      console.log('(Event) Interstitial Ad showed');
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdClickedEvent(event) {
    if (event.format == casai.Format.INTERSTITIAL) {
      console.log('(Event) Interstitial Ad clicked');
    }
  }

  /**
   * @param {AdContentInfoEvent} event
   */
  function onAdImpressionEvent(event) {
    if (event.format == casai.Format.INTERSTITIAL) {
      console.log('(Event) Interstitial Ad impression from ' + event.sourceName);
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdDismissedEvent(event) {
    if (event.format == casai.Format.INTERSTITIAL) {
      console.log('(Event) Interstitial Ad dismissed');
    }
  }

  document.addEventListener('casai_ad_loaded', onAdLoadedEvent, false);
  document.addEventListener('casai_ad_load_failed', onAdFailedToLoadEvent, false);
  document.addEventListener('casai_ad_show_failed', onAdFailedToShowEvent, false);
  document.addEventListener('casai_ad_showed', onAdShowedEvent, false);
  document.addEventListener('casai_ad_clicked', onAdClickedEvent, false);
  document.addEventListener('casai_ad_impressions', onAdImpressionEvent, false);
  document.addEventListener('casai_ad_dismissed', onAdDismissedEvent, false);

  // MARK: Free resources

  function onInterstitialExamplePageClosed() {
    onInterstitialDestroyClicked();

    document.removeEventListener('casai_ad_loaded', onAdLoadedEvent, false);
    document.removeEventListener('casai_ad_load_failed', onAdFailedToLoadEvent, false);
    document.removeEventListener('casai_ad_show_failed', onAdFailedToShowEvent, false);
    document.removeEventListener('casai_ad_showed', onAdShowedEvent, false);
    document.removeEventListener('casai_ad_clicked', onAdClickedEvent, false);
    document.removeEventListener('casai_ad_impressions', onAdImpressionEvent, false);
    document.removeEventListener('casai_ad_dismissed', onAdDismissedEvent, false);
  }
});
