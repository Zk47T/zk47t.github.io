---
title: '[Boot-BBB] 2. Compile U-boot and test MLO, u-boot.img'
date: '2025-11-01T09:18:00+07:00'
lastmod: '2025-11-06T18:03:31+07:00'
slug: boot-bbb-2-u-boot-1-build-va-chay-test-mlo-u-boot-img
url: /en/2025/11/01/boot-bbb-2-u-boot-1-build-va-chay-test-mlo-u-boot-img/
categories:
- BootProcess
tags:
- Beaglebone
- BootProcess
- Linux
series:
- Boot-BBB
series_order: 2
boards:
- Beaglebone Black
image: /uploads/2025/09/maxresdefault.jpg
description: 'Building U-Boot v2023.01 from source for the BeagleBone Black, fixing missing host packages, partitioning and formatting the SD card, then booting MLO and u-boot.img step by step.'
wp_id: 1164
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
In this post I will show you how to compile `u-boot` from source and configure it for the **Beaglebone Black** board. For what u-boot is, you can read more at [[BBB-Linux] 3. Beaglebone Black Boot Process - U-boot](/en/2025/05/10/bbb-linux-3-beaglebone-black-boot-process-u-boot/)

## 1. Clone, configure and compile u-boot

### 1.1 Clone and checkout

```bash
git clone https://source.denx.de/u-boot/u-boot.git
cd u-boot
git checkout v2023.01
```

I `checkout` v2023.01 because that is the version used in the **worklabs bootlin**, which is highly compatible with the `busybox` and `buildroot` used in the same series

### 1.2 Set environment variables for cross-compiling

We are doing a `cross-compile`, so we must use the `toolchain` built in the previous post. I already added it to `PATH`, so we only need to run the following simple command.

```bash
export CROSS_COMPILE=arm-linux-
```

Put simply: if you don't set this variable it is empty, and calling `gcc` calls the `gcc` on the laptop you build with, instead of the `arm-linux-gcc` we built in the previous post for building for ARM.

### 1.3. Compile the default config and device tree

Next we choose the **default config** and **device tree** for the beaglebone black. You can read more about device trees here: [[BBB-Linux] 3.1 Why do we need a Device Tree?](/en/2025/05/10/bbb-linux-3-1-tai-sao-can-co-device-tree/)

```bash
make am335x_evm_defconfig .
make DEVICE_TREE=am335x-boneblack
```

### 1.4 Fixing missing libraries and packages

While building on my machine I hit the following error; you may see something very similar

```bash
include/image.h:1383:12: fatal error: openssl/evp.h: No such file or directory
 1383 | #  include
```

It is quite simple: I don't have the `openssl` library on my machine yet, so we have to install the package.

```bash
sudo apt-get install libssl-dev
```

But how many packages are enough? That is when you should check the `u-boot` documentation, with the keyword **U-boot prerequisites**; the documentation is here: <https://docs.u-boot.org/en/stable/build/gcc.html>

```bash
sudo apt-get install bc bison build-essential coccinelle \
  device-tree-compiler dfu-util efitools flex gdisk graphviz imagemagick \
  libgnutls28-dev libguestfs-tools libncurses-dev \
  libpython3-dev libsdl2-dev libssl-dev lz4 lzma lzma-alone openssl \
  pkg-config python3 python3-asteval python3-coverage python3-filelock \
  python3-pkg-resources python3-pycryptodome python3-pyelftools \
  python3-pytest python3-pytest-xdist python3-sphinxcontrib.apidoc \
  python3-sphinx-rtd-theme python3-subunit python3-testtools \
  python3-venv swig uuid-dev
```

Better too many than too few; install all of them so compiling `u-boot` goes smoothly.

## 2. Preparing the SD card

### 2.1 Format the SD card

Simply put, we write zeros (`/dev/zero`) over the boot area of the card

```bash
sudo dd if=/dev/zero of=/dev/mmcblk0 bs=1M count=16
```

- if=/dev/zero: the input file is /dev/zero, its content is 0x00
- of=/dev/mmcblk0: the output file is /dev/mmcblk0 (this is the device of my SD card; if you plug the card in through usb it will be /dev/sda, /dev/sdb. Be careful here)
- bs=1M: block size is 1Mb: megabytes
- count=16: write 16 blocks (wipes the beginning, cleaning the old MBR/GPT/bootloader)

Another way is to write zeros over the whole card, but that is unnecessary. Without a boot partition and valid headers, any non-zero data on the card is just garbage.

### 2.2 Create partitions on the SD card

```bash
sudo sfdisk /dev/mmcblk0 << EOF
,64M,0x0c,*
,1024M,L,
EOF
```

Partition 1

- Size: `64Mb`,
- `0x0C` here is the **Partition Type ID** <https://gist.github.com/mxpv/5187707?utm_source=chatgpt.com>
- \* is the **bootable flag** (it can be booted from)

Partition 2

- Size 1024Mb
- L here is short for Linux (<https://www.man7.org/linux/man-pages/man8/sfdisk.8.html>), section Shortcut and Aliases
- No bootable flag

### 2.3 Create a file system on each partition

```bash
sudo mkfs.vfat -a -F 16 -n boot /dev/mmcblk0p1
sudo mkfs.ext4 -L rootfs /dev/mmcblk0p2
```

`FAT` for the `boot` partition

- mkfs.vfat: creates FAT12/16/32 (FAT = File Allocation Table)
- -F 16: FAT16
- -n boot: name = boot

```bash
sudo mkfs.ext4 -L rootfs /dev/mmcblk0p2
```

`ext4` for `rootfs`

- mkfs.ext4: (make file system - ext4)
- -L rootfs: label = rootfs. From what I found, mkfs.ext4 and mkfs.vfat belong to 2 different tool suites, so their parameters are used slightly differently

Okay, that's it; now when you check with `lsblk` (list block) the machine shows the following

```bash
mmcblk0     179:0    0   7,4G  0 disk
├─mmcblk0p1 179:1    0    64M  0 part /media/zk47/boot
└─mmcblk0p2 179:2    0     1G  0 part /media/zk47/rootfs
```

## 3. Copy MLO and u-boot.img to the SD card and test

### 3.1 Copy only MLO

To show the order in which files are searched during boot more clearly, I will copy the files to the SD card one at a time (read more in 1. BBB-Linux Overview, [Beaglebone Black](/en/beaglebone-black/)). First, MLO.

Copy the `MLO` file you just built to the boot partition on the SD card

```bash
zk47@ltu:~/Learning/Bootlin_practice/u-boot$ sudo cp MLO /media/zk47/boot/
```

Booting the board, we get the following output

```bash
U-Boot SPL 2023.01 (Sep 18 2025 - 23:22:33 +0700)
Trying to boot from MMC1
spl_load_image_fat: error reading image u-boot.img, err - -2
SPL: failed to boot from all boot devices
### ERROR ### Please RESET the board ###
```

As you can see, we have not given u-boot the u-boot.img file, so it fails.

### 3.2 Now copy u-boot.img

```bash
zk47@ltu:~/Learning/Bootlin_practice/u-boot$ sudo cp u-boot.img /media/zk47/boot/
```

This time when the board boots we see the following

```bash
U-Boot SPL 2023.01 (Sep 18 2025 - 23:22:33 +0700)
Trying to boot from MMC1

U-Boot 2023.01 (Sep 18 2025 - 23:22:33 +0700)

CPU  : AM335X-GP rev 2.1
Model: TI AM335x BeagleBone Black
DRAM:  512 MiB
Core:  160 devices, 18 uclasses, devicetree: separate
WDT:   Started wdt@44e35000 with servicing every 1000ms (60s timeout)
NAND:  0 MiB
MMC:   OMAP SD/MMC: 0, OMAP SD/MMC: 1
Loading Environment from FAT... Unable to read "uboot.env" from mmc0:1...
 not set. Validating first E-fuse MAC
Net:   eth2: ethernet@4a100000, eth3: usb_ether
Hit any key to stop autoboot:  0
switch to partitions #0, OK
mmc0 is current device
Scanning mmc 0:1...
No EFI system partition
BootOrder not defined
EFI boot manager: Cannot load any image
switch to partitions #0, OK
mmc1(part 0) is current device
Scanning mmc 1:1...
BootOrder not defined
EFI boot manager: Cannot load any image
## Error: "bootcmd_nand0" not defined
```

This time we get a uboot.env error, so we will need to add that file in the next post.

**In the next post I will compile the kernel and use uboot.env to set the environment variables for u-boot.**

Hope you keep reading and supporting!!
