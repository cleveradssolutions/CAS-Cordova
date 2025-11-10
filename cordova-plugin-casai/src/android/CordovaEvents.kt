package com.cleveradssolutions.plugin.cordova

import android.webkit.ValueCallback
import org.apache.cordova.CordovaPlugin
import org.json.JSONObject

internal object CordovaEvents {
    fun emit(plugin: CordovaPlugin, type: String, detail: JSONObject) {
        val javascriptCode = buildString {
            append("cordova.fireWindowEvent(")
            append(JSONObject.quote(type))
            append(", ")
            append(detail.toString())
            append(");")
        }

        plugin.cordova.activity.runOnUiThread {
            val engine = plugin.webView.engine
            if (engine != null) {
                engine.evaluateJavascript(javascriptCode, ValueCallback { })
            } else {
                plugin.webView.loadUrl("javascript:$javascriptCode")
            }
        }
    }
}
