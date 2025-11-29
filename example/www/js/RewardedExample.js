route('#/rewarded', function (root) {
  renderTemplate('tmpl-rewarded', root);

  function onRewardedLoadClicked() {
    window.onExamplePageClosed = onRewardedExamplePageClosed;

    casai.rewardedAd
      .load({ autoReload: true })
      .then(function () {
        console.log('Rewarded Ad loaded');
      })
      .catch(function (e) {
        console.log('Rewarded Ad failed to load: ' + e.message);
      });
  }

  function onRewardedShowClicked() {
    casai.rewardedAd
      .show()
      .then(function (info) {
        if (info.isUserEarnReward) {
          console.log('User earn reward');
        }
        console.log('Rewarded Ad closed');
      })
      .catch(function (e) {
        console.log('Rewarded Ad failed to show: ' + e.message);
      });
  }

  function onRewardedDestroyClicked() {
    casai.rewardedAd.destroy();
    console.log('Rewarded Ad destroy()');
  }

  document.getElementById('rLoad').onclick = onRewardedLoadClicked;
  document.getElementById('rShow').onclick = onRewardedShowClicked;
  document.getElementById('rDestroy').onclick = onRewardedDestroyClicked;

  // MARK: Optional Document Events

  /**
   * @param {AdInfoEvent} event
   */
  function onAdUserEarnRewardEvent(event) {
    console.log('(Event) User earn reward from Rewarded Ad');
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdLoadedEvent(event) {
    if (event.format == casai.Format.REWARDED) {
      console.log('(Event) Rewarded Ad loaded');
    }
  }

  /**
   * @param {AdErrorEvent} event
   */
  function onAdFailedToLoadEvent(event) {
    if (event.format == casai.Format.REWARDED) {
      console.log('(Event) Rewarded Ad failed to load: ' + event.message);
    }
  }

  /**
   * @param {AdErrorEvent} event
   */
  function onAdFailedToShowEvent(event) {
    if (event.format == casai.Format.REWARDED) {
      console.log('(Event) Rewarded Ad failed to show: ' + event.message);
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdShowedEvent(event) {
    if (event.format == casai.Format.REWARDED) {
      console.log('(Event) Rewarded Ad showed');
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdClickedEvent(event) {
    if (event.format == casai.Format.REWARDED) {
      console.log('(Event) Rewarded Ad clicked');
    }
  }

  /**
   * @param {AdContentInfoEvent} event
   */
  function onAdImpressionEvent(event) {
    if (event.format == casai.Format.REWARDED) {
      console.log('(Event) Rewarded Ad impression from ' + event.sourceName);
    }
  }

  /**
   * @param {AdInfoEvent} event
   */
  function onAdDismissedEvent(event) {
    if (event.format == casai.Format.REWARDED) {
      console.log('(Event) Rewarded Ad dismissed');
    }
  }

  document.addEventListener('casai_ad_reward', onAdUserEarnRewardEvent, false);
  document.addEventListener('casai_ad_loaded', onAdLoadedEvent, false);
  document.addEventListener('casai_ad_load_failed', onAdFailedToLoadEvent, false);
  document.addEventListener('casai_ad_show_failed', onAdFailedToShowEvent, false);
  document.addEventListener('casai_ad_showed', onAdShowedEvent, false);
  document.addEventListener('casai_ad_clicked', onAdClickedEvent, false);
  document.addEventListener('casai_ad_impressions', onAdImpressionEvent, false);
  document.addEventListener('casai_ad_dismissed', onAdDismissedEvent, false);

  // MARK: Free resources

  function onRewardedExamplePageClosed() {
    onRewardedDestroyClicked();

    document.removeEventListener('casai_ad_reward', onAdUserEarnRewardEvent, false);
    document.removeEventListener('casai_ad_loaded', onAdLoadedEvent, false);
    document.removeEventListener('casai_ad_load_failed', onAdFailedToLoadEvent, false);
    document.removeEventListener('casai_ad_show_failed', onAdFailedToShowEvent, false);
    document.removeEventListener('casai_ad_showed', onAdShowedEvent, false);
    document.removeEventListener('casai_ad_clicked', onAdClickedEvent, false);
    document.removeEventListener('casai_ad_impressions', onAdImpressionEvent, false);
    document.removeEventListener('casai_ad_dismissed', onAdDismissedEvent, false);
  }
});
