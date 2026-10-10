import Foundation
import Security

/// A Wi-Fi network the printer can be switched to. The password lives in the
/// Keychain, keyed by `id`; it is never written to UserDefaults.
struct NetworkProfile: Identifiable, Codable, Hashable {
    var id = UUID()
    var name: String
    var ssid: String
    var security: Security

    enum Security: String, Codable, CaseIterable, Identifiable {
        case wpa2Personal = "WPA2-Personal (AES)"
        case wpaWpa2Personal = "WPA/WPA2-Personal (TKIP + AES)"
        case open = "None (open network)"

        var id: String { rawValue }
        var needsPassword: Bool { self != .open }
    }

    static var blank: NetworkProfile {
        NetworkProfile(name: "", ssid: "", security: .wpa2Personal)
    }
}

final class ProfileStore: ObservableObject {
    @Published private(set) var profiles: [NetworkProfile] = []

    private let defaultsKey = "savedNetworkProfiles"

    init() {
        if let data = UserDefaults.standard.data(forKey: defaultsKey),
           let decoded = try? JSONDecoder().decode([NetworkProfile].self, from: data) {
            profiles = decoded
        }
    }

    func profile(_ id: NetworkProfile.ID?) -> NetworkProfile? {
        profiles.first { $0.id == id }
    }

    func contains(_ profile: NetworkProfile) -> Bool {
        profiles.contains { $0.id == profile.id }
    }

    func save(_ profile: NetworkProfile, password: String) {
        if let index = profiles.firstIndex(where: { $0.id == profile.id }) {
            profiles[index] = profile
        } else {
            profiles.append(profile)
        }
        Keychain.setPassword(profile.security.needsPassword ? password : "", for: profile.id)
        persist()
    }

    func delete(_ profile: NetworkProfile) {
        profiles.removeAll { $0.id == profile.id }
        Keychain.setPassword("", for: profile.id)
        persist()
    }

    private func persist() {
        if let data = try? JSONEncoder().encode(profiles) {
            UserDefaults.standard.set(data, forKey: defaultsKey)
        }
    }
}

enum Keychain {
    private static let service = "PrinterWiFiSwitcher"

    private static func baseQuery(_ id: UUID) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: id.uuidString,
        ]
    }

    /// Stores `password` for the profile. An empty password removes the item.
    static func setPassword(_ password: String, for id: UUID) {
        SecItemDelete(baseQuery(id) as CFDictionary)
        guard !password.isEmpty else { return }
        var item = baseQuery(id)
        item[kSecValueData as String] = Data(password.utf8)
        SecItemAdd(item as CFDictionary, nil)
    }

    static func password(for id: UUID) -> String {
        var query = baseQuery(id)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return "" }
        return String(decoding: data, as: UTF8.self)
    }
}
