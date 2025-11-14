package com.cleveradssolutions.plugin.cordova

import android.os.Build
import android.view.DisplayCutout
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.MainThread
import androidx.core.util.TypedValueCompat.pxToDp
import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.OnAdImpressionListener
import com.cleveradssolutions.sdk.base.CASHandler
import com.cleversolutions.ads.AdError
import com.cleversolutions.ads.AdSize
import com.cleversolutions.ads.AdViewListener
import com.cleversolutions.ads.android.CASBannerView
import org.apache.cordova.CallbackContext
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.roundToInt

internal object BannerPosition {
    const val TOP_CENTER = 0
    const val TOP_LEFT = 1
    const val TOP_RIGHT = 2
    const val BOTTOM_CENTER = 3
    const val BOTTOM_LEFT = 4
    const val BOTTOM_RIGHT = 5
    const val MIDDLE_CENTER = 6
    const val MIDDLE_LEFT = 7
    const val MIDDLE_RIGHT = 8
}


class BannerController(
    private val plugin: CASMobileAds,
    private val adFormat: AdFormat
) : AdViewListener, OnAdImpressionListener {

    private var bannerView: CASBannerView? = null

    private val isVisible = AtomicBoolean(false)
    private var desiredPosition: Int = BannerPosition.BOTTOM_CENTER
    private var offsetXdp: Int = 0
    private var offsetYdp: Int = 0
    private var pendingLoadPromise: CallbackContext? = null
    private var sizeCode: String = "A"
    private var maxWdp: Int = 0
    private var maxHdp: Int = 0

    fun setRequest(sizeCode: String, maxWdp: Int, maxHdp: Int) {
        this.sizeCode = sizeCode
        this.maxWdp = maxWdp
        this.maxHdp = maxHdp
    }

    fun loadBanner(
        casId: String,
        adSize: AdSize,
        autoload: Boolean,
        refreshSeconds: Int,
        promise: CallbackContext
    ) {
        pendingLoadPromise = promise

        val view = bannerView ?: CASBannerView(plugin.activity).apply {
            adListener = this@BannerController
            onImpressionListener = this@BannerController
            visibility = View.GONE
            bannerView = this
        }

        val resolvedSize = when (sizeCode) {
            "A" -> resolveAdSize()
            "I" -> resolveAdSize()
            else -> adSize
        }

        CASHandler.main {
            view.casId = casId
            view.isAutoloadEnabled = autoload
            view.refreshInterval = refreshSeconds
            view.size = resolvedSize

            val lp = buildLayoutParamsForCurrentState(view)
            if (view.parent == null) {
                plugin.activity.addContentView(view, lp)
            } else {
                view.layoutParams = lp
            }

            if (view.visibility != View.VISIBLE) view.visibility = View.GONE

            if (!autoload) view.load()
        }
    }

    fun show(position: Int, offsetXdp: Int, offsetYdp: Int) {
        desiredPosition = position
        this.offsetXdp = offsetXdp
        this.offsetYdp = offsetYdp
        isVisible.set(true)

        val view = bannerView ?: return
        CASHandler.main {
            view.layoutParams = buildLayoutParamsForCurrentState(view)
            view.visibility = View.VISIBLE
        }
    }

    fun hide() {
        isVisible.set(false)
        bannerView?.let { v -> CASHandler.main { v.visibility = View.GONE } }
    }

    fun destroy() {
        val view = bannerView ?: return
        CASHandler.main {
            view.destroy()
        }
        bannerView = null
        isVisible.set(false)
        pendingLoadPromise = null
    }

    override fun onAdViewLoaded(view: CASBannerView) {
        view.layoutParams = buildLayoutParamsForCurrentState(view)
        view.visibility = if (isVisible.get()) View.VISIBLE else View.GONE

        plugin.emitEvent(PluginEvents.LOADED, plugin.adInfoJson(adFormat))
        pendingLoadPromise?.success()
        pendingLoadPromise = null
    }

    override fun onAdViewFailed(view: CASBannerView, error: AdError) {
        val payload = plugin.errorJson(adFormat, error)
        plugin.emitEvent(PluginEvents.LOAD_FAILED, payload)
        pendingLoadPromise?.error(payload.toString())
        pendingLoadPromise = null
    }

    override fun onAdViewClicked(view: CASBannerView) {
        plugin.emitEvent(PluginEvents.CLICKED, plugin.adInfoJson(adFormat))
    }

    override fun onAdImpression(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.IMPRESSIONS, plugin.adContentToJson(adFormat, ad))
    }

    fun onConfigurationChanged() {
        val view = bannerView ?: return
        view.post {
            if (sizeCode == "A" || sizeCode == "I") {
                view.size = resolveAdSize()
            }
        }
    }


    private fun resolveAdSize(): AdSize {
        val dm = plugin.activity.resources.displayMetrics

        val root = plugin.activity.findViewById<View>(android.R.id.content)
        val widthPx = (root.width.takeIf { it > 0 } ?: dm.widthPixels)
        val heightPx = (root.height.takeIf { it > 0 } ?: dm.heightPixels)

        val screenWdp = pxToDp(widthPx.toFloat(), dm).toInt()
        val screenHdp = pxToDp(heightPx.toFloat(), dm).toInt()

        val w = if (maxWdp > 0) maxWdp.coerceAtMost(screenWdp) else screenWdp
        val h = if (maxHdp > 0) maxHdp.coerceAtMost(screenHdp) else screenHdp

        return when (sizeCode) {
            "S" -> AdSize.getSmartBanner(plugin.activity)
            "A" -> AdSize.getAdaptiveBanner(plugin.activity, w)
            "I" -> AdSize.getInlineBanner(w, h)
            else -> AdSize.BANNER
        }
    }

    @MainThread
    private fun buildLayoutParamsForCurrentState(view: CASBannerView): FrameLayout.LayoutParams {
        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        )

        val density = plugin.activity.resources.displayMetrics.density
        val offXpx = (offsetXdp * density).roundToInt()
        val offYpx = (offsetYdp * density).roundToInt()

        val decor = plugin.activity.window.decorView
        val screenW = decor.width
        val screenH = decor.height

        var safeLeft = 0; var safeTop = 0; var safeRight = 0; var safeBottom = 0
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val cutout: DisplayCutout? = decor.rootWindowInsets?.displayCutout
            if (cutout != null) {
                safeBottom = cutout.safeInsetBottom
                safeTop = cutout.safeInsetTop
                safeLeft = cutout.safeInsetLeft
                safeRight = cutout.safeInsetRight
            }
        }

        val adW = if (view.measuredWidth == 0) view.size.widthPixels(plugin.activity) else view.measuredWidth
        val adH = if (view.measuredHeight == 0) view.size.heightPixels(plugin.activity) else view.measuredHeight

        fun clamp(v: Int, min: Int, max: Int) = v.coerceIn(min, max)

        when (desiredPosition) {
            BannerPosition.TOP_CENTER, BannerPosition.TOP_LEFT, BannerPosition.TOP_RIGHT -> {
                params.gravity = Gravity.TOP
                params.topMargin = clamp(safeTop + offYpx, safeTop, screenH - safeBottom - adH)
            }
            BannerPosition.BOTTOM_CENTER, BannerPosition.BOTTOM_LEFT, BannerPosition.BOTTOM_RIGHT -> {
                params.gravity = Gravity.BOTTOM
                params.bottomMargin = clamp(safeBottom + offYpx, safeBottom, screenH - safeTop - adH)
            }
            BannerPosition.MIDDLE_CENTER, BannerPosition.MIDDLE_LEFT, BannerPosition.MIDDLE_RIGHT -> {
                params.gravity = Gravity.CENTER_VERTICAL
                params.topMargin = offYpx
            }
            else -> {
                params.gravity = Gravity.BOTTOM
                params.bottomMargin = safeBottom
            }
        }

        when (desiredPosition) {
            BannerPosition.TOP_LEFT, BannerPosition.BOTTOM_LEFT, BannerPosition.MIDDLE_LEFT -> {
                params.gravity = params.gravity or Gravity.START
                params.leftMargin = clamp(safeLeft + offXpx, safeLeft, screenW - safeRight - adW)
            }
            BannerPosition.TOP_RIGHT, BannerPosition.BOTTOM_RIGHT, BannerPosition.MIDDLE_RIGHT -> {
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
