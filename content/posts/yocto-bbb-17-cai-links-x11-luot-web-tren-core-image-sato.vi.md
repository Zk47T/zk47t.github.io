---
title: '[Yocto-BBB] 17. Cài Links-X11, Lướt web trên core-image-sato'
date: '2026-01-17T06:34:00+07:00'
lastmod: '2025-12-04T10:20:03+07:00'
slug: yocto-bbb-17-cai-links-x11-luot-web-tren-core-image-sato
url: /2026/01/17/yocto-bbb-17-cai-links-x11-luot-web-tren-core-image-sato/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 17
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Nọ mình cài Android 6 trên Beaglebone Black thì có thấy app Trình duyệt, nhưng không lướt được web. Với các board mới hơn như FRDM i.MX93 thì hỗ trợ tốt cho …
wp_id: 1744
---

Nọ mình cài Android 6 trên Beaglebone Black thì có thấy app Trình duyệt, nhưng không lướt được web. Với các board mới hơn như FRDM i.MX93 thì hỗ trợ tốt cho Chromium, nhưng chắc chắn yêu cầu phần cứng phải tốt hơn rất nhiều.

Do đó mình tìm các giải pháp thay thế và thấy duy chỉ có Links là tương thích tốt với Yocto. Và để tiện nhìn, thì mình cũng dựa trên 1 image có giao diện. Wayland Weston thì ngồi fix nó cũng ốm rồi, nên mình dựa trên core-image-sato. Và còn may mắn nữa là có hẳn Recipes Links-X11, khiến việc tương thích trở nên đơn giản hơn nhiều.

## 1. Cấu hình build Yocto

### 1.1 Cấu hình yocto

{{% details title="local.conf" closed="true" %}}

```bash
PACKAGE_CLASSES = "package_ipk"

DISTRO_FEATURES:append = " systemd pam x11"
VIRTUAL-RUNTIME_init_manager = "systemd"
DISTRO_FEATURES_BACKFILL_CONSIDERED += "sysvinit"
VIRTUAL-RUNTIME_initscripts = ""

IMAGE_INSTALL:append = " libxcursor evtest libinput xkeyboard-config weston-examples adwaita-icon-theme hicolor-icon-theme udev adwaita-icon-theme-cursors libinput-bin "

IMAGE_INSTALL:append = " kernel-modules kernel-module-evdev "

KERNEL_MODULE_AUTOLOAD:append = " evdev usbhid "
```

{{% /details %}}

{{% details title="core-image-sato.bbappend" closed="true" %}}

```bash
SUMMARY = "My custom Linux Image"
IMAGE_INSTALL = "packagegroup-core-boot ${CORE_IMAGE_EXTRA_INSTALL}"
IMAGE_LINGUAS = " "
LICENSE = "MIT"
inherit core-image

inherit extrausers
#Change root password to test
PASSWD = "\$5\$y9Aeg5ctwntRHo/g\$CAKtoTfQg7VPGfVAMGo5ZG/0GJLn3AD0JdoQ.i0dDFC"
EXTRA_USERS_PARAMS = "\
    usermod -p '${PASSWD}' root; \
    "

#Network
IMAGE_INSTALL:append = " \
    kernel-module-rtl8188eu \
    linux-firmware \
    dhcpcd \
    iw \
    wpa-supplicant \
    wireless-regdb-static \
"
#Link Browser
IMAGE_INSTALL:append = " \
    links-x11 \
    ca-certificates \
    tzdata \
    iputils-ping \
"

KERNEL_MODULE_AUTOLOAD:append = " \
    rtl8188eu \
    "
```

{{% /details %}}

Ở đây mình dùng systemd cho việc tiện debug service, cũng như bật usb trong local.conf

Với core-image-sato, mình kết nối qua usb wifi, nên mình thêm đủ package tương tự bài [Yocto-BBB 7](/2025/08/09/yocto-bbb-7-them-driver-cho-usb-wifi/), các bạn cắm qua Ethernet, có thể thêm package như bài [Yocto-BBB 6](/2025/08/02/yocto-bbb-6-ssh-toi-board-qua-ethernet/).

Với việc dùng Links Browser, ngoài package gốc, ta cũng cần thêm

```bash
ca-certificates \ Dùng cho HTTPS (TLS).
tzdata \ Bộ dữ liệu múi giờ (Locales, ssl/time)
iputils-ping \ Cung cấp ping command để test
```

### 1.2 Build và flash

Việc này thì chắc cũng quen thuộc nếu bạn đọc đến bài này rồi

```bash
bitbake core-image-sato
```

Rồi các bạn dùng bmaptool flash image tại folder output

## 2. Boot và Kết nối mạng

### 2.1 Kết nối màn, chuột và USB wifi

Bài này dùng image có giao diện, do đó mình sẽ cắm 1 màn ngoài qua micro HDMI, và cũng cắm UART debug để tiện dùng command trên Serial

Có 1 lưu ý là, vừa cắm màn vừa cắm USB Wifi thì Beaglebone Black sẽ không cung cấp đủ điện.

Do đó mình cấp điện cho màn bằng nguồn ngoài. Và dùng 1 hub cho usb Beaglebone Black, để vừa cắm đươc usb wifi, và cắm chuột (Không cắm màn vào cổng usb, do đó không dùng cảm ứng được mà phải dùng chuột ngoài)

### 2.2 Kết nối mạng

Mình dùng USB wifi do đó cách kết nối mạng, sẽ tương tự ở bài [Yocto-BBB 7](/2025/08/09/yocto-bbb-7-them-driver-cho-usb-wifi/)

```bash
ip link set wlan0 up
iw wlan0 scan | grep SSID
wpa_passphrase "iPhone" "12345689" > /etc/wpa_supplicant.conf
wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant.conf
dhcpcd wlan0
```

Ở đây thì tùy mạng của bạn, mà bạn sẽ set chỗ wpa_passphrase cho hợp lý nhé. Mạng mình SSID = "iPhone", Pass="12345689"

Tuy nhiên thực tế ở đây, nếu bạn thử ping google.com, nó sẽ báo lỗi. Các bài trước mình chỉ dừng lại bước, cấp được IP cho board, và ping trong LAN. Do đó ta vẫn có thể SSH được, chứ mình chưa ra Internet

```bash
root@beaglebone:~# ping -c 3 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
From 169.254.218.80 icmp_seq=1 Destination Host Unreachable
From 169.254.218.80 icmp_seq=2 Destination Host Unreachable
From 169.254.218.80 icmp_seq=3 Destination Host Unreachable

--- 8.8.8.8 ping statistics ---
3 packets transmitted, 0 received, +3 errors, 100% packet loss, time 2026ms
pipe 3
root@beaglebone:~# ping -c 3 google.com
ping: google.com: Temporary failure in name resolution
root@beaglebone:~#
```

Ta nhìn thấy lỗi "name resolution" --> Nó sẽ liên quan đến DNS

### 2.3 Fix lỗi DNS

Cách fix khá đơn giản.

```bash
echo 'nameserver 8.8.8.8' > /etc/resolv.conf
```

Chính ra mình biết đến lỗi này khi kết nối wifi trên con board FRDM i.MX93 không được. Và nó cùng bị lỗi DNS, và fix tương tự :vv

## 3. Dùng Links có và không có giao diện

Vì Links-X11 là package hỗ trợ chuẩn cho X11, do đó nó cũng được cài trên sato thành 1 app luôn.

Các bạn có thể truy cập app Links trên màn hình, hoặc gõ bằng terminal cho ra dáng dân Linux nhỉ :vv

Các bạn dùng ứng dụng terminal trên sato nhé, cắm thêm bàn phím vào hub nữa. Dùng qua uart debug sẽ không được nhé !!

```bash
links -g https://embeddedlinux.blog //Có hình ảnh - graphical
links https://embeddedlinux.blog // Chỉ text
```

Links-X11 này cũng không hỗ trợ tốt các Javascripts + CSS giao diện, backend đời mới, nếu web bạn chỉ html thì hiển thị mượt mà không vấn đề gì

Ở đây, cũng chưa support tốt Tiếng Việt lắm

Các bạn có thể xem video demo dưới đây nhé

{{< youtube H_GVwxp19m8 >}}
