---
title: '[Yocto-BBB] 4. Thay đổi Distro Description'
date: '2025-07-19T09:21:00+07:00'
lastmod: '2026-06-19T14:07:15+07:00'
slug: yocto-bbb-4-thay-doi-distro-description
url: /2025/07/19/yocto-bbb-4-thay-doi-distro-description/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 4
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Như bài trước đã nói, mục tiêu của bài này mình sẽ thay đổi distro description từ "Poky (Yocto Project Reference Distro)" sang dòng hiển thị custom theo cá nhân
wp_id: 305
---

Như bài trước đã nói, mục tiêu của bài này mình sẽ thay đổi distro description từ "Poky (Yocto Project Reference Distro)" sang dòng hiển thị custom theo cá nhân

## Thay đổi Distro Description

Đầu tiên ta tìm xem, vậy trong repo poky, dòng chữ này được chứa trong file nào sau khi build xong image

![](/uploads/2025/06/image-16.png)

Về đúng luồng chạy, DISTRO_NAME từ meta-poky/conf/distro/poky.conf sẽ được truyền vào issue.net. Bởi theo repo ban đầu, issue và issue.net là rỗng, các bạn có thể check tại

<https://github.com/yoctoproject/poky/blob/scarthgap/meta/recipes-core/base-files/base-files/issue>

Ngoài DISTRO_NAME sẽ có cả DISTRO_VERSION(4.0.28) được truyền vào issue.net, sau đó issue.net lại được append sang issue rồi cài đặt vào hệ thống tại /etc/issue

## 1. Tạo conf/distro

Ta tạo nội dung thư mục ./conf/distro như sau

```bash
zk47@zk47-ltu:~/Learning/poky/meta-bbb$ tree
.
├── conf
│ ├── distro
│ │ └── bbbdistro.conf
│ └── layer.conf
```

file bbbdistro.conf có nội dung

```bash
# meta-zk47 distro config
DISTRO = "bbbdistro"
DISTRO_NAME = "ZK47 Embedded Linux"
DISTRO_VERSION = "1.0"
DISTRO_CODENAME = "elite"
DISTRO_DESCRIPTION = "A sleek, custom Linux distro by ZK47"

# Inherit the default poky behavior
include conf/distro/poky.inc
```

Lưu ý rằng giá trị biến DISTRO phải giống với tên file conf (bbbdistro)

## 2. Set DISTRO conf/local.conf

Sau đó ta set DISTRO trong ./build-bbb/conf/local.conf bằng bbbdistro

```bash
zk47@zk47-ltu:~/Learning/poky/build-bbb$ cat ./conf/local.conf | grep "DISTRO = "
DISTRO = "bbbdistro"
```

Về cấu trúc folder, Các bạn có thể tham khảo meta-bbb mình đã push lên github <https://github.com/Zk47T/meta-bbb>

![](/uploads/2025/06/image-14.png)

## 3. Build lại và check thông tin

```bash
bitbake -c cleanall core-image-minimal
bitbake core-image-minimal
```

Ta thấy ở đây, DISTRO và DISTRO_VERSION đã thay đổi theo cái ta set trong bbbdistro.conf

![](/uploads/2025/06/image-15.png)

Build lại và check dễ thấy issue.net và issue file nội dung đã thay đổi

![](/uploads/2025/06/image-18.png)

1 lưu ý là sau khi đã đổi distro, output image sẽ không còn ở vị trí cũ nữa, ta check bằng cách

```bash
zk47@zk47-ltu:~/Learning/poky/build-bbb$ bitbake -e core-image-minimal | grep "^WORKDIR"
WORKDIR="/home/zk47/Learning/poky/build-bbb/tmp/work/beaglebone-oe-linux-gnueabi/core-image-minimal/1.0-r0"
```

Có 1 thủ thuật nhỏ dùng (ls -al) để tránh việc copy nhầm file đó là mình luôn check thời gian build sau khi vào folder. Đôi khi do Bitbake vẫn lưu state dẫn đến việc không trigger build lại image.

![](/uploads/2025/07/image-9.png)

Flash lại thẻ nhớ theo image mới và cấp nguồn cho board

![](/uploads/2025/06/image-19.png)

***---> Bài tiếp theo mình sẽ hướng dẫn các bạn về cách thay đổi banner sau khi đăng nhập, cũng như cách để cài 1 file vào trong board.***

![](/uploads/2025/06/image-20.png)
