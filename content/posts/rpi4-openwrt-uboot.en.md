---
title: '[OpenWrt-RPi4] 2. Bringing up U-Boot on an OpenWrt image for the Raspberry Pi 4'
date: '2026-11-22T22:31:00+07:00'
lastmod: '2026-11-22T22:31:00+07:00'   # = date: bài hẹn giờ, không để git (ngày merge) làm "Cập nhật" sớm hơn ngày đăng
slug: rpi4-openwrt-uboot
authors:
- tuan
categories:
- OpenWrt
- BootProcess
- Raspberry Pi
tags:
- OpenWrt
- U-Boot
- RaspberryPi
series:
- OpenWrt-RPi4
series_order: 2
boards:
- Raspberry Pi 4
image: /uploads/2026/11/openwrt-rpi4-uboot-boot-log.webp
description: 'Put U-Boot between the Raspberry Pi firmware and the OpenWrt Linux kernel on a Pi 4: edit config.txt, create a separate defconfig and device tree, write bootargs and bootcmd by hand instead of bootstd, and fix the MMC alias so U-Boot finds the SD card.'
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
## Goal

- Add **U-Boot** to the **OpenWrt** boot flow on the **Raspberry Pi 4** (`bcm2711`), sitting between the Raspberry Pi firmware (`start4.elf` / `config.txt`) and the Linux kernel (`kernel8.img`).

## 1. Build an OpenWrt image for the Raspberry Pi 4

For this part, see my [previous post](/en/posts/rpi4-openwrt-build/).

---

## 2. Raspberry Pi 4 boot files

After booting into the board:

```bash
cd /boot
ls
```

You can see these files:

```text
COPYING.linux
LICENCE.broadcom
bcm2711-rpi-4-b.dtb
bcm2711-rpi-400.dtb
bcm2711-rpi-cm4.dtb
config.txt
cmdline.txt
distroconfig.txt
fixup4.dat
fixup4cd.dat
fixup4x.dat
kernel8.img
overlays/
partuuid.txt
start4.elf
start4cd.elf
start4x.elf
```

These are the files the Raspberry Pi 4 uses during boot.

---

## 3. The default Raspberry Pi 4 boot flow

The first important point: **the default Raspberry Pi 4 boot flow does not use U-Boot.**

Default flow:

```text
BOOTROM
   │
   ▼
start4.elf
   │
   ▼
config.txt
   │
   ├── Load kernel
   ├── Load Device Tree
   │
   ▼
Linux Kernel
   │
   ▼
OpenWrt
```

Where:

- **BOOTROM**: the first boot code of the Raspberry Pi. On the Pi 4, the BOOTROM loads the bootloader stored in the SPI EEPROM on the board, and that bootloader reads the SD card and loads `start4.elf` (the Pi 4 does not use `bootcode.bin` like earlier models).
- **start4.elf**: the Raspberry Pi 4 firmware/bootloader.
- **config.txt**: an important config file that decides what the firmware loads next.
- **kernel8.img**: the 64-bit Linux kernel.
- **.dtb**: the Device Tree Blob.

---

## 4. OpenWrt's default `config.txt`

OpenWrt's default `config.txt` contains almost no special boot settings:

```text
################################################################################
# Bootloader configuration - config.txt
################################################################################
# For overclocking and various other settings, see:
# https://www.raspberrypi.com/documentation/computers/config_txt.html
################################################################################
# OpenWrt config
include distroconfig.txt

[all]
# Place your custom settings here
```

So the Raspberry Pi keeps using its default settings. One important setting is:

```text
arm_64bit=1
```

The Raspberry Pi 4 boots in 64-bit ARM mode, so the default kernel is `kernel8.img`.

The flow is then:

```text
start4.elf
    │
    ▼
config.txt
    │
    ├── arm_64bit=1
    │
    ▼
kernel8.img
    │
    ├── bcm2711-rpi-4-b.dtb
    │
    ▼
Linux Kernel
```

---

## 5. Adding U-Boot to the boot flow

Now the goal is to put U-Boot between the Raspberry Pi firmware and the Linux kernel. We do that by editing `config.txt` so the firmware loads `u-boot.bin` instead of loading the Linux kernel directly.

Add to `config.txt`:

```text
enable_uart=1
arm_64bit=1
kernel=u-boot.bin
device_tree=bcm2711-rpi-4-b_owrt.dtb
```

What each line does:

- `enable_uart=1`: enables the UART so we can debug U-Boot.
- `arm_64bit=1`: boots the ARM cores in 64-bit mode.
- `kernel=u-boot.bin`: instead of `kernel8.img`, the Raspberry Pi firmware loads `u-boot.bin`.
- `device_tree=bcm2711-rpi-4-b_owrt.dtb`: uses the Device Tree made for U-Boot.

New boot flow:

```text
BOOTROM
   │
   ▼
start4.elf
   │
   ▼
config.txt
   │
   ├── kernel=u-boot.bin
   └── device_tree=bcm2711-rpi-4-b_owrt.dtb
   │
   ▼
U-Boot
   │
   ├── Load kernel
   ├── Load Device Tree
   │
   ▼
Linux Kernel
   │
   ▼
OpenWrt
```

From the moment U-Boot is loaded, U-Boot is in charge of how the Linux kernel gets loaded.

---

## 6. Build U-Boot

With the new boot flow in place, the next step is to build U-Boot so that it can load the Pi 4 Linux kernel.

Clone the source:

```bash
git clone https://github.com/u-boot/u-boot.git
cd u-boot
```

Create a separate working branch from the `v2026.07` tag:

```bash
git checkout -b rpi4-openwrt v2026.07
```

> **Note:** branch off a release tag rather than `master`. Since September 2026, U-Boot `master` has removed `arch/arm/dts/bcm2711-rpi-4-b.dts` and dropped the `CONFIG_DEFAULT_DEVICE_TREE` line from `rpi_4_defconfig`, so sections 7 and 8.1 cannot be followed there. The `v2026.07` and `v2026.10` tags still have the file. I worked on `2026.07-rc1`.

---

## 7. The two U-Boot files that matter

There are two original Raspberry Pi 4 files to care about:

- `configs/rpi_4_defconfig`
- `arch/arm/dts/bcm2711-rpi-4-b.dts`

I don't want to edit the originals directly. Instead, I create two separate files:

- `configs/rpi_4_owrt_defconfig`
- `arch/arm/dts/bcm2711-rpi-4-b_owrt.dts`

You can copy them like this:

```bash
cd configs
cp rpi_4_defconfig rpi_4_owrt_defconfig
cd ../arch/arm/dts
cp bcm2711-rpi-4-b.dts bcm2711-rpi-4-b_owrt.dts
```

From here on, I handle the defconfig and the Device Tree in two separate sections.

---

## 8. U-Boot defconfig

### 8.1. Change the default Device Tree

`configs/rpi_4_owrt_defconfig` contains the line:

```text
CONFIG_DEFAULT_DEVICE_TREE="bcm2711-rpi-4-b"
```

This is the Device Tree U-Boot uses/builds. Since I created my own Device Tree `bcm2711-rpi-4-b_owrt.dts`, change it to:

```text
CONFIG_DEFAULT_DEVICE_TREE="bcm2711-rpi-4-b_owrt"
```

### 8.2. Disable Boot Standard

Another config that needs special attention:

```text
CONFIG_BOOTSTD_DEFAULTS=y
```

This is U-Boot's Boot Standard (`bootstd`). With `bootstd` enabled, U-Boot runs bootflow discovery to find a valid bootflow on the boot devices. Along the way, U-Boot may try boot methods such as `EFI`, `PXE`, `DHCP`...

OpenWrt, on the other hand, has its own boot layout (`kernel`, `Device Tree`, `root filesystem`). So if you keep `CONFIG_BOOTSTD_DEFAULTS=y`, you may hit errors like:

```text
Card did not respond to voltage select: 110
Can not persist EFI variable without system partition
bootflow NULL with efi_mgr
```

For this boot flow I don't use `bootstd`; instead I boot with hand-written `bootargs` and `bootcmd`. Replace `CONFIG_BOOTSTD_DEFAULTS=y` with:

```text
# CONFIG_BOOTSTD_DEFAULTS is not set
```

### 8.3. Configure `CONFIG_BOOTARGS`

Add:

```text
CONFIG_USE_BOOTARGS=y
CONFIG_BOOTARGS="console=tty1 console=ttyAMA0,115200 root=PARTUUID=c509a674-02 rootfstype=squashfs,ext4 rootwait"
```

`CONFIG_BOOTARGS` is the kernel command line passed to the Linux kernel.

When the Raspberry Pi boots without U-Boot, this lives in `/boot/cmdline.txt`. For example:

```text
console=tty1 console=serial0,115200 root=@ROOT@ rootfstype=squashfs,ext4 rootwait
```

But once U-Boot is in the boot flow, U-Boot does not use `cmdline.txt` the way the default Raspberry Pi boot flow does. So I pass the kernel command line directly through `CONFIG_BOOTARGS`.

`serial0` in `cmdline.txt` is the generic name for the Raspberry Pi's primary UART. When passing it through U-Boot, I write the real device name: OpenWrt's `distroconfig.txt` sets `dtoverlay=disable-bt` for the Pi 4, so the UART on GPIO 14/15 is the PL011, which Linux calls `ttyAMA0`.

### 8.4. The `root=@ROOT@` problem

In `cmdline.txt`, `@ROOT@` is eventually replaced with the `PARTUUID` of the partition holding the root filesystem. The catch is that the `PARTUUID` can change from image to image. Here I hardcoded it by booting OpenWrt on the board and checking:

```bash
cd /boot
cat cmdline.txt
```

Then take the matching `root=...` value and put it into `CONFIG_BOOTARGS`. For example, my image gives `root=PARTUUID=c509a674-02` (yours will be different):

```text
CONFIG_BOOTARGS="console=tty1 console=ttyAMA0,115200 root=PARTUUID=c509a674-02 rootfstype=squashfs,ext4 rootwait"
```

### 8.5. Configure `CONFIG_BOOTCOMMAND`

Next:

```text
CONFIG_USE_BOOTCOMMAND=y
CONFIG_BOOTCOMMAND="fatload mmc 0:1 ${kernel_addr_r} kernel8.img; fatload mmc 0:1 ${fdt_addr_r} bcm2711-rpi-4-b.dtb; booti ${kernel_addr_r} - ${fdt_addr_r}"
```

`CONFIG_BOOTCOMMAND` is the command U-Boot runs after the boot delay/countdown. Here U-Boot does 3 steps:

- **Load the kernel:**

  ```bash
  fatload mmc 0:1 ${kernel_addr_r} kernel8.img
  ```

  - `mmc 0:1`: partition 1 of MMC device 0.
  - `${kernel_addr_r}`: the RAM address the kernel is loaded to.
  - `kernel8.img`: the Linux kernel.

- **Load the Device Tree:**

  ```bash
  fatload mmc 0:1 ${fdt_addr_r} bcm2711-rpi-4-b.dtb
  ```

  U-Boot loads `bcm2711-rpi-4-b.dtb` to `${fdt_addr_r}`.

- **Boot Linux:**

  ```bash
  booti ${kernel_addr_r} - ${fdt_addr_r}
  ```

  - `${kernel_addr_r}`: the kernel address.
  - `-`: no initrd.
  - `${fdt_addr_r}`: the Device Tree address.
  - In other words: `booti <kernel address> - <device tree address>`.

### 8.6. The `kernel_addr_r` and `fdt_addr_r` addresses

You don't need to come up with these addresses yourself; they are in:

```text
board/raspberrypi/rpi/rpi.env
```

### 8.7. Enable the FAT commands for debugging

Since the Raspberry Pi boot partition is FAT, you can also enable:

```text
CONFIG_CMD_FAT=y
```

All the defconfig changes in section 8 are in commit [`17e57b1`](https://github.com/TuanTNT19/u-boot/commit/17e57b1975d804fe88e95885c168da4ca29ba7a9) on my [`develop/uboot-bringup-openwrt`](https://github.com/TuanTNT19/u-boot/commits/develop/uboot-bringup-openwrt) branch. The PARTUUID in the commit belongs to the image I had at the time; replace it with yours as in section 8.4.

---

## 9. The `bcm2711-rpi-4-b_owrt.dts` Device Tree

With the defconfig done, move on to the Device Tree at `arch/arm/dts/bcm2711-rpi-4-b_owrt.dts`.

### 9.1. The MMC problem

Without any further Device Tree changes, you may see this at boot:

```text
U-Boot 2026.07-rc1-00004-g33d676df8693 (Sep 01 2026 - 19:43:26 +0700)

DRAM:  1.9 GiB
RPI 4 Model B (0xb03115)
Core:  176 devices, 18 uclasses, devicetree: board
MMC:   mmc@7e300000: 0, mmc@7e340000: 1
Loading Environment from FAT... Card did not respond to voltage select! : -110
** Bad device specification mmc 0 **
```

You can see U-Boot initialising two MMC devices:

- `mmc0` → `0x7e300000`
- `mmc1` → `0x7e340000`

Why does `mmc 0` fail? In `CONFIG_BOOTCOMMAND` I use `fatload mmc 0:1 ...`, so U-Boot needs MMC device 0, but the Raspberry Pi 4 SD card is not there.

**Finding where the SD card is:**

Check `arch/arm/dts/bcm2711-rpi-4-b_owrt.dts` (or build `bcm2711-rpi-4-b_owrt.dtb` before making any changes and use `dtc` to dump it back to a `.dts` file):

```c
/* EMMC2 is used to drive the SD card */
```

`emmc2` is at `0x7e340000`, so the actual mapping is:

```text
SD card
   │
   ▼
emmc2
   │
   ▼
0x7e340000
   │
   ▼
MMC device 1
```

→ The SD card is on `mmc1`.

### 9.2. Fix it with a Device Tree alias

You can fix the MMC mapping with `aliases`. Add to the `.dts` file:

```dts
aliases {
    mmc0 = &emmc2;
    mmc1 = &sdhci;
};
```

Then:

```text
mmc0
 │
 └──> emmc2
       │
       └──> SD card
```

And `fatload mmc 0:1 ...` reaches the SD card.

See commit [`5a297f0`](https://github.com/TuanTNT19/u-boot/commit/5a297f0d06e092e46c0c761207d3c710b39b2e73).

---

## 10. U-Boot build script

You can add a small script to make building easier. For example:

```bash
./build.sh rpi_4_owrt_defconfig
```

See commit [`7ab72e1`](https://github.com/TuanTNT19/u-boot/commit/7ab72e1d28f24f836331802abd54bc2f7acd3053). The script only runs the commands below, so you can also type them by hand (you need the `aarch64-linux-gnu-` cross compiler; on Ubuntu the package is `gcc-aarch64-linux-gnu`):

```bash
make distclean
make rpi_4_owrt_defconfig
make -j$(nproc) CROSS_COMPILE=aarch64-linux-gnu-
mkdir -p out
cp u-boot.bin out/
```

My script also passes `CC=aarch64-linux-gnu-gcc-10` because my machine uses gcc 10; use whichever version you have.

---

## 11. Build U-Boot

Once `configs/rpi_4_owrt_defconfig` and `arch/arm/dts/bcm2711-rpi-4-b_owrt.dts` are done, build U-Boot.

After the build, the two files you need are:

- `out/u-boot.bin`
- `arch/arm/dts/bcm2711-rpi-4-b_owrt.dtb`

---

## 12. Copy U-Boot onto OpenWrt

On the Raspberry Pi 4:

```bash
cd /boot
```

Edit `config.txt` to:

```text
################################################################################
# Bootloader configuration - config.txt
################################################################################
# For overclocking and various other settings, see:
# https://www.raspberrypi.com/documentation/computers/config_txt.html
################################################################################
# OpenWrt config
include distroconfig.txt

[all]
# Place your custom settings here.
enable_uart=1
arm_64bit=1
device_tree=bcm2711-rpi-4-b_owrt.dtb
kernel=u-boot.bin
```

Then copy `out/u-boot.bin` and `arch/arm/dts/bcm2711-rpi-4-b_owrt.dtb` into `/boot`. You can use `scp`:

```bash
scp out/u-boot.bin root@<PI_IP>:/boot/
scp arch/arm/dts/bcm2711-rpi-4-b_owrt.dtb root@<PI_IP>:/boot/
```

> **Note:** since OpenSSH 9.0 (for example on Ubuntu 24.04), `scp` uses the SFTP protocol by default, and OpenWrt ships without an SFTP server. If `scp` fails with `sftp-server: not found` or `Connection closed`, add `-O` to use the old SCP protocol: `scp -O out/u-boot.bin root@<PI_IP>:/boot/`.

---

## 13. Test boot

After copying, `/boot` looks like this:

```text
/boot
├── u-boot.bin
├── bcm2711-rpi-4-b_owrt.dtb
├── kernel8.img
├── config.txt
├── cmdline.txt
└── ...
```

Restart the board with `reboot` (the files were copied straight onto the board, so there is no need to pull the SD card). If the UART is enabled (`enable_uart=1`), you can open a serial console to watch the U-Boot log.

The final boot flow is:

```text
┌──────────────┐
│   BOOTROM    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  start4.elf  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  config.txt  │
└──────┬───────┘
       │
       │ kernel=u-boot.bin
       ▼
┌──────────────┐
│    U-Boot    │
└──────┬───────┘
       │
       ├── fatload kernel8.img
       │
       ├── fatload Device Tree
       │
       └── booti
              │
              ▼
       ┌──────────────┐
       │ Linux Kernel │
       └──────┬───────┘
              │
              ▼
          OpenWrt
```

A few things in this post are a bit hardcoded; if you have ideas, leave a comment and let's fix them together.

![U-Boot log while booting the Raspberry Pi 4](/uploads/2026/11/openwrt-rpi4-uboot-boot-log.webp)
