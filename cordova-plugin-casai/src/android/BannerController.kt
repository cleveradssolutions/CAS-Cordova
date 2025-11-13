package com.cleveradssolutions.plugin.cordova

import android.os.Build
import android.view.DisplayCutout
import android.view.Gravity
import android.view.View
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

    private val bannerView: CASBannerView = CASBannerView(plugin.activity).apply {
        adListener = this@BannerController
        onImpressionListener = this@BannerController
        visibility = View.GONE
    }

    private var attachedToWindow = false
    private var isVisible: Boolean = false
    private var desiredPosition: Int = BannerPosition.BOTTOM_CENTER
    private var offsetXdp: Int = 0
    private var offsetYdp: Int = 0
    private var pendingLoadPromise: CallbackContext? = null

    fun loadBanner(
        casId: String,
        adSize: AdSize,
        autoload: Boolean,
        refreshSeconds: Int,
        promise: CallbackContext
    ) {
        pendingLoadPromise = promise

        bannerView.casId = casId
        bannerView.isAutoloadEnabled = autoload
        bannerView.refreshInterval = refreshSeconds
        bannerView.size = adSize

        CASHandler.main {
            if (!attachedToWindow) {
                val layoutParams = buildLayoutParamsForCurrentState()
                plugin.activity.addContentView(bannerView, layoutParams)
                attachedToWindow = true
            } else {
                bannerView.layoutParams = buildLayoutParamsForCurrentState()
            }
            bannerView.visibility = if (isVisible) View.VISIBLE else View.GONE
        }
        bannerView.load()
    }

    fun show(position: Int, offsetXdp: Int, offsetYdp: Int) {
        desiredPosition = position
        this.offsetXdp = offsetXdp
        this.offsetYdp = offsetYdp
        isVisible = true

        if (!attachedToWindow) {
            return
        }

        CASHandler.main {
            bannerView.layoutParams = buildLayoutParamsForCurrentState()
            bannerView.visibility = View.VISIBLE
        }
    }

    fun hide() {
        isVisible = false
        if (attachedToWindow)
            CASHandler.main {
                bannerView.visibility = View.GONE
            }
    }

    fun destroy() {
        CASHandler.main {
            bannerView.visibility = View.GONE
            bannerView.destroy()
        }
        isVisible = false
        pendingLoadPromise = null
    }


    override fun onAdViewLoaded(view: CASBannerView) {
        plugin.emitEvent(PluginEvents.LOADED, adInfoJson(adFormat))
        pendingLoadPromise?.success()
        pendingLoadPromise = null

        view.layoutParams = buildLayoutParamsForCurrentState()
        view.visibility = if (isVisible) View.VISIBLE else View.GONE
    }

    override fun onAdViewFailed(view: CASBannerView, error: AdError) {
        val error = errorJson(adFormat, error)
        plugin.emitEvent(PluginEvents.LOAD_FAILED, error)
        pendingLoadPromise?.error(error.toString())
        pendingLoadPromise = null
    }

    override fun onAdViewClicked(view: CASBannerView) {
        plugin.emitEvent(PluginEvents.CLICKED, adInfoJson(adFormat))
    }

    override fun onAdImpression(ad: AdContentInfo) {
        plugin.emitEvent(PluginEvents.IMPRESSIONS, adContentToJson(adFormat, ad))
    }

    @MainThread
    private fun buildLayoutParamsForCurrentState(): FrameLayout.LayoutParams {
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

        val adW = if (bannerView.measuredWidth == 0) bannerView.size.widthPixels(plugin.activity) else bannerView.measuredWidth
        val adH = if (bannerView.measuredHeight == 0) bannerView.size.heightPixels(plugin.activity) else bannerView.measuredHeight

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

