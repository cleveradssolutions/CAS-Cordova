// Type definitions for cordova-plugin-device
// Project: https://github.com/cleveradssolutions/CAS-Cordova
// Definitions by: CleverAdsSolutions LTD, CAS.AI <https://cas.ai>

/**
 * Audience category used for regulatory handling and content filtering.
 */
type AdAudience =
  /**
   * If your app's target age groups include both children and older audiences, any ads that may be shown to children must comply with Google Play's Families Ads Program.
   *
   * A neutral age screen must be implemented so that any ads not suitable for children are only shown to older audiences.
   * A neutral age screen is a mechanism to verify a user's age in a way that doesn't encourage them to falsify their age
   * and gain access to areas of your app that aren't designed for children, for example, an age gate.
   */
  | undefined
  /**
   * Compliance with all applicable legal regulations and industry standards relating to advertising to children.
   */
  | 'children'
  /**
   * Audiences over the age of 13 NOT subject to the restrictions of child protection laws.
   */
  | 'notchildren';

/** User’s geography used to determine which privacy rules apply. */
type PrivacyGeography =
  /** Geography is unknown. */
  | 'unknown'
  /** Geography appears as in European Economic Area. */
  | 'eea'
  /** Geography appears as in a regulated US State. */
  | 'us'
  /** Geography appears as in a region with no regulation in force. */
  | 'unregulated';

/** Represents the result of {@link CASMobileAds.initialize}. */
interface InitializationStatus {
  /**
   * Initialization error or `undefined` if success.
   * Check value against known error string constants if needed by platform.
   */
  error?: string;

  /** User Country code ISO-2 or `undefined` if not allowed. */
  countryCode?: string;

  /** Indicates the privacy options button is required. */
  isConsentRequired: boolean;

  /** Consent flow status code. See {@link ConsentFlowStatus}. */
  consentFlowStatus: ConsentFlowStatus;
}

/**
 * This plugin defines a global device object, which describes the device's hardware and software.
 * Although the object is in the global scope, it is not available until after the deviceready event.
 */
interface CASMobileAds {
  /**
   * The format of the ad
   */
  readonly Format: {
    BANNER: 'Banner';
    MREC: 'MediumRectangle';
    APPOPEN: 'AppOpen';
    INTERSTITIAL: 'Interstitial';
    REWARDED: 'Rewarded';
  };

  /**
   *  Represents the size of a banner ad.
   */
  readonly Size: {
    /**
     * Standard Banner has a fixed size of 320x50 and is the minimum ad size
     */
    BANNER: 'B';
    /**
     * Leaderboard has a fixed size of 728x90 and is allowed on tablets only.
     */
    LEADERBOARD: 'L';
    /**
     * Adaptive banner ads have a fixed aspect ratio for the maximum width.
     * The adaptive size calculates the optimal height for that width with an aspect ratio similar to 320x50.
     * By default, the full screen width will be used. You can limit width by specifying a `maxWidth` in the parameters.
     */
    ADAPTIVE: 'A';
    /**
     * Inline banner ads have a desired width and a maximum height, useful when you want to limit the banner's height.
     * Inline banners are larger and taller compared to adaptive banners. They have variable height, including Medium Rectangle size,
     * and can be as tall as the device screen. Specify the `maxWidth` and `maxHeight` dimensions to limit the ad size.
     */
    INLINE: 'I';
    /**
     * Smart selects the optimal dimensions depending on the device type.
     * For mobile devices, it returns 320x50, while for tablets, it returns 728x90.
     * In the UI, these banners occupy the same amount of space regardless of device type.
     */
    SMART: 'S';
  };
  /**
   * Ad Position on screen.
   */
  readonly Position: {
    TOP_CENTER: 0;
    TOP_LEFT: 1;
    TOP_RIGHT: 2;
    BOTTOM_CENTER: 3;
    BOTTOM_LEFT: 4;
    BOTTOM_RIGHT: 5;
    MIDDLE_CENTER: 6;
    MIDDLE_LEFT: 7;
    MIDDLE_RIGHT: 8;
  };

  // MARK: Initialization

  /**
   * Initializes the CAS Mobile Ads SDK.
   * @returns A Promise that resolves with the initialization status.
   */
  initialize(options: {
    /**
     * Indicates the target {@link AdAudience} of the app for regulatory and content purposes.
     * This may affect how the SDK handles data collection, personalization,
     * and content rendering, especially for audiences such as children.
     */
    targetAudience?: AdAudience;
    /**
     * Shows the consent form only if it is required and the user has not responded previously.
     * If the consent status is required, the SDK loads a form and immediately presents it.
     * @default true
     */
    showConsentFormIfRequired?: boolean;
    /**
     * Enable test ads mode that will always return test ads for all devices.
     * **Attention** Don't forget to set it to False after the tests are completed.
     * @default false
     */
    forceTestAds?: boolean;
    /**
     * Add a test device ID corresponding to test devices which will always request test ads.
     * List of test devices should be defined before first MediationManager initialized.
     *
     * 1. Run an app with the CAS SDK `initialize()` call.
     * 2. Check the console or logcat output for a message that looks like this:
     *    "To get test ads on this device, set ... "
     * 3. Copy your alphanumeric test device ID to your clipboard.
     * 4. Add the test device ID to the `testDeviceIds` list.
     */
    testDeviceIds?: string[];
    /**
     * Sets the debug geography for testing purposes. (Only effective in test sessions.)
     * @default 'eea'
     */
    debugGeography?: PrivacyGeography;
    /**
     * Additional mediation settings.
     */
    mediationExtras?: Record<string, any>;
  }): Promise<InitializationStatus>;

  /**
   * Manually shows the built-in consent form.
   *
   * If consent is required, the SDK loads the form and immediately presents it.
   * The returned `Promise<ConsentFlowStatus>` resolves after the user dismisses the form.
   * If consent is **not required**, the Promise resolves instantly.
   *
   * @param options Configuration options for the consent flow.
   * @returns A Promise that resolves with the resulting {@link ConsentFlowStatus}.
   */
  showConsentFlow(options: {
    /**
     * Indicates whether to show the consent form only if required.
     */
    ifRequired: Boolean;
    /**
     * Optional. Sets the debug geography for testing purposes
     * (e.g., to simulate different regions for consent behavior)
     */
    debugGeography?: PrivacyGeography;
  }): Promise<ConsentFlowStatus>;

  /** Returns the underlying native SDK version, e.g. "4.3.0". */
  getSDKVersion(): Promise<string>;

  /** Enables or disables debug logging to the console (native logcat/console). */
  setDebugLoggingEnabled(enabled: boolean): void;

  /**
   * Sets whether the ad source is muted.
   *
   * Affects initial mute state for fullscreen ads.
   * Use this method only if your application has its own volume controls
   * (e.g., custom music or sound effect muting).
   *
   * Not muted by default.
   */
  setAdSoundsMuted(muted: boolean): void;

  /**
   * Sets the user’s age.
   *
   * Limitation: 1–99, and 0 is 'unknown'.
   * Note: Only pass data you are legally allowed to share.
   */
  setUserAge(age: number): void;

  /**
   * Set targeting to user’s gender.
   */
  setUserGender(gender?: undefined | 'male' | 'female'): void;

  /**
   * Sets a list of keywords, interests, or intents related to your application.
   *
   * Words or phrases describing the current activity of the user for targeting purposes.
   */
  setAppKeywords(keywords: string[]): void;

  /**
   * Sets the content URL for a website whose content matches the app's primary content.
   * This website content is used for targeting and brand safety purposes.
   *
   * Limitation: max URL length 512.
   * Pass `undefined` to clear the value.
   */
  setAppContentUrl(contentUrl?: string): void;

  /**
   * Collect from the device the latitude and longitude coordinates truncated to the
   * hundredths decimal place.
   *
   * * Collect only if your application already has the relevant end-user permissions.
   * * Does not collect if the target audience is children.
   * * Disabled by default.
   */
  setLocationCollectionEnabled(enabled: boolean): void;

  /**
   * Defines the time interval, in seconds, starting from the moment of the initial app installation,
   * during which users can use the application without ads being displayed while still retaining
   * access to the Rewarded Ads format.
   * Within this interval, users enjoy privileged access to the application's features without intrusive advertisements.
   *
   * Default: 0 seconds.
   */
  setTrialAdFreeInterval(interval: number): void;

  // MARK: Banner ads

  /**
   * Loads a banner ad with the specified options.
   * The banner will not be visible until {@link showBannerAd()} is called.
   *
   * @param options Configuration options for the banner ad.
   * @returns A Promise that resolves when the ad is is successfully loaded,
   * or rejects with an error if the ad fails to load.
   */
  loadBannerAd(options: {
    /**
     * Represents the size of a banner ad.
     */
    adSize: BannerAdSize;
    /**
     * Maximum width for Adaptive/Inline banners.
     * If omitted, the width defaults to the full device width.
     * Automatically clamped to the screen bounds and updated on orientation changes.
     */
    maxWidth?: number;
    /**
     * Maximum height for Inline banners.
     * By default, inline adaptive banners without an explicit maxHeight use the device height.
     * Automatically clamped to the screen bounds and updated on orientation changes.
     */
    maxHeight?: number;
    /**
     * If enabled, the ad will automatically retry loading the ad if an error occurs during the loading process.
     * @default enabled.
     */
    autoReload: boolean;
    /**
     * Sets the refresh interval in seconds for displaying ads.
     * The countdown runs only while the view is visible.
     * Once elapsed, a new ad automatically loads and displays.
     * Default: 30 seconds. Set `0` to disable.
     * Works regardless of `autoReload`.
     */
    refreshInterval: number;
  }): Promise<void>;

  /**
   * Displays banner ad on the screen.
   *
   * The banner will remain hidden until this function is called.
   */
  showBannerAd(options: {
    /**
     * Position on the screen where the banner should appear.
     */
    position: AdPosition;
    /**
     * Place AdView at the X offset in DP, where the origin is the selected corner (AdPosition) of the screen.
     */
    offsetX?: number;
    /**
     * Place AdView at the Y offset in DP, where the origin is the selected corner (AdPosition) of the screen.
     */
    offsetY?: number;
  }): void;

  /**
   * Hides the currently displayed banner ad without destroying it.
   */
  hideBannerAd(): void;

  /**
   * Destroys the banner ad and frees up resources.
   * The banner will need to be reloaded with `loadBannerAd` to be displayed again.
   */
  destroyBannerAd(): void;

  // MARK: MRec ads

  /**
   * Loads a Medium Rectangle ad with the specified options.
   * The banner will not be visible until {@link showMRecAd()} is called.
   *
   * @param options Configuration options for the banner ad.
   * @returns A Promise that resolves when the ad is is successfully loaded,
   * or rejects with an error if the ad fails to load.
   */
  loadMRecAd(options: {
    /**
     * If enabled, the ad will automatically retry loading the ad if an error occurs during the loading process.
     * @default enabled.
     */
    autoReload?: boolean;
    /**
     * Sets the refresh interval in seconds for displaying ads.
     * The countdown runs only while the view is visible.
     * Once elapsed, a new ad automatically loads and displays.
     * Set `0` to disable. Works regardless of `autoReload`.
     * @default 30 seconds
     */
    refreshInterval?: number;
  }): Promise<void>;

  /**
   * Displays banner ad on the screen.
   *
   * The banner will remain hidden until this function is called.
   */
  showMRecAd(options: {
    /**
     * Position on the screen where the banner should appear.
     */
    position?: AdPosition;
    /**
     * Place AdView at the X offset in DP, where the origin is the selected corner (AdPosition) of the screen.
     */
    offsetX?: number;
    /**
     * Place AdView at the Y offset in DP, where the origin is the selected corner (AdPosition) of the screen.
     */
    offsetY?: number;
  }): void;

  /**
   * Hides the currently displayed banner ad without destroying it.
   */
  hideMRecAd(): void;

  /**
   * Destroys the banner ad and frees up resources.
   * The banner will need to be reloaded with `loadMRecAd` to be displayed again.
   */
  destroyMRecAd(): void;

  // MARK: AppOpen ads

  /**
   * Loads an App Open ad with the specified options.
   *
   * @param options Configuration options for the App Open ad.
   * @returns A Promise that resolves when the ad is is successfully loaded,
   * or rejects with an error if the ad fails to load.
   */
  loadAppOpenAd(options: {
    /**
     * Enables automatic loading of the next ad.
     * When enabled, the SDK loads a new ad after dismissal and retries on load errors.
     * @default false
     */
    autoReload: boolean;
    /**
     * Controls whether the ad should be automatically displayed when the user returns to the app.
     * Note: the ad must be ready at the moment the app returns to foreground.
     * @default false
     */
    autoShow: boolean;
  }): Promise<void>;

  /**
   * Checks if an App Open ad is currently loaded and ready to be shown.
   *
   * @returns A Promise that resolves with `true` if the ad is loaded, otherwise `false`.
   */
  isAppOpenAdLoaded(): Promise<boolean>;

  /**
   * Shows a previously loaded App Open ad.
   *
   * @returns A Promise that resolves after the ad is dismissed, or rejects with an error if the ad fails to show.
   */
  showAppOpenAd(): Promise<void>;

  /**
   * Destroys the currently loaded App Open ad and frees up resources.
   * After calling this, the ad must be reloaded with `loadAppOpenAd` to show it again.
   */
  destroyAppOpenAd(): void;

  // MARK: Interstitial ads

  /**
   * Loads an App Open ad with the specified options.
   *
   * @param options Configuration options for the App Open ad.
   * @returns A Promise that resolves when the ad is is successfully loaded,
   * or rejects with an error if the ad fails to load.
   */
  loadInterstitialAd(options: {
    /**
     * Enables automatic loading of the next ad.
     * When enabled, the SDK loads a new ad after dismissal and retries on load errors.
     * @default false
     */
    autoReload: boolean;
    /**
     * Controls whether the ad should be automatically displayed when the user returns to the app.
     * Note: the ad must be ready at the moment the app returns to foreground.
     * @default false
     */
    autoShow: boolean;
    /**
     * The minimum interval between showing interstitial ads, in seconds.
     * Showing earlier will trigger onAdFailedToShow with codeNotPassedInterval.
     * The timer is shared across instances; values may differ per instance.
     * @default 0
     */
    minInterval: number;
  }): Promise<void>;

  /**
   * Checks if an Interstitial ad is currently loaded and ready to be shown.
   *
   * @returns A Promise that resolves with `true` if the ad is loaded, otherwise `false`.
   */
  isInterstitialAdLoaded(): Promise<boolean>;

  /**
   * Shows a previously loaded Interstitial ad.
   *
   * @returns A Promise that resolves after the ad is dismissed, or rejects with an error if the ad fails to show.
   */
  showInterstitialAd(): Promise<void>;

  /**
   * Destroys the currently loaded Interstitial ad and frees up resources.
   * After calling this, the ad must be reloaded with `loadInterstitialAd` to show it again.
   */
  destroyInterstitialAd(): void;

  // MARK: Rewarded ads

  /**
   * Loads an App Open ad with the specified options.
   *
   * @param options Configuration options for the App Open ad.
   * @returns A Promise that resolves when the ad is is successfully loaded,
   * or rejects with an error if the ad fails to load.
   */
  loadRewardedAd(options: {
    /**
     * Enables automatic loading of the next ad.
     * When enabled, the SDK loads a new ad after dismissal and retries on load errors.
     * @default false
     */
    autoReload: boolean;
  }): Promise<void>;

  /**
   * Checks if an Rewarded ad is currently loaded and ready to be shown.
   *
   * @returns A Promise that resolves with `true` if the ad is loaded, otherwise `false`.
   */
  isRewardedAdLoaded(): Promise<boolean>;

  /**
   * Shows a previously loaded Rewarded ad.
   *
   * @returns A Promise that resolves after the ad is dismissed, or rejects with an error if the ad fails to show.
   */
  showRewardedAd(): Promise<RewardedAdInfo>;

  /**
   * Destroys the currently loaded Rewarded ad and frees up resources.
   * After calling this, the ad must be reloaded with `loadRewardedAd` to show it again.
   */
  destroyRewardedAd(): void;
}

/**
 *  Represents the size of a banner ad.
 */
type BannerAdSize = (typeof casai.Size)[keyof typeof casai.Size];

/**
 * Ad Position on screen.
 */
type AdPosition = (typeof casai.Position)[keyof typeof casai.Position];

type ConsentFlowStatus =
  /** There was no attempt to show the consent flow. */
  | 'Unknown'
  /** User consent obtained. Personalized vs non-personalized undefined. */
  | 'Obtained'
  /** User consent not required. */
  | 'Not required'
  /** User consent unavailable. */
  | 'Unavailable'
  /** There was an internal error. */
  | 'Internal error'
  /** There was an error loading data from the network. */
  | 'Network error'
  /** There was an error with the UI context passed in. */
  | 'Invalid context'
  /** There was an error with another form still being displayed. */
  | 'Still presenting';

// MARK: Ads events

/**
 * The format of the ad
 */
type AdFormat = (typeof casai.Format)[keyof typeof casai.Format];

interface AdInfo {
  /**
   * The format of the ad that is shown.
   */
  format: AdFormat;
}

/**
 * Represents the result of {@link CASMobileAds.showRewardedAd}.
 */
interface RewardedAdInfo {
  /**
   * Indicates whether the user has earned a reward from the ad.
   */
  isUserEarnReward: boolean;
}

interface AdContentInfo {
  /**
   * The format of the ad that is shown.
   */
  format: AdFormat;
  /**
   * The display name of the mediated network that purchased the impression.
   */
  sourceUnitId: string;
  /**
   * The Ad Unit ID from the mediated network that purchased the impression.
   */
  sourceName: string;
  /**
   * The Creative ID associated with the ad, if available.
   * You can use this ID to report creative issues to the Ad review team.
   */
  creativeId?: string;
  /**
   * The revenue generated from the impression, in USD.
   * The revenue value may be either estimated or exact, depending on the precision specified by `revenuePrecision`.
   */
  revenue: number;
  /**
   * The precision type of the revenue field. (e.g. `estimated`, `precise`, `floor`).
   */
  revenuePrecision: string;
  /**
   * The accumulated value of user ad revenue in USD from all ad format impressions.
   */
  revenueTotal: number;
  /**
   * The total number of impressions across all ad formats for the current user, across all sessions.
   */
  impressionDepth: number;
}

/**
 * Error details returned when an ad fails to load/show.
 */
interface AdError {
  /**
   * The format of the ad that is shown.
   */
  format: AdFormat;
  /**
   * Numeric error code returned by the SDK.
   */
  code: number;
  /**
   * Human-readable error message.
   */
  message: string;
}

interface Document {
  /**
   * Called when the ad content has been successfully loaded.
   * To check the ad format:
   * ```
   * if (ev.detail.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_loaded', listener: (ev: CustomEvent<AdInfo>) => any, useCapture?: boolean): void;
  /**
   * Called when the ad content fails to load.
   * To check the ad format:
   * ```
   * if (ev.detail.format == casai.Format.APPOPEN) {
   *  console.log("Error: " + ev.detail.message)
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_load_failed', listener: (ev: CustomEvent<AdError>) => any, useCapture?: boolean): void;
  /**
   * Called when the ad content fails to show.
   * To check the ad format:
   * ```
   * if (ev.detail.format == casai.Format.APPOPEN) {
   *  console.log("Error: " + ev.detail.message)
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_show_failed', listener: (ev: CustomEvent<AdError>) => any, useCapture?: boolean): void;
  /**
   * Called when the ad content is successfully shown.
   * To check the ad format:
   * ```
   * if (ev.detail.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_showed', listener: (ev: CustomEvent<AdInfo>) => any, useCapture?: boolean): void;
  /**
   * Called when an ad impression occurs.
   * To check the ad format:
   * ```
   * if (ev.detail.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_impressions', listener: (ev: CustomEvent<AdContentInfo>) => any, useCapture?: boolean): void;
  /**
   * Called when the ad content is clicked by the user
   * To check the ad format:
   * ```
   * if (ev.detail.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_clicked', listener: (ev: CustomEvent<AdInfo>) => any, useCapture?: boolean): void;
  /**
   * Called when the ad content is dismissed.
   * To check the ad format:
   * ```
   * if (ev.detail.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_dismissed', listener: (ev: CustomEvent<AdInfo>) => any, useCapture?: boolean): void;
  /**
   * Called when a user earns a reward from the ad.
   * To check the ad format:
   * ```
   * if (ev.detail.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_reward', listener: (ev: CustomEvent<AdInfo>) => any, useCapture?: boolean): void;

  removeEventListener(type: 'casai_ad_loaded', listener: (ev: CustomEvent<AdInfo>) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_load_failed', listener: (ev: CustomEvent<AdError>) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_show_failed', listener: (ev: CustomEvent<AdError>) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_showed', listener: (ev: CustomEvent<AdInfo>) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_impressions', listener: (ev: CustomEvent<AdContentInfo>) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_clicked', listener: (ev: CustomEvent<AdInfo>) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_dismissed', listener: (ev: CustomEvent<AdInfo>) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_reward', listener: (ev: CustomEvent<AdInfo>) => any, useCapture?: boolean): void;
}

declare var casai: CASMobileAds;
