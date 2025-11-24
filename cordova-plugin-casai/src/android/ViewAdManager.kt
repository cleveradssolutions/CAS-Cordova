package com.cleveradssolutions.plugin.cordova

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.util.DisplayMetrics
import android.view.DisplayCutout
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.annotation.MainThread
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
) : AdViewListener, OnAdImpressionListener {

    private var bannerView: CASBannerView? = null

    private val isVisible = AtomicBoolean(false)
    private var desiredPosition: Int = BOTTOM_CENTER
    private var offsetXdp: Int = 0
    private var offsetYdp: Int = 0
    private var pendingLoadPromise: CallbackContext? = null

    private var sizeCode: String = "B"
    private var maxWdp: Int = 0
    private var maxHdp: Int = 0

    private val showTask = Runnable {
        bannerView?.let {
            it.layoutParams = buildLayoutParams(it)
            it.visibility = View.VISIBLE
        }
    }

    private val hideTask = Runnable {
        bannerView?.visibility = View.GONE
    }

    fun loadBanner(
        adSize: AdSize,
        autoload: Boolean,
        refreshSeconds: Int,
        promise: CallbackContext
    ) {
        pendingLoadPromise?.error(plugin.cancelledLoadError(adFormat))
        pendingLoadPromise = promise

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
        pendingLoadPromise = null
        callback.success()
    }

    override fun onAdViewLoaded(view: CASBannerView) {
        view.layoutParams = buildLayoutParams(view)

        plugin.emitEvent(PluginEvents.LOADED, plugin.adInfoJson(adFormat))
        pendingLoadPromise?.success()
        pendingLoadPromise = null
    }

    override fun onAdViewFailed(view: CASBannerView, error: AdError) {
        onAdViewFailed(error)
    }

    private fun onAdViewFailed(error: AdError) {
        val json = plugin.errorJson(adFormat, error)
        plugin.emitEvent(PluginEvents.LOAD_FAILED, json)
        pendingLoadPromise?.error(json.toString())
        pendingLoadPromise = null
    }

    override fun onAdViewClicked(view: CASBannerView) {
        plugin.emitEvent(PluginEvents.CLICKED, plugin.adInfoJson(adFormat))
    }

    override fun onAdImpression(ad: AdContentInfo) {
        plugin.emitImpressionEvent(adFormat, ad)
    }

    @MainThread
    fun onConfigurationChanged() {
        val view = bannerView ?: return
        if (sizeCode == "A" || sizeCode == "I") {
            view.size = resolveAdSize(sizeCode, maxWdp, maxHdp)
        }
        view.layoutParams = buildLayoutParams(view)
    }

    fun resolveAdSize(sizeCode: String, maxWdp: Int, maxHdp: Int): AdSize {
        this.sizeCode = sizeCode
        this.maxWdp = maxWdp
        this.maxHdp = maxHdp

        return when (sizeCode) {
            "L" -> AdSize.LEADERBOARD
            "S" -> AdSize.getSmartBanner(plugin.cordova.context)
            "A", "I" -> {
                val (screenWdp, screenHdp) = getScreenDp()
                val w = if (maxWdp > 0) maxWdp.coerceAtMost(screenWdp) else screenWdp
                if (sizeCode == "I") {
                    val h = if (maxHdp > 0) maxHdp.coerceAtMost(screenHdp) else screenHdp
                    AdSize.getInlineBanner(w, h)
                } else {
                    AdSize.getAdaptiveBanner(plugin.cordova.context, w)
                }
            }

            else -> AdSize.BANNER
        }
    }

    private fun getScreenDp(): Pair<Int, Int> {
        val windowManager = plugin.cordova.context.getSystemService(WindowManager::class.java)

        val widthPx: Int
        val heightPx: Int
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val metrics = windowManager.currentWindowMetrics
            val bounds = metrics.bounds
            val insets =
                metrics.windowInsets.getInsetsIgnoringVisibility(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            widthPx = bounds.width() - insets.left - insets.right
            heightPx = bounds.height() - insets.top - insets.bottom
        } else {
            val tmp = DisplayMetrics()
            windowManager.defaultDisplay.getMetrics(tmp)
            widthPx = tmp.widthPixels
            heightPx = tmp.heightPixels
        }

        val density = plugin.cordova.context.resources.displayMetrics.density
        val wDp = (widthPx.toFloat() / density).roundToInt()
        val hDp = (heightPx.toFloat() / density).roundToInt()
        return wDp to hDp
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

        val decor = (view.context as Activity).window.decorView
        val screenW = decor.width
        val screenH = decor.height

        var safeLeft = 0
        var safeTop = 0
        var safeRight = 0
        var safeBottom = 0
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val cutout: DisplayCutout? = decor.rootWindowInsets?.displayCutout
            if (cutout != null) {
                safeBottom = cutout.safeInsetBottom
                safeTop = cutout.safeInsetTop
                safeLeft = cutout.safeInsetLeft
                safeRight = cutout.safeInsetRight
            }
        }

        var adW = (view.size.width * density).roundToInt()
        var adH = (view.size.height * density).roundToInt()
        view.getChildAt(0)?.layoutParams?.let {
            if (it.width > 0 && it.height > 0) {
                adW = it.width
                adH = it.height
            }
        }

        fun clamp(v: Int, min: Int, max: Int) = v.coerceIn(min, max)

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
}
