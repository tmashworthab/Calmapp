import Foundation
import IOKit
import IOKit.usb

/// Watches the USB bus for Brother devices (vendor ID 0x04F9) and publishes
/// the ones currently plugged in.
final class USBPrinterMonitor: ObservableObject {
    struct Device: Identifiable, Hashable {
        let id: UInt64
        let name: String
        let serial: String?
    }

    @Published private(set) var devices: [Device] = []

    private static let brotherVendorID = 0x04F9

    private var notifyPort: IONotificationPortRef?
    private var addedIterator: io_iterator_t = 0
    private var removedIterator: io_iterator_t = 0

    func start() {
        guard notifyPort == nil else { return }
        let port = IONotificationPortCreate(kIOMainPortDefault)
        IONotificationPortSetDispatchQueue(port, .main)
        notifyPort = port

        let context = Unmanaged.passUnretained(self).toOpaque()

        IOServiceAddMatchingNotification(port, kIOFirstMatchNotification, Self.matching(), { context, iterator in
            let monitor = Unmanaged<USBPrinterMonitor>.fromOpaque(context!).takeUnretainedValue()
            USBPrinterMonitor.drain(iterator)
            monitor.rescan()
        }, context, &addedIterator)

        IOServiceAddMatchingNotification(port, kIOTerminatedNotification, Self.matching(), { context, iterator in
            let monitor = Unmanaged<USBPrinterMonitor>.fromOpaque(context!).takeUnretainedValue()
            let gone = USBPrinterMonitor.drain(iterator)
            monitor.devices.removeAll { gone.contains($0.id) }
        }, context, &removedIterator)

        // Arm both notifications; the first drain also reports what is already attached.
        Self.drain(addedIterator)
        Self.drain(removedIterator)
        rescan()
    }

    deinit {
        if addedIterator != 0 { IOObjectRelease(addedIterator) }
        if removedIterator != 0 { IOObjectRelease(removedIterator) }
        if let notifyPort { IONotificationPortDestroy(notifyPort) }
    }

    private func rescan() {
        var iterator: io_iterator_t = 0
        guard IOServiceGetMatchingServices(kIOMainPortDefault, Self.matching(), &iterator) == KERN_SUCCESS else { return }
        defer { IOObjectRelease(iterator) }

        var found: [Device] = []
        while case let service = IOIteratorNext(iterator), service != 0 {
            defer { IOObjectRelease(service) }
            var entryID: UInt64 = 0
            IORegistryEntryGetRegistryEntryID(service, &entryID)
            let name: String = Self.property(service, "USB Product Name")
                ?? Self.property(service, "kUSBProductString")
                ?? "Brother device"
            let serial: String? = Self.property(service, "USB Serial Number")
                ?? Self.property(service, "kUSBSerialNumberString")
            found.append(Device(id: entryID, name: name, serial: serial))
        }
        devices = found
    }

    private static func matching() -> CFDictionary {
        let dict = IOServiceMatching("IOUSBHostDevice") as NSMutableDictionary
        dict["idVendor"] = brotherVendorID
        return dict as CFDictionary
    }

    /// Empties an iterator (required to re-arm the notification) and returns the registry IDs it held.
    @discardableResult
    private static func drain(_ iterator: io_iterator_t) -> Set<UInt64> {
        var ids = Set<UInt64>()
        while case let service = IOIteratorNext(iterator), service != 0 {
            var entryID: UInt64 = 0
            IORegistryEntryGetRegistryEntryID(service, &entryID)
            ids.insert(entryID)
            IOObjectRelease(service)
        }
        return ids
    }

    private static func property<T>(_ service: io_service_t, _ key: String) -> T? {
        IORegistryEntryCreateCFProperty(service, key as CFString, kCFAllocatorDefault, 0)?
            .takeRetainedValue() as? T
    }
}
