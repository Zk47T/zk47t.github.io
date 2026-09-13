---
title: '[Yocto-MX93] 2. Kết nối wifi, test thử Chromium'
date: '2026-02-07T07:34:09+07:00'
lastmod: '2026-02-09T21:49:17+07:00'
slug: yocto-mx93-2-ket-noi-wifi-test-thu-chromium
url: /2026/02/07/yocto-mx93-2-ket-noi-wifi-test-thu-chromium/
categories:
- FRDM-i.MX93
- Yocto
tags:
- FRMD-i.MX93
- Linux
- NXP
- Yocto
series:
- Yocto-MX93
series_order: 2
boards:
- FRDM i.MX93
image: /uploads/2025/11/screenshot-from-2025-11-18-22-03-24.png
description: 1 cái hay khi dùng luôn image full tính năng từ hãng là bạn định thêm thắt gì khá đơn giản, và cũng có nhiều tài liệu từ hãng luôn
wp_id: 1659
---

1 cái hay khi dùng luôn image full tính năng từ hãng là bạn định thêm thắt gì khá đơn giản, và cũng có nhiều tài liệu từ hãng luôn

## 1. Thêm Chromium khi build

Đầu tiên, như mình đã bảo ở bài trước, tránh việc bạn sửa các file local.conf và bbalyers xong các bạn mới chạy source thì 2 file này. Thì ta chạy trước câu lệnh sau để khởi tạo môi trường build

```cpp
MACHINE=imx93frdm DISTRO=fsl-imx-xwayland source sources/meta-imx-frdm/tools/imx-frdm-setup.sh -b frdm-imx93
```

Ta thêm layers meta-chromium vào bblayers.conf

```bash
BBLAYERS += "${BSPDIR}/sources/meta-browser/meta-chromium"
```

Ta cài chromium-ozone-wayland vào image hiện tại trong local.conf

```bash
CORE_IMAGE_EXTRA_INSTALL += "chromium-ozone-wayland"
```

Và tiến hành build lại

```bash
bitbake imx-full-image
```

Build Chromium là 1 quá trình ngốn tài nguyên lớn. Mình build Chromium cho Windows 10, xưa mất 8 tiếng, full 100% CPU (14 cores 20 luồng cộng với 32Gb RAM, 64Gb swap, và tốn 300Gb bộ nhớ). Ở đây, Chromium trên Arm cũng không nhẹ hơn là bao.

Nếu các bạn chỉ định kết nối wifi thì có thể sang phần 2, bỏ qua vụ Chromium nhé.

## 2. Kết nối wifi

### 2.1 Cài module moal

Image này đã sẵn module wifi, ta modprobe nó

```bash
modprobe moal mod_para=nxp/wifi_mod_para.conf
```

Ở đây NXP không dùng tên gọi wlan0 cho wifi mà lại dùng mlan0, Các bạn có thể check kết quả câu lệnh này, trước và sau khi modprobe module

```bash
ls -al /sys/bus/net
```

### 2.2 Sửa cấu hình wifi

Sửa interface config, set up cho mlan0 (Theo gợi ý là ta sẽ down uap0 đi, tránh xung đột)

```bash
ifconfig mlan0 up
# (Optional) ensure AP side not interfering:
ifconfig uap0 down 2>/dev/null || true
```

Tiếp theo ta conf cho wifi, khá tương tự với việc mình từng làm với USB wifi trước đây.

```bash
cat >/etc/wpa_supplicant.conf <<'EOF'
ctrl_interface=/var/run/wpa_supplicant
ctrl_interface_group=0
update_config=1

network={
    ssid="YourHotspotSSID"
    key_mgmt=WPA-PSK
    psk="YourHotspotPassword"
}
EOF
mkdir -p /var/run/wpa_supplicant
```

### 2.3 Kết nối tới Internet

Ta kết nối tới mạng

```bash
killall wpa_supplicant 2>/dev/null || true
wpa_supplicant -B -i mlan0 -D nl80211 -c /etc/wpa_supplicant.conf
```

Cấp IP cho nó

```bash
udhcpc -i mlan0
```

Đúng ra tới đây thì là guide của hãng đã hết, tuy nhiên mình vẫn không vào được mạng. Sau khi tìm hiểu thêm, thì vấn đề là do DNS, ta chạy thêm câu lệnh sau

```bash
echo 'nameserver 8.8.8.8' > /etc/resolv.conf
```

Vậy là ngon rồi, giờ các bạn có thể vào Internet.

## 3. Sử dụng Chromium lướt web

Hiện tại thì mình tắt gpu để Chromium hoạt động chuẩn, chắc sẽ phải nghiên cứu để fix thêm

```bash
chromium --no-sandbox --disable-gpu https://embeddedlinux.blog
```

Mình có demo nhỏ sau

{{< youtube 8f_mB2YBbpY >}}
