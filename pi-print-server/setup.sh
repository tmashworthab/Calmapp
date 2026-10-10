#!/bin/bash
# Turns a Raspberry Pi into a print server for the Brother HL-3140CW (or any
# AirPrint printer on the same network), reachable from anywhere through Tailscale.
#
# Run it on the Pi as your normal user:   ./setup.sh
# It is safe to run again if something fails part-way.
set -euo pipefail

QUEUE="Brother"
WEB_PORT=8631
TAILSCALE_NAME="printpi"
HERE="$(cd "$(dirname "$0")" && pwd)"

step() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

if [ "$(id -u)" -eq 0 ]; then
    echo "Run this as your normal user, not with sudo. It asks for sudo itself when needed."
    exit 1
fi

step "Installing the printing software (on a first-generation Pi this can take 20 minutes or more)"
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y cups cups-filters cups-client avahi-daemon python3 curl
sudo usermod -aG lpadmin "$USER"
sudo systemctl enable --now cups avahi-daemon
# Let other computers (at home, or over Tailscale) print through this Pi.
sudo cupsctl --share-printers --remote-any

step "Looking for the printer on the network"
URI=""
for attempt in 1 2 3 4 5 6; do
    if command -v driverless >/dev/null; then
        URI="$(driverless 2>/dev/null | grep -i -m1 brother || true)"
    fi
    if [ -z "$URI" ]; then
        URI="$(sudo lpinfo --include-schemes dnssd -v 2>/dev/null | awk 'tolower($0) ~ /brother/ { print $2; exit }' || true)"
    fi
    [ -n "$URI" ] && break
    echo "  Not found yet. Trying again in 10 seconds… ($attempt of 6)"
    sleep 10
done
if [ -z "$URI" ]; then
    cat <<EOF

Couldn't find the printer. Check that:
  • the printer is switched on and connected to Wi-Fi, and
  • the Pi's network cable goes into the router whose Wi-Fi the printer is on.
Then run ./setup.sh again.
EOF
    exit 1
fi
echo "  Found: $URI"

step "Adding the printer as \"$QUEUE\""
if ! sudo lpadmin -p "$QUEUE" -E -v "$URI" -m "driverless:$URI" 2>/dev/null; then
    sudo lpadmin -p "$QUEUE" -E -v "$URI" -m everywhere
fi
sudo lpadmin -p "$QUEUE" -o printer-is-shared=true
sudo lpadmin -p "$QUEUE" -o PageSize=A4 2>/dev/null || true
sudo lpadmin -d "$QUEUE"
sudo cupsenable "$QUEUE"
sudo cupsaccept "$QUEUE"

step "Installing the print web page"
sudo install -m 755 "$HERE/printweb.py" /usr/local/bin/printweb.py
sudo tee /etc/systemd/system/printweb.service >/dev/null <<EOF
[Unit]
Description=Home printer web page
After=network-online.target cups.service
Wants=network-online.target

[Service]
ExecStart=/usr/bin/python3 /usr/local/bin/printweb.py --queue $QUEUE --port $WEB_PORT
Restart=on-failure
DynamicUser=yes
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now printweb
sudo systemctl restart printweb

step "Installing Tailscale (the secure link for printing from anywhere)"
if ! command -v tailscale >/dev/null; then
    curl -fsSL https://tailscale.com/install.sh | sh
fi
if ! tailscale version >/dev/null 2>&1; then
    cat <<EOF

Tailscale won't run on this Pi, so printing from away isn't set up yet.
Printing at home already works: open http://$(hostname).local:$WEB_PORT
Copy everything above and send it to Claude to sort out the Tailscale step.
EOF
    exit 1
fi
echo
echo "A link will appear below. Open it on your Mac and sign in to Tailscale (a free account is fine)."
echo "This step waits until you've signed in."
sudo tailscale up --hostname="$TAILSCALE_NAME"

cat <<EOF

All done.

  Print page, at home:            http://$(hostname).local:$WEB_PORT
  Print page, anywhere (Tailscale on): http://$TAILSCALE_NAME:$WEB_PORT

  To print from a Mac's normal Print menu, add a printer by IP address:
    Address:  $TAILSCALE_NAME
    Protocol: Internet Printing Protocol - IPP
    Queue:    printers/$QUEUE
EOF
