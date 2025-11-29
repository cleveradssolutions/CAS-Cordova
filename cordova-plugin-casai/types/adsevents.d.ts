/**
 * The format of the ad
 */
type AdFormat = (typeof casai.Format)[keyof typeof casai.Format];

interface AdInfoEvent extends Event {
  /**
   * The format of the ad that is shown.
   */
  format: AdFormat;
}

/**
 * Represents the result of {@link RewardedAd.show()}.
 */
interface RewardedAdInfo {
  /**
   * Indicates whether the user has earned a reward from the ad.
   */
  isUserEarnReward: boolean;
}

interface AdContentInfoEvent extends AdInfoEvent {
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
   * The precision type of the revenue field.
   */
  revenuePrecision: 'precise' | 'estimated' | 'floor' | 'unknown';
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
interface AdErrorEvent extends AdInfoEvent {
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
   * if (ev.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_loaded', listener: (ev: AdInfoEvent) => any, useCapture?: boolean): void;
  /**
   * Called when the ad content fails to load.
   * To check the ad format:
   * ```
   * if (ev.format == casai.Format.APPOPEN) {
   *  console.log("Error: " + ev.message)
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_load_failed', listener: (ev: AdErrorEvent) => any, useCapture?: boolean): void;
  /**
   * Called when the ad content fails to show.
   * To check the ad format:
   * ```
   * if (ev.format == casai.Format.APPOPEN) {
   *  console.log("Error: " + ev.message)
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_show_failed', listener: (ev: AdErrorEvent) => any, useCapture?: boolean): void;
  /**
   * Called when the ad content is successfully shown.
   * To check the ad format:
   * ```
   * if (ev.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_showed', listener: (ev: AdInfoEvent) => any, useCapture?: boolean): void;
  /**
   * Called when an ad impression occurs.
   * To check the ad format:
   * ```
   * if (ev.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_impressions', listener: (ev: AdContentInfoEvent) => any, useCapture?: boolean): void;
  /**
   * Called when the ad content is clicked by the user
   * To check the ad format:
   * ```
   * if (ev.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_clicked', listener: (ev: AdInfoEvent) => any, useCapture?: boolean): void;
  /**
   * Called when the ad content is dismissed.
   * To check the ad format:
   * ```
   * if (ev.format == casai.Format.APPOPEN) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_dismissed', listener: (ev: AdInfoEvent) => any, useCapture?: boolean): void;
  /**
   * Called when a user earns a reward from the ad.
   * To check the ad format:
   * ```
   * if (ev.format == casai.Format.REWARDED) {
   * }
   * ```
   */
  addEventListener(type: 'casai_ad_reward', listener: (ev: AdInfoEvent) => any, useCapture?: boolean): void;

  removeEventListener(type: 'casai_ad_loaded', listener: (ev: AdInfoEvent) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_load_failed', listener: (ev: AdErrorEvent) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_show_failed', listener: (ev: AdErrorEvent) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_showed', listener: (ev: AdInfoEvent) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_impressions', listener: (ev: AdContentInfoEvent) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_clicked', listener: (ev: AdInfoEvent) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_dismissed', listener: (ev: AdInfoEvent) => any, useCapture?: boolean): void;
  removeEventListener(type: 'casai_ad_reward', listener: (ev: AdInfoEvent) => any, useCapture?: boolean): void;
}
