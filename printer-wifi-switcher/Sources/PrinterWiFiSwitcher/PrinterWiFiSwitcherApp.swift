import SwiftUI

@main
struct PrinterWiFiSwitcherApp: App {
    var body: some Scene {
        WindowGroup("Printer Wi-Fi Switcher") {
            ContentView()
                .frame(minWidth: 900, minHeight: 600)
        }
        .windowResizability(.contentMinSize)
    }
}
