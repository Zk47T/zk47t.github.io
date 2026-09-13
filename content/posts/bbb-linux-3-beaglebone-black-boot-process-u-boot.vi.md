---
title: '[BBB-Linux] 3. Beaglebone Black Boot Process - U-boot'
date: '2025-05-10T11:16:00+00:00'
lastmod: '2025-11-22T15:10:34+00:00'
slug: bbb-linux-3-beaglebone-black-boot-process-u-boot
url: /2025/05/10/bbb-linux-3-beaglebone-black-boot-process-u-boot/
tags:
- Beaglebone
- Linux
series:
- BBB-Linux
series_order: 3
boards:
- Beaglebone Black
image: /uploads/2025/05/u-boot.png
description: Tiếp tục với Boot Process trên BBB đó là u-boot
wp_id: 25
---

Tiếp tục với Boot Process trên BBB đó là u-boot

![](/uploads/blogger/b2740fa3dded.png)

## 1. U-boot là gì ?

**U-Boot (Universal Boot Loader)** là một trình nạp khởi động mã nguồn mở, đóng vai trò quan trọng trong các hệ thống nhúng sử dụng Linux. Nó chịu trách nhiệm khởi tạo phần cứng cơ bản và chuyển quyền điều khiển cho nhân hệ điều hành. Nhờ khả năng tương thích với nhiều nền tảng như ARM, x86 hay PowerPC, U-Boot được ứng dụng rộng rãi trong phát triển phần mềm nhúng. Ngoài ra, nó còn cho phép cấu hình môi trường hệ thống trước khi kernel được thực thi, góp phần đảm bảo quá trình khởi động diễn ra ổn định và linh hoạt.

## 2. Cấu hình U-boot

Sau khi qua bước MLO, các bạn sẽ thấy dòng chữ

![](/uploads/2025/05/image-11.png)

Đến bước này, chúng ta đang ở giai đoạn config U-boot Environment, nội dung của 1 file sẽ có dạng như sau

![](/uploads/2025/05/image-12.png)

- console sẽ setup uart debug log, ở baud rate bao nhiêu, cổng nào
- ipaddr và serverip sẽ là ip address và server ip phục vụ việc nạp kernel qua ethernet thông qua TFTP (Trivial File Transfer Protocol)
- loadaddr : biến lưu địa chỉ nạp kernel
- fdtaddr : biến lưu địa chỉ nạp Flatenned Device Tree.

## 3. uImage và zImage

Sau khi đã cấu hình xong, U-boot sẽ tìm tới uImage. Cấu trúc của nó có dạng

![](/uploads/2025/05/image-13.png)

![](/uploads/2025/05/image-14.png)

Và rồi uImage sẽ làm nốt 1 số việc của U-boot như

- Khởi tạo ngoại vi từ tất cả boot option sẵn sàng cho việc nạp kernel
- Nạp kernel tới DDR memory
- Truyền boot arguments tới Kernel
- Start kernel

Và rồi uImage sẽ làm nốt 1 số việc của U-boot như

Khởi tạo ngoại vi từ tất cả boot option sẵn sàng cho việc nạp kernel\
Nạp kernel tới DDR memory\
Truyền boot arguments tới Kernel\
Start kernel

**Okay, đến hết bài này các bạn đã nắm được căn bản của các bước boot cho Beaglebone Black, các bạn đọc tiếp về Series [Boot-BBB] nhé !!**
