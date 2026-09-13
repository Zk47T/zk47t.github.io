---
title: '[Yocto-BBB] 5. Thay đổi banner sau khi đăng nhập'
date: '2025-07-26T09:37:00+07:00'
lastmod: '2025-12-09T20:52:19+07:00'
slug: yocto-bbb-5-thay-doi-banner-sau-khi-dang-nhap
url: /2025/07/26/yocto-bbb-5-thay-doi-banner-sau-khi-dang-nhap/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 5
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Mục tiêu của chúng ta sau bài này là sau khi đăng nhập ta sẽ hiện ra màn hình như sau
wp_id: 382
---

Mục tiêu của chúng ta sau bài này là sau khi đăng nhập ta sẽ hiện ra màn hình như sau

(Nếu các bạn gặp khó khăn trong quá trình thực hành theo blog, các bạn có thể tham khảo video thực hành của mình ở cuối bài )

![](/uploads/2025/06/image-21.png)

Để in ra được dòng này trên màn hình, ta sẽ phải chạy 1 script nào đó. Để trigger script đó ta có thể dùng 1 service, rồi cài đặt trong systemd, nhưng việc cài đặt sẽ phức tạp hơn.

Mình sẽ hướng đến việc dùng luồng có sẵn để trigger script mình tạo. Việc tạo service mình sẽ làm trong các bài sau

## 1. Viết script trên board

### 1.1 Luồng chạy sau khi đăng nhập

Sau khi tìm hiểu mình biết được luồng của giai đoạn đăng nhập có chạy file script `/etc/profile`

Bên trong có đoạn code sau

```bash
if [ -d /etc/profile.d ]; then
        for i in /etc/profile.d/*.sh; do
                if [ -f $i -a -r $i ]; then
                        . $i
                fi
        done
        unset i
fi
```

Hiểu đơn giản là sẽ chạy mọi file có đuôi .sh trong `/etc/profile.d` Vậy chúng ta sẽ đưa file script của mình vào đây là nó sẽ auto chạy sau khi đăng nhập

### 1.2 Viết banner.sh

Nội dung của banner.sh thì khá đơn giản mình chỉ in ra dòng ZK47 có chút cách điệu, cùng các thông số Uptime, Hostname, Disk Usage, Memory

Tạo file

```bash
touch banner.sh
```

Để tạo dòng chữ tùy theo tên mình, các bạn có thể truy cập trang sau <https://patorjk.com/software/taag/#p=display&f=Big&t=ZK47> và tạo dòng chữ, rồi copy vào script. Nội dung file mình đang để như sau

```bash
#!/bin/sh
echo "
 ______  ___  _ _____
|__  / |/ / || |___  |
  / /| ' /| || |_ / /
 / /_| . \|__   _/ /
/____|_|\_\  |_|/_/

Uptime     : $(uptime)
Hostname   : $(hostname)
Disk Usage : $(df -h | awk '/\/$/ {print $3 " used of " $2}')
Memory     : $(free | awk '/Mem:/ {printf "%.1fM used of %.1fM", $3/1024, $2/1024}')
"
```

```bash
chmod +x banner.sh
cp banner.sh /etc/profile.d/
reboot
```

Lưu ý ở đây mình đang đăng nhập với `root`, vì trong `core-image-minimal` này thậm chí không có package `sudo`

Và ok, thành công thay đổi nếu dùng thủ công thêm script.

## 2. Tạo recipes copy script tới board

### 2.1 Tạo recipes

Hiện tại mình đang tạo core-image-minimal trong recipes-core, nên mình cũng dùng chung container này luôn. Cấu trúc folder như sau

```bash
zk47@zk47-ltu:~/Learning/poky/meta-bbb/recipes-core$ tree
.
├── custom-banner
│   ├── custom-banner
│   │   ├── banner.sh
│   │   └── COPYING.MIT
│   └── custom-banner.bb
└── images
    └── core-image-minimal.bbappend

3 directories, 4 files
```

Nội dung banner.sh giống với **mục 1** bên trên

### 2.2 Nội dung file custom-banner.bb

Nội dung file, ở đây mình sẽ phân tích sâu về từng biến từng trường bằng

```bash
bitbake -e custom-banner | grep ^{VAR_NAME}
```

```bash
TMPDIR = "${TOPDIR}/tmp"

FILESEXTRAPATHS:prepend := "${THISDIR}/${PN}:"
SRC_URI = "file://banner.sh file://COPYING.MIT"

DESCRIPTION = "ZK47 login banner with system info"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://COPYING.MIT;md5=3da9cfbcb788c80a0384361b4de20420"

S = "${WORKDIR}"

do_install() {
    install -d ${D}${sysconfdir}/profile.d
    install -m 0755 ${WORKDIR}/banner.sh ${D}${sysconfdir}/profile.d/
}
```

- `TOPDIR`="*/home/zk47/Learning/poky/build-bbb*"
- `TMPDIR`="*/home/zk47/Learning/poky/build-bbb/tmp*"
- `THISDIR`="*/home/zk47/Learning/poky/meta-bbb/recipes-core/custom-banner*"
- `PN`="*custom-banner*"
- `FILESEXTRAPATHS`="*/home/zk47/Learning/poky/meta-bbb/recipes-core/custom-banner/custom-banner*
- `S` = `WORKDIR` = "*/home/zk47/Learning/poky/build-bbb/tmp/work/armv7at2hf-neon-oe-linux-gnueabi/custom-banner/1.0-r0*"
- `D`="/*home/zk47/Learning/poky/build-bbb/tmp/work/armv7at2hf-neon-oe-linux-gnueabi/custom-banner/1.0-r0/image*"
- `sysconfigdir`="*/etc*"

Vậy lần lượt các tác vụ mình làm trong bitbake recipe này là

- Đặt `build-bbb/tmp` là output cho recipe của mình (Nếu không set lại thì nó sẽ output ra tại build-bbb/tmp-glibc là 1 default value)
- Đặt `FILESEXTRAPATHS` tại */recipes-core/custom-banner/custom-banner* : Mình làm thế vì trong folder đó mình lưu tất cả các file mình sẽ dùng, bao gồm cả file mình copy vào board
- Về `LICENSE`, Yocto có một quy tắc QA bắt buộc:\
  Nếu một recipe có `SRC_URI`, tức là nó cài file vào rootfs, thì phải có `LICENSE` và `LIC_FILES_CHKSUM`
- Về `do_install`, ta sử dụng câu lệnh `install` là 1 lệnh toàn năng có thể tạo folder (-d) đổi mode cho file (-m).\
  Ở đây đúng như miêu tả, mình đang tạo ra folder /etc/profile.d rồi sau đó copy file banner.sh vào đó, rồi đổi sang mode 0755

```bash
source oe-init-build-env build-bbb
```

Có 1 lưu ý khi chạy source script này thì luôn đứng ở thư mục poky clone về (nếu không sẽ không tìm thấy script hoặc sẽ tạo thêm 1 thư mục build-bbb)

```bash
bitbake custom-banner
```

Ta check trong WORKDIR

![](/uploads/2025/06/image-22.png)

Hiểu đơn giản thì khi build ra các recipe, các file trong thư mục image sẽ được merge vào với nhau, rồi sau đó được cho vào trong image build (root file system của image)

### 2.3 Bước cuối và test trên board

Tuy ta đã tạo ra được 1 recipes riêng, tuy nhiên khi build thì ta đang build core-image-minimal, là 1 recipes riêng. Do đó ta phải thêm điều kiện khi build core-image-minimal thì có build cả custom-banner

Do đó ta thêm dòng sau trong core-image-minimal.bbappend

![](/uploads/2025/06/image-23.png)

Vậy là đã xong, bước cuối là build lại image

```bash
bitbake -c cleanall core-image-minimal
bitbake core-image-minimal
```

Thành quả sau cùng giống với mục tiêu đặt ra :v

![](/uploads/2025/06/image-24.png)

Ở đây, trên banner ta thấy 1 điều lạ. Toàn bộ Disk usage chỉ 34Mb, nhưng thẻ nhớ mình đang dùng tận 32gb, do đó có 1 cơ chế nào đó khiến RFS (Root file system đang fix-sized, không tự mở rộng)

### 2.4 Sửa kích thước Root partititon

Hiện tại check log.do_image.wic (/home/zk47/Learning/poky/build-bbb/tmp/work/beaglebone-poky-linux-gnueabi/core-image-minimal/1.0-r0/temp/log.do_image_wic) ta sẽ thấy 1 dòng là

```bash
INFO: The image(s) were created using OE kickstart file:
  /home/zk47/Learning/poky/meta-ti/meta-ti-bsp/wic/sdimage-2part.wks
```

Nội dung file sdimage2part.wks như sau

```bash
part --source bootimg-partition --fstype=vfat --label boot --active --align 1024 --use-uuid --fixed-size 128M
part / --source rootfs --fstype=ext4 --label root --align 1024 --use-uuid
```

Các bạn có thể đọc thêm tại đây để thêm bbappend sửa lại 1 cách hợp lý <https://docs.yoctoproject.org/ref-manual/kickstart.html>

Ta có thể thêm option sau cho part /

```bash
--overhead-factor
```

Với Number lớn hơn 1, default đang là 1.3. Ví dụ để Number là 5, thì Root build ra 100mb, wic kickstart sẽ define phân vùng Root là 500mb.

1 cách khác mình sẽ dùng các biến được define trước của Yocto để thay đổi kích cỡ

Ví dụ mình sẽ thêm các dòng sau vào core-image-minimal.bbappend

```bash
IMAGE_OVERHEAD_FACTOR ?= "1.0"
IMAGE_ROOTFS_SIZE ?= "204800"
IMAGE_ROOTFS_MAXSIZE = "2097152"
```

Việc sửa các thông số này giúp bạn tối ưu được dung lượng trên thẻ sdcard, nhưng đây là cho quá trình build image

Sau khi build xong các bạn hoàn toàn có thể tự tạo partition trên thẻ nhớ rồi resize tùy ý mình.

***Ở bài tiếp theo mình sẽ nói về cách Enable Ethernet và SSH vào board qua CMD cũng như cả Visual Studio Code, các bạn cùng đón đọc nhé***

{{< youtube WDAagNhjIRI >}}
