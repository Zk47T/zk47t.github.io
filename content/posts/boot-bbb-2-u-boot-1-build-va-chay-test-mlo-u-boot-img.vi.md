---
title: '[Boot-BBB] 2. Compile U-boot và chạy test MLO, u-boot.img'
date: '2025-11-01T09:18:00+07:00'
lastmod: '2025-11-06T18:03:31+07:00'
slug: boot-bbb-2-u-boot-1-build-va-chay-test-mlo-u-boot-img
url: /2025/11/01/boot-bbb-2-u-boot-1-build-va-chay-test-mlo-u-boot-img/
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
description: Ở bài này, mình sẽ hướng dẫn các bạn compile từ source của u-boot và cấu hình cho board Beaglebone Black. Về u-boot là gì, các bạn có thể đọc thêm tại </2025…
wp_id: 1164
---

Ở bài này, mình sẽ hướng dẫn các bạn compile từ source của `u-boot` và cấu hình cho board **Beaglebone Black**. Về u-boot là gì, các bạn có thể đọc thêm tại </2025/05/10/bbb-linux-3-beaglebone-black-boot-process-u-boot/>

## 1. Clone, cấu hình và compile u-boot

### 1.1 Clone và checkout

```bash
git clone https://source.denx.de/u-boot/u-boot.git
cd u-boot
git checkout v2023.01
```

Mình `checkout` v2023.01 bởi đó là phiên bản được sử dụng trong **worklabs bootlin**, mang độ tương thích cao với `busybox` và `buildroot` trong cùng series

### 1.2 Cài đặt biến môi trường cho Cross-compile

Ta đang `cross-compile`, do đó ta phải sử dụng `toolchain` đã build ra từ bài trước. Mình đã thêm vào `PATH` nên ta chỉ cần chạy câu lệnh đơn giản sau.

```bash
export CROSS_COMPILE=arm-linux-
```

Bạn hiểu đơn giản nếu không set biến này thì nó sẽ là rỗng, khi gọi `gcc` sẽ đang là gọi `gcc` hiện tại có trên laptop bạn dùng để build. Thay vì `arm-linux-gcc` ta build từ bài trước, dùng để build cho ARM vậy

### 1.3. Compile default config và device tree

Ta chọn tiếp **default config** và **device tree** cho beaglebone black. Về device tree các bạn có thể đọc thêm tại đây : </2025/05/10/bbb-linux-3-1-tai-sao-can-co-device-tree/>

```bash
make am335x_evm_defconfig .
make DEVICE_TREE=am335x-boneblack
```

### 1.4 Sửa lỗi thiếu thư viện, package

Trong lúc build trên máy mình, mình có gặp lỗi sau, các bạn có thể gặp lỗi khá tương tự

```bash
include/image.h:1383:12: fatal error: openssl/evp.h: No such file or directory
 1383 | #  include
```

Ở đây thì hiểu khá đơn giản là mình đang chưa có thư viện `openssl` trên máy, do đó ta sẽ phải cài thêm gói.

```bash
sudo apt-get install libssl-dev
```

Nhưng cài thêm bao nhiêu là đủ ? Đó là khi bạn nên kiểm tra tài liệu từ `u-boot`, với keyword **U-boot prerequisites**, link tài liệu tại đây: <https://docs.u-boot.org/en/stable/build/gcc.html>

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

Thừa hơn thiếu, các bạn cài đủ để quá trình compile `u-boot` diễn ra 1 cách trơn tru.

## 2. Chuẩn bị thẻ nhớ

### 2.1 Format thẻ nhớ

Hiểu đơn giản là ta ghi 0 (`/dev/zero`) lên phân vùng boot của thẻ

```bash
sudo dd if=/dev/zero of=/dev/mmcblk0 bs=1M count=16
```

- if=/dev/zero: input file là /dev/zero, nội dung là 0x00
- of=/dev/mmcblk0: output file là /dev/mmcblk0 (ở đây là địa chỉ thẻ nhớ của mình, nếu các bạn cắm thẻ qua usb nó sẽ là /dev/sda, /dev/sdb. Nhớ lưu chỗ này )
- bs=1M: block size là 1Mb: mega bytes
- count=16: ghi 16 block size (Xóa phần đầu, sạch MBR/GPT/bootloader cũ)

Có 1 cách khác là bạn khi 0 lên toàn bộ thẻ, nhưng việc này là không cần thiết. Vì thiếu phân vùng boot và các header hợp lý, dữ liệu khác 0 trên thẻ chỉ là dữ liệu rác vậy.

### 2.2 Tạo phân vùng cho thẻ nhớ

```bash
sudo sfdisk /dev/mmcblk0 << EOF
,64M,0x0c,*
,1024M,L,
EOF
```

Tạo phân vùng 1

- Kích thước : `64Mb`,
- `0x0C` ở đây hiểu là **Partition Type ID** <https://gist.github.com/mxpv/5187707?utm_source=chatgpt.com>
- \* là **bootable flag** (Có thể boot từ đây)

Phân vùng 2

- Kích thước 1024Mb
- L ở đây là viết tắt cho Linux (<https://www.man7.org/linux/man-pages/man8/sfdisk.8.html>) mục Shortcut and Aliases
- Không chứa bootable flag

### 2.3 Tạo file system cho từng phân vùng

```bash
sudo mkfs.vfat -a -F 16 -n boot /dev/mmcblk0p1
sudo mkfs.ext4 -L rootfs /dev/mmcblk0p2
```

`FAT` cho phân vùng `boot`

- mkfs.vfat : tạo FAT12/16/32 (FAT = File Allocation Table)
- -F 16: FAT16
- -n boot: name = boot

```bash
sudo mkfs.ext4 -L rootfs /dev/mmcblk0p2
```

`ext4` cho `rootfs`

- mkfs.ext4 : (make file system - ext4)
- -L rootfs : label = rootfs . Mình tìm hiểu thì mkfs.ext4 mkfs.vfat lại thuộc 2 bộ công cụ khác nhau nên có cách dùng param hơi khác nhau

Okay vậy là xong, giờ khi bạn check bằng `lsblk` (list block) máy ta sẽ hiển thị như sau

```bash
mmcblk0     179:0    0   7,4G  0 disk
├─mmcblk0p1 179:1    0    64M  0 part /media/zk47/boot
└─mmcblk0p2 179:2    0     1G  0 part /media/zk47/rootfs
```

## 3. Copy MLO và u-boot.img vào thẻ nhớ test

### 3.1 Copy chỉ MLO

Ở đây để hiển thị kĩ hơn về trình tự tìm kiếm các file trong quá trình boot mình sẽ copy từng file vào thẻ nhớ (Đọc kỹ hơn tại 1. BBB-Linux Overview </beaglebone-black/>). Đầu tiên là MLO.

Các bạn copy file `MLO` vừa build ra vào phân vùng boot trên thẻ nhớ

```bash
zk47@ltu:~/Learning/Bootlin_practice/u-boot$ sudo cp MLO /media/zk47/boot/
```

Khởi động board ta sẽ nhận được nội dung sau

```bash
U-Boot SPL 2023.01 (Sep 18 2025 - 23:22:33 +0700)
Trying to boot from MMC1
spl_load_image_fat: error reading image u-boot.img, err - -2
SPL: failed to boot from all boot devices
### ERROR ### Please RESET the board ###
```

Dễ thấy, ta đang không cung cấp cho u-boot file u-boot.img, nên nó sẽ lỗi.

### 3.2 Copy tiếp u-boot.img

```bash
zk47@ltu:~/Learning/Bootlin_practice/u-boot$ sudo cp u-boot.img /media/zk47/boot/
```

Lần này khởi động board lên ta sẽ thấy nội dung sau

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

Lần này ta gặp lỗi uboot.env, do đó ta sẽ cần bổ sung file này ở bài sau.

**Ở bài sau mình sẽ compile kernel và dùng uboot.env để cài đặt các biến môi trường cho u-boot.**

Mong được các bạn tiếp tục đón đọc và ủng hộ !!
