package com.cleveradssolutions.plugin.cordova

import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleversolutions.ads.AdError
import org.json.JSONObject

fun jsFormat(format: AdFormat): String = when (format) {
    AdFormat.BANNER, AdFormat.INLINE_BANNER -> "Banner"
    AdFormat.MEDIUM_RECTANGLE -> "MediumRectangle"
    AdFormat.APP_OPEN -> "AppOpen"
    AdFormat.INTERSTITIAL -> "Interstitial"
    AdFormat.REWARDED -> "Rewarded"
    AdFormat.NATIVE -> "Native"
}

fun adInfoJson(format: AdFormat): JSONObject = JSONObject().put("format", jsFormat(format))

fun errorJson(format: AdFormat, error: AdError): JSONObject =
    JSONObject()
        .put("format", jsFormat(format))
        .put("code", error.code)
        .put("message", error.message)

fun adContentToJson(format: AdFormat, info: AdContentInfo?): JSONObject {
    val obj = JSONObject().put("format", jsFormat(format))
    if (info != null) {
        obj.put("sourceUnitId", info.sourceUnitId ?: JSONObject.NULL)
        obj.put("sourceName", info.sourceName ?: JSONObject.NULL)
        obj.put("creativeId", info.creativeId ?: JSONObject.NULL)
        obj.put("revenue", info.revenue)
        obj.put("revenuePrecision", info.revenuePrecision ?: JSONObject.NULL)
        obj.put("revenueTotal", info.revenueTotal)
        obj.put("impressionDepth", info.impressionDepth)
    }
    return obj
}
