---
title: '[Yocto-BBB] 3. Thêm mật khẩu cho User'
date: '2025-07-12T09:38:00+07:00'
lastmod: '2026-06-19T14:05:04+07:00'
slug: yocto-bbb-3-them-mat-khau-cho-user
url: /2025/07/12/yocto-bbb-3-them-mat-khau-cho-user/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 3
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Ở 2 bài trước, ta đang không cài mật khẩu cho user root. Đến bài này mình sẽ thêm mật khẩu (do không có sudo, nên thêm cho root luôn :v)
wp_id: 284
---

Ở 2 bài trước, ta đang không cài mật khẩu cho user root. Đến bài này mình sẽ thêm mật khẩu (do không có sudo, nên thêm cho root luôn :v)

(Nếu các bạn gặp khó khăn trong quá trình thực hành theo blog, các bạn có thể tham khảo video thực hành của mình ở cuối bài )

## 1. Tài liệu từ Yocto Reference Manual

Dựa theo [Yocto Reference Manual](https://docs.yoctoproject.org/1.8/ref-manual/ref-manual.html) mục 7.38

![](/uploads/2025/06/image-1-2.png)

Ta hoàn toàn có thể sử dụng usermod, useradd trong biến EXTRA_USER_PARAMS để thêm user hoặc set password cho user.

Để làm được điều này ta cần inherit class extrausers. Hiện tại ta đang build core-image-minimal, nên ta cần tạo bbappend cho chính recipe này

## 2. Tạo core-image-minimal.bbappend

Đầu tiên ta cần biết core-image-minimal.bb nằm ở đâu, để ta có thể tạo cấu trúc folder đúng

![](/uploads/2025/06/image-11.png)

Gõ trên thanh tìm kiếm ta được meta/recipes-core/images

Như đã mô tả ở bài trước về bitbake append, ta ta cần tạo 1 meta-layers riêng cho dễ thay đổi ghi đè lại nếu cần từ bitbake recipes gốc, ở đây làm cho board beaglebone black nên mình tạo meta-bbb

### 2.1 Tạo meta layer meta-bbb

```bash
bitbake-layers create-layers meta-bbb
bitbake-layers add-layers meta-bbb
```

- create-layers sẽ tạo ra 1 layers theo cấu trúc mẫu có dạng giống như sau

![](/uploads/2025/06/image-12.png)

- add-layers là sẽ add layers mới tạo vào file bblayers.conf

### 2.2 Tạo recipe-core và add core-image-minimal

Sau khi đã tạo meta-bbb thành công, thì ta tạo folder recipes-core/image với cấu trúc như sau

```bash
zk47@zk47-ltu:~/Learning/poky/meta-bbb/recipes-core$ tree
.
├── images
│ └── core-image-minimal.bbappend
```

Nội dung file core-image-minimal.bbappend giống với miêu tả từ Reference Manual

```bash
# User "root" has password set to "test" in the image.
# printf "%q" $(mkpasswd -m sha256crypt test)
# \$5\$1ywTDE4jLgPDskTp\$yK5Ap.2xjc5gYeFQ4MGvR6C0VzA4VDSMIFkQ5.TJO84
inherit extrausers
PASSWD = "\$5\$y9Aeg5ctwntRHo/g\$CAKtoTfQg7VPGfVAMGo5ZG/0GJLn3AD0JdoQ.i0dDFC"
EXTRA_USERS_PARAMS = "\
    usermod -p '${PASSWD}' root; \
    "
```

Ở đây mình không set trực tiếp password, mà sẽ hash nó qua sha256 trước (User : root, Password : test)

Mình có push meta-bbb này lên github <https://github.com/Zk47T/meta-bbb>, các bạn có thể tham khảo thêm, khi clone về các bạn nhớ thêm vào bblayers.conf nhé

```bash
bitbake-layers add-layers ../meta-bbb
```

Nội dung file bblayers.conf sẽ như sau

```bash
# POKY_BBLAYERS_CONF_VERSION is increased each time build/conf/bblayers.conf
# changes incompatibly
POKY_BBLAYERS_CONF_VERSION = "2"
BBPATH = "${TOPDIR}"
BBFILES ?= ""
BBLAYERS ?= " \
  /home/zk47/Learning/poky/meta \
  /home/zk47/Learning/poky/meta-yocto-bsp \
  /home/zk47/Learning/poky/meta-openembedded/meta-oe \
  /home/zk47/Learning/poky/meta-arm/meta-arm-toolchain \
  /home/zk47/Learning/poky/meta-arm/meta-arm \
  /home/zk47/Learning/poky/meta-ti/meta-ti-bsp \
  /home/zk47/Learning/poky/meta-ti/meta-ti-extras \
  /home/zk47/Learning/poky/meta-bbb \
"
```

#### 2.3 Build lại và kết nối qua UART

Các bạn lưu ý bất kỳ khi nào mình thay đổi 1 recipes nào bằng bbappend, hay thay đổi trong bb file. Ta nên cleansstate lại nó trước khi build. Việc này sẽ xóa output build được tại build-bbb

```bash
bitbake -c cleansstate core-image-minimal
bitbake core-image-minimal
```

![](/uploads/2025/06/image-2-1.png)

Vậy là đã setup thành công

--> Tuy nhiên còn cái khiến mình chưa thấy đẹp là nó đang hiện dòng chữ Poky (Yocto Project Reference Distro). Mình muốn thay đổi nó tiếp.

***--> Các bạn đón đọc bài 4, mình sẽ đi đến thay đổi Distro Description cũng như Banner để trình đăng nhập được đẹp hơn, tương tự như với ví dụ Orange Pi sau***

![](/uploads/2025/06/image-3-1.png)

{{< youtube hDr0zcNRDq8 >}}
