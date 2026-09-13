---
title: '[Kernel-BBB] 1. KGDB over UART'
date: '2026-04-18T06:56:00+07:00'
lastmod: '2026-04-18T12:06:21+07:00'
slug: kernel-bbb-1-kgdb-qua-uart
url: /en/2026/04/18/kernel-bbb-1-kgdb-qua-uart/
categories:
- Yocto
- kgdb
tags:
- Beaglebone
- Linux
- Yocto
- kgdb
series:
- Kernel-BBB
series_order: 1
boards:
- Beaglebone Black
image: /uploads/2026/04/screenshot-from-2026-04-04-14-00-18.png
description: 'A new Yocto meta-layer for the BeagleBone Black kernel: enabling KGDB and DWARF debug info in menuconfig, turning the change into a config fragment, and debugging the kernel with gdb over the serial port.'
wp_id: 2044
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
Keeping the configuration from [Yocto-BBB 1](/en/2025/06/28/yocto-bbb-1-build-beaglebone-black-image-bang-yocto-project/), I add a new meta-layer just for this kernel work

## 1. Create a new meta layer

### 1.1 Create the meta layer and add it to bblayers

```bash
$ source oe-init-build-env build-bbb/
zk47@ltu:~/Youtube/Yocto/yocto-bbb/poky/build-bbb$ bitbake-layers create-layer ../meta-kernel
NOTE: Starting bitbake server...
Add your new layer with 'bitbake-layers add-layer ../meta-kernel'

$ bitbake-layers add-layer ../meta-kernel
NOTE: Starting bitbake server...
```

### 1.2 Create the kernel append recipe

We use the following command to find the kernel recipe (in fact we could use virtual/kernel, but that is a generic name, not the specific one)

```bash
$ oe-pkgdata-util lookup-recipe kernel
linux-bb.org
```

Now we create linux-bb.org.bbappend

So the folder structure is as follows

```bash
zk47@ltu:~/Youtube/Yocto/yocto-bbb/poky/meta-kernel$ tree
.
├── conf
│   └── layer.conf
├── COPYING.MIT
├── README
└── recipes-kernel
    └── linux
        ├── linux-bb.org
        │   └── kgdb.cfg
        └── linux-bb.org_%.bbappend

4 directories, 5 files
```

Okay, we have the skeleton; now I will enable kgdb in menuconfig and get the config fragment

## 2. Configure KGDB through menuconfig

(See the [Kernel docs KGDB](https://www.kernel.org/doc/html/v4.18/dev-tools/kgdb.html#kernel-config-options-for-kgdb))

We open the kernel's menuconfig

```cpp
btibake -c menuconfig virtual/kernel
```

### 2.1 Enable KGDB

Okay, we enable KGDB

> Kernel hacking
> > Generic Kernel Debugging Instruments
> > KGDB: kernel debugger

![](/uploads/2026/04/image.png)

Remember to also select the serial console option on line 2 like this. The menuconfig may differ slightly between kernel versions. You can type "/" to search for the text KGDB to get to the right place

### 2.2 Enable Debug info

Kernel hacking

→ Compile-time checks and compiler options

→ Debug information

→ (Select) Generate DWARF Version 5 debuginfo

![](/uploads/2026/04/image-2.png)

### 2.3 Disable strict kernel

Turn off the option that makes kernel text and rodata read only

General architecture-dependent options

-> Make kernel text and rodata read-only (STRICT_KERNEL_RWX [=y])

![](/uploads/2026/04/image-1.png)

Okay, as the last step I save it with the name kgdb.config.

### 2.4 Edit kgdb.cfg in the meta-layer

It will be in your working directory; on my machine it is at

```bash
/home/zk47/Youtube/Yocto/yocto-bbb/poky/build-bbb/tmp/work/beaglebone-poky-linux-gnueabi/linux-bb.org/6.12.34+git/build/kgdb.config
```

However, this kgdb.config is the entire kernel config, 9012 lines long; if I put it in the meta-layer it would be hard to follow, right?

What I need is only what I changed above. That is when we create a config fragment with diffconfig

```cpp
$ bitbake -c diffconfig linux-bb.org
```

However, since this linux-bbb recipe only inherits kernel, not kernel-yocto, it lacks the do_diffconfig task, so it cannot create fragment.cfg

Let's try the manual way

Go into the build folder and diff .config against .config.old

```bash
/home/zk47/Youtube/Yocto/yocto-bbb/poky/build-bbb/tmp/work/beaglebone-poky-linux-gnueabi/linux-bb.org/6.12.34+git/build
diff .config .config.old
```

Now save these values into our kgdb.cfg

```bash
$ cat kgdb.cfg
# CONFIG_STRICT_KERNEL_RWX is not set
CONFIG_DEBUG_INFO=y
# CONFIG_DEBUG_INFO_NONE is not set
CONFIG_DEBUG_INFO_DWARF5=y
CONFIG_KGDB=y
CONFIG_KGDB_SERIAL_CONSOLE=y
```

To make it easy to compare after the build, remember these 2 options,

![](/uploads/2026/04/image-4.png)

This is so that after building and flashing we can check /proc/config.gz to confirm our config is there

We also edit linux-bb.org_%.bbappend so the kernel gets it applied

```bash
FILESEXTRAPATHS:prepend := "${THISDIR}/linux-bb.org:"

SRC_URI += "file://kgdb.cfg"

KERNEL_CONFIG_FRAGMENTS:append = " ${WORKDIR}/kgdb.cfg"
```

### 2.5 Build the kernel and the image

```bash
bitbake -c cleansstate linux-bb.org && bitbake linux-bb.org && bitbake core-image-minimal
```

Okay, once done we flash the SD card

## 3. Running KGDB

### 3.1 Set up KGDB on the board

When the board boots, we get into the u-boot terminal and set the baudrate and tty

```bash
setenv optargs kgdboc=ttyS0,115200
saveenv
boot
```

If you forgot to stop in u-boot, you can run the following command at runtime

```bash
root@beaglebone:~# tty
/dev/ttyS0

root@beaglebone:~# echo ttyS0 > /sys/module/kgdboc/parameters/kgdboc
```

Then we start debugging

```bash
root@beaglebone:~# echo g > /proc/sysrq-trigger
[  211.552855] sysrq: DEBUG
[  211.555578] KGDB: Entering KGDB
```

This shows KGDB is enabled successfully

### 3.2 Start KGDB on the host

We exit the current serial terminal (to avoid a conflict, since we now share /dev/ttyUSB0; ideally the serial console is on one UART and KGDB on another) and start gdb

```cpp
sudo gdb-multiarch ~/Youtube/Yocto/yocto-bbb/poky/build-bbb/tmp/work/beaglebone-poky-linux-gnueabi/linux-bb.org/6.12.34+git/build/vmlinux
```

(Point it to the vmlinux in the output. Here I use sudo for now because accessing /dev/ttyUSB0 needs root)

Setup

```bash
(gdb) set serial baud 115200
(gdb) target remote /dev/ttyUSB0
Remote debugging using /dev/ttyUSB0
```

The basic command set is as follows

```bash
(gdb) bt                        # xem backtrace
(gdb) list                      # xem source code (sau khi set path)
(gdb) break do_sys_openat2      # set a breakpoint
(gdb) continue                  # let the kernel keep running
(gdb) info registers            # xem registers
```

![](/uploads/2026/04/image-6.png)

Today's post is already quite long; I will continue with kgdbwait and the gdb server in the next post

Good luck with the hands-on
