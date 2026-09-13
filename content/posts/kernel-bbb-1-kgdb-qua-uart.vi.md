---
title: '[Kernel-BBB] 1. KGDB qua UART'
date: '2026-04-18T06:56:00+07:00'
lastmod: '2026-04-18T12:06:21+07:00'
slug: kernel-bbb-1-kgdb-qua-uart
url: /2026/04/18/kernel-bbb-1-kgdb-qua-uart/
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
description: Giữ nguyên cấu hình từ bài Yocto-BBB 1(/2025/06/28/yocto-bbb-1-build-beaglebone-black-image-bang-yocto-project/) mình thêm 1 meta-layer mới riêng cho phần ke…
wp_id: 2044
---

Giữ nguyên cấu hình từ bài [Yocto-BBB 1](/2025/06/28/yocto-bbb-1-build-beaglebone-black-image-bang-yocto-project/) mình thêm 1 meta-layer mới riêng cho phần kernel này

## 1. Tạo meta layer mới

### 1.1 Tạo meta layer và add vào bblayers

```bash
$ source oe-init-build-env build-bbb/
zk47@ltu:~/Youtube/Yocto/yocto-bbb/poky/build-bbb$ bitbake-layers create-layer ../meta-kernel
NOTE: Starting bitbake server...
Add your new layer with 'bitbake-layers add-layer ../meta-kernel'

$ bitbake-layers add-layer ../meta-kernel
NOTE: Starting bitbake server...
```

### 1.2 Tạo recipe kernel append

Ta dùng câu lệnh sau để biết được recipe kernel (Thực tế ta có thể dùng virtual/kernel nhưng nó kiểu tên chung, không chỉ đích danh)

```bash
$ oe-pkgdata-util lookup-recipe kernel
linux-bb.org
```

Giờ ta tạo linux-bb.org.bbappend

Vậy cấu trúc folder sẽ như sau

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

Okay, vậy là ta đã có bộ khung, giờ mình sẽ enable kgdb trong menuconfig và lấy được cái config fragment nhé

## 2. Cấu hình KGDB qua menuconfig

(Tham khảo [Kernel docs KGDB](https://www.kernel.org/doc/html/v4.18/dev-tools/kgdb.html#kernel-config-options-for-kgdb))

Ta mở menuconfig của kernel

```cpp
btibake -c menuconfig virtual/kernel
```

### 2.1 Bật KGDB

Okay, ta enable KGDB

> Kernel hacking
> > Generic Kernel Debugging Instruments
> > KGDB: kernel debugger

![](/uploads/2026/04/image.png)

Nhớ chọn cả lựa chọn serial console dòng 2 như này nhé, Có thể menuconfig của mỗi phiên bản kernel sẽ khác nhau nhỏ. Các bạn có thể gõ "/" để search text KGDB để vào đúng địa chỉ

### 2.2 Bật Debug info

Kernel hacking

→ Compile-time checks and compiler options

→ Debug information

→ (Select) Generate DWARF Version 5 debuginfo

![](/uploads/2026/04/image-2.png)

### 2.3 Tắt strict kernel

Tắt đi lựa chọn kernel text và rodata là read only

General architecture-dependent options

-> Make kernel text and rodata read-only (STRICT_KERNEL_RWX [=y])

![](/uploads/2026/04/image-1.png)

Okay, vậy bước cuối thì mình save lại với tên kgdb.config.

### 2.4 Sửa kgdb.cfg trong meta-layer

Và nó sẽ ở tại thư mục làm việc của bạn, như máy mình là sẽ ở

```bash
/home/zk47/Youtube/Yocto/yocto-bbb/poky/build-bbb/tmp/work/beaglebone-poky-linux-gnueabi/linux-bb.org/6.12.34+git/build/kgdb.config
```

Tuy nhiên ở cái kgdb.config này đang là toàn bộ config của kernel dài đến 9012 dòng, nếu mình để vào meta-layer nó sẽ bị khó theo dõi đúng không ?

Cái mình cần chỉ là cái mình đã thay đổi bên trên. Đó là lúc ta tạo ra fragment config bằng diffconfig

```cpp
$ bitbake -c diffconfig linux-bb.org
```

Tuy nhiên do cái linux-bbb này chỉ inherit kernel không phải kernel-yocto nên cũng thiếu đi task do_diffconfig, nên nó sẽ không tạo được fragment.cfg

Ta thử cách thủ công

Vào folder build và diff giữa .config và .config.old

```bash
/home/zk47/Youtube/Yocto/yocto-bbb/poky/build-bbb/tmp/work/beaglebone-poky-linux-gnueabi/linux-bb.org/6.12.34+git/build
diff .config .config.old
```

Rồi giờ lưu giá trị này vào kgdb.cfg của ta

```bash
$ cat kgdb.cfg
# CONFIG_STRICT_KERNEL_RWX is not set
CONFIG_DEBUG_INFO=y
# CONFIG_DEBUG_INFO_NONE is not set
CONFIG_DEBUG_INFO_DWARF5=y
CONFIG_KGDB=y
CONFIG_KGDB_SERIAL_CONSOLE=y
```

Để tiện cho việc đối chiếu khi build xong, thì các bạn nhớ 2 option này nhé,

![](/uploads/2026/04/image-4.png)

Cái này để lúc flash, build xong thì ta check lại trong /proc/config.gz để confirm cái config của ta đã có

Ta cũng sửa cả linux-bb.org_%.bbappend để kernel được apply nhé

```bash
FILESEXTRAPATHS:prepend := "${THISDIR}/linux-bb.org:"

SRC_URI += "file://kgdb.cfg"

KERNEL_CONFIG_FRAGMENTS:append = " ${WORKDIR}/kgdb.cfg"
```

### 2.5 Build kernel và image

```bash
bitbake -c cleansstate linux-bb.org && bitbake linux-bb.org && bitbake core-image-minimal
```

Okay, xong rồi ta flash thẻ nhớ

## 3. Chạy KGDB

### 3.1 Setup KGDB board

Khi board boot lên, ta truy cập u-boot terminal và set baudrate và tty

```bash
setenv optargs kgdboc=ttyS0,115200
saveenv
boot
```

Nếu các bạn nhỡ quên không vào u-boot, thì có thể chạy lệnh sau lúc runtime

```bash
root@beaglebone:~# tty
/dev/ttyS0

root@beaglebone:~# echo ttyS0 > /sys/module/kgdboc/parameters/kgdboc
```

Rồi ta chạy debug

```bash
root@beaglebone:~# echo g > /proc/sysrq-trigger
[  211.552855] sysrq: DEBUG
[  211.555578] KGDB: Entering KGDB
```

Như đây là đã bật KGDB thành công

### 3.2 Bật KGDB bên host

Ta thoát khỏi terminal serial hiện tại (tránh xung đột vì giờ ta đang dùng chung /dev/ttyUSB0, nếu được thì serial ở 1 UART, và KGDB ở 1 UART khác thì là đẹp nhất), và bật gdb lên

```cpp
sudo gdb-multiarch ~/Youtube/Yocto/yocto-bbb/poky/build-bbb/tmp/work/beaglebone-poky-linux-gnueabi/linux-bb.org/6.12.34+git/build/vmlinux
```

(Trỏ đến vmlinux ở output nhé. Ở đây mình chạy sudo tạm vì truy cập /dev/ttyUSB0 đang cần quyền root)

Setup

```bash
(gdb) set serial baud 115200
(gdb) target remote /dev/ttyUSB0
Remote debugging using /dev/ttyUSB0
```

Ta có tập lệnh căn bản như sau

```bash
(gdb) bt                        # xem backtrace
(gdb) list                      # xem source code (sau khi set path)
(gdb) break do_sys_openat2      # đặt breakpoint
(gdb) continue                  # cho kernel chạy tiếp
(gdb) info registers            # xem registers
```

![](/uploads/2026/04/image-6.png)

Tạm thời bài hôm nay đã khá dài, mình sẽ tiếp tục về kgdbwait và gdb server ở bài sau

Chúc các bạn thực hành thành công
