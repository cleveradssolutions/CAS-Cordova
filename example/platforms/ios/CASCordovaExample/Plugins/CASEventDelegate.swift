import Foundation
import CleverAdsSolutions

enum CASEvent: String {
    case casai_ad_loaded
    case casai_ad_showed
    
    case casai_ad_load_failed
    case casai_ad_show_failed
    
    case casai_ad_impressions
    
    case casai_ad_clicked
    case casai_ad_dismissed
    
    case casai_ad_reward
}

protocol CASEventDelegate: AnyObject {
    func sendEvent(_ name: CASEvent, format: String)
    func sendError(_ name: CASEvent, format: String, error: AdError)
    func sendImpression(format: String, contentInfo: AdContentInfo)
}

protocol CDVEventDelegate: AnyObject {
    func send(_ result: CDVPluginResult?, callbackId: String?)
}
