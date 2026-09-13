---
title: '[Yocto-BBB] 7. Thêm driver cho USB wifi'
date: '2025-08-09T08:15:00+07:00'
lastmod: '2025-12-09T20:53:25+07:00'
slug: yocto-bbb-7-them-driver-cho-usb-wifi
url: /2025/08/09/yocto-bbb-7-them-driver-cho-usb-wifi/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 7
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Với các board không có sẵn module wifi như Beaglebone Black, thì việc dùng 1 usb wifi là rất tiện so với việc cắm dây Ethernet. Ở bài này mình dùng mẫu USB w…
wp_id: 507
---

Với các board không có sẵn module wifi như **Beaglebone Black**, thì việc dùng 1 usb wifi là rất tiện so với việc cắm dây Ethernet. Ở bài này mình dùng mẫu USB wifi từ **TP-Link WN722N** V2 khá phổ biến ở các shop Việt Nam

(Nếu các bạn gặp khó khăn trong quá trình thực hành theo blog, các bạn có thể tham khảo video thực hành của mình ở cuối bài )

![](/uploads/2025/07/image-28.png)

Và tất nhiên rồi để board hay máy tính có thể bắt đầu sử dụng được 1 hardware mới, ta cần cung cấp driver cho nó.

## 1. Kiểm tra độ tương thích và Driver

Các bạn hoàn toàn có thể dùng 1 usb wifi khác sẵn có , và thực hiện cách làm khá tương tự.

Để kiểm tra độ tương thích mình vào web sau : <https://linux-wless.passys.nl/>

Mình chọn hãng của mình rồi bấm show, như đây mình chọn TP-Link

![](/uploads/2025/07/image-29.png)

![](/uploads/2025/07/image-31.png)

Rồi search tên mã usb là **TL-WN722 V.2**. Ở đây có màu vàng là mức giữa Xếp từ thấp đến cao về độ tương thích : Xám - Vàng - Xanh lá. Vàng có nghĩa là có thể chạy luôn được, nhưng cũng có thể phải cấu hình đôi chút.

Với usb wifi này mình có test với bản image build sẵn từ beaglebone <https://www.beagleboard.org/distros : am335x-debian-12.11-base-vscode-v6.12-armhf-2025-05-29-4gb.img.xz> thì nó có nhận luôn rtl8xxxu driver và hoạt động OK

![](/uploads/2025/07/image-32.png)

Tuy nhiên với `custom-image-minimal`, ta build từ `packagegroup-core-boot` cùng với 1 vài package ta tự thêm vào thì mọi chuyện không đơn giản như thế :vv

## 2. Yocto build USB wifi Driver

Test việc cắm usb wifi vào board với bản build custom-image-minimal hiện tại rõ ràng là nó sẽ không chạy rồi :vv

Ở cột Comment trên trang <https://linux-wless.passys.nl/> ta sẽ thấy được link driver của TL-WN722N v.2 <https://github.com/lwfinger/rtl8188eu>.

Vậy nhiệm vụ của chúng ta là clone source này về, build thành driver và thêm driver vào được image build

Về source code và cấu trúc folder các bạn có thể tham khảo tại github của mình <https://github.com/Zk47T/meta-bbb/tree/main>

![](/uploads/2025/07/image-39.png)

### 2.1 Cấu trúc folder recipes

Các bạn tạo 1 recipes mới trong meta-bbb, ở đây mình đặt là recipes-wifi, rồi tạo bitbake recipe, mình đặt tên là rtl8188eu.bb

```bash
meta-bbb
└── recipes-wifi
    └── rtl8188eu
        └── rtl8188eu.bb
```

### 2.2 Nội dung rtl8188eu.bb

```bash
DESCRIPTION = "Realtek RTL8188EU USB WiFi driver"
SECTION = "kernel/modules"
LICENSE = "GPL-2.0-only"

LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/GPL-2.0-only;md5=801f80980d171dd6425610833a22dbe6"

SRC_URI = "git://github.com/lwfinger/rtl8188eu.git;branch=v5.2.2.4;protocol=https"
SRCREV = "f42fc9c45d2086c415dce70d3018031b54a7beef"

PV = "1.0+git${SRCPV}"
S = "${WORKDIR}/git"

inherit module

KERNEL_MODULE_AUTOLOAD += "8188eu"

do_install() {
    install -d ${D}${nonarch_base_libdir}/modules/${KERNEL_VERSION}/kernel/drivers/net/wireless
    install -m 0644 8188eu.ko ${D}${nonarch_base_libdir}/modules/${KERNEL_VERSION}/kernel/drivers/net/wireless/
}

# Manually declare the kernel module for packaging
FILES:${PN} += "${nonarch_base_libdir}/modules/${KERNEL_VERSION}/kernel/drivers/net/wireless/8188eu.ko"
RPROVIDES:${PN} += "kernel-module-rtl8188eu"
```

Các mục `DESCRIPTION` và `SECTION` thì có lẽ không cần giải thích nữa.

{{% details title="LICENSE & LIC_FILES_CHKSUM" closed="true" %}}

Yocto có kiểm soát nghiêm ngặt việc recipes bắt buộc phải có `LICENSE`, do đó ta cần trường này. Vấn đề là trên github gốc <https://github.com/lwfinger/rtl8188eu> lại không hề đính kèm `LICENSE`.

![](/uploads/2025/07/image-33.png)

Thông thường github gốc sẽ có license và khi ta build sẽ kiểm tra lại checksum cho nó.

Vì vậy ở đây mình tự bổ sung thêm `LICENSE` là `GPL-2.0-only`, là 1 `LICENSE` phổ biến cho việc phát hành trên Linux.

`LICENSE` này mình sẽ lấy ở `COMMON_LICENSE_DIR` hay chính là ***/poky/meta/files/common-licenses***

Ta chạy hash cho file rồi copy vào `LIC_FILES_CHKSUM`

```bash
md5sum poky/meta/files/common-licenses/GPL-2.0-only
```

{{% /details %}}

{{% details title="SRC_URI" closed="true" %}}

Như tên gọi thì sẽ là địa điểm source code. Với bài `custom-banner`, ta đã lấy source ở local, giờ ta sẽ lấy source từ git. cú pháp như trên

```bash
SRC_URI = "git://github.com/lwfinger/rtl8188eu.git;branch=v5.2.2.4;protocol=https"
```

Ở đây mình chọn branch `v5.2.2.4` chứ không phải `master`, vì trong quá trình build với `master` mình đã gặp lỗi sau

```bash
/home/zk47/Learning/yocto-mp1/build-mp1/tmp/work/stm32mp1-poky-linux-gnueabi/rtl8188eu/1.0+git/git/os_dep/os_intfs.c:757:16: error: 'struct net_device' has no member named 'wireless_handlers'
  757 |         pnetdev->wireless_handlers = (struct iw_handler_def *)&rtw_handlers_def;
...
```

Sau khi lượn 1 hồi các forum, thì cuối cùng mình thử theo cách làm của ông ở đây, switch từ `master` sang `v5.2.2.4` thì lại build ngon lành <https://github.com/lwfinger/rtl8188eu/issues/330>

Nhiều khi cũng mệt mỏi lắm :vv

{{% /details %}}

{{% details title="SRCREV" closed="true" %}}

Source Revision, ở đây mình chọn là mã hash của commit gần nhất trên branch. Các bạn có thể clone thủ công git về rồi check git log để lấy được mã.

![](/uploads/2025/07/image-34.png)

{{% /details %}}

{{% details title="PV" closed="true" %}}

**Package Version**, cái này thì sẽ là version của package bạn build. Ví dụ như đây bạn set là bản 1.0 thì sau khi build xong ở thư mục output sẽ là

```bash
build-bbb/tmp/work/beaglebone-poky-linux-gnueabi/rtl8188eu/1.0+gitAUTOINC+f42fc9c45d-r0
```

`SRCPV` thì là Source revision nhưng đây là cho package. Mình đặt tên như này để thêm sự tường minh rằng mình lấy từ commit nào, package version bao nhiêu, nguồn nào

{{% /details %}}

{{% details title="S = '${WORKDIR}/git'" closed="true" %}}

Sau khi chạy qua lệnh `do_fetch` và `do_unpack`, output của clone git sẽ nằm tại folder git trong build

```bash
build-bbb/tmp/work/beaglebone-poky-linux-gnueabi/rtl8188eu/1.0+gitAUTOINC+f42fc9c45d-r0/git
```

Do đó ta cần định nghĩa cụ thể thêm rằng source code đang nằm ở đâu, tiện cho việc tương tác như make hay insmod

{{% /details %}}

{{% details title="inherit module" closed="true" %}}

Kế thừa lớp Yocto `module.bbclass`, dùng cho **kernel modules**.

Nó giúp:

- Tự động chèn cờ biên dịch phù hợp với kernel
- Đảm bảo dùng đúng kernel headers trong quá trình build
- Gắn module vào hệ thống Yocto

{{% /details %}}

{{% details title="KERNEL_MODULE_AUTOLOAD += '8188eu'" closed="true" %}}

Chỉ định rằng module `8188eu.ko` cần tự động được load khi hệ thống boot.

- Điều này tạo file `8188eu` trong `/etc/modules-load.d/`
- Giúp driver WiFi hoạt động ngay khi boot, không cần `modprobe` thủ công.

{{% /details %}}

{{% details title="do_install()" closed="true" %}}

Chép file `.ko` vào đúng vị trí trong filesystem

{{% /details %}}

{{% details title="FILES:${PN} & RPROVIDES:${PN}" closed="true" %}}

Đây là phần để Yocto đóng gói đúng file và giúp bạn gọi nó bằng tên chuẩn khi thêm vào `IMAGE_INSTALL`

{{% /details %}}

### 2.3 Thay đổi nhỏ trong custom-image-minimal.bb

Với rtl8188eu.bb ta đã có recipes driver cho usb wifi, giờ điều ta cần là thêm driver sau khi build vào được image.

Ta thêm dòng sau vào custom-image-minimal.bb, và để có các command support cho việc kết nối mạng, ta cũng cần bổ sung vào IMAGE_INSTALL, đây là thay đổi của file

```bash
diff --git a/recipes-core/images/custom-image-minimal.bb b/recipes-core/images/custom-image-minimal.bb
index d833726..8469106 100644
--- a/recipes-core/images/custom-image-minimal.bb
+++ b/recipes-core/images/custom-image-minimal.bb
@@ -34,4 +34,14 @@ IMAGE_INSTALL:append = " \
     libgcc \
     libstdc++ \
     libatomic \
+    kernel-module-rtl8188eu \
+    linux-firmware \
+    dhcpcd \
+    iw \
+    wpa-supplicant \
+    wireless-regdb-static \
 "
+
+KERNEL_MODULE_AUTOLOAD:append = " \
+    rtl8188eu \
+    "
```

### 2.4 Build lại image, Test driver và SSH

#### 2.4.1 Build image, test driver

```bash
bitbake -c cleanall custom-image-minimal
bitbake rtl8188eu
bitbake custom-image-minimal
```

Flash và boot vào thẻ nhớ. Ta check với các câu lệnh sau

```bash
root@beaglebone:~# ls /sys/class/net
eth0  lo  wlan0
```

Đã có interface wlan0

```bash
root@beaglebone:~# iw wlan0 scan | grep SSID
command failed: Network is down (-100)
```

Network vẫn ở trạng thái down, ta cần up nó lên :vv rồi chạy lại scan

```bash
root@beaglebone:~# ip link set wlan0 up
[  203.832596] RTW: Invalid Channel 0 of Band 0 in phy_GetChannelIndexOfTxPowerLimit
[  203.840378] RTW: Invalid Channel 0 of Band 0 in phy_GetChannelIndexOfTxPowerLimit
```

![](/uploads/2025/07/image-35.png)

Vậy là USB wifi ta đã hoạt động ok. Mình sẽ thử kết nối SSH từ laptop

#### 2.4.2 Kết nối mạng và SSH

Giả dụ bạn định kết nối đến mạng A, với mật khẩu B, cụ thể là mình có SSID "iPhone", pass "12345689" thì mình sẽ chạy lần lượt các lệnh sau để kết nối

```bash
wpa_passphrase "iPhone" "12345689" > /etc/wpa_supplicant.conf
wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant.conf
dhcpcd wlan0
```

![](/uploads/2025/07/image-36.png)

Vậy là mình đã kết nối được vào mạng và lấy được IP 192.168.0.101

Đứng từ phía laptop mình cũng đã kết nối SSH thành công

![](/uploads/2025/07/image-37.png)

Kết nối SSH qua Visual Studio Code cũng đã ok

![](/uploads/2025/07/image-38.png)

***Ở bài tiếp theo mình sẽ hướng dẫn các bạn kết nối màn SSD1306 0.96 inch I2C với Beaglebone Black***

{{< youtube yKecyurUzfY >}}
