---
title: '[Yocto-BBB] 20. Build Yocto 6.0 wrynose cho board Beaglebone Black'
date: '2026-06-20T06:09:00+07:00'
lastmod: '2026-06-26T10:10:45+07:00'
slug: yocto-bbb-20-build-yocto-6-0-wrynose-cho-board-beaglebone-black
url: /2026/06/20/yocto-bbb-20-build-yocto-6-0-wrynose-cho-board-beaglebone-black/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 20
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Vậy là tròn 1 năm từ hồi mình đăng bài đầu tiên về build Yocto cho Beaglebone Black. Ban đầu mình dùng phiên bản Kirkstone, sau đó update lên Scarthgap và mì…
wp_id: 2541
---

Vậy là tròn 1 năm từ hồi mình đăng bài đầu tiên về build Yocto cho Beaglebone Black. Ban đầu mình dùng phiên bản Kirkstone, sau đó update lên Scarthgap và mình nghĩ là nó sẽ khá bền :vv , nhưng lên phiên bản Wrynose đã có sự thay đổi khá lớn về cấu trúc. Nên mình viết thêm bài này về cách build ở version mới nhé, mình nghĩ từ bản 6.0 này trở đi, cấu trúc sẽ được giữ nguyên.

## 1. Chuẩn bị máy bên host

```bash
sudo apt install -y gawk wget git diffstat unzip texinfo gcc build-essential \
     chrpath socat cpio python3 python3-pip python3-pexpect xz-utils \
     debianutils iputils-ping python3-git python3-jinja2 python3-subunit \
     zstd liblz4-tool file locales libacl1
sudo locale-gen en_US.UTF-8
```

## 2. Clone source code

Ngày xưa lúc học, đa số ta sẽ clone poky là reference distro từ Yocto Project và build quanh nó. Thực tế đi làm, các dự án sẽ luôn define distro của riêng mình. Do đó, giờ họ sẽ không support poky git nữa, mà thành meta-poky với poky distro bên trong, nếu ta dùng thì sẽ chọn, không thì chỉ lấy cái lõi openembedded-core và các meta cần thiết thôi

```bash
mkdir -p ~/yocto-bbb/layers
cd ~/yocto-bbb/layers
```

Ta để các meta clone về trong folder layers (Theo [hướng dẫn chuẩn từ Yocto Project](https://docs.yoctoproject.org/dev-manual/poky-manual-setup.html#use-git-to-clone-the-layers))

```bash
git clone -b 2.18    https://git.openembedded.org/bitbake
git clone -b wrynose https://git.openembedded.org/openembedded-core
git clone -b wrynose https://git.yoctoproject.org/meta-yocto
```

Thêm các BSP và extra-layer cho Beaglebone Black

```bash
git clone -b wrynose https://git.openembedded.org/meta-openembedded
git clone -b wrynose https://git.yoctoproject.org/meta-arm
git clone -b wrynose https://git.yoctoproject.org/meta-ti
```

## 3. Khởi tạo môi trường và build

### 3.1 Khởi tạo môi trường

Giờ oe-init-build-env sẽ lấy từ openembedded-core chứ không từ poky nữa, nên default sẽ là DISTRO= "nodistro".

```bash
cd ~/yocto-bbb/
source layers/openembedded-core/oe-init-build-env build-bbb
```

Câu lệnh này sẽ

- Set $OEROOT : Xác định thư mục gốc của yocto
- Set $PATH : Thêm bitbake vào path của session terminal, giống kiểu thêm vào biến môi trường ở Windows
- Set $BUILDDIR : Chọn thư mục output ./build-bbb (default sẽ là build, nhưng nếu chạy cho nhiều board thì nên chia riêng)
- Set $BBPATH : Để bitbake tìm thấy các layer
- Tạo cấu trúc thư mục $BUILDDIR

### 3.2 Sửa lại conf file

Đầu tiên là add layer vào bblayers.conf

```bash
bitbake-layers add-layer ../layers/meta-yocto/meta-poky
bitbake-layers add-layer ../layers/meta-yocto/meta-yocto-bsp
bitbake-layers add-layer ../layers/meta-openembedded/meta-oe
bitbake-layers add-layer ../layers/meta-arm/meta-arm-toolchain
bitbake-layers add-layer ../layers/meta-arm/meta-arm
bitbake-layers add-layer ../layers/meta-ti/meta-ti-bsp
bitbake-layers add-layer ../layers/meta-ti/meta-ti-extras
bitbake-layers add-layer ../layers/meta-ti/meta-beagle
bitbake-layers show-layers
```

Okay, giờ các bạn mở build-bbb/conf/local.conf lên và thêm dòng MACHINE = "beaglebone" là ta xong phần config

Thực tế bên trên mình đã clone meta-poky, thì bạn có thể hoàn toàn set DISTRO= "poky" và làm các cái tương tự như guide cũ.

### 3.3 Và build thôi

```bash
bitbake core-image-minimal
```

Việc flash và debug các bạn tham khảo 2 bài [Yocto-BBB 1](/2025/06/28/yocto-bbb-1-build-beaglebone-black-image-bang-yocto-project/) và [Yocto-BBB 2](/2025/07/05/yocto-bbb-2-uart-debug-board/) nhé !!

Chúc các bạn thực hành thành công
