// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "PrinterWiFiSwitcher",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "PrinterWiFiSwitcher",
            path: "Sources/PrinterWiFiSwitcher",
            linkerSettings: [
                .linkedFramework("IOKit"),
                .linkedFramework("WebKit"),
                .linkedFramework("Security"),
            ]
        )
    ]
)
