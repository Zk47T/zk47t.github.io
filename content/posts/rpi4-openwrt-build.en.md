---
title: '[OpenWrt-RPi4] 1. Building an OpenWrt image for the Raspberry Pi 4'
date: '2026-11-22T22:30:00+07:00'
lastmod: '2026-11-22T22:30:00+07:00'   # = date: bài hẹn giờ, không để git (ngày merge) làm "Cập nhật" sớm hơn ngày đăng
slug: rpi4-openwrt-build
authors:
- tuan
categories:
- OpenWrt
- Raspberry Pi
tags:
- OpenWrt
- RaspberryPi
series:
- OpenWrt-RPi4
series_order: 1
boards:
- Raspberry Pi 4
image: /uploads/2026/11/openwrt-rpi4-menuconfig-2.webp
description: 'Build OpenWrt from source for the Raspberry Pi 4 (bcm2711), preconfigure a static IP on eth0 so you can SSH and SCP into the board, then flash the image to an SD card with dd.'
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
## Goal

- Build an **OpenWrt** image for the **Raspberry Pi 4** (`bcm2711`).
- Bring up the Ethernet interface so we can use **SSH** and **SCP**.

For an introduction to OpenWrt, have a look here: [Introduction to OpenWrt](https://www.tiktok.com/@embedded_knowledge/photo/7460465376422333703)

---

## 1. Clone the source code

We clone the source code straight from the official OpenWrt repository:

```bash
git clone https://github.com/openwrt/openwrt.git
```

Then check out a separate branch to work on:

```bash
cd openwrt
git checkout -b develop/pi4
```

---

## 2. Update feeds

Run:

```bash
./scripts/feeds update -a && ./scripts/feeds install -a
```

---

## 3. Add a config for the Ethernet interface

OpenWrt uses the file `/etc/config/network` to configure network interfaces.

In the source tree, create this file at:

```bash
cd package/base-files/files/etc
mkdir -p config
cd config
touch network
vim network
```

If you want the interface to be `eth0` with the IP `192.168.1.42`, the config looks like this:

```text
config interface 'wan'
    option device 'eth0'
    option proto 'static'
    option ipaddr '192.168.1.42'
    option netmask '255.255.255.0'
    option broadcast '192.168.1.255'
```

Where:

- **interface**: `wan`
- **device** (physical interface): `eth0`
- **protocol**: `static`
- **IP address**: `192.168.1.42`
- **netmask**: `255.255.255.0`
- **broadcast**: `192.168.1.255`

> **Note:** set the IP, netmask and broadcast to match your own network.
>
> OpenWrt 21.02 and later use `option device`. Older releases use `option ifname`, which newer releases still accept but is deprecated.

---

## 4. Run menuconfig

From the OpenWrt root directory, run:

```bash
make menuconfig
```

Then select the Raspberry Pi 4 target and disable the firewall as shown in the screenshots:

- **Target System**: `Broadcom BCM27xx`
- **Subtarget**: `BCM2711 boards (64 bit)`
- **Target Profile**: Raspberry Pi 4B (64bit)
- The firewall is the `firewall4` package under **Base system**; deselect it.

![make menuconfig settings for the Raspberry Pi 4 (1/2)](/uploads/2026/11/openwrt-rpi4-menuconfig-1.webp)

![make menuconfig settings for the Raspberry Pi 4 (2/2)](/uploads/2026/11/openwrt-rpi4-menuconfig-2.webp)

---

## 5. Build OpenWrt

Go back to the OpenWrt root directory:

```bash
cd <openwrt>
```

Then build:

```bash
make -j$(nproc)
```

The first build can take around **30 - 45 minutes**. The actual time depends on your build machine and your network speed.

When the build finishes, the images are in:

```text
bin/targets/bcm27xx/bcm2711/
```

The image we need is:

```text
openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img.gz
```

---

## 6. Flash the image to the SD card

### 6.1. Find the SD card device

Plug the SD card into your PC, then use:

```bash
lsblk
```

to find the device that belongs to the SD card. For example:

```text
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0   512G  0 disk
├─nvme0n1p1
└─nvme0n1p2

sdb           8:16   1    32G  0 disk
├─sdb1
└─sdb2
```

In this example, `/dev/sdb` is the whole SD card device.

> **Careful:** `dd` writes directly to the device. Picking the wrong device can wipe data on another disk.

### 6.2. Decompress the OpenWrt image

The image currently looks like this:

```text
openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img.gz
```

Decompress it:

```bash
gzip -d openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img.gz
```

After decompressing you get:

```text
openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img
```

### 6.3. Write the image to the SD card

Use `dd`:

```bash
sudo dd if=openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img \
        of=/dev/<device> \
        bs=4M \
        status=progress \
        conv=fsync
```

For example, if the SD card is `/dev/sdb`:

```bash
sudo dd if=openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img \
        of=/dev/sdb \
        bs=4M \
        status=progress \
        conv=fsync
```

When it finishes:

```bash
sync
```

---

## 7. Boot the Raspberry Pi 4

Put the SD card into the Raspberry Pi 4 and power the board on.

Once OpenWrt has booted, since we configured the Ethernet interface `eth0` with the IP `192.168.1.42`, we can reach the board over SSH:

```bash
ssh root@192.168.1.42
```

After logging in over SSH you get the OpenWrt shell:

```text
BusyBox v1.36.1 (2024-11-16 18:57:58 UTC) built-in shell (ash)

  _______                     ________        __
 |       |.-----.-----.-----.|  |  |  |.----.|  |_
 |   -   ||  _  |  -__|     ||  |  |  ||   _||   _|
 |_______||   __|_____|__|__||________||__|  |____|
          |__| W I R E L E S S   F R E E D O M
 -----------------------------------------------------
 OpenWrt SNAPSHOT, r0+28105-afffcd09e5
 -----------------------------------------------------
=== WARNING! =====================================
There is no root password defined on this device!
Use the "passwd" command to set up a new password
in order to prevent unauthorized SSH logins.
--------------------------------------------------
root@OpenWrt:~#
```

> **Note:** as the warning above says, the board has no root password yet and the firewall is disabled. Only connect it to a lab network, and set a password with `passwd` right after your first SSH login.
