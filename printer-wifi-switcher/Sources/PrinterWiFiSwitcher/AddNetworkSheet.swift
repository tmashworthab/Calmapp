import SwiftUI

/// Step 1: pick one of the Wi-Fi networks this Mac can see.
/// Step 2: confirm the details and password (`ProfileEditor`).
struct AddNetworkSheet: View {
    let existingSSIDs: Set<String>
    let onSave: (NetworkProfile, String) -> Void

    @Environment(\.dismiss) private var dismiss
    @StateObject private var scanner = WiFiScanner()
    @State private var chosen: NetworkProfile?

    var body: some View {
        Group {
            if let chosen {
                ProfileEditor(profile: chosen, onSave: onSave, onBack: { self.chosen = nil })
            } else {
                picker
            }
        }
        .onAppear { scanner.start() }
    }

    private var picker: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Choose a Wi-Fi network").font(.title3.bold())
            Text("These are the networks this Mac can see right now.")
                .foregroundStyle(.secondary)

            Group {
                switch scanner.state {
                case .needsPermission:
                    notice("When macOS asks, allow Location access. macOS only shows Wi-Fi network names to apps that have it. This app never uses your location.")
                case .denied:
                    VStack(alignment: .leading, spacing: 8) {
                        notice("Location access is off for this app, so macOS hides the network names. Turn on Printer Wi-Fi Switcher under Location Services, then press Refresh.")
                        Button("Open Location Services Settings") { scanner.openLocationSettings() }
                    }
                case .failed(let message):
                    notice("Couldn't scan for networks: \(message)")
                case .scanning where scanner.networks.isEmpty:
                    ProgressView("Looking for networks…")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                default:
                    networkList
                }
            }
            .frame(maxHeight: .infinity, alignment: .top)

            HStack {
                Button("Enter a network manually…") { chosen = .blank }
                Spacer()
                Button("Refresh") { scanner.start() }
                    .disabled(scanner.state == .scanning)
                Button("Cancel") { dismiss() }
                    .keyboardShortcut(.cancelAction)
            }
        }
        .padding(20)
        .frame(width: 500, height: 480)
    }

    private var networkList: some View {
        List(scanner.networks) { network in
            Button { choose(network) } label: {
                HStack(spacing: 10) {
                    Image(systemName: "wifi", variableValue: signalLevel(network.rssi))
                        .frame(width: 22)
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text(network.ssid)
                            if network.isCurrent {
                                Text("This Mac is on it").font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        if let problem = network.problem {
                            Text(problem).font(.caption).foregroundStyle(.orange)
                        } else if existingSSIDs.contains(network.ssid) {
                            Text("Already saved").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                    Spacer()
                    if network.security?.needsPassword ?? true {
                        Image(systemName: "lock.fill").foregroundStyle(.secondary)
                    }
                }
                .contentShape(Rectangle())
                .padding(.vertical, 3)
            }
            .buttonStyle(.plain)
            .disabled(network.problem != nil)
        }
    }

    private func notice(_ text: String) -> some View {
        Text(text)
            .fixedSize(horizontal: false, vertical: true)
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.quaternary.opacity(0.5), in: RoundedRectangle(cornerRadius: 8))
    }

    private func choose(_ network: WiFiScanner.VisibleNetwork) {
        chosen = NetworkProfile(name: "", ssid: network.ssid, security: network.security ?? .wpa2Personal)
    }

    private func signalLevel(_ rssi: Int) -> Double {
        // Roughly -90 dBm (barely there) to -50 dBm (excellent).
        min(1, max(0.1, Double(rssi + 90) / 40))
    }
}
