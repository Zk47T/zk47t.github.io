---
title: '[Boot-BBB] 4. Create a root filesystem by hand with busybox'
date: '2025-11-15T06:30:00+07:00'
lastmod: '2025-11-15T06:16:51+07:00'
slug: boot-bbb-4-tao-root-filesystem-thu-cong-voi-busybox
url: /en/2025/11/15/boot-bbb-4-tao-root-filesystem-thu-cong-voi-busybox/
categories:
- BootProcess
tags:
- Beaglebone
- BootProcess
- Linux
series:
- Boot-BBB
series_order: 4
boards:
- Beaglebone Black
image: /uploads/2025/09/maxresdefault.jpg
description: 'Building the Linux folder hierarchy on the SD card, cross-compiling a static busybox, fixing the IPv6 and permission errors, and booting into a shell on the BeagleBone Black.'
wp_id: 1260
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
Okay, in today's post I continue by showing you how to create a root filesystem by hand, with utilities from busybox (utilities here means the binaries behind commands such as "ls", "cat", ...)

Even a basic root filesystem (rfs) needs around 50 commands.

## 1. Create the folder structure

First we create the folder structure for linux (the linux folder hierarchy). I talked about these folders in section 5 of part 1 of the BBB-Linux series: [[BBB-Linux] 1. Beaglebone Black Boot Process Overview](/en/2025/06/21/bbb-linux-1-beaglebone-black-boot-process-overview/)

We create it on the root partition of the SD card

Note: if the mmcblk0p2 partition is not mounted and reports an error, you can fix it with

```bash
sudo e2fsck -f /dev/mmcblk0p2
```

Keep pressing enter and it will be fixed and mountable

We create the main folders

```bash
sudo mkdir bin dev etc home lib proc sbin sys tmp usr var && sudo mkdir usr/bin usr/lib usr/sbin var/log
```

The structure looks like this

```bash
zk47@ltu:/media/zk47/rootfs$ tree -d
.
├── bin
├── dev
├── etc
├── home
├── lib
├── proc
├── sbin
├── sys
├── tmp
├── usr
│   ├── bin
│   ├── lib
│   └── sbin
└── var
    └── log

15 directories
```

## 2. Use busybox to create the needed binaries

First we clone the busybox source code and checkout a stable release

```bash
git clone git://busybox.net/busybox.git
cd busybox
git checkout 1_35_0
```

Again we export the toolchain built in part 1 to the path

```bash
make distclean
export PATH=$HOME/x-tools/arm-training-linux-uclibcgnueabihf/bin:$PATH

export ARCH=arm
export CROSS_COMPILE=arm-training-linux-uclibcgnueabihf-
```

We build the default config for busybox

```bash
make defconfig
```

Okay, now we configure menuconfig so that after compiling, busybox make install goes to the root partition on our SD card

```bash
make menuconfig
```

Go to

- Settings
  - Installation Options
    - Destination path for 'make install'

![](/uploads/2025/09/image-12.png)

(Or, a bit simpler, we run make install like this)

```bash
make install CONFIG_PREFIX=/media/zk47/rootfs
```

We also turn off shared libs, so busybox is not built with missing libs

- Settings
  - Build Options
    - Build static binary (\*)

![](/uploads/2025/09/image-14.png)

Okay, now we run

```bash
make install
```

At this point I got an error

```bash
networking/ping.c:158:11: fatal error: netinet/icmp6.h: No such file or directory
  158 | # include
      |           ^~~~~~~~~~~~~~~~~
compilation terminated.
```

This is also noted in the bootlin worklab: turn off ipv6 support. We go back into busybox's menuconfig

```bash
make menuconfig
```

- Networking Utilities
  - Enable IPv6 support: disable (press space to remove \*)

![](/uploads/2025/09/image-13.png)

Then run it again

```bash
make install
```

If you get permission denied, don't switch to running with sudo; instead change the ownership of the rootfs partition on the SD card

```bash
sudo chown -R $USER:$USER /media/zk47/rootfs
```

Then run make install again.

If you run sudo, it counts as a new session with sudo rights and we lose the PATH we set above. (That makes busybox build with gcc, not arm-gcc)

## 3. Result and testing the SD card

Okay, make install succeeded; now if you check the SD card it looks like this

```bash
zk47@ltu:~/Learning/Bootlin_practice/busybox$ tree /media/zk47/rootfs/
/media/zk47/rootfs/
├── bin
│   ├── arch -> busybox
│   ├── ash -> busybox
│   ├── base32 -> busybox
│   ├── base64 -> busybox
│   ├── busybox
│   ├── cat -> busybox
│   ├── chattr -> busybox
....
```

Okay, now power up the board and we see the following

```bash
[    3.617786] EXT4-fs (mmcblk0p2): mounted filesystem d756ca9b-1e88-4f98-9c7d-80323ff21984 r/w with ordered data mode. Quota mode: disabled.
[    3.630629] VFS: Mounted root (ext4 filesystem) on device 179:2.
[    3.637275]  mmcblk1: p1
[    3.641359] mmcblk1boot0: mmc1:0001 M62704 2.00 MiB
[    3.650063] devtmpfs: mounted
[    3.654353] mmcblk1boot1: mmc1:0001 M62704 2.00 MiB
[    3.664734] Freeing unused kernel image (initmem) memory: 2048K
[    3.674001] mmcblk1rpmb: mmc1:0001 M62704 512 KiB, chardev (236:0)
[    3.680437] Run /sbin/init as init process
can't run '/etc/init.d/rcS': No such file or directory

Please press Enter to activate this console.
/ # ls
bin         home        lost+found  sys         var
dev         lib         proc        tmp
etc         linuxrc     sbin        usr
/ #
```

That works nicely

About the /etc/init.d/rcS error: simply put, this is the systemV style of implementation, like a script run at boot. Here, instead of having to press Enter, you can put the following command in that script so it drops into the terminal automatically

```bash
exec /bin/sh
```

Read more at: <https://unix.stackexchange.com/questions/56075/why-is-rcs-required-after-file-system-is-mounted-by-the-kernel>

Okay, that's it for today :vv

**In the next post I will use buildroot to generate this root file system, which is more convenient**

Hope you keep reading and supporting
