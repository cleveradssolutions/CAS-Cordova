/**
 *  Represents the size of a banner ad.
 */
type BannerAdSize = (typeof casai.Size)[keyof typeof casai.Size];

/**
 * Ad Position on screen.
 */
type AdPosition = (typeof casai.Position)[keyof typeof casai.Position];

/**
 * A banner ad.
 */
interface BannerAd {
  /**
   * Loads a banner ad with the specified options.
   * The banner will not be visible until {@link show} is called.
   *
   * @param options Configuration options for the banner ad.
   * @returns A Promise that resolves when the ad is is successfully loaded,
   * or rejects with an error if the ad fails to load.
   *  * @example
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
     * Represents the size of a banner ad.
     * @default SMART
     */
    adSize?: BannerAdSize;
    /**
     * Maximum width for Adaptive/Inline banners.
     * If omitted, the width defaults to the full device width.
     * Automatically clamped to the screen bounds and updated on orientation changes.
     * @default window.screen.width
     */
    maxWidth?: number;
    /**
     * Maximum height for Inline banners.
     * By default, inline adaptive banners without an explicit maxHeight use the device height.
     * Automatically clamped to the screen bounds and updated on orientation changes.
     * @default window.screen.height
     */
    maxHeight?: number;
    /**
     * If enabled, the ad will automatically retry loading the ad if an error occurs during the loading process.
     * @default true.
     */
    autoReload?: boolean;
    /**
     * Sets the refresh interval in seconds for displaying ads.
     * The countdown runs only while the view is visible.
     * Once elapsed, a new ad automatically loads and displays.
     * Set `0` to disable. Works regardless of `autoReload`.
     * @default 30 seconds.
     */
    refreshInterval?: number;
  }): Promise<void>;

  /**
   * Displays banner ad on the screen.
   */
  show(options: {
    /**
     * The screen position where the banner should appear.
     * Determines the anchor point used for calculating the final placement.
     * @default BOTTOM_CENTER
     */
    position?: AdPosition;
    /**
     * Horizontal offset in dp relative to the selected anchor position (`position`).
     * A positive value moves the banner to the right, a negative value — to the left.
     * @default 0
     */
    offsetX?: number;
    /**
     * Vertical offset in dp relative to the selected anchor position (`position`).
     * A positive value moves the banner downward, a negative value — upward.
     * @default 0
     */
    offsetY?: number;
  }): void;

  /**
   * Hides the banner ad without destroying it.
   */
  hide(): void;

  /**
   * Destroys the banner ad and frees up resources.
   * The banner will need to be reloaded with `load` to be displayed again.
   */
  destroy(): void;
}

interface MRecAd {
  /**
   * Loads a Medium Rectangle ad with the specified options.
   * The banner will not be visible until {@link show()} is called.
   *
   * @param options Configuration options for the banner ad.
   * @returns A Promise that resolves when the ad is is successfully loaded,
   * or rejects with an error if the ad fails to load.
   *  * @example
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
     * If enabled, the ad will automatically retry loading the ad if an error occurs during the loading process.
     * @default true.
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
   */
  show(options: {
    /**
     * The screen position where the banner should appear.
     * Determines the anchor point used for calculating the final placement.
     * @default BOTTOM_CENTER
     */
    position?: AdPosition;
    /**
     * Horizontal offset in dp relative to the selected anchor position (`position`).
     * A positive value moves the banner to the right, a negative value — to the left.
     * @default 0
     */
    offsetX?: number;
    /**
     * Vertical offset in dp relative to the selected anchor position (`position`).
     * A positive value moves the banner downward, a negative value — upward.
     * @default 0
     */
    offsetY?: number;
  }): void;

  /**
   * Hides the banner ad without destroying it.
   */
  hide(): void;

  /**
   * Destroys the banner ad and frees up resources.
   * The banner will need to be reloaded with `load` to be displayed again.
   */
  destroy(): void;
}
