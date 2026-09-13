---
title: '[Yocto-BBB] 1. Build Beaglebone Black Image Bằng Yocto Project'
date: '2025-06-28T17:54:46+07:00'
lastmod: '2026-05-14T09:47:34+07:00'
slug: yocto-bbb-1-build-beaglebone-black-image-bang-yocto-project
url: /2025/06/28/yocto-bbb-1-build-beaglebone-black-image-bang-yocto-project/
categories:
- Beaglebone
- Yocto
tags:
- Beaglebone Black
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 1
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Bắt đầu series về build bủng bằng Yocto thôi, bài đầu sẽ về build cho Beaglebone Black.
wp_id: 206
---

Bắt đầu series về build bủng bằng Yocto thôi, bài đầu sẽ về build cho Beaglebone Black.

(Nếu các bạn gặp khó khăn trong quá trình thực hành theo blog, các bạn có thể tham khảo video thực hành của mình ở cuối bài )

![](/uploads/2025/06/image-25.png)

### 1. Chuẩn bị bên máy host (Máy để build)

Ở đây máy mình cài [Ubuntu 22.04.5 LTS (Jammy Jellyfish)](https://releases.ubuntu.com/jammy). Mình cài dual boot với windows để tối ưu core

Dựa theo hướng dẫn bên [Yocto Project Reference Manual](https://docs.yoctoproject.org/2.2.2/ref-manual/ref-manual.html#required-packages-for-the-host-development-system) , mục 1.3.2.1. Ta cài các package sau

```bash
sudo apt-get -y install gawk wget git-core diffstat unzip texinfo gcc-multilib \
     build-essential chrpath socat cpio python3 python3-pip python3-pexpect \
     libsdl1.2-dev xterm make xsltproc docbook-utils fop dblatex xmlto lz4
```

### 2. Clone source code

Chúng ta dùng bản poky là 1 repo mẫu từ bên Yocto Project (reference repo) với phiên bản Scarthgap 5.0.

```bash
git clone -b scarthgap git://git.yoctoproject.org/poky/

cd poky

git clone -b scarthgap git://git.openembedded.org/meta-openembedded

git clone -b scarthgap git://git.yoctoproject.org/meta-ti

git clone -b scarthgap https://git.yoctoproject.org/meta-arm
```

### 3. Setup và build

#### 3.1. Tạo môi trường build

```bash
source oe-init-build-env build-bbb
```

Câu lệnh này sẽ

- Set $OEROOT : Xác định thư mục gốc của yocto
- Set $PATH : Thêm bitbake vào path của session terminal, giống kiểu thêm vào biến môi trường ở Windows
- Set $BUILDDIR : Chọn thư mục output ./build-bbb (default sẽ là build, nhưng nếu chạy cho nhiều board thì nên chia riêng)
- Set $BBPATH : Để bitbake tìm thấy các layer
- Tạo cấu trúc thư mục $BUILDDIR

![](/uploads/2025/06/image-2.png)

### 3.2 Thay đổi conf file

Thông thường ta sẽ thay đổi config file của môi trường build, bằng các layer, tuy nhiên ở đây để đơn giản mình sẽ thay đổi trong local.conf

```bash
nano ./build-bbb/conf/local.conf
```

Ta thay đổi MACHINE ?= "beaglebone"

```bash
nano ./build-bbb/conf/bblayers.conf
```

Ta add thêm các meta-openembedded, meta-arm, meta-ti, để có thêm các tính năng sẽ dùng sau

```groovy
POKY_BBLAYERS_CONF_VERSION = "2"

BBPATH = "${TOPDIR}"
BBFILES ?= ""

BBLAYERS ?= " \
/home/zk47/Learning/poky/meta \
/home/zk47/Learning/poky/meta-poky \
/home/zk47/Learning/poky/meta-yocto-bsp \
/home/zk47/Learning/poky/meta-openembedded/meta-oe \
/home/zk47/Learning/poky/meta-arm/meta-arm-toolchain \
/home/zk47/Learning/poky/meta-arm/meta-arm \
/home/zk47/Learning/poky/meta-ti/meta-ti-bsp \
/home/zk47/Learning/poky/meta-ti/meta-ti-extras \
/home/zk47/Learning/poky/meta-ti/meta-beagle \
"
```

Lưu ý đường dẫn trong BBLAYERS là đường dẫn tuyệt đối tới các meta-layers, do đó sẽ tùy theo máy.

### 3.3 Build thôi

```bash
bitbake core-image-minimal
```

Ở đây mình chọn image này vì đúng như tên gọi, nó là cái tinh giản nhất, đúng chỉ là lên được OS, số lượng package rất it, nên build nhanh.

Mình dùng laptop chip 13700H, 14 core 20 luồng. Thời gian build rơi vào tầm hơn 1 tiếng

![](/uploads/2025/06/image-3.png)

### 4. Flash image SD card

#### 4.1 Check image

Sau khi build xong nếu các bạn không biết output ở đâu có thể check bằng câu lệnh

```bash
bitbake -e core-image-minimal | grep ^WORKDIR=
```

- bitbake -e \<recipe> : Liệt kê environment hay các biến được set trong 1 recipe
- grep ^WORKDIR= : tìm các dòng bắt đầu bằng "WORKDIR="

Output của câu lệnh sẽ dạng

```bash
zk47@zk47-ltu:~/Learning/poky/build-bbb$ bitbake -e core-image-minimal | grep ^WORKDIR=
WORKDIR="/home/zk47/Learning/poky/build-bbb/tmp/work/beaglebone-oe-linux-gnueabi/core-image-minimal/1.0-r0"
```

Các bạn vào được thư mục đó rồi mở tiếp folder deploy image sau cùng

```bash
cd /home/zk47/Learning/poky/build-bbb/tmp/work/beaglebone-oe-linux-gnueabi/core-image-minimal/1.0-r0
cd deploy-core-image-minimal-image-complete
```

#### 4.2 Copy image sang sd card

Trong thư mục này sẽ có rất nhiều image

![](/uploads/2025/06/image-4.png)

Nhưng để cho nhanh mình sẽ dùng image .wic.xz (tối ưu việc copy hơn do có bmap)

Các bạn cắm sd card vào, nếu đã có phân vùng được mount thì nhớ unmount trước, check bằng câu lệnh lsblk

![](/uploads/2025/06/image-5.png)

Như ở đây thẻ nhớ mình đang nhận ở /dev/mmcblk0 và có 2 phân vùng đã được mount do đó ta cần umount nó trước

```bash
sudo umount /media/zk47/boot /media/zk47/root
```

Sau đó ta copy sử dụng bmaptool

```bash
sudo bmaptool copy core-image-minimal-beaglebone.wic.xz /dev/mmcblk0
```

Và thế là xong, ta đã build thành công và flash vào thẻ nhớ. Giờ ta cắm thẻ nhớ vào BBB và test thôi

Lưu ý giữ button S2 (boot button) để BBB nhận boot từ MMC1 là thẻ nhớ, nếu không giữ button S2 BBB sẽ boot từ MMC2 là eMMC.

![](/uploads/2025/06/figure-6-5.png)

--> Chúng ta sẽ đăng nhập bằng user root, không có mật khẩu

![](/uploads/2025/06/image-6.png)

--> [**[Yocto-BBB] 2. UART Debug Board và Bitbake Append**](/2025/07/05/yocto-bbb-2-uart-debug-board/)

{{< youtube 5hR5LsSi4-s >}}
