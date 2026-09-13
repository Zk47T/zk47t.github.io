---
title: '[BBB-Linux] 1. Beaglebone Black Boot Process Overview'
date: '2025-06-21T08:51:00+07:00'
lastmod: '2025-09-27T00:42:35+07:00'
slug: bbb-linux-1-beaglebone-black-boot-process-overview
url: /2025/06/21/bbb-linux-1-beaglebone-black-boot-process-overview/
tags:
- Beaglebone
- Linux
series:
- BBB-Linux
series_order: 1
boards:
- Beaglebone Black
image: /uploads/2025/09/maxresdefault.jpg
description: Tổng quan sẽ gồm 5 giai đoạn theo mô tả trên hình, ta đi vào sâu hơn về từng giai đoạn
wp_id: 39
---

![](/uploads/blogger/043d800bc825.jpg)

Tổng quan sẽ gồm 5 giai đoạn theo mô tả trên hình, ta đi vào sâu hơn về từng giai đoạn

## 1. SoC ROM Bootloader

- RBL (ROM Bootloader): cái này sẽ do bên vendor, hay bên sản xuất board code, không thể thay thế được nội dung
- Đây là đoạn code đầu tiên sẽ chạy khi mở board lên
- Nhiệm vụ chính là để chạy khối tiếp theo First Stage Bootloader (SPL/MLO)

## 2. First Stage Bootloader (SPL/MLO)

SPL: Secondary Program Loader

MLO: Memory Loader

- Nhiệm vụ chính là cấu hình RAM, clock, các ngoại vi ngoài và nạp Main Bootloader (U-boot, Grub …)
- Một số SPL còn triển khai các tính năng bảo mật như verify signature (secure boot)
- Chọn chế độ boot

Trên Beaglebone Black có rất nhiều lựa chọn cho nguồn boot. Thứ tự ưu tiên sẽ tùy vào việc Phím S2 được ấn lúc khởi động hay không

![](/uploads/2025/05/image.png)

![](/uploads/2025/05/image-1.png)

Các bạn có thể đọc thêm về cái này trong [Reference Manual](https://www.ti.com/lit/ug/spruh73q/spruh73q.pdf) của BeagleBone Black

*Table 26-7. SYSBOOT Configuration Pins[4]*

## 3. Second Stage Bootloader (U-boot + uEnv.txt)

- Khởi tạo ngoại vi từ tất cả boot options : I2C, NAND, Flash , … sẵn sàng cho việc load kernel image
- Load kernel image : Load image đến DDR memory
- Truyền Boot argument to Kernel
- Có thể cấu hình lại u-boot bằng file uEnv.txt
- U-boot sẽ luôn tìm uImage

## 4. Linux Kernel

- Phân tích các boot arguments từ u-boot
- Sử dụng Device Tree Blob/Binary (DTB) để hiểu cấu trúc phần cứng của hệ thống
- Mount Root File System
- Chạy “init” process, process đầu tiên PID 1

## 5. Root Filesystem, Init Process

Root filesystem là file system mà được mount tới root (/)

File system là tập hợp các file theo quy chuẩn cấu trúc, ở đây là Linux File System

![](/uploads/2025/05/image-2.png)

Đây là tổng quan về BBB Boot Process, với mỗi 1 mục trên, mình sẽ có các bài đi sâu tìm hiểu hơn
