import AppKit
import SwiftUI

struct ContentView: View {
    @StateObject private var profiles = ProfileStore()
    @StateObject private var usb = USBPrinterMonitor()
    @StateObject private var browser = PrinterBrowser()
    @AppStorage("printerHost") private var printerHost = ""
    @State private var selection: NetworkProfile.ID?
    @State private var editing: NetworkProfile?
    @State private var addingNetwork = false
    /// The profile whose printer page should open as soon as it's shown (right after adding it).
    @State private var openPrinterPageFor: NetworkProfile.ID?

    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                Section("Printer") {
                    PrinterSection(usb: usb, browser: browser, host: $printerHost)
                }
                Section("Saved networks") {
                    if profiles.profiles.isEmpty {
                        Text("Add each Wi-Fi network you want the printer to use.")
                            .foregroundStyle(.secondary)
                    }
                    ForEach(profiles.profiles) { profile in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(profile.name.isEmpty ? profile.ssid : profile.name)
                            Text(profile.ssid).font(.caption).foregroundStyle(.secondary)
                        }
                        .tag(profile.id)
                        .contextMenu {
                            Button("Edit…") { editing = profile }
                            Button("Delete", role: .destructive) { profiles.delete(profile) }
                        }
                    }
                }
            }
            .navigationSplitViewColumnWidth(min: 280, ideal: 310)
            .safeAreaInset(edge: .bottom) {
                Button { addingNetwork = true } label: {
                    Label("Add Wi-Fi Network…", systemImage: "plus.circle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .padding(12)
            }
            .toolbar {
                Button { addingNetwork = true } label: {
                    Label("Add Wi-Fi Network", systemImage: "plus")
                }
            }
        } detail: {
            if let profile = profiles.profile(selection) {
                SwitchView(
                    profile: profile,
                    host: printerHost.trimmingCharacters(in: .whitespaces),
                    usbConnected: !usb.devices.isEmpty,
                    openPrinterPage: openPrinterPageFor == profile.id,
                    onEdit: { editing = profile }
                )
                .id("\(profile.id)|\(printerHost)")
                .onAppear { openPrinterPageFor = nil }
            } else {
                ContentUnavailableView {
                    Label("Add the networks your printer should use", systemImage: "wifi")
                } description: {
                    Text("Pick one of the Wi-Fi networks this Mac can see. The app then opens the printer's Wi-Fi settings with the details filled in.")
                } actions: {
                    Button("Add Wi-Fi Network…") { addingNetwork = true }
                        .buttonStyle(.borderedProminent)
                }
            }
        }
        .sheet(isPresented: $addingNetwork) {
            AddNetworkSheet(existingSSIDs: Set(profiles.profiles.map(\.ssid))) { saved, password in
                profiles.save(saved, password: password)
                openPrinterPageFor = saved.id
                selection = saved.id
            }
        }
        .sheet(item: $editing) { profile in
            ProfileEditor(profile: profile) { saved, password in
                profiles.save(saved, password: password)
                selection = saved.id
            }
        }
        .onAppear {
            usb.start()
            browser.start()
        }
        .onChange(of: browser.printers) { _, found in
            if printerHost.isEmpty, let first = found.first { printerHost = first.host }
        }
    }
}

private struct PrinterSection: View {
    @ObservedObject var usb: USBPrinterMonitor
    @ObservedObject var browser: PrinterBrowser
    @Binding var host: String

    var body: some View {
        if usb.devices.isEmpty {
            Label("No Brother printer on USB", systemImage: "cable.connector")
                .foregroundStyle(.secondary)
        } else {
            ForEach(usb.devices) { device in
                Label {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(device.name)
                        Text(device.serial.map { "USB · serial \($0)" } ?? "Connected by USB")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                } icon: {
                    Image(systemName: "cable.connector").foregroundStyle(.green)
                }
            }
        }

        ForEach(browser.printers) { printer in
            Button { host = printer.host } label: {
                Label {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(printer.name)
                        Text(printer.host).font(.caption).foregroundStyle(.secondary)
                    }
                } icon: {
                    Image(systemName: host == printer.host ? "checkmark.circle.fill" : "wifi")
                }
            }
            .buttonStyle(.plain)
        }
        if browser.printers.isEmpty {
            Label("Looking for the printer on Wi-Fi…", systemImage: "wifi.exclamationmark")
                .foregroundStyle(.secondary)
        }

        TextField("Printer address, e.g. 192.168.1.40", text: $host)
            .textFieldStyle(.roundedBorder)
    }
}

private struct SwitchView: View {
    let profile: NetworkProfile
    let host: String
    let usbConnected: Bool
    let onEdit: () -> Void

    @State private var showingPrinterPage: Bool
    @State private var status = ""
    @State private var refillToken = 0
    @State private var copied: String?

    init(profile: NetworkProfile, host: String, usbConnected: Bool,
         openPrinterPage: Bool, onEdit: @escaping () -> Void) {
        self.profile = profile
        self.host = host
        self.usbConnected = usbConnected
        self.onEdit = onEdit
        _showingPrinterPage = State(initialValue: openPrinterPage && !host.isEmpty)
    }

    private var password: String { Keychain.password(for: profile.id) }

    private var printerURL: URL? {
        guard !host.isEmpty else { return nil }
        return URL(string: "http://\(host)/")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header
            if showingPrinterPage, let url = printerURL {
                HStack {
                    Text(status).font(.callout).fixedSize(horizontal: false, vertical: true)
                    Spacer()
                    Button("Fill in again") { refillToken += 1 }
                    Button("Close") { showingPrinterPage = false }
                }
                PrinterWebView(url: url, ssid: profile.ssid, password: password,
                               status: $status, refillToken: refillToken)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(.quaternary))
            } else {
                instructions
                Spacer()
            }
        }
        .padding(20)
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(profile.name.isEmpty ? profile.ssid : profile.name).font(.title2.bold())
                Text("Network name: \(profile.ssid) · \(profile.security.rawValue)")
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Button(copied == "ssid" ? "Copied" : "Copy name") { copy(profile.ssid, tag: "ssid") }
            if profile.security.needsPassword {
                Button(copied == "pw" ? "Copied" : "Copy password") { copy(password, tag: "pw") }
            }
            Button("Edit…", action: onEdit)
        }
    }

    @ViewBuilder
    private var instructions: some View {
        if printerURL == nil {
            GroupBox("The printer isn't on a network this Mac can see") {
                VStack(alignment: .leading, spacing: 8) {
                    if usbConnected {
                        Text("The printer is plugged in by USB, so it's ready for Brother's own first-time setup.")
                    }
                    Text("To switch networks, this app needs the printer to be on a Wi-Fi network your Mac is also on. If it isn't on any network yet, or it was moved somewhere its old network doesn't reach, get it onto one first. Any of these will work:")
                    Text("• **WPS:** press the WPS button on your router, then on the printer choose Network › WLAN › WPS/Push Button.")
                    Text("• **On the printer:** Network › WLAN › Setup Wizard, then choose the network and type the password with the arrow keys. Use **Copy password** above to check what to type.")
                    Text("• **Over USB:** Brother's wireless setup tool from support.brother.com (search for HL-3140CW).")
                    Text("Once it's online, choose it on the left or type its address. The printer's Network Configuration report shows the address.")
                    Button("Open Brother support") {
                        NSWorkspace.shared.open(URL(string: "https://support.brother.com/")!)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(6)
            }
        } else {
            GroupBox("Switch the printer to \(profile.ssid)") {
                VStack(alignment: .leading, spacing: 8) {
                    Text("1. Press **Open printer settings**. If asked to log in, use the printer's admin password. Many older Brother models ship with `access`.")
                    Text("2. Go to **Network › Wireless › Wireless (Personal)**. The network name and password fill in automatically.")
                    Text("3. Check the security type is **\(profile.security.rawValue)**, then press **Submit**.")
                    Text("The printer then leaves its current network and joins \(profile.ssid). From then on, anyone on \(profile.ssid) can add it on a Mac (System Settings › Printers & Scanners › Add Printer), and iPhones and iPads can print to it with AirPrint.")
                        .foregroundStyle(.secondary)
                    Text("If you're moving the printer, do this before you leave. It can only join a network it's in range of.")
                        .foregroundStyle(.secondary)
                    Button("Open printer settings") {
                        status = ""
                        showingPrinterPage = true
                    }
                    .buttonStyle(.borderedProminent)
                    .padding(.top, 4)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(6)
            }
        }
    }

    private func copy(_ value: String, tag: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(value, forType: .string)
        copied = tag
    }
}

struct ProfileEditor: View {
    @Environment(\.dismiss) private var dismiss
    @State private var draft: NetworkProfile
    @State private var password: String
    @State private var lookingUpPassword = false
    @State private var lookupMessage: String?
    let onSave: (NetworkProfile, String) -> Void
    /// Shown as a Back button when the editor is the second step of adding a network.
    let onBack: (() -> Void)?

    init(profile: NetworkProfile, onSave: @escaping (NetworkProfile, String) -> Void,
         onBack: (() -> Void)? = nil) {
        _draft = State(initialValue: profile)
        _password = State(initialValue: Keychain.password(for: profile.id))
        self.onSave = onSave
        self.onBack = onBack
    }

    private func useMacPassword() {
        lookingUpPassword = true
        lookupMessage = nil
        let ssid = draft.ssid
        DispatchQueue.global(qos: .userInitiated).async {
            let found = WiFiScanner.passwordSavedOnMac(for: ssid)
            DispatchQueue.main.async {
                lookingUpPassword = false
                if let found {
                    password = found
                    lookupMessage = "Filled in from this Mac's saved networks."
                } else {
                    lookupMessage = "This Mac has no saved password for that network, or access wasn't allowed. Type it in instead."
                }
            }
        }
    }

    private var canSave: Bool {
        !draft.ssid.trimmingCharacters(in: .whitespaces).isEmpty
            && (!draft.security.needsPassword || password.count >= 8)
    }

    var body: some View {
        Form {
            TextField("Label (e.g. Home, Office)", text: $draft.name)
            TextField("Network name (SSID)", text: $draft.ssid)
            Picker("Security", selection: $draft.security) {
                ForEach(NetworkProfile.Security.allCases) { Text($0.rawValue).tag($0) }
            }
            if draft.security.needsPassword {
                SecureField("Wi-Fi password (8+ characters)", text: $password)
                Button(lookingUpPassword ? "Asking macOS…" : "Use the password this Mac has saved") {
                    useMacPassword()
                }
                .disabled(lookingUpPassword || draft.ssid.trimmingCharacters(in: .whitespaces).isEmpty)
                if let lookupMessage {
                    Text(lookupMessage).font(.caption).foregroundStyle(.secondary)
                }
            }
            Text("The HL-3140CW only joins 2.4 GHz networks and can't use WPA3-only security. A router in WPA2/WPA3 mixed mode works.")
                .font(.caption).foregroundStyle(.secondary)
        }
        .formStyle(.grouped)
        .frame(width: 440)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                if let onBack {
                    Button("Back", action: onBack)
                } else {
                    Button("Cancel") { dismiss() }
                }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button(onBack == nil ? "Save" : "Save and Open Printer Settings") {
                    onSave(draft, password)
                    dismiss()
                }
                .disabled(!canSave)
            }
        }
    }
}
