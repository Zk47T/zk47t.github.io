---
title: '[Yocto-MX93] 2. Connecting to wifi, trying Chromium'
date: '2026-02-07T07:34:09+07:00'
lastmod: '2026-02-09T21:49:17+07:00'
slug: yocto-mx93-2-ket-noi-wifi-test-thu-chromium
url: /en/2026/02/07/yocto-mx93-2-ket-noi-wifi-test-thu-chromium/
categories:
- FRDM-i.MX93
- Yocto
tags:
- FRMD-i.MX93
- Linux
- NXP
- Yocto
series:
- Yocto-MX93
series_order: 2
boards:
- FRDM i.MX93
image: /uploads/2025/11/screenshot-from-2025-11-18-22-03-24.png
description: 'Adding meta-chromium and chromium-ozone-wayland to the i.MX93 image, loading the moal wifi module, configuring mlan0 with wpa_supplicant, fixing DNS, and browsing with Chromium.'
wp_id: 1659
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
One nice thing about using the vendor's full-featured image is that adding things is quite simple, and there is plenty of documentation from the vendor too

## 1. Adding Chromium to the build

First, as I said in the previous post, to avoid editing local.conf and bblayers and then having those 2 files reset when you run source, we first run the following command to initialise the build environment

```cpp
MACHINE=imx93frdm DISTRO=fsl-imx-xwayland source sources/meta-imx-frdm/tools/imx-frdm-setup.sh -b frdm-imx93
```

We add the meta-chromium layer to bblayers.conf

```bash
BBLAYERS += "${BSPDIR}/sources/meta-browser/meta-chromium"
```

We install chromium-ozone-wayland into the current image in local.conf

```bash
CORE_IMAGE_EXTRA_INSTALL += "chromium-ozone-wayland"
```

And rebuild

```bash
bitbake imx-full-image
```

Building Chromium is extremely resource hungry. I once built Chromium for Windows 10, and it took 8 hours at 100% CPU (14 cores 20 threads plus 32Gb RAM, 64Gb swap, and 300Gb of disk). Chromium on Arm is not much lighter.

If you only want to connect to wifi, you can skip to part 2 and ignore Chromium.

## 2. Connecting to wifi

### 2.1 Load the moal module

This image already has the wifi module; we modprobe it

```bash
modprobe moal mod_para=nxp/wifi_mod_para.conf
```

Here NXP does not use the name wlan0 for wifi but mlan0; you can check the output of this command before and after modprobing the module

```bash
ls -al /sys/bus/net
```

### 2.2 Edit the wifi configuration

Edit the interface config and set up mlan0 (as suggested, we bring uap0 down to avoid conflicts)

```bash
ifconfig mlan0 up
# (Optional) ensure AP side not interfering:
ifconfig uap0 down 2>/dev/null || true
```

Next we configure the wifi, quite similar to what I did with the USB wifi adapter before.

```bash
cat >/etc/wpa_supplicant.conf <<'EOF'
ctrl_interface=/var/run/wpa_supplicant
ctrl_interface_group=0
update_config=1

network={
    ssid="YourHotspotSSID"
    key_mgmt=WPA-PSK
    psk="YourHotspotPassword"
}
EOF
mkdir -p /var/run/wpa_supplicant
```

### 2.3 Connecting to the Internet

We connect to the network

```bash
killall wpa_supplicant 2>/dev/null || true
wpa_supplicant -B -i mlan0 -D nl80211 -c /etc/wpa_supplicant.conf
```

Get an IP for it

```bash
udhcpc -i mlan0
```

Strictly speaking, the vendor's guide ends here, but I still could not get online. After more digging, the problem was DNS; we run one more command

```bash
echo 'nameserver 8.8.8.8' > /etc/resolv.conf
```

That works; now you can reach the Internet.

## 3. Browsing the web with Chromium

For now I disable the gpu so Chromium works properly; I will probably need to research a proper fix

```bash
chromium --no-sandbox --disable-gpu https://embeddedlinux.blog
```

Here is a small demo

{{< youtube 8f_mB2YBbpY >}}
