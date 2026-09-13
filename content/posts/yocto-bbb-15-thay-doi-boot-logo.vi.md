---
title: '[Yocto-BBB] 15. Thay đổi Boot Logo'
date: '2025-10-18T09:25:00+07:00'
lastmod: '2025-09-17T22:26:15+07:00'
slug: yocto-bbb-15-thay-doi-boot-logo
url: /2025/10/18/yocto-bbb-15-thay-doi-boot-logo/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 15
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Okay, bài này mình sẽ hướng dẫn cách thay đổi Boot Logo trên Beaglebone Black. Ban đầu mình nghĩ sẽ là 1 cái phải tìm hiểu sâu. Nhưng thực tế cách thay đổi k…
wp_id: 1055
---

Okay, bài này mình sẽ hướng dẫn cách thay đổi **Boot Logo** trên **Beaglebone Black**. Ban đầu mình nghĩ sẽ là 1 cái phải tìm hiểu sâu. Nhưng thực tế cách thay đổi khá đơn giản. Và đấy cũng là 1 cái hay của `Linux` khi đã hỗ trợ rất nhiều nhưng `Package`. Việc của mình là mò ra cái cần dùng và ráp nó lại.

## 1. Mò mẫm

Để làm bài này mình đi search trên mạng nhiều chỗ và va dính guide sau : <https://oestudyard.blogspot.com/2012/04/change-gumstix-overo-booting-screen.html>

Và mình biết được là đúng psplash nó sẽ kiểm soát boot logo thật

Nên là mình xem `recipe` file bb của psplash xem như thế nào đầu tiên. Thông thường khi tìm kiếm 1 file dạng `psplash.bb` mình sẽ tìm kiếm như sau

```bash
zk47@ltu:~/Learning/yocto-bbb$ source poky/oe-init-build-env build-bbb/
zk47@ltu:~/Learning/yocto-bbb/build-bbb$ bitbake-layers show-recipes psplash
psplash:
  meta                 0.1+gitAUTOINC+44afb7506d
```

- Tuy nhiên như này thì vẫn không biết được địa chỉ thực của nó nên mình dùng kiểu chay

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb$ find .. -name "*psplash*.bb*"
../poky/meta-poky/recipes-core/psplash/psplash_git.bbappend
../poky/meta/recipes-core/psplash/psplash_git.bb
```

Vậy là ta tìm thấy các file bb và lưu ý có cả bbappend đến từ meta-poky.

Ở đây, về lịch sử thì layer `meta` thuộc về `open-embedded`, `meta-poky` thuộc `poky` thuộc **Yocto Project** phát triển trên nền tảng `open-embedded`

Ta check 2 folder và bạn thấy file nào khả nghi nhất ? Đúng rồi đó là file `psplash-poky-img.h`

```bash
zk47@ltu:~/Learning/yocto-bbb/poky/meta/recipes-core/psplash$ tree
.
├── files
│   ├── psplash-init
│   ├── psplash-poky-img.h
│   ├── psplash-start.service
│   └── psplash-systemd.service
└── psplash_git.bb

zk47@ltu:~/Learning/yocto-bbb/poky/meta-poky/recipes-core/psplash$ tree
.
├── files
│   └── psplash-poky-img.h
└── psplash_git.bbappend

1 directory, 2 files
```

Ta thấy ở đây `meta-poky` đã ghi đè lại file image gốc (Đổi sang logo Yocto Project). Do đó ta cũng làm việc tương tự, là tạo ra file img.h này

Vậy làm sao để có thể tạo được file `header` cho image này, ta tiếp tục đọc mục 2 ở [Open-Embedded Study Yard](https://oestudyard.blogspot.com/) blog kia.

## 2. Tạo img.h bằng make-image-header.sh

Vậy là trong `psplash` repo đã cung cấp cho ta 1 `script` để đổi được từ 1 ảnh thường sang img.h (Nó giống như kiểu ảnh bitmap vậy. )

Có 2 cách để ta có được script này, 1 là vào trực tiếp repo kiếm file này lấy nội dung, 2 là ta bitbake ra để nó clone từ git về rồi ta vào `build-bbb` để lấy.

Mình học yocto mà, nên ta sẽ làm cách 2.

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb$ bitbake psplash
zk47@ltu:~/Learning/yocto-bbb/build-bbb$ bitbake -e psplash | grep ^WORKDIR
WORKDIR="/home/zk47/Learning/yocto-bbb/build-bbb/tmp/work/armv7at2hf-neon-poky-linux-gnueabi/psplash/0.1+gitAUTOINC+44afb7506d-r0"
```

Ta đến folder WORKDIR này, vào thư mục git, copy make-image-header.sh về máy cá nhân

```bash
zk47@ltu:~/Project/Boot_Logo$ ls -l
total 400
-rwxr-xr-x 1 zk47 zk47    255 Thg 9  14 21:38 make-image-header.sh
-rw-rw-r-- 1 zk47 zk47  31548 Thg 8  27 21:43 mylogo.png
```

Okay, mình copy mylogo.png vào cùng 1 folder, mở terminal lên và làm các bước sau

```bash
convert mylogo.png -background white -alpha remove -alpha off \
    -gravity center -extent 640x480 my-splash-640x480.png

./make-image-header.sh my-splash-640x480.png POKY
```

Đầu tiên convert ảnh của mình sang kích thước 640x480, sau đó chạy script. Cuối cùng ta sẽ có các file sau

![](/uploads/2025/09/image-7.png)

Các bạn có thể tạo 1 recipes để chứa file bbappend, mình hơi lười nên sửa trực tiếp `poky/meta-poky/recipes-core/psplash/files/psplash-poky-img.h` sang thành nội dung của mình

Các bạn build lại, và đây là kết quả. À có lưu ý là các bạn nhớ build với image có GUI nhé. Ở đây mình build `core-image-weston`, hay `core-image-sato` thì đều ok.

<video controls preload="metadata" poster="/videos/mHZwiELW/poster.jpg" src="/videos/mHZwiELW/change-boot-logo-bbb.mp4" style="max-width:100%;margin:auto;display:block"></video>

Viết đến bài này thì mình cũng có hơi bí ý tưởng cho Yocto-BBB rồi, 1 phần vì phần cứng hạn chế. 1 số tính năng mình build được thành công trên STM32MP157 hay i.MX91 thì sang đây lại lỗi lên lỗi xuống điển hình như Weston. Nên mình sẽ tạm thời dừng series Yocto-BBB tại đây. Các bạn cho mình xin thêm ý tưởng, hay vướng mắc gì khi làm với Yocto-BBB nhé. Mình sẽ bổ sung thêm khi có thời gian.

**Mình sẽ tiếp tục với Series Boot-BBB: về quá trình boot, MLO, SPL, u-boot, busybox, fast boot.**

**Rất mong được các bạn tiếp tục đón đọc !!!**
