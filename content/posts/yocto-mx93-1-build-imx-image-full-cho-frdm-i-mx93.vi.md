---
title: '[Yocto-MX93] 1. Build imx-image-full cho FRDM-i.MX93'
date: '2026-01-31T22:07:48+07:00'
lastmod: '2026-02-09T22:20:20+07:00'
slug: yocto-mx93-1-build-imx-image-full-cho-frdm-i-mx93
url: /2026/01/31/yocto-mx93-1-build-imx-image-full-cho-frdm-i-mx93/
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
series_order: 1
boards:
- FRDM i.MX93
image: /uploads/2025/11/screenshot-from-2025-11-18-22-03-24.png
description: Ở các series Yocto cho Beaglebone Black, STM32MP157, mình đã làm nhiều về các tính năng căn bản, cách dùng yocto và đi lên từ core-image-minimal. Lần này mìn…
wp_id: 1639
---

Ở các series Yocto cho Beaglebone Black, STM32MP157, mình đã làm nhiều về các tính năng căn bản, cách dùng yocto và đi lên từ core-image-minimal. Lần này mình sẽ build các tính năng cho board FRDM i.MX93 từ image full của hãng luôn.

## 1. Khởi tạo repo, lấy source code

Đầu tiên các bản tải i.MX SW 2024 Q3 BSP Release về

```bash
repo init -u https://github.com/nxp-imx/imx-manifest -b imx-linux-scarthgap -m imx-6.6.36-2.1.0.xml
repo sync
```

Tiếp theo các bạn tải FRDM-MX93 layer về thư mục source của Yocto

```bash
cd ${MY_YOCTO}/sources
git clone https://github.com/nxp-imx-support/meta-imx-frdm.git
```

Trước mình có thử build core-image-minimal cho board này, nếu không lấy meta-imx-frdm về, Kernel khi build sẽ không tìm thấy Device Tree cho board, vì DT của board này không được NXP đẩy nên Linux git mainline (Hoặc chưa được merged)

## 2. Cấu hình build, và fix lỗi build

### 2.1 Cấu hình build

Ta cấu hình machine và distro. Ở các bài Yocto trước, mình set luôn trong local.conf cho MACHINE và DISTRO, tuy nhiên các bạn hoàn toàn có thể export 2 biến này tại terminal khi chạy

```bash
MACHINE=imx93frdm DISTRO=fsl-imx-xwayland source sources/meta-imx-frdm/tools/imx-frdm-setup.sh -b frdm-imx93
```

Có 1 lưu ý cho các lần sau bạn chạy. Mỗi khi bạn chạy câu lệnh trên local.conf và bblayers.conf sẽ được reset lại về template từ repo mẫu.

Do đó, nếu các bạn sửa gì trong local.conf hoặc bblayers.conf thì copy ra đâu đó trước rồi chạy xong lại copy lại. Tránh khi bạn thêm layers, hoặc cài config mới trong local.conf, mà khi build lại lại không thấy thay đổi gì.

Để build thì ta chạy

```bash
bitbake imx-image-full
```

Máy mình 14 cores 20 luồng, chạy mất tầm 5 tiếng thì phải

### 2.2 Fix lỗi khi build

Trong khi build thì mình gặp 1 lỗi như sau khi build recipes onnxruntime (1 recipes liên quan đến Machine learning gì đó )

```cpp
undefined reference to `onnxruntime::perftest::CommandLineParser::Show Usage()
```

Sau khi tìm hiểu trên mạng thì mình thấy có người bị lỗi tương tự khi build onnxruntime nhưng không phải trên Yocto tại <https://github.com/microsoft/onnxruntime/issues/4273>

Mình làm tương tự và sửa file onnxruntim.bb luôn

```bash
zk47@ltu:~/Learning/yocto-imx93/sources/meta-imx/meta-imx-ml/recipes-libraries/onnxruntime$ git diff onnxruntime_1.17.1.bb
diff --git a/meta-imx-ml/recipes-libraries/onnxruntime/onnxruntime_1.17.1.bb b/meta-imx-ml/recipes-libraries/onnxruntime/onnxruntime_1.17.1.bb
index 8570e080f9..694fab34e5 100644
--- a/meta-imx-ml/recipes-libraries/onnxruntime/onnxruntime_1.17.1.bb
+++ b/meta-imx-ml/recipes-libraries/onnxruntime/onnxruntime_1.17.1.bb
@@ -7,6 +7,7 @@ LIC_FILES_CHKSUM_model = "file://${S}/example-models/squeezenet/LICENSE;md5=3b83
 LIC_FILES_CHKSUM = "${LIC_FILES_CHKSUM_runtime} ${LIC_FILES_CHKSUM_model}"

 DEPENDS = "libpng zlib"
+DEPENDS += " protobuf re2 rsync"

 inherit setuptools3

@@ -33,6 +34,13 @@ EXTRA_OECMAKE += "\
     -Donnxruntime_BUILD_UNIT_TESTS=ON \
 "

+EXTRA_OECMAKE += "\
+    -DProtobuf_PROTOC_EXECUTABLE=${STAGING_BINDIR_NATIVE}/protoc \
+    -DProtobuf_INCLUDE_DIR=${STAGING_INCDIR} \
+    -DProtobuf_LIBRARY=${STAGING_LIBDIR}/libprotobuf.so \
+    -Donnxruntime_USE_NSYNC=ON \
+"
+
 PYTHON_DEPENDS = "\
     ${PYTHON_PN} \
     ${PYTHON_PN}-pip-native \
```

Và ta build lại luôn, để tránh lỗi do ccache từ task trước sinh ra (Mình nghĩ do cache mà sau khi sửa mình lại lỗi tiếp qtbase), thì ta chạy task sau

```bash
bitbake -c cleansstate qtbase && bitbake -c cleanall onnxruntime
bitbake imx-image-full
```

## 3. Flash SD card và sử dụng GoPoint demo

### 3.1 Flash thẻ SD

Ta vào thư mục Output (Các bạn có thể check biến $WORKDIR nhé) rồi flash thẻ sd (thay thế /dev/sdX theo thẻ nhớ của bạn nhé)

```bash
zstdcat imx-image-full-imx93frdm.rootfs.wic.zst | sudo dd of=/dev/sdx bs=1M && sync
```

1 gợi ý khác là ta dùng tool uuu

```bash
uuu -b sd_all imx-image-full-imx93frdm.rootfs.wic.zst
```

Hiện tại config gốc đang không dùng output có bmap image, do đó bạn không dùng được bmaptool như trong series Yocto mình từng viết

### 3.2 Cắm thẻ và GoPoint demo

![](/uploads/2025/11/image-10.png)

Các bạn chọn 0011 tại boot switch để boot từ uSD card

Cổng nguồn và Serial Debug trên board là 2 chân type C đó.

Nếu trên Linux sẽ là /dev/ttyACM0, các bạn mở port này lên nhé

```bash
sudo picocom -b 115200 /dev/ttyACM0
```

Bản image này là bản có giao diện, nên bạn cũng cắm màn để trải nghiệm được GoPoint demo

{{< youtube u_fRh0GKZY0 >}}

Các bạn có thể đọc thêm guide từ hãng để có Matter, cũng như build Debian 12 cho board

## 4. Tham khảo

<https://www.nxp.com/document/guide/getting-started-with-frdm-imx93:GS-FRDM-IMX93?section=out-of-the-box>

<https://www.nxp.com/document/guide/getting-started-with-frdm-imx93:GS-FRDM-IMX93?section=build-and-run>
