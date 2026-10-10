import AppKit
import SwiftUI
import WebKit

/// Shows the printer's own settings site (Web Based Management) and fills the
/// chosen network's name and password into its wireless form. The person still
/// reviews the form and presses Submit themselves.
struct PrinterWebView: NSViewRepresentable {
    let url: URL
    let ssid: String
    let password: String
    @Binding var status: String
    /// Bump to run the autofill again on the page currently shown.
    let refillToken: Int

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        let controller = config.userContentController
        controller.add(context.coordinator, name: "autofill")
        controller.addUserScript(WKUserScript(source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: false))

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        context.coordinator.webView = webView
        context.coordinator.lastRefillToken = refillToken
        webView.load(URLRequest(url: url, timeoutInterval: 15))
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        context.coordinator.parent = self
        if context.coordinator.lastRefillToken != refillToken {
            context.coordinator.lastRefillToken = refillToken
            context.coordinator.filledThisPage = false
            webView.evaluateJavaScript(script)
        }
    }

    static func dismantleNSView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "autofill")
    }

    private var script: String {
        let config = ["ssid": ssid, "password": password]
        let json = (try? JSONSerialization.data(withJSONObject: config))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        return Self.autofillSource.replacingOccurrences(of: "__CONFIG__", with: json)
    }

    // Looks for the SSID box and the network key boxes on whatever page is
    // showing. It matches on field names and nearby label text, so it copes
    // with differences between Brother firmware versions.
    private static let autofillSource = #"""
    (function (cfg) {
      function post(message) {
        try { window.webkit.messageHandlers.autofill.postMessage(message); } catch (e) {}
      }
      function ownText(el) {
        return [el.name, el.id, el.getAttribute('aria-label')].join(' ').toLowerCase();
      }
      function labelText(el) {
        var row = el.closest('tr, li, dt, dd, label, p');
        return row ? row.innerText.toLowerCase() : '';
      }
      function fill(el, value) {
        el.focus();
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.style.outline = '3px solid #34c759';
      }
      function run() {
        var inputs = Array.prototype.slice.call(document.querySelectorAll('input'));
        var textInputs = inputs.filter(function (el) {
          var t = (el.getAttribute('type') || 'text').toLowerCase();
          return t === 'text' && !el.disabled && !el.readOnly;
        });
        var ssidField = textInputs.find(function (el) { return /ssid/.test(ownText(el)); })
          || textInputs.find(function (el) { return /ssid|network name/.test(labelText(el)); });
        if (!ssidField) return false;
        fill(ssidField, cfg.ssid);

        var filledKey = false;
        if (cfg.password) {
          inputs.filter(function (el) {
            if (el.type !== 'password') return false;
            var text = ownText(el) + ' ' + labelText(el);
            return /key|pass|psk|phrase/.test(text) && !/admin|login|log in/.test(text);
          }).forEach(function (el) { fill(el, cfg.password); filledKey = true; });
        }
        post(!cfg.password || filledKey ? 'filled' : 'filled-ssid');
        return true;
      }
      if (!run()) {
        // Some pages build their forms with script after load.
        setTimeout(function () {
          if (!run() && window === window.top) post('no-form');
        }, 800);
      }
    })(__CONFIG__);
    """#

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: PrinterWebView
        weak var webView: WKWebView?
        var lastRefillToken = 0
        var filledThisPage = false

        init(_ parent: PrinterWebView) { self.parent = parent }

        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? String else { return }
            switch body {
            case "filled":
                filledThisPage = true
                parent.status = "Filled in the network name and password (outlined in green). Check the security type matches, then press Submit on the printer's page."
            case "filled-ssid":
                filledThisPage = true
                parent.status = "Filled in the network name, but couldn't find a password box. Paste the password with the Copy button, then press Submit."
            case "no-form":
                guard !filledThisPage else { return }
                parent.status = "This page has no Wi-Fi form. Log in if asked, then go to Network › Wireless › Wireless (Personal). The fields fill in automatically when that page opens."
            default:
                break
            }
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            filledThisPage = false
            parent.status = "Loading the printer's settings page…"
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            let host = parent.url.host ?? "the printer"
            parent.status = "Couldn't reach \(host): \(error.localizedDescription). Is the printer on the same network as this Mac?"
        }

        /// Keeps the web view on the printer. Links elsewhere open in the default browser,
        /// so the Wi-Fi password is only ever typed into the printer's own pages.
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
            guard let url = navigationAction.request.url, let host = url.host else { return .allow }
            let printerHost = parent.url.host ?? ""
            if host.caseInsensitiveCompare(printerHost) == .orderedSame { return .allow }
            if url.scheme == "http" || url.scheme == "https" {
                NSWorkspace.shared.open(url)
            }
            return .cancel
        }
    }
}
