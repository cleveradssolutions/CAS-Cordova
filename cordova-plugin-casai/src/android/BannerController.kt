package com.cleveradssolutions.plugin.cordova

import android.os.Build
import android.view.DisplayCutout
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import androidx.annotation.MainThread
import com.cleveradssolutions.sdk.AdFormat
import com.cleveradssolutions.sdk.OnAdImpressionListener
import com.cleveradssolutions.sdk.base.CASHandler
import com.cleversolutions.ads.AdError
import com.cleversolutions.ads.AdSize
import com.cleversolutions.ads.AdViewListener
import com.cleversolutions.ads.android.CASBannerView
import org.apache.cordova.CallbackContext

class BannerController(
    private val plugin: CASMobileAds,
    private val host: FrameLayout
) : AdViewListener {

    private var bannerView: CASBannerView? = null
    private var pendingLoadPromise: CallbackContext? = null

    private var pendingShowPos: Int? = null
    private var isLoadedOnce: Boolean = false
    
    private var offsetXdp: Int = 0
    private var offsetYdp: Int = 0

    fun loadBanner(
        casId: String,
        adSize: AdSize,
        autoload: Boolean,
        refreshSeconds: Int,
        promise: CallbackContext
    ) {
        pendingLoadPromise = promise

        val view = (bannerView ?: CASBannerView(plugin.activity).also { created ->
            bannerView = created
            created.casId = casId
            created.onImpressionListener = ScreenImpressionProxy(plugin, AdFormat.BANNER)
            created.adListener = this
        })

        view.isAutoloadEnabled = autoload
        view.refreshInterval = refreshSeconds
        view.size = adSize

        isLoadedOnce = false

        CASHandler.main {
            if (view.parent != host) {
                host.addView(
                    view,
                    FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.WRAP_CONTENT,
                        FrameLayout.LayoutParams.WRAP_CONTENT
                    ).apply { gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL }
                )
                host.bringToFront()
            }
            view.visibility = View.GONE
        }

        view.load()
    }
    
    fun show(position: Int, offsetXdp: Int, offsetYdp: Int) {
        pendingShowPos = position
        this.offsetXdp = offsetXdp
        this.offsetYdp = offsetYdp

        val view = bannerView ?: return
        CASHandler.main {
            if (isLoadedOnce) {
                host.bringToFront()
                view.visibility = View.VISIBLE
                view.post { refreshViewPosition(view, position) }
                pendingShowPos = null
            }
        }
    }

    fun hide() {
        pendingShowPos = null
        CASHandler.main { bannerView?.visibility = View.GONE }
    }

    fun destroy() {
        val view = bannerView ?: return
        CASHandler.main {
            host.removeView(view)
            view.destroy()
        }
        bannerView = null
        pendingLoadPromise = null
        pendingShowPos = null
        isLoadedOnce = false
        offsetXdp = 0
        offsetYdp = 0
    }

    override fun onAdViewLoaded(view: CASBannerView) {
        isLoadedOnce = true
        plugin.emitEvent(PluginEvents.LOADED, adInfoJson(AdFormat.BANNER))
        pendingLoadPromise?.success()
        pendingLoadPromise = null

        val pos = pendingShowPos
        CASHandler.main {
            if (pos != null) {
                host.bringToFront()
                view.visibility = View.VISIBLE
                view.post { refreshViewPosition(view, pos) } 
                pendingShowPos = null
            } else {
                view.visibility = View.GONE
            }
        }
    }

    override fun onAdViewFailed(view: CASBannerView, error: AdError) {
        plugin.emitEvent(PluginEvents.LOAD_FAILED, errorJson(AdFormat.BANNER, error))
        pendingLoadPromise?.error(errorJson(AdFormat.BANNER, error).toString())
        pendingLoadPromise = null
    }

    override fun onAdViewClicked(view: CASBannerView) {
        plugin.emitEvent(PluginEvents.CLICKED, adInfoJson(AdFormat.BANNER))
    }

    @MainThread
    private fun refreshViewPosition(view: CASBannerView, position: Int) {
        val activity = plugin.activity

        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        )

        val adWidthPx: Int
        val adHeightPx: Int
        if (view.measuredWidth == 0) {
            val size = view.size
            adWidthPx = size.widthPixels(activity)
            adHeightPx = size.heightPixels(activity)
        } else {
            adWidthPx = view.measuredWidth
            adHeightPx = view.measuredHeight
        }

        val decor = activity.window.decorView
        val screenWidth = decor.width
        val screenHeight = decor.height

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

        fun clamp(v: Int, min: Int, max: Int) = v.coerceIn(min, max)
        
        val density = activity.resources.displayMetrics.density
        val offXpx = (offsetXdp * density).toInt()
        val offYpx = (offsetYdp * density).toInt()

        when (position) {
            0, 1, 2 -> {
                params.gravity = Gravity.TOP
                params.topMargin = clamp(safeTop + offYpx, safeTop, screenHeight - safeBottom - adHeightPx)
            }
            3, 4, 5 -> {
                params.gravity = Gravity.BOTTOM
                params.bottomMargin = clamp(safeBottom + offYpx, safeBottom, screenHeight - safeTop - adHeightPx)
            }
            6, 7, 8 -> {
                params.gravity = Gravity.CENTER_VERTICAL
                params.topMargin = offYpx
            }
            else -> {
                params.gravity = Gravity.BOTTOM
                params.bottomMargin = safeBottom
            }
        }

        when (position) {
            1, 4, 7 -> {
                params.gravity = params.gravity or Gravity.START
                params.leftMargin = clamp(safeLeft + offXpx, safeLeft, screenWidth - safeRight - adWidthPx)
            }
            2, 5, 8 -> {
                params.gravity = params.gravity or Gravity.END
                params.rightMargin = clamp(safeRight + offXpx, safeRight, screenWidth - safeLeft - adWidthPx)
            }
            else -> {
                params.gravity = params.gravity or Gravity.CENTER_HORIZONTAL
            }
        }

        view.layoutParams = params
    }

    private class ScreenImpressionProxy(
        private val plugin: CASMobileAds,
        private val adFormat: AdFormat
    ) : OnAdImpressionListener {
        override fun onAdImpression(ad: com.cleveradssolutions.sdk.AdContentInfo) {
            plugin.emitEvent(PluginEvents.IMPRESSIONS, adContentToJson(adFormat, ad))
        }
    }
}

