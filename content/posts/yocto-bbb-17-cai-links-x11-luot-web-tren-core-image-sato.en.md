---
title: '[Yocto-BBB] 17. Installing Links-X11, browsing the web on core-image-sato'
date: '2026-01-17T06:34:00+07:00'
lastmod: '2025-12-04T10:20:03+07:00'
slug: yocto-bbb-17-cai-links-x11-luot-web-tren-core-image-sato
url: /en/2026/01/17/yocto-bbb-17-cai-links-x11-luot-web-tren-core-image-sato/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 17
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: 'Adding the links-x11 browser to core-image-sato on the BeagleBone Black, powering a screen and USB wifi at the same time, fixing DNS name resolution, and browsing with and without the GUI.'
wp_id: 1744
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
The other day I installed Android 6 on the Beaglebone Black and saw a Browser app, but it could not browse the web. Newer boards such as the FRDM i.MX93 support Chromium well, but that certainly requires much better hardware.

So I looked for alternatives and found that only Links works well with Yocto. And to make it pleasant to look at, I based it on an image with a GUI. Fixing Wayland Weston already wore me out, so I based it on core-image-sato. Luckily there is even a Links-X11 recipe, which makes compatibility much simpler.

## 1. Yocto build configuration

### 1.1 Configure yocto

{{% details title="local.conf" closed="true" %}}

```bash
PACKAGE_CLASSES = "package_ipk"

DISTRO_FEATURES:append = " systemd pam x11"
VIRTUAL-RUNTIME_init_manager = "systemd"
DISTRO_FEATURES_BACKFILL_CONSIDERED += "sysvinit"
VIRTUAL-RUNTIME_initscripts = ""

IMAGE_INSTALL:append = " libxcursor evtest libinput xkeyboard-config weston-examples adwaita-icon-theme hicolor-icon-theme udev adwaita-icon-theme-cursors libinput-bin "

IMAGE_INSTALL:append = " kernel-modules kernel-module-evdev "

KERNEL_MODULE_AUTOLOAD:append = " evdev usbhid "
```

{{% /details %}}

{{% details title="core-image-sato.bbappend" closed="true" %}}

```bash
SUMMARY = "My custom Linux Image"
IMAGE_INSTALL = "packagegroup-core-boot ${CORE_IMAGE_EXTRA_INSTALL}"
IMAGE_LINGUAS = " "
LICENSE = "MIT"
inherit core-image

inherit extrausers
#Change root password to test
PASSWD = "\$5\$y9Aeg5ctwntRHo/g\$CAKtoTfQg7VPGfVAMGo5ZG/0GJLn3AD0JdoQ.i0dDFC"
EXTRA_USERS_PARAMS = "\
    usermod -p '${PASSWD}' root; \
    "

#Network
IMAGE_INSTALL:append = " \
    kernel-module-rtl8188eu \
    linux-firmware \
    dhcpcd \
    iw \
    wpa-supplicant \
    wireless-regdb-static \
"
#Link Browser
IMAGE_INSTALL:append = " \
    links-x11 \
    ca-certificates \
    tzdata \
    iputils-ping \
"

KERNEL_MODULE_AUTOLOAD:append = " \
    rtl8188eu \
    "
```

{{% /details %}}

Here I use systemd to make debugging services easier, and enable usb in local.conf

For core-image-sato I connect through a usb wifi adapter, so I add the same packages as in post [Yocto-BBB 7](/en/2025/08/09/yocto-bbb-7-them-driver-cho-usb-wifi/); if you use Ethernet, you can add the packages from post [Yocto-BBB 6](/en/2025/08/02/yocto-bbb-6-ssh-toi-board-qua-ethernet/).

To use the Links Browser, besides the base package we also need

```bash
ca-certificates \ Used for HTTPS (TLS).
tzdata \ Time zone data (Locales, ssl/time)
iputils-ping \ Provides the ping command for testing
```

### 1.2 Build and flash

This is probably familiar if you have read this far

```bash
bitbake core-image-sato
```

Then use bmaptool to flash the image in the output folder

## 2. Boot and network connection

### 2.1 Connecting the screen, mouse and USB wifi

This post uses an image with a GUI, so I plug in an external screen through micro HDMI, and also plug in the UART debug so I can use commands over Serial

One note: with both the screen and the USB Wifi plugged in, the Beaglebone Black cannot supply enough power.

So I power the screen from an external supply, and use a usb hub on the Beaglebone Black so I can plug in both the usb wifi and a mouse (the screen is not plugged into a usb port, so touch doesn't work and an external mouse is needed)

### 2.2 Network connection

I use USB wifi, so connecting to the network is the same as in post [Yocto-BBB 7](/en/2025/08/09/yocto-bbb-7-them-driver-cho-usb-wifi/)

```bash
ip link set wlan0 up
iw wlan0 scan | grep SSID
wpa_passphrase "iPhone" "12345689" > /etc/wpa_supplicant.conf
wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant.conf
dhcpcd wlan0
```

Depending on your network, set the wpa_passphrase part accordingly. My network is SSID = "iPhone", Pass = "12345689"

However, in practice, if you try to ping google.com here, it fails. In earlier posts I only went as far as getting an IP for the board and pinging within the LAN. So SSH worked, but I never actually reached the Internet

```bash
root@beaglebone:~# ping -c 3 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
From 169.254.218.80 icmp_seq=1 Destination Host Unreachable
From 169.254.218.80 icmp_seq=2 Destination Host Unreachable
From 169.254.218.80 icmp_seq=3 Destination Host Unreachable

--- 8.8.8.8 ping statistics ---
3 packets transmitted, 0 received, +3 errors, 100% packet loss, time 2026ms
pipe 3
root@beaglebone:~# ping -c 3 google.com
ping: google.com: Temporary failure in name resolution
root@beaglebone:~#
```

We see the "name resolution" error --> it is related to DNS

### 2.3 Fixing the DNS error

The fix is quite simple.

```bash
echo 'nameserver 8.8.8.8' > /etc/resolv.conf
```

Actually I learned about this error when I could not connect to wifi on the FRDM i.MX93 board. It had the same DNS error, with the same fix :vv

## 3. Using Links with and without the GUI

Since Links-X11 is a package with proper X11 support, it is also installed on sato as an app.

You can open the Links app on the screen, or type it in the terminal to look like a proper Linux user :vv

Use the terminal app on sato, with a keyboard plugged into the hub as well. It won't work over the uart debug !!

```bash
links -g https://embeddedlinux.blog //With images - graphical
links https://embeddedlinux.blog // Text only
```

Links-X11 does not support modern Javascript + CSS interfaces and backends well; if your site is just html it displays smoothly with no problem

It also does not support Vietnamese very well yet

You can watch the demo video below

{{< youtube H_GVwxp19m8 >}}
