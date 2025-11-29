package com.cleveradssolutions.plugin.cordova

import android.content.res.Configuration
import android.graphics.Color
import android.os.Build
import android.util.DisplayMetrics
import android.util.Size
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.annotation.MainThread
import androidx.core.view.OnApplyWindowInsetsListener
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.OnAdImpressionListener
import com.cleveradssolutions.sdk.base.CASHandler
import com.cleversolutions.ads.AdError
import com.cleversolutions.ads.AdSize
import com.cleversolutions.ads.AdViewListener
import com.cleversolutions.ads.android.CASBannerView
import org.apache.cordova.CallbackContext
import org.json.JSONArray
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.roundToInt

private const val TOP_CENTER = 0
private const val TOP_LEFT = 1
private const val TOP_RIGHT = 2
private const val BOTTOM_CENTER = 3
private const val BOTTOM_LEFT = 4
private const val BOTTOM_RIGHT = 5
private const val MIDDLE_CENTER = 6
private const val MIDDLE_LEFT = 7
private const val MIDDLE_RIGHT = 8

class ViewAdManager(
    private val plugin: CASMobileAds,
    private val adFormat: AdFormat
) : AdViewListener, OnAdImpressionListener,
    OnApplyWindowInsetsListener {

    private var bannerView: CASBannerView? = null

    private val isVisible = AtomicBoolean(false)
    private val isRefreshRequired = AtomicBoolean(false)
    private var desiredPosition: Int = BOTTOM_CENTER
    private var offsetXdp: Int = 0
    private var offsetYdp: Int = 0
    private var loadCallback: CallbackContext? = null

    private var adSizeCode: Char = 'B'
    private var maxAdWidthDP: Int = 0
    private var maxAdHeightDP: Int = 0

    private var safeLeft = 0
    private var safeTop = 0
    private var safeRight = 0
    private var safeBottom = 0

    private val showTask = Runnable {
        bannerView?.let {
            it.layoutParams = buildLayoutParams(it)
            it.visibility = View.VISIBLE
        }
    }

    private val hideTask = Runnable {
        bannerView?.visibility = View.GONE
    }

    fun resolveAdSize(sizeCode: Char, maxWdp: Int, maxHdp: Int): AdSize {
        this.adSizeCode = sizeCode
        this.maxAdWidthDP = maxWdp
        this.maxAdHeightDP = maxHdp

        return when (sizeCode) {
            'B' -> AdSize.BANNER
            'L' -> AdSize.LEADERBOARD
            'S' -> AdSize.getSmartBanner(plugin.cordova.context)
            'A', 'I' -> {
                val screenSize = getScreenSizeDp()
                val width = if (maxWdp > 0) maxWdp.coerceAtMost(screenSize.width)
                else screenSize.width
                if (sizeCode == 'I') {
                    val height = if (maxHdp > 0) maxHdp.coerceAtMost(screenSize.height)
                    else screenSize.height
                    AdSize.getInlineBanner(width, height)
                } else {
                    AdSize.getAdaptiveBanner(plugin.cordova.context, width)
                }
            }

            else -> AdSize.BANNER
        }
    }

    fun loadBanner(
        adSize: AdSize,
        autoload: Boolean,
        refreshSeconds: Int,
        promise: CallbackContext
    ) {
        loadCallback?.error(plugin.cancelledLoadError(adFormat))
        loadCallback = promise

        CASHandler.main {
            val view = bannerView ?: run {
                val newView = CASBannerView(plugin.activity ?: plugin.cordova.context)
                newView.isAutoloadEnabled = false
                newView.casId = plugin.casId
                newView.adListener = this
                newView.onImpressionListener = this
                newView.setBackgroundColor(Color.TRANSPARENT)
                newView.setDescendantFocusability(ViewGroup.FOCUS_BLOCK_DESCENDANTS)
                newView.visibility = if (isVisible.get()) View.VISIBLE else View.GONE
                bannerView = newView

                val layoutParams = buildLayoutParams(newView)
                val activity = plugin.activity
                if (activity != null) {
                    activity.addContentView(newView, layoutParams)
                } else {
                    val parent = plugin.webView.view.parent as ViewGroup
                    parent.addView(newView, layoutParams)
                }

                // Listening window insets to render ad in safe area
                ViewCompat.setOnApplyWindowInsetsListener(newView, this)
                ViewCompat.requestApplyInsets(newView)

                newView
            }

            view.size = adSize
            view.isAutoloadEnabled = autoload
            view.refreshInterval = refreshSeconds
            if (!autoload) {
                view.load()
            }
        }
    }

    fun show(args: JSONArray, callbackContext: CallbackContext) {
        desiredPosition = args.optInt(0, BOTTOM_CENTER)
        offsetXdp = args.optInt(1, 0)
        offsetYdp = args.optInt(2, 0)
        isVisible.set(true)
        CASHandler.main(showTask)
        callbackContext.success()
    }

    fun hide(callback: CallbackContext) {
        isVisible.set(false)
        CASHandler.main(hideTask)
        callback.success()
    }

    fun destroy(callback: CallbackContext) {
        val view = bannerView ?: return
        CASHandler.main {
            view.destroy()
            (view.parent as? ViewGroup)?.removeView(view)
        }
        bannerView = null
        isVisible.set(false)
        loadCallback = null
        callback.success()
    }

    override fun onAdViewLoaded(view: CASBannerView) {
        view.layoutParams = buildLayoutParams(view)

        plugin.emitEvent(PluginEvents.LOADED, adFormat)
        loadCallback?.success()
        loadCallback = null
    }

    override fun onAdViewFailed(view: CASBannerView, error: AdError) {
        onAdViewFailed(error)
    }

    private fun onAdViewFailed(error: AdError) {
        plugin.emitErrorEvent(PluginEvents.LOAD_FAILED, adFormat, error, loadCallback)
        loadCallback = null
    }

    override fun onAdViewClicked(view: CASBannerView) {
        plugin.emitEvent(PluginEvents.CLICKED, adFormat)
    }

    override fun onAdImpression(ad: AdContentInfo) {
        plugin.emitImpressionEvent(adFormat, ad)
    }

    fun onConfigurationChanged(configuration: Configuration) {
        // When the screen orientation changes, the screen insets are calculated later.
        // So, we need to wait for the onApplyWindowInsets callback to compute the new size
        // and position.
        isRefreshRequired.set(bannerView != null)

        // But if the window insets are zero, then onApplyWindowInsets will not be called.
        if (safeTop == 0 && safeBottom == 0 && safeRight == 0 && safeLeft == 0) {
            onWindowInsetsChanged()
        }
    }

    override fun onApplyWindowInsets(view: View, insets: WindowInsetsCompat): WindowInsetsCompat {
        val safe = insets.getInsets(
            WindowInsetsCompat.Type.systemBars() or
                    WindowInsetsCompat.Type.displayCutout()
        )
        safeTop = safe.top
        safeBottom = safe.bottom
        safeRight = safe.right
        safeLeft = safe.left

        onWindowInsetsChanged()
        return insets
    }

    private fun onWindowInsetsChanged() {
        val view = bannerView ?: return
        // Refresh adaptive ad size after configuration changed only.
        if (isRefreshRequired.getAndSet(false)) {
            if (adSizeCode == 'A' || adSizeCode == 'I') {
                view.size = resolveAdSize(adSizeCode, maxAdWidthDP, maxAdHeightDP)
            }
        }
        // Refresh ad position in any case
        view.layoutParams = buildLayoutParams(view)
    }

    private fun getScreenSizeDp(): Size {
        val windowManager = plugin.activity?.windowManager
            ?: plugin.cordova.context.getSystemService(WindowManager::class.java)

        val widthPx: Int
        val heightPx: Int
        val density: Float
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val metrics = windowManager.currentWindowMetrics
            val bounds = metrics.bounds
            val insets = metrics.windowInsets.getInsets(
                WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout()
            )
            widthPx = bounds.width() - insets.left - insets.right
            heightPx = bounds.height() - insets.top - insets.bottom

            density = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
                metrics.density
            else
                plugin.cordova.context.resources.displayMetrics.density
        } else {
            val metrics = DisplayMetrics()
            windowManager.defaultDisplay.getMetrics(metrics)
            widthPx = metrics.widthPixels
            heightPx = metrics.heightPixels
            density = metrics.density
        }

        return Size(
            (widthPx.toFloat() / density).roundToInt(),
            (heightPx.toFloat() / density).roundToInt()
        )
    }

    @MainThread
    private fun buildLayoutParams(view: CASBannerView): FrameLayout.LayoutParams {
        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        )

        val density = view.context.resources.displayMetrics.density
        val offXpx = (offsetXdp * density).roundToInt()
        val offYpx = (offsetYdp * density).roundToInt()

        val decor = plugin.activity?.window?.decorView ?: plugin.webView.view
        val screenW = decor.width
        val screenH = decor.height

        var adW = (view.size.width * density).roundToInt()
        var adH = (view.size.height * density).roundToInt()
        view.getChildAt(0)?.layoutParams?.let {
            if (it.width > 0 && it.height > 0) {
                adW = it.width
                adH = it.height
            }
        }

        when (desiredPosition) {
            TOP_CENTER, TOP_LEFT, TOP_RIGHT -> {
                params.gravity = Gravity.TOP
                params.topMargin = clamp(safeTop + offYpx, safeTop, screenH - safeBottom - adH)
            }

            BOTTOM_CENTER, BOTTOM_LEFT, BOTTOM_RIGHT -> {
                params.gravity = Gravity.BOTTOM
                params.bottomMargin =
                    clamp(safeBottom + offYpx, safeBottom, screenH - safeTop - adH)
            }

            MIDDLE_CENTER, MIDDLE_LEFT, MIDDLE_RIGHT -> {
                params.gravity = Gravity.CENTER_VERTICAL
                params.topMargin = offYpx
            }

            else -> {
                params.gravity = Gravity.BOTTOM
                params.bottomMargin = safeBottom
            }
        }

        when (desiredPosition) {
            TOP_LEFT, BOTTOM_LEFT, MIDDLE_LEFT -> {
                params.gravity = params.gravity or Gravity.START
                params.leftMargin = clamp(safeLeft + offXpx, safeLeft, screenW - safeRight - adW)
            }

            TOP_RIGHT, BOTTOM_RIGHT, MIDDLE_RIGHT -> {
                params.gravity = params.gravity or Gravity.END
                params.rightMargin = clamp(safeRight + offXpx, safeRight, screenW - safeLeft - adW)
            }

            else -> {
                params.gravity = params.gravity or Gravity.CENTER_HORIZONTAL
            }
        }

        return params
    }

    private fun clamp(v: Int, min: Int, max: Int) = v.coerceIn(min, max)
}
