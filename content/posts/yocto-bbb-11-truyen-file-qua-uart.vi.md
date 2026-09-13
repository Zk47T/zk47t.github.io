---
title: '[Yocto-BBB] 11. Truyền file qua UART'
date: '2025-09-20T09:25:00+07:00'
lastmod: '2025-09-12T16:35:39+07:00'
slug: yocto-bbb-11-truyen-file-qua-uart
url: /2025/09/20/yocto-bbb-11-truyen-file-qua-uart/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 11
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Ở bài này, mình sẽ hướng dẫn các bạn cách truyền file qua UART. Sẽ rất hữu dụng khi sắp tới ta học về quá trình Boot trên BBB cũng như u-boot.
wp_id: 827
---

Ở bài này, mình sẽ hướng dẫn các bạn cách truyền file qua UART. Sẽ rất hữu dụng khi sắp tới ta học về quá trình Boot trên BBB cũng như u-boot.

## 1. Lý do

Cho đến giờ mình biết tới 1 số kiểu truyền file từ HOST sang board sau. Mình sẽ nêu ra ưu và nhược điểm của nó

- **Copy trực tiếp vào thẻ nhớ** (nếu board dùng thẻ nhớ) : Nhanh nhưng không tiện :v
- `SCP` : copy qua mạng --> Nhanh nhưng cần setup ssh key. Không được support bởi u-boot
- `TFTP` : copy qua mạng --> Chậm hơn SCP, không cần key, được support bởi u-boot
- `UART` : Tốc độ chậm, nhưng không cần mạng. Gọn nhẹ :vv

Vậy UART tuy chậm, nhưng rất tiện khi ta đang có 1 board không có giao diện, không boot từ uSD card, không có wifi và ta không có sẵn dây mạng (hoặc board không sẵn cổng Ethernet :vv ).

## 2. Chuẩn bị minicom bên Host

Ở các bài trong series Yocto-BBB, mình đã hướng dẫn các bạn kết nối UART tới board sử dụng command `screen` hoặc `picocom`. Tuy nhiên 2 command này là command tối giản không tích hợp thêm các giao thức để truyền file qua `UART`. Ở series này mình sẽ dùng `minicom`, là phiên bản nâng cấp của 2 command trên

#### 2.1 Cài minicom

```bash
sudo apt update
sudo apt install minicom
```

Để kết nối với board các bạn cắm UART USB tới board, cách kết nối mình có nói ở bài </2025/07/05/yocto-bbb-2-uart-debug-board/> mục 1.1

### 2.2 Cấu hình minicom

Ta phải cấu hình để UART ở chế độ truyền nhận được, và cũng setup sẵn baudrate cũng như địa chỉ tiện cho lần sau dùng. (Đây sẽ là defautl config, nếu sau ví dụ bạn kết nối với STM32MP157 mà port ở /dev/ttyACM0 thì bạn phải nhớ cấu hình lại)

```bash
sudo minicom -s
```

![](/uploads/2025/09/image.png)

Chọn **Serial Port setup**

![](/uploads/2025/09/image-1.png)

Chọn giống như hình trên. Nhớ để ý **Hardware Flow Control** là No

Okay, nhấn `Esc` để back rồi chọn **Save as dfl**, rồi `Exit`

## 3. Chuẩn bị image cho beaglebone black

Để board biết được có file gửi tới, ta cần có command trên board để biến board sang trạng thái chờ nhận file. Ta cần thêm package cho lrzsz tại IMAGE_INSTALL

Mình sẽ quay về dùng core-image-minimal cho gọn nhẹ.

Đây là nội dung file recipes-core/image/`core-image-minimal.bbappend` của mình

```bash
zk47@ltu:~/Learning/yocto-bbb/meta-bbb/recipes-core/images$ cat core-image-minimal.bbappend
inherit extrausers
TMPDIR = "${TOPDIR}/tmp"
# User "root" has password set to "test" in the image.
# printf "%q" $(mkpasswd -m sha256crypt test)
# \$5\$1ywTDE4jLgPDskTp\$yK5Ap.2xjc5gYeFQ4MGvR6C0VzA4VDSMIFkQ5.TJO84
PASSWD = "\$5\$y9Aeg5ctwntRHo/g\$CAKtoTfQg7VPGfVAMGo5ZG/0GJLn3AD0JdoQ.i0dDFC"
EXTRA_USERS_PARAMS = "\
    usermod -p '${PASSWD}' root; \
    "
# Add for emmc script
IMAGE_INSTALL:append = " \
  lrzsz \
"
```

Build

```bash
zk47@ltu:~/Learning/yocto-bbb$ source poky/oe-init-build-env build-bbb/
zk47@ltu:~/Learning/yocto-bbb/build-bbb$ bitbake -c cleanall core-image-minimal && bitbake core-image-minimal
```

Check lại file manifest xem đã có package lrzsz chưa

![](/uploads/2025/09/image-2.png)

Okay rồi thì ta Flash tới thẻ sdcard sử dụng bmaptool như các bài trước (nhớ umount 2 phân vùng boot và root trên thẻ nhớ trước)

## 4. Copy file qua Minicom UART

### 4.1 Bật trạng thái chờ nhận file trên Beaglebone

Sau khi đăng nhập với user-password root-test xong. Ta chạy câu lệnh rz để board sang trạng thái chờ file

```bash
root@beaglebone:~# rz
�z waiting to receive.**B0100000023be50
```

### 4.2 Gửi file từ host

Nhấn **Ctrl + A sau đó nhấn S** (**Ctrl + A** để minicom biết ký tự nhập ngay sau là option cho minicom, chứ không phải ký tự thường để truyền qua UART)

(Nếu các bạn quên thì nhớ lấy tổ hợp **Ctrl + A rồi nhấn Z** ta sẽ có giao diện command summary sau `)`

![](/uploads/2025/09/image-3.png)

Option S có nghĩa là **Send files**

`Esc` sẽ là thoát nhé

Okay, khi Nhấn **Ctrl + A sau đó nhấn S** ta thấy hiện như sau

![](/uploads/2025/09/image-4.png)

Theo trình tự lịch sử thì xmodem-ymodem-kermit-zmodem. `Zmodem` là nhanh nhất và được dùng nhiều nhất. Cũng như nó tương thích với **command rz** nên mình sẽ dùng cái này. `Enter`

ở giao diện tiếp theo các bạn di chuyển lên xuống và trái phải bằng bàn phím để chọn. Chọn `Goto` rôi nhập đường link các bạn muốn tới

![](/uploads/2025/09/image-5.png)

Ở đây các bạn có thể đổi sang option `Tag` để chọn nhiều file (`Space` để chọn nhé), rồi đổi sang `Okay` và bấm `Enter`

![](/uploads/2025/09/image-6.png)

Chỉ đơn giản thế thôi, là các bạn đã truyền file okay rồi

Lưu ý ở board, bạn chạy command rz ở đâu thì file sẽ được copy vào đấy nhé

**Ở bài tới, mình sẽ hướng dẫn các bạn cách truyền file qua TFTP để phục vụ cho u-boot sau này, cũng như đạt được tốc độ cao hơn khi truyền file.**
