import Foundation

/// Finds Brother printers advertising themselves on the local network over Bonjour.
final class PrinterBrowser: NSObject, ObservableObject, NetServiceBrowserDelegate, NetServiceDelegate {
    struct Found: Identifiable, Hashable {
        var id: String { name }
        let name: String
        let host: String
    }

    @Published private(set) var printers: [Found] = []

    private let serviceTypes = ["_ipp._tcp.", "_pdl-datastream._tcp.", "_printer._tcp."]
    private var browsers: [NetServiceBrowser] = []
    private var resolving: [NetService] = []

    func start() {
        guard browsers.isEmpty else { return }
        for type in serviceTypes {
            let browser = NetServiceBrowser()
            browser.delegate = self
            browser.searchForServices(ofType: type, inDomain: "local.")
            browsers.append(browser)
        }
    }

    func netServiceBrowser(_ browser: NetServiceBrowser, didFind service: NetService, moreComing: Bool) {
        guard service.name.localizedCaseInsensitiveContains("brother"),
              !printers.contains(where: { $0.name == service.name }) else { return }
        service.delegate = self
        resolving.append(service)
        service.resolve(withTimeout: 10)
    }

    func netServiceBrowser(_ browser: NetServiceBrowser, didRemove service: NetService, moreComing: Bool) {
        printers.removeAll { $0.name == service.name }
    }

    func netServiceDidResolveAddress(_ sender: NetService) {
        defer { finish(sender) }
        guard var host = sender.hostName, !printers.contains(where: { $0.name == sender.name }) else { return }
        if host.hasSuffix(".") { host.removeLast() }
        printers.append(Found(name: sender.name, host: host))
    }

    func netService(_ sender: NetService, didNotResolve errorDict: [String: NSNumber]) {
        finish(sender)
    }

    private func finish(_ service: NetService) {
        service.stop()
        resolving.removeAll { $0 === service }
    }
}
