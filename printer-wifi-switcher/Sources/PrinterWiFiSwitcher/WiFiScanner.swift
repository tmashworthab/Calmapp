import AppKit
import CoreLocation
import CoreWLAN

/// Lists the Wi-Fi networks this Mac can see. macOS only reveals network names
/// to apps that have Location Services permission, so this asks for it first.
final class WiFiScanner: NSObject, ObservableObject, CLLocationManagerDelegate {
    struct VisibleNetwork: Identifiable, Hashable {
        var id: String { ssid }
        let ssid: String
        let rssi: Int
        let isCurrent: Bool
        /// The printer-side security setting, or nil if the printer can't join this network.
        let security: NetworkProfile.Security?
        let problem: String?
    }

    enum State: Equatable {
        case needsPermission
        case denied
        case scanning
        case ready
        case failed(String)
    }

    @Published private(set) var networks: [VisibleNetwork] = []
    @Published private(set) var state: State = .needsPermission

    private let location = CLLocationManager()

    override init() {
        super.init()
        location.delegate = self
    }

    func start() {
        switch location.authorizationStatus {
        case .notDetermined:
            state = .needsPermission
            location.requestWhenInUseAuthorization()
        case .denied, .restricted:
            state = .denied
        default:
            scan()
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .notDetermined: state = .needsPermission
        case .denied, .restricted: state = .denied
        default: scan()
        }
    }

    func openLocationSettings() {
        NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices")!)
    }

    func scan() {
        guard state != .scanning else { return }
        state = .scanning
        DispatchQueue.global(qos: .userInitiated).async {
            let result: Result<[VisibleNetwork], Error>
            do {
                result = .success(try Self.performScan())
            } catch {
                result = .failure(error)
            }
            DispatchQueue.main.async {
                switch result {
                case .success(let found):
                    self.networks = found
                    self.state = .ready
                case .failure(let error):
                    self.state = .failed(error.localizedDescription)
                }
            }
        }
    }

    private static func performScan() throws -> [VisibleNetwork] {
        guard let interface = CWWiFiClient.shared().interface() else {
            throw NSError(domain: "WiFiScanner", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "This Mac's Wi-Fi is turned off."])
        }
        let current = interface.ssid()
        let scanned = try interface.scanForNetworks(withName: nil)

        // The same name is often broadcast on several channels and bands; merge them.
        let bySSID = Dictionary(grouping: scanned.filter { !($0.ssid ?? "").isEmpty }, by: { $0.ssid! })
        return bySSID.map { ssid, entries in
            let strongest = entries.max { $0.rssiValue < $1.rssiValue }!
            let has24GHz = entries.contains { $0.wlanChannel?.channelBand == .band2GHz }
            let security = printerSecurity(for: strongest)
            let problem: String?
            if !has24GHz {
                problem = "5 GHz only. The printer needs 2.4 GHz."
            } else if security == nil {
                problem = "Uses security the printer doesn't support (WPA3-only or enterprise)."
            } else {
                problem = nil
            }
            return VisibleNetwork(ssid: ssid, rssi: strongest.rssiValue, isCurrent: ssid == current,
                                  security: security, problem: problem)
        }
        .sorted { ($0.isCurrent ? 1 : 0, $0.rssi) > ($1.isCurrent ? 1 : 0, $1.rssi) }
    }

    /// Maps what the router offers onto what the HL-3140CW can use.
    private static func printerSecurity(for network: CWNetwork) -> NetworkProfile.Security? {
        if network.supportsSecurity(.none) { return .open }
        // WPA2/WPA3 mixed ("transition") networks accept WPA2 devices like the printer.
        if network.supportsSecurity(.wpa2Personal) || network.supportsSecurity(.wpa3Transition) {
            return .wpa2Personal
        }
        if network.supportsSecurity(.wpaPersonalMixed) || network.supportsSecurity(.wpaPersonal) {
            return .wpaWpa2Personal
        }
        return nil
    }

    /// Reads the password this Mac has saved for `ssid`. macOS asks the person to
    /// approve this (usually with their Mac login password). Call off the main thread.
    static func passwordSavedOnMac(for ssid: String) -> String? {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/security")
        process.arguments = ["find-generic-password", "-D", "AirPort network password", "-a", ssid, "-w"]
        let output = Pipe()
        process.standardOutput = output
        process.standardError = Pipe()
        do {
            try process.run()
        } catch {
            return nil
        }
        let data = output.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()
        guard process.terminationStatus == 0 else { return nil }
        let password = String(decoding: data, as: UTF8.self).trimmingCharacters(in: .newlines)
        return password.isEmpty ? nil : password
    }
}
