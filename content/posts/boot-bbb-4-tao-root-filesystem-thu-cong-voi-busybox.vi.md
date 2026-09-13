---
title: '[Boot-BBB] 4. Tạo root filesystem thủ công với busybox'
date: '2025-11-15T06:30:00+07:00'
lastmod: '2025-11-15T06:16:51+07:00'
slug: boot-bbb-4-tao-root-filesystem-thu-cong-voi-busybox
url: /2025/11/15/boot-bbb-4-tao-root-filesystem-thu-cong-voi-busybox/
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
description: Okay, bài hôm nay mình sẽ tiếp tục hướng dẫn các bạn cách tạo root filesystem thủ công, với các utility từ busybox (utilities ở đây được hiểu là các binary p…
wp_id: 1260
---

Okay, bài hôm nay mình sẽ tiếp tục hướng dẫn các bạn cách tạo root filesystem thủ công, với các utility từ busybox (utilities ở đây được hiểu là các binary phục vụ cho command như "ls","cat",...)

Kể cả với root filesystem (rfs) căn bản, ta vẫn cần tầm 50 comamnd.

## 1. Tạo cấu trúc folder

Đầu tiên ta sẽ tạo cấu trúc folder cho linux (linux hierachy folder), mình có nói về các thư mục này qua tại phần 5 bài 1 series BBB-Linux </2025/07/04/bbb-linux-1-beaglebone-black-boot-process-overview/>

Ta tạo tại phân vùng root trên thẻ nhớ

Lưu ý nếu các bạn thấy phân vùng mmcblk0p2 này không được mount và báo lỗi, có thể fix bằng cách

```bash
sudo e2fsck -f /dev/mmcblk0p2
```

Nhấn enter liên tục là sẽ fix và mount được

Ta tạo các folder chính

```bash
sudo mkdir bin dev etc home lib proc sbin sys tmp usr var && sudo mkdir usr/bin usr/lib usr/sbin var/log
```

Cấu trúc sẽ có dạng

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

## 2. Sử dụng busybox tạo binary cần thiết

Đầu tiên ta clone source code của busybox rồi checkout sang stable release

```bash
git clone git://busybox.net/busybox.git
cd busybox
git checkout 1_35_0
```

Ta tiếp tục export Toolchain ta build ra tại bài 1 tới path

```bash
make distclean
export PATH=$HOME/x-tools/arm-training-linux-uclibcgnueabihf/bin:$PATH

export ARCH=arm
export CROSS_COMPILE=arm-training-linux-uclibcgnueabihf-
```

Ta build default config cho busybox

```bash
make defconfig
```

Okay, giờ ta sẽ cấu hình menuconfig, để khi compile xong busybox sẽ make install tới phân vùng root trên thẻ nhớ của chúng ta

```bash
make menuconfig
```

Ta vào

- Settings
  - Installation Options
    - Destination path for 'make install'

![](/uploads/2025/09/image-12.png)

(Hoặc đơn giản hơn tí ta sẽ chạy make install theo kiểu )

```bash
make install CONFIG_PREFIX=/media/zk47/rootfs
```

Và ta cũng tắt shared libs đi, tránh việc busybox build thiếu lib

- Settings
  - Build Options
    - Build static binary (\*)

![](/uploads/2025/09/image-14.png)

Okay giờ thì ta chạy

```bash
make install
```

Đến đây mình bị lỗi

```bash
networking/ping.c:158:11: fatal error: netinet/icmp6.h: No such file or directory
  158 | # include
      |           ^~~~~~~~~~~~~~~~~
compilation terminated.
```

Điều này cũng được chú thích trong bootlin worklab là mình sẽ Tắt ipv6 support đi, ta vào lại menuconfig của busybox

```bash
make menuconfig
```

- Networking Utilities
  - Enable IPv6 support : disable (bấm space để bỏ \*)

![](/uploads/2025/09/image-13.png)

Rồi chạy lại

```bash
make install
```

Nếu các bạn báo lỗi permission denied, thì các bạn đừng đổi sang chạy bằng sudo mà hay chuyển quyền của phân vùng rootfs, trên thẻ nhớ

```bash
sudo chown -R $USER:$USER /media/zk47/rootfs
```

Rồi sau đó chạy make install lại.

Nếu các bạn chạy sudo thì nó sẽ coi như chạy trong 1 phiên mới với quyền sudo, ta sẽ mất các PATH ta đã set bên trên. (khiến cho busybox build với gcc, chứ không phải arm-gcc)

## 3. Kết quả và test thẻ nhớ

Okay vậy là đã make install thành công, giờ nếu bạn check trên thẻ nhớ sẽ có dạng

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

Okay, giờ mở board lên ta sẽ thấy như sau

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

Vậy là ngon rồi

Về lỗi /etc/init.d/rcS : thì các bạn hiểu đơn giản đây là kiểu implement của systemV, như kiểu 1 script lúc khởi động vậy. Ở đây giống kiểu thay vì phải Nhấn Enter, bạn có thể để vào trong script đó câu lệnh sau để nó tự nhảy vào terminal

```bash
exec /bin/sh
```

Đọc kỹ hơn tại : <https://unix.stackexchange.com/questions/56075/why-is-rcs-required-after-file-system-is-mounted-by-the-kernel>

Okay, bài hôm nay đến đây thôi :vv

**Ở bài tiếp theo mình sẽ dùng buildroot cho quá trình gen root file system này, đem lại sự thuận tiện hơn**

Mong được các bạn tiếp tục đón đọc và ủng hộ
