route('#/appopen', function (root) {
  renderTemplate('tmpl-appopen', root);

  function onAppOpenLoadClicked() {
    window.onExamplePageClosed = onAppOpenExamplePageClosed;

    casai.appOpenAd
      .load({
        autoReload: true,
        autoShow: true,
      })
      .then(function () {
        console.log('AppOpen Ad loaded');
      })
      .catch(function (e) {
        console.log('AppOpen Ad failed to load: ' + e.message);
      });
  }

  function onAppOpenShowClicked() {
    casai.appOpenAd
      .show()
      .then(function () {
        console.log('AppOpen Ad closed');
      })
      .catch(function (e) {
        console.log('AppOpen Ad failed to show: ' + e.message);
      });
  }

  function onAppOpenDestroyClicked() {
    casai.appOpenAd.destroy();
    console.log('AppOpen Ad destroy()');
  }

  document.getElementById('oLoad').onclick = onAppOpenLoadClicked;
  document.getElementById('oShow').onclick = onAppOpenShowClicked;
  document.getElementById('oDestroy').onclick = onAppOpenDestroyClicked;


  // MARK: Optional Document Events

  /**
   * @param {AdInfoEvent} event
   */
  function onAdLoadedEvent(event) {
    if (event.format == casai.Format.APPOPEN) {
      console.log('(Event) AppOpen Ad loaded');
    }
  }

  /**
   * @param {AdErrorEvent} event
   */
  function onAdFailedToLoadEvent(event) {
    if (event.format == casai.Format.APPOPEN) {
      console.log('(Event) AppOpen Ad failed to load: ' + event.message);
    }
  }

  /**
   * @param {AdErrorEvent} event
   */
  function onAdFailedToShowEvent(event) {
    if (event.format == casai.Format.APPOPEN) {
      console.log('(Event) AppOpen Ad failed to show: ' + event.message);
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdShowedEvent(event) {
    if (event.format == casai.Format.APPOPEN) {
      console.log('(Event) AppOpen Ad showed');
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdClickedEvent(event) {
    if (event.format == casai.Format.APPOPEN) {
      console.log('(Event) AppOpen Ad clicked');
    }
  }

  /**
   * @param {AdContentInfoEvent} event
   */
  function onAdImpressionEvent(event) {
    if (event.format == casai.Format.APPOPEN) {
      console.log('(Event) AppOpen Ad impression from ' + event.sourceName);
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdDismissedEvent(event) {
    if (event.format == casai.Format.APPOPEN) {
      console.log('(Event) AppOpen Ad dismissed');
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

  function onAppOpenExamplePageClosed() {
    onAppOpenDestroyClicked();

    document.removeEventListener('casai_ad_loaded', onAdLoadedEvent, false);
    document.removeEventListener('casai_ad_load_failed', onAdFailedToLoadEvent, false);
    document.removeEventListener('casai_ad_show_failed', onAdFailedToShowEvent, false);
    document.removeEventListener('casai_ad_showed', onAdShowedEvent, false);
    document.removeEventListener('casai_ad_clicked', onAdClickedEvent, false);
    document.removeEventListener('casai_ad_impressions', onAdImpressionEvent, false);
    document.removeEventListener('casai_ad_dismissed', onAdDismissedEvent, false);
  }
});
