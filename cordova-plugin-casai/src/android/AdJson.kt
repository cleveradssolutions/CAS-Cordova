package com.cleveradssolutions.plugin.cordova

import com.cleveradssolutions.sdk.AdContentInfo
import com.cleveradssolutions.sdk.AdFormat
import com.cleversolutions.ads.AdError
import org.json.JSONObject

fun adInfoJson(format: AdFormat): JSONObject = JSONObject().put("format", format.label)

fun errorJson(format: AdFormat, error: AdError): JSONObject =
    JSONObject()
        .put("format", format.label)
        .put("code", error.code)
        .put("message", error.message)

fun adContentToJson(format: AdFormat, info: AdContentInfo?): JSONObject {
    val obj = JSONObject().put("format", format.label)
    if (info != null) {
        obj.put("sourceUnitId", info.sourceUnitId)
        obj.put("sourceName", info.sourceName)
        obj.put("creativeId", info.creativeId ?: JSONObject.NULL)
        obj.put("revenue", info.revenue)
        obj.put("revenuePrecision", info.revenuePrecision)
        obj.put("revenueTotal", info.revenueTotal)
        obj.put("impressionDepth", info.impressionDepth)
    }
    return obj
}
