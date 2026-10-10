# Printer Wi-Fi Switcher

A small Mac app for moving a Brother HL-3140CW between Wi-Fi networks.

## What it does

- **Saves your networks.** Add Home, Office and so on, each with its network name,
  security type and password. Passwords are stored in your Mac's Keychain.
- **Detects the printer over USB.** Any Brother device plugged in by USB shows up
  in the sidebar, live.
- **Finds the printer on Wi-Fi.** Uses Bonjour to find it, or you can type its address.
- **Switches the printer's network.** Opens the printer's own settings page inside
  the app. When you reach the Wi-Fi form, it fills in the network name and password.
  You check the form and press Submit.

## What it can't do, and why

- **The printer can only be on one network at a time.** The HL-3140CW stores one
  wireless setup. "Multiple networks" here means saved networks you switch between.
- **It doesn't send Wi-Fi settings over the USB cable.** Brother's USB setup uses a
  private protocol that Brother has never documented. Guessing at it could leave the
  printer misconfigured. So the app makes the switch through the printer's settings
  page, which needs the printer to be on a network your Mac is also on.
  - **If you're moving the printer**, switch it *before* you move it.
  - **If it's already somewhere it can't reach any network it knows**, get it onto
    one first. The app shows three ways: WPS, the printer's own menu, or Brother's
    USB setup tool. Then switch normally from then on.
- **2.4 GHz only, no WPA3-only networks.** That's a limit of the printer itself.
  A router in WPA2/WPA3 mixed mode is fine.

## Build it

You need Xcode, or the free Command Line Tools (`xcode-select --install`).

```bash
cd printer-wifi-switcher
./build.sh
open "build/Printer Wi-Fi Switcher.app"
```

The first time it runs, macOS asks to let it find devices on your local network.
Allow this, or it can't find the printer. If it asks about Keychain access, choose
**Always Allow**.

The app is signed only for your own Mac. If macOS still blocks it, right-click the
app and choose **Open**.

## Use it

1. Press **+** and add each Wi-Fi network you want the printer to use.
2. With the printer on a network your Mac is also on, check it shows in the
   sidebar, or type its address.
3. Select a saved network and press **Open printer settings**.
4. Log in if asked. On many older Brother models the default password is `access`.
5. Go to **Network › Wireless › Wireless (Personal)**. The name and password fill in
   and are outlined in green. Check the security type, then press **Submit**.

The printer restarts its Wi-Fi and joins the new network. If the fields don't fill
(firmware pages differ), use **Copy name** and **Copy password**, then paste.
