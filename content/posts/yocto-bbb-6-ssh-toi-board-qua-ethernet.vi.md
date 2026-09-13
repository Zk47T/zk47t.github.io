---
title: '[Yocto-BBB] 6. SSH tới board qua Ethernet'
date: '2025-08-02T08:25:00+07:00'
lastmod: '2025-12-09T20:52:55+07:00'
slug: yocto-bbb-6-ssh-toi-board-qua-ethernet
url: /2025/08/02/yocto-bbb-6-ssh-toi-board-qua-ethernet/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 6
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Tiếp tục bài 5, bài này mình sẽ hướng dẫn các bạn thêm package vào image để kết nối được Internet khi cắm Ethernet, từ đó SSH tới board, tiện cho việc lập tr…
wp_id: 461
---

Tiếp tục bài 5, bài này mình sẽ hướng dẫn các bạn thêm package vào image để kết nối được Internet khi cắm Ethernet, từ đó SSH tới board, tiện cho việc lập trình sau này hơn.

(Nếu các bạn gặp khó khăn trong quá trình thực hành theo blog, các bạn có thể tham khảo video thực hành của mình ở cuối bài )

## 1. Add Package và Check

Ở đây để tiện cho việc theo dõi package mình tạo ra `cusom-image.bb` (Thực tế do gõ `core-image-minimal` hơi dài :vvv) tại ***/meta-bbb/recipes-core/images/***

Nội dung như sau

```bash
SUMMARY = "My custom Linux Image"
IMAGE_INSTALL = "packagegroup-core-boot ${CORE_IMAGE_EXTRA_INSTALL}"
IMAGE_LINGUAS = " "
LICENSE = "MIT"
inherit core-image
inherit extrausers
#Set rootfs to 200MiB by default
IMAGE_OVERHEAD_FACTOR ?= "1.0"
IMAGE_ROOTFS_SIZE ?= "204800"
IMAGE_ROOTFS_MAXSIZE = "2097152"
#Change root password to test
PASSWD = "\$5\$y9Aeg5ctwntRHo/g\$CAKtoTfQg7VPGfVAMGo5ZG/0GJLn3AD0JdoQ.i0dDFC"
EXTRA_USERS_PARAMS = "\
    usermod -p '${PASSWD}' root; \
    "
IMAGE_INSTALL:append = " \
    dhcpcd \
    iproute2 \
    iputils \
    openssh \
"
```

Lần lượt các package có nghĩa sau

- `dhcpcd`: Cung cấp DHCP client (lấy IP từ router cho Ethernet).
- `iproute2`: Cung cấp 1 số tool như `ip link`, `ip addr`, `ip route` .
- `iputils`: Cung cấp tool `ping`, .
- `openssh`: Cho phép SSH từ laptop.

Và thế là đủ rồi, các bạn tiến hành build thôi

```bash
bitbake -c cleanall custom-image
bitbake custom-image
```

![](/uploads/2025/07/image-12.png)

Đây là kết quả sau khi khởi động lại (custom-image.bb mình đang không append custom-banner và distro description từ bài 3,4 nên nó vẫn đang là mặc định).

Nếu của các bạn không được cấp ip sẵn thì có thể chạy lệnh

```bash
dhcpcd eth0
```

## 2. Kết nối Internet và SSH

### 2.1 Test Internet

Đơn giản là ping goole thôi

```bash
ping -c 4 google.com
```

![](/uploads/2025/07/image-14.png)

Vậy là ta có thể ping đến google.com --> Kết nối đến Internet thành công

Mọi thứ có vẻ ok ta đến bước SSH

### 2.3 SSH từ laptop command line

```bash
ssh root@192.168.0.102
```

![](/uploads/2025/07/image-16.png)

### 2.4 Kết nối từ laptop Visual Studio Code

#### 2.4.1 Cài extensions và test

Ta cần cài thêm extensions từ Mircosoft

![](/uploads/2025/07/image-17.png)

Sau khi cài xong ta bấm vào góc trái bên dưới có nút như sau "><"

Chọn SSH --> Connect to Host --> Add new SSH Host rồi nhập

```bash
ssh root@192.168.0.102
```

Save lại Vào lại SSH --> Connect to Host, giờ thì ta sẽ thấy xuất hiện device tại đây

![](/uploads/2025/07/image-18.png)

Nhập mật khẩu và đợi download VS Code Server tới board cho lần đầu tiên, tầm 1 phút

Tuy nhiên, VS code gặp khó khăn khi mở SSH cho giao diện người dùng vì trên image của chúng ta thiếu những package VS Code cần

Các bạn có thể bấm Diagnose with Copilot để biết được mình cần làm tiếp gì, hoặc More Actions để kiểm tra kĩ hơn Output log lỗi.

![](/uploads/2025/07/image-20.png)

--> Do đó trong ta cần thêm các package **bash, tar, xz, procps, coreutils, curl**.

#### 2.4.2 Cài thêm package và test lại

![](/uploads/2025/07/image-22.png)

Lưu ý mỗi khi ssh sau khi build lại image, beaglebone tạo lại ssh key khi boot nên bên laptop mình cũng phải xóa key cũ tại `.ssh/know_host` tạo lại key mới

![](/uploads/2025/07/image-21.png)

Lần này VS code đã hiện 1 lỗi mới

![](/uploads/2025/07/image-24.png)

Lại phải cài thêm `libgcc`, `libstdc++`, `libatomic`. Sau cùng IMAGE_INSTALL:append của chúng ta sẽ là

![](/uploads/2025/07/image-27.png)

Giờ build và flash sd card lại. Ta sẽ kết nối được thành công

![](/uploads/2025/07/image-26.png)

--> Tuy nhiên, cắm Ethernet chỉ tiện khi bạn ngồi gần router, lúc đem đi đâu lại phải cầm theo dây nữa, cũng bất tiện.

***--> Ở bài tiếp theo mình sẽ hướng dẫn các bạn cách cài driver USB wifi cho Beaglebone Black vẫn với Yocto Build***

{{< youtube acngfYNlXYo >}}
