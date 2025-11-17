/**
 * Manages an app open ad, allowing for loading, showing, and destroying the ad content.
 *
 * This class provides functionality to handle app open ads, which are
 * full-screen ads that cover the entire screen.
 */
interface AppOpenAd {
  /**
   * Loads an App Open ad with the specified options.
   *
   * @param options Configuration options for the App Open ad.
   * @returns A Promise that resolves when the ad is is successfully loaded,
   * or rejects with an error if the ad fails to load.
   * @example
   * ```ts
   * .load()
   * .then(() => {
   *     // Ad was successfully loaded
   * })
   * .catch((error) => {
   *     // Ad failed to load. Check error.message or error.code for details.
   * });
   * ```
   */
  load(options: {
    /**
     * Enables automatic loading of the next ad.
     * When enabled, the SDK loads a new ad after dismissal and retries on load errors.
     * @default false
     */
    autoReload?: boolean;
    /**
     * Controls whether the ad should be automatically displayed when the user returns to the app.
     * Note: the ad must be ready at the moment the app returns to foreground.
     * @default false
     */
    autoShow?: boolean;
  }): Promise<void>;

  /**
   * Checks if an App Open ad is currently loaded and ready to be shown.
   *
   * @returns A Promise that resolves with `true` if the ad is loaded, otherwise `false`.
   */
  isLoaded(): Promise<boolean>;

  /**
   * Shows a previously loaded App Open ad.
   *
   * @returns A Promise that resolves after the ad is dismissed, 
   * or rejects with an error if the ad fails to show.
   * @example
   * ```ts
   * .show()
   * .then(() => {
   *     // Ad was successfully shown and dismissed
   * })
   * .catch((error) => {
   *     // Ad failed to display. Check error.message or error.code for details.
   * });
   * ```
   */
  show(): Promise<void>;

  /**
   * Destroys the currently loaded App Open ad and frees up resources.
   * After calling this, the ad must be reloaded with `load` to show it again.
   */
  destroy(): void;
}

/**
 * Manages an interstitial ad, allowing for loading, showing, and destroying the ad content.
 *
 * This class provides functionality to handle interstitial ads, which are
 * full-screen ads that cover the entire screen and are typically used at natural transition points within an app.
 */
interface InterstitialAd {
  /**
   * Loads an App Open ad with the specified options.
   *
   * @param options Configuration options for the App Open ad.
   * @returns A Promise that resolves when the ad is is successfully loaded,
   * or rejects with an error if the ad fails to load.
   * @example
   * ```ts
   * .load()
   * .then(() => {
   *     // Ad was successfully loaded
   * })
   * .catch((error) => {
   *     // Ad failed to load. Check error.message or error.code for details.
   * });
   * ```
   */
  load(options: {
    /**
     * Enables automatic loading of the next ad.
     * When enabled, the SDK loads a new ad after dismissal and retries on load errors.
     * @default false
     */
    autoReload?: boolean;
    /**
     * Controls whether the ad should be automatically displayed when the user returns to the app.
     * Note: the ad must be ready at the moment the app returns to foreground.
     * @default false
     */
    autoShow?: boolean;
    /**
     * The minimum interval between showing interstitial ads, in seconds.
     * Showing earlier will trigger onAdFailedToShow with codeNotPassedInterval.
     * The timer is shared across instances; values may differ per instance.
     * @default 0
     */
    minInterval?: number;
  }): Promise<void>;

  /**
   * Checks if an Interstitial ad is currently loaded and ready to be shown.
   *
   * @returns A Promise that resolves with `true` if the ad is loaded, otherwise `false`.
   */
  isLoaded(): Promise<boolean>;

  /**
   * Shows a previously loaded Interstitial ad.
   *
   * @returns A Promise that resolves after the ad is dismissed, 
   * or rejects with an error if the ad fails to show.
   * @example
   * ```ts
   * .show()
   * .then(() => {
   *     // Ad was successfully shown and dismissed
   * })
   * .catch((error) => {
   *     // Ad failed to display. Check error.message or error.code for details.
   * });
   * ```
   */
  show(): Promise<void>;

  /**
   * Destroys the currently loaded Interstitial ad and frees up resources.
   * After calling this, the ad must be reloaded with `load` to show it again.
   */
  destroy(): void;
}

/**
 * Manages a rewarded ad, allowing for loading, showing, and destroying the ad content.
 *
 * This class provides functionality to handle rewarded ads, which are ads where
 * users can earn rewards for interacting with them.
 */
interface RewardedAd {
  /**
   * Loads an App Open ad with the specified options.
   *
   * @param options Configuration options for the App Open ad.
   * @returns A Promise that resolves when the ad is is successfully loaded,
   * or rejects with an error if the ad fails to load.
   * 
   * @example
   * ```ts
   * .load()
   * .then(() => {
   *     // Ad was successfully loaded
   * })
   * .catch((error) => {
   *     // Ad failed to load. Check error.message or error.code for details.
   * });
   * ```
   */
  load(options: {
    /**
     * Enables automatic loading of the next ad.
     * When enabled, the SDK loads a new ad after dismissal and retries on load errors.
     * @default false
     */
    autoReload?: boolean;
  }): Promise<void>;

  /**
   * Checks if an Rewarded ad is currently loaded and ready to be shown.
   
   * @returns A Promise that resolves with `true` if the ad is loaded, otherwise `false`.
   */
  isLoaded(): Promise<boolean>;

  /**
   * Shows a previously loaded Rewarded ad.
   *
   * @returns A Promise that resolves after the ad is dismissed, or rejects with an error if the ad fails to show.
   * @example
   * ```ts
   * .show()
   * .then((info) => {
   *     if (info.isUserEarnReward) {
   *         // User earn reward
   *     }
   *     // Ad was successfully shown and dismissed
   * })
   * .catch((error) => {
   *     // Ad failed to display. Check error.message or error.code for details.
   * });
   * ```
   */
  show(): Promise<RewardedAdInfo>;

  /**
   * Destroys the currently loaded Rewarded ad and frees up resources.
   * After calling this, the ad must be reloaded with `load` to show it again.
   */
  destroy(): void;
}
