---
title: '[Yocto-STM32MP1] 1. Build và flash core-image-minimal cho STM32MP157'
date: '2025-12-06T07:11:00+07:00'
lastmod: '2025-12-06T07:55:02+07:00'
slug: yocto-stm32mp1-1-build-va-flash-core-image-minimal-cho-stm32mp157
url: /2025/12/06/yocto-stm32mp1-1-build-va-flash-core-image-minimal-cho-stm32mp157/
categories:
- Linux
- STM32MP
- Yocto
tags:
- RemoteProc
series:
- Yocto-STM32MP1
series_order: 1
boards:
- STM32MP157
image: /uploads/2025/10/embedded-linuxlinux.png
description: Ở đây máy mình cài Ubuntu 22.04.5 LTS (Jammy Jellyfish). Mình cài dual boot với windows để tối ưu core
wp_id: 1359
---

## 1. Chuẩn bị bên máy host

Ở đây máy mình cài Ubuntu 22.04.5 LTS (Jammy Jellyfish). Mình cài dual boot với windows để tối ưu core

Dựa theo hướng dẫn bên [Yocto Project Reference Manual](https://docs.yoctoproject.org/2.2.2/ref-manual/ref-manual.html#required-packages-for-the-host-development-system) , mục 1.3.2.1. Ta cài các package sau

```bash
sudo apt-get install gawk wget git-core diffstat unzip texinfo gcc-multilib \
build-essential chrpath socat cpio python3 python3-pip python3-pexpect \
libsdl1.2-dev xterm make xsltproc docbook-utils fop dblatex xmlto
```

## 2. Cấu hình môi trường build

### 1.1 Clone source poky, và meta-layer cần thiết

Đầu tiên ta clone source poky (reference distribution của Yocto project), với branch Scarthgap

```bash
git clone -b scarthgap git://git.yoctoproject.org/poky.git
```

Sau đó ta clone tiếp source code của meta-st-stm32mp là meta layer chuẩn từ hãng ST

```bash
git clone -b scarthgap https://github.com/STMicroelectronics/meta-st-stm32mp.git
```

### 1.2 Sửa file bblayers.conf và local.conf

Ta khởi tạo môi trường build

```bash
source poky/oe-init-build-env build-stm32mp1
```

Chúng ta đọc file README từ trong repo này, ST sẽ miêu tả chúng ta cần thêm các layer nào khi build (<https://github.com/STMicroelectronics/meta-st-stm32mp/blob/scarthgap/README.md>)

![](/uploads/2025/10/image.png)

Do đó ta clone source và bổ sung thêm các layer này vào conf/bblayers.conf

```bash
git clone -b scarthgap git://git.openembedded.org/meta-openembedded
```

```bash
# POKY_BBLAYERS_CONF_VERSION is increased each time build/conf/bblayers.conf
# changes incompatibly
POKY_BBLAYERS_CONF_VERSION = "2"
BBPATH = "${TOPDIR}"
BBFILES ?= ""
BBLAYERS ?= " \
  /home/zk47/Learning/yocto-mp1/poky/meta \
  /home/zk47/Learning/yocto-mp1/poky/meta-poky \
  /home/zk47/Learning/yocto-mp1/poky/meta-yocto-bsp \
  /home/zk47/Learning/yocto-mp1/meta-openembedded/meta-oe \
  /home/zk47/Learning/yocto-mp1/meta-openembedded/meta-python \
  /home/zk47/Learning/yocto-mp1/meta-st-stm32mp \
  "
```

Ta kiểm tra tiếp file [conf/machine/stm32mp1.conf](https://github.com/STMicroelectronics/meta-st-stm32mp/blob/scarthgap/conf/machine/stm32mp1.conf) trong layer để biết ta cần set machine là gì, sau đó ta sửa trong conf/local.conf

```bash
MACHINE = "stm32mp1"
# Configure xz (for low-end host machines with low RAM and lots of swap)
# XZ_DEFAULTS = "--memlimit=1500MiB"
```

Theo gợi ý từ guide của Digikey thì ta có thể bật "XZ_DEFAULTS = "--memlimit=1500MiB"" lên nếu máy host có dung lượng RAM ít, ở đây máy mình RAM và Swap khá nhiều nên mình sẽ comment dòng này đi

Okay, giờ ta tiến hành source thôi, mình sẽ chọn builddir là build-stm32mp1

Okay build thôi

```bash
bitbake core-image-minimal
```

## 3. Flash thẻ nhớ với image build xong

### 3.1 Chuẩn bị thẻ nhớ

Chúng ta cắm thẻ nhớ vào, và unmount các phân vùng hiện tại đi. Ta check bằng câu lệnh lsblk

```bash
mmcblk0     179:0    0  29,2G  0 disk
├─mmcblk0p1 179:1    0   128M  0 part /media/zk47/boot
└─mmcblk0p2 179:2    0 132,4M  0 part /media/zk47/root
```

Ở đây thẻ nhớ mình cắm vào có 2 phân vùng như trên, có thể của bạn sẽ hiện sda1, hoăc sdb1 nhé. Các bạn tiến hành unmount

```bash
sudo umount /media/zk47/root
sudo umount /media/zk47/boot
```

### 3.2 Tiến hành Flash

Trước khi flash các bạn nên biết về flash layout của STM32 các bạn đọc thêm về cái này tại đây [STM32MP1-Software-Platform_boot_BOOT](https://www.st.com/content/ccc/resource/training/technical/product_training/group1/ac/45/53/56/1f/0b/47/68/STM32MP1-Software-Platform_boot_BOOT/files/STM32MP1-Software-Platform_boot_BOOT.pdf/_jcr_content/translations/en.STM32MP1-Software-Platform_boot_BOOT.pdf)

Cũng như xem video hướng dẫn của Digikey 11 phút đầu tiên nhé [Introduction to Embedded Linux Part 3 - Flash SD Card and Boot Process | Digi-Key Electronics](https://www.youtube.com/watch?v=KU8_HMfpv0s&list=PLEBQazB0HUyTpoJoZecRK6PpDG31Y7RPB&index=3)

Okay, xong khi đã xem xong, các bạn sẽ nắm được 1 cách cơ bản, còn đâu về Flash, bạn theo dõi guide từ Digikey sẽ bị cuốn vào fix partition mình nghĩ sẽ khó cho người mới

![](/uploads/2025/10/image-1.png)

Về cơ bản ta sẽ có 1 số phân vùng như sau.

Ta dùng script sẵn của ST cung cấp để chia phân vùng, ta vào folder build-stm32mp1/tmp/deploy/images/stm32mp1

```bash
sudo ./scripts/create_sdcard_from_flashlayout.sh ./flashlayout_core-image-minimal/optee/FlashLayout_sdcard_stm32mp157d-dk1-optee.tsv
```

Tức là bạn chạy script, với 1 parameter là layout.tsv (ở đây mình chọn optee, các bạn chưa cần hiểu ngay nó khác nhau như nào, tạm thời là flash trước :vv )

Sau khi chạy xong, ta sẽ có chạy tiếp chính dòng in ra ở terminal sau câu "To put this raw image on sdcard:"

```bash
sudo dd if=/home/zk47/Youtube/Yocto/yocto-stm32mp1/build-stm32mp1/tmp/deploy/images/stm32mp1/flashlayout_core-image-minimal/optee/../../FlashLayout_sdcard_stm32mp157d-dk1-optee.raw of=/dev/mmcblk0 bs=8M conv=fdatasync status=progress
```

Các bạn tút thẻ nhớ ra cắm lại.

Okay giờ đã có phân vùng theo file tsv kia, trong file tsv này cũng đã gợi ý chúng ta file gì để vào đâu rồi, các bạn để ý 4 dòng cuối.

```bash
P	0x10	bootfs	System	mmc0	0x00984400	st-image-bootfs-poky-stm32mp1.bootfs.ext4
P	0x11	vendorfs	FileSystem	mmc0	0x04984400	st-image-vendorfs-poky-stm32mp1.vendorfs.ext4
P	0x12	rootfs	FileSystem	mmc0	0x05984400	core-image-minimal-stm32mp1.rootfs.ext4
P	0x13	userfs	FileSystem	mmc0	0x105984400	st-image-userfs-poky-stm32mp1.userfs.ext4
```

Đúng như gợi ý, ta copy những file này vào phân vùng, tuy nhiên chỉ cần rootfs, và bootfs để board khởi động lên thôi, nhớ unmount 2 phân vùng này trước

```bash
zk47@ltu:~/Youtube/Yocto/yocto-stm32mp1/build-stm32mp1/tmp/deploy/images/stm32mp1$ sudo dd if=core-image-minimal-stm32mp1.rootfs.ext4 of=/dev/mmcblk0p10 bs=1M status=progress
zk47@ltu:~/Youtube/Yocto/yocto-stm32mp1/build-stm32mp1/tmp/deploy/images/stm32mp1$ sudo dd if=st-image-bootfs-poky-stm32mp1.bootfs.ext4 of=/dev/mmcblk0p8 bs=1M status=progress
zk47@ltu:~/Youtube/Yocto/yocto-stm32mp1/build-stm32mp1/tmp/deploy/images/stm32mp1$ sync
```

Okay, các bạn tút thẻ nhớ và cắm lại vào board

Với STM32MP157, sau khi cắm st-link thì nó sẽ là ở tại /dev/ttyACM0 nhé

```bash
sudo picocom -b 115200 /dev/ttyACM0
```

Kết quả sẽ là đây

```bash
Poky (Yocto Project Reference Distro) 5.0.13 stm32mp1 /dev/ttySTM0
stm32mp1 login: root
WARNING: Poky is a reference Yocto Project distribution that should be used for
testing and development purposes only. It is recommended that you create your
own distribution for production use.
```

Ở bài tới mình sẽ hướng dẫn các bạn cách tạo patch Device Tree để enable I2C nhé

Rất mong nhận được sự ủng hộ, đóng góp từ các bạn !!
