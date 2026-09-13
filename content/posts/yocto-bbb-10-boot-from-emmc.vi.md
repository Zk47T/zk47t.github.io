---
title: '[Yocto-BBB] 10. Boot từ eMMC'
date: '2025-08-30T08:40:00+07:00'
lastmod: '2025-09-12T15:30:48+07:00'
slug: yocto-bbb-10-boot-from-emmc
url: /2025/08/30/yocto-bbb-10-boot-from-emmc/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 10
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Ở bài này mình sẽ hướng dẫn các bạn cách cấu hình để Beaglebone Black boot từ eMMC.
wp_id: 714
---

Ở bài này mình sẽ hướng dẫn các bạn cách cấu hình để Beaglebone Black boot từ eMMC.

## 1. Lý do

### 1.1 eMMC là gì ?

**eMMC (embedded MultiMediaCard)** là một loại bộ nhớ lưu trữ tích hợp, kết hợp **flash NAND** và **bộ điều khiển** trên cùng một chip.

Nó giống như một phiên bản nâng cấp của thẻ nhớ/flash rời, nhưng được hàn trực tiếp trên bo mạch. Tốc độ đọc ghi tùy chuẩn (thường từ ~100MB/s đến ~400MB/s với eMMC 5.1).

![](/uploads/2025/08/image-3.png)

### 1.2 Lý do mình dùng eMMC

Có 2 lý do chính khiến mình muốn boot được Beaglebone Black từ eMMC đó là

1. Mặc định khi không nhấn nút S2 thì BBB sẽ boot từ eMMC, còn muốn boot từ SD card sẽ cần dí nút S2. Và mình lười khi làm thế.
2. Đỡ tốn 1 sd card khi trên board đã có bộ nhớ để lưu image.

![](/uploads/2025/08/image.png)

Ảnh trên đã miêu tả chi tiết về boot option của BBB khi nhấn hoặc không nhấn nút S2

Trước hết mình sẽ hướng dẫn các bạn cách đơn giản nhất dành cho người lười, khi không muốn làm theo cả bài, và vẫn dùng micro SD card, mà lại không cần giữ nút S2

## 2. Cách cho người lười

Như đã thấy ở ảnh bên trên. Nếu không giữ nút S2, thì thứ tự sẽ là eMMC, uSD card, UART0, USB0.

Vậy làm thế nào để mình bỏ qua được eMMC, và tự động nhảy sang uSD card ?

Đó là mình sẽ xóa hoàn toàn dữ liệu của vùng eMMC gốc. Đơn giản phải không. Nếu BBB không tìm thấy boot partition trên eMMC nó sẽ auto nhảy sang option 2.

### 2.1 Build core-minimal-image với package phục vụ tương tác với emmc

Trước tiên để cho image nhỏ, copy nhanh, mình sẽ dùng bản core-image-minimal, cài thêm sẵn 1 số package cần thiết.

```bash
IMAGE_INSTALL:append = " \
  bash \
  coreutils \
  util-linux util-linux-lsblk util-linux-fdisk util-linux-sfdisk util-linux-partx util-linux-findmnt \
  e2fsprogs e2fsprogs-e2fsck e2fsprogs-resize2fs e2fsprogs-tune2fs e2fsprogs-mke2fs \
  dosfstools \
  parted \
  rsync \
  tar gzip xz \
  pv \
  u-boot-tools \
  mmc-utils \
"
```

![](/uploads/2025/08/image-2.png)

Mình tạo core-image-minimal.bbappend, rồi thêm các package sau. User = root, password = test.

Build xong flash vào thẻ nhớ, boot và check

```bash
root@beaglebone:~# lsblk
NAME         MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
mmcblk0      179:0    0  7.4G  0 disk
|-mmcblk0p1  179:1    0  128M  0 part
`-mmcblk0p2  179:2    0   68M  0 part /
mmcblk1      179:256  0  3.6G  0 disk
mmcblk1boot0 179:512  0    2M  1 disk
mmcblk1boot1 179:768  0    2M  1 disk
```

Mình dùng thẻ nhớ 8gb, và như các bạn thấy ở đây ta có thêm 1 mmcblk1 hay chính là eMMC với kích cỡ 3.6gb

### 2.2 Xóa trắng eMMC

Mặc định khi các bạn mua mới BBB về thì eMMC sẽ được flash 1 bản debian. Do đó ta phải xóa nó đi.

```bash
dd if=/dev/zero of=/dev/mmcblk1 bs=4M status=progress conv=fsync
```

Mình ghi 0 lên toàn bộ mmcblk1. Việc này sẽ mất tầm 2-3 phút

Và từ giờ các bạn chỉ cần cắm sd card, không cần dí nút S2 nữa mà board vẫn auto nhận boot từ sd card.

## 3. Copy image từ uSD card sang eMMC

Okay giờ ta quay lại cách chính quy, với mong muốn sau khi đã có image hoàn thiện thì ta copy vào eMMC, và không cần dùng đến sd card nữa.

### 3.1 Tạo phân vùng cho eMMC

Về cơ bản thì ở sd card nó dáng dấp như nào thì mình sẽ làm tương tự với eMMC như thế

```bash
root@beaglebone:~# lsblk
NAME         MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
mmcblk0      179:0    0  7.4G  0 disk
|-mmcblk0p1  179:1    0  128M  0 part
`-mmcblk0p2  179:2    0   68M  0 part /
mmcblk1      179:256  0  3.6G  0 disk
mmcblk1boot0 179:512  0    2M  1 disk
mmcblk1boot1 179:768  0    2M  1 disk
```

Ta sẽ tạo mmcblk1p1 cho boot, mmcblk1p2 cho root, tương tự như mmcblk0

```bash
set -e
src=/dev/mmcblk0
dst=/dev/mmcblk1
umount ${dst}p* || true
swapoff -a || true

# wipe first MiB to avoid old signatures
dd if=/dev/zero of=${dst} bs=1M count=8 conv=fsync

# DOS partition table with 2 partitions
parted -s ${dst} mklabel msdos
parted -s ${dst} unit MiB mkpart primary fat32 1 129
parted -s ${dst} set 1 boot on
parted -s ${dst} unit MiB mkpart primary ext4 129 100%

# tell kernel
partprobe ${dst}
sleep 1
```

- umount để un mount eMMC
- swapoff để tắt swap
- parted để chia phân vùng
- partprobe để thông báo kernel có sự thay đổi về phân vùng
- set 1 boot on: bật cờ boot cho phân vùng

### 3.2 Make filesystems và Mount

```bash
# Make filesystems (label them to simplify fstab)
mkfs.vfat -F 32 -n BOOT ${dst}p1
mkfs.ext4 -L ROOT ${dst}p2

mkdir -p /mnt/srcboot /mnt/srcroot /mnt/dstboot /mnt/dstroot

# Source (SD)
mount ${src}p1 /mnt/srcboot
mount ${src}p2 /mnt/srcroot

# Target (eMMC)
mount ${dst}p1 /mnt/dstboot
mount ${dst}p2 /mnt/dstroot
```

### 3.3 Copy root file system và boot

Ở đây ta sẽ không copy toàn bộ root file system của sd card, mà sẽ exclude đi các folder như

- `/run`, `/var/volatile`, `/tmp` → tmpfs runtime.
- `/dev`, `/proc`, `/sys` → kernel/udev tạo lúc boot
- /boot/\* → tránh việc xung đột boot partition

```bash
rsync -aHAXx --numeric-ids \
  --exclude='/boot/*' \
  --exclude='/dev/*' --exclude='/proc/*' --exclude='/sys/*' \
  --exclude='/tmp/*' --exclude='/run/*' --exclude='/var/volatile/*' \
  /mnt/srcroot/ /mnt/dstroot/

rsync -aHAX /mnt/srcboot/ /mnt/dstboot/
sync
```

### 3.4 Sửa /etc/fstab của eMMC

fstab là file system table, về cơ bản ta sẽ định nghĩa label, mountpoint, type, options, cho nó

```bash
# Create/replace fstab on target
cat >/mnt/dstroot/etc/fstab
LABEL=BOOT     /boot        vfat   defaults,ro,utf8  0  2
LABEL=ROOT   /            ext4   defaults           0  1
tmpfs          /run         tmpfs  mode=0755,nosuid,nodev,size=50% 0 0
tmpfs          /var/volatile tmpfs defaults,size=50% 0 0
EOF

sync
```

### 3.5 Sửa /boot/extlinux/extlinux.conf

Hiện tại file này có nội dung như sau

```bash
root@beaglebone:/mnt/dstboot/extlinux# cat extlinux.conf
# Generic Distro Configuration file generated by OpenEmbedded
LABEL Poky (Yocto Project Reference Distro)
	KERNEL ../zImage
	FDTDIR ../
    APPEND root=PARTUUID=${uuid} rootfstype=ext4 rootwait rw earlycon console=ttyS0,115200n8
```

Bình thường uuid sẽ được set trong uEnv.txt nhưng hiện mình chưa cấu hình cái này, và cũng không muốn bài làm quá phức tạp nữa, nên đến đây mình sẽ hard code block uuid

```bash
root@beaglebone:/mnt/dstboot/extlinux# tune2fs -L rootfs /dev/mmcblk1p2
tune2fs 1.46.5 (30-Dec-2021)
root@beaglebone:/mnt/dstboot/extlinux# blkid -s PARTUUID -o value /dev/mmcblk1p2
0cebe1df-02
```

Okay vậy ta thay blkid của /dev/mmcblk1p2 vào extlinux.conf

```bash
root@beaglebone:/mnt/dstboot/extlinux# cat extlinux.conf
# Generic Distro Configuration file generated by OpenEmbedded
LABEL Poky (Yocto Project Reference Distro)
	KERNEL ../zImage
	FDTDIR ../
    APPEND root=PARTUUID=0cebe1df-02 rootfstype=ext4 rootwait rw earlycon console=ttyS0,115200n8
```

Okay vậy là ta đã hoàn thành tất cả các bước copy. Giờ ta có thể tút thẻ micro SD ra và dùng eMMC 1 cách bình thường rồi :v

Để giải thích về từng câu lệnh một sẽ hơi dài, nên các bạn có thể check manual linux để hiểu thêm ý nghĩa của từng cái. Nếu có gì khó khăn hãy comment bên dưới nhé.

Ở bài tiếp theo mình sẽ viết về cách gửi nhận file thông qua UART tới board

Mong được các bạn tiếp tục ủng hộ và đón đọc :vv!!
