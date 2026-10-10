# Print from anywhere with a Raspberry Pi

The Pi sits at home, plugged into your router, and passes print jobs to the
Brother printer over Wi-Fi. **Tailscale**, a free secure-link app, lets your
Mac and phone reach the Pi from anywhere, without opening your home network to
the internet.

No monitor or keyboard is needed. You set up the memory card on your Mac and do
everything else from Terminal.

## What you need

- **The Pi and a micro-USB power supply** (5 V, at least 1 A; a good phone charger works).
- **A network cable** from the Pi to your router. The first Pi has no Wi-Fi.
  - If your Pi has **no network socket** (Model A or A+), you also need a USB Wi-Fi adapter. Ask Claude about this first.
- **An SD card**, 8 GB or more. The original Model B takes a full-size SD card; the B+ takes microSD.
- **A USB-C SD card reader** for your Mac. The MacBook Air has no card slot.

## 1. Set up the SD card on your Mac

1. Download and install **Raspberry Pi Imager** from raspberrypi.com/software.
2. Put the SD card in the reader and plug it into your Mac.
3. In Imager:
   - **Device:** Raspberry Pi 1 (the oldest model listed).
   - **Operating system:** Raspberry Pi OS (other) › **Raspberry Pi OS Lite (32-bit)**.
   - **Storage:** your SD card.
4. When asked whether to customise settings, choose **Edit settings** (or the customisation step in newer Imagers):
   - **Hostname:** `printpi`
   - **Username and password:** choose them and write them down.
   - **Wireless LAN:** leave off.
   - **Locale:** your time zone and keyboard.
   - **Services:** turn on **SSH** with **password authentication**.
5. Write the card. This erases it. When it finishes, take it out.

## 2. Start the Pi

1. Put the card in the Pi.
2. Plug the network cable into the Pi and into **the router whose Wi-Fi the printer is on**. Today that's the Homebase Megastore router.
   - Once that router is in access point mode (see the main README), either router works.
3. Plug in the power. The first start on a first-generation Pi takes 5–10 minutes.

## 3. Copy the setup files over and run them

On your Mac, in Terminal (swap `YOURNAME` for the username you chose):

```bash
cd Calmapp
git pull
scp -r pi-print-server YOURNAME@printpi.local:
ssh YOURNAME@printpi.local
```

- The first time, type `yes` to trust the Pi, then enter the password you chose.
- If `printpi.local` isn't found, wait a few more minutes and try again.

You're now typing on the Pi. Run:

```bash
cd pi-print-server
./setup.sh
```

It installs everything, finds the printer and adds it. Near the end it shows a
link: open it on your Mac and sign in to Tailscale (a free personal account).
On a first-generation Pi, the whole thing can take half an hour.

## 4. Set up your Mac and phone

Install **Tailscale** on each device you'll print from: the Mac App Store
version for the Mac, and the App Store version for an iPhone or iPad. Sign in
with the same account.

**Print from a browser (any device):** with Tailscale on, open
`http://printpi:8631`. Choose a file, then tap **Print**. Bookmark it, or on an
iPhone use **Share › Add to Home Screen**.

**Print from the Mac's normal Print menu:**

1. Open **System Settings › Printers & Scanners › Add Printer, Scanner or Fax…**.
2. Click the **IP** tab (the globe icon). Enter:
   - **Address:** `printpi`
   - **Protocol:** Internet Printing Protocol – IPP
   - **Queue:** `printers/Brother`
3. Name it "Home Printer (anywhere)".

It works whenever Tailscale is on, at home or away.

## Letting other people print

In the Tailscale admin console, find `printpi` under **Machines**. Choose
**Share…** and invite them. They install Tailscale and open
`http://printpi:8631`.

## Good to know

- The Pi must stay on, plugged into the router.
- The page accepts PDFs, JPG and PNG photos, and plain text. Save Word or Pages documents as PDF first.
- The first-generation Pi is slow. A long PDF can take a minute or two to start printing.
- If you move the printer to another Wi-Fi network with the switcher app, the Pi must be plugged into that network's router too.
