---
title: '[OpenWrt-RPi4] 1. Build OpenWrt image cho Raspberry Pi 4'
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
description: 'Build OpenWrt từ source cho Raspberry Pi 4 (bcm2711), cấu hình sẵn IP tĩnh cho eth0 để SSH và SCP vào board, rồi flash image ra thẻ SD bằng dd.'
---

## Mục tiêu

- Build được **OpenWrt** image cho **Raspberry Pi 4** (`bcm2711`).
- Bật giao diện Ethernet để có thể sử dụng **SSH** và **SCP**.

Về giới thiệu OpenWrt, anh em xem tại đây nhé: [Giới thiệu OpenWrt](https://www.tiktok.com/@embedded_knowledge/photo/7460465376422333703)

---

## 1. Clone source code

Ta sẽ clone source code trực tiếp từ repository chính thức của OpenWrt:

```bash
git clone https://github.com/openwrt/openwrt.git
```

Sau đó checkout ra một branch riêng để làm việc:

```bash
cd openwrt
git checkout -b develop/pi4
```

---

## 2. Update feeds

Chạy command:

```bash
./scripts/feeds update -a && ./scripts/feeds install -a
```

---

## 3. Add config cho giao diện Ethernet

OpenWrt sử dụng file `/etc/config/network` để cấu hình network interface.

Trong source code, tạo file này tại:

```bash
cd package/base-files/files/etc
mkdir -p config
cd config
touch network
vim network
```

Nếu muốn interface có tên là `eth0` và sử dụng IP `192.168.1.42` thì cấu hình như sau:

```text
config interface 'wan'
    option device 'eth0'
    option proto 'static'
    option ipaddr '192.168.1.42'
    option netmask '255.255.255.0'
    option broadcast '192.168.1.255'
```

Trong đó:

- **interface**: `wan`
- **device** (interface vật lý): `eth0`
- **protocol**: `static`
- **IP address**: `192.168.1.42`
- **netmask**: `255.255.255.0`
- **broadcast**: `192.168.1.255`

> **Lưu ý:** Anh em cần cấu hình IP, netmask và broadcast phù hợp với network của mình.
>
> OpenWrt từ 21.02 dùng `option device`. Bản cũ hơn dùng `option ifname`, bản mới vẫn đọc được nhưng đã cũ.

---

## 4. Chạy menuconfig

Tại thư mục root của OpenWrt, chạy:

```bash
make menuconfig
```

Sau đó chọn target tương ứng với Raspberry Pi 4 và tắt firewall như trong ảnh đính kèm:

- **Target System**: `Broadcom BCM27xx`
- **Subtarget**: `BCM2711 boards (64 bit)`
- **Target Profile**: Raspberry Pi 4B (64bit)
- Firewall là package `firewall4` trong mục **Base system**, bỏ chọn package này.

![Cấu hình make menuconfig cho Raspberry Pi 4 (1/2)](/uploads/2026/11/openwrt-rpi4-menuconfig-1.webp)

![Cấu hình make menuconfig cho Raspberry Pi 4 (2/2)](/uploads/2026/11/openwrt-rpi4-menuconfig-2.webp)

---

## 5. Build OpenWrt

Di chuyển về thư mục root của OpenWrt:

```bash
cd <openwrt>
```

Sau đó build:

```bash
make -j$(nproc)
```

Lần build đầu tiên có thể mất khoảng **30 - 45 phút**. Thời gian thực tế phụ thuộc vào cấu hình máy build và tốc độ mạng.

Sau khi build xong, image sẽ nằm tại:

```text
bin/targets/bcm27xx/bcm2711/
```

Trong đó, image mình cần sử dụng là:

```text
openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img.gz
```

---

## 6. Flash image vào thẻ nhớ

### 6.1. Xác định device của thẻ nhớ

Cắm thẻ nhớ vào máy, sau đó sử dụng:

```bash
lsblk
```

để xác định device tương ứng với thẻ nhớ. Ví dụ:

```text
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0   512G  0 disk
├─nvme0n1p1
└─nvme0n1p2

sdb           8:16   1    32G  0 disk
├─sdb1
└─sdb2
```

Trong ví dụ này, `/dev/sdb` là toàn bộ device của thẻ nhớ.

> **Cẩn thận:** `dd` sẽ ghi trực tiếp vào device. Chọn sai device có thể làm mất dữ liệu trên ổ đĩa khác.

### 6.2. Giải nén OpenWrt image

Image hiện tại có dạng:

```text
openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img.gz
```

Giải nén:

```bash
gzip -d openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img.gz
```

Sau khi giải nén sẽ có:

```text
openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img
```

### 6.3. Ghi image vào thẻ nhớ

Sử dụng `dd`:

```bash
sudo dd if=openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img \
        of=/dev/<device> \
        bs=4M \
        status=progress \
        conv=fsync
```

Ví dụ nếu thẻ nhớ là `/dev/sdb`:

```bash
sudo dd if=openwrt-bcm27xx-bcm2711-rpi-4-ext4-factory.img \
        of=/dev/sdb \
        bs=4M \
        status=progress \
        conv=fsync
```

Sau khi hoàn tất:

```bash
sync
```

---

## 7. Boot Raspberry Pi 4

Cắm thẻ nhớ vào Raspberry Pi 4 và boot board.

Sau khi OpenWrt boot lên thành công, do chúng ta đã cấu hình Ethernet interface `eth0` với IP `192.168.1.42`, nên có thể truy cập vào board thông qua SSH:

```bash
ssh root@192.168.1.42
```

Sau khi SSH thành công, sẽ thấy shell của OpenWrt:

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

> **Lưu ý:** Như cảnh báo ở trên, board chưa có mật khẩu root và firewall đã tắt. Chỉ nên cắm board vào mạng lab, và đặt mật khẩu bằng `passwd` ngay sau lần SSH đầu tiên.
