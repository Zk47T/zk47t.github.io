---
title: '[BBB-Linux] 2. Beaglebone Black Boot Process - RBL, SPL'
date: '2025-05-08T15:29:00+00:00'
lastmod: '2025-11-22T15:11:09+00:00'
slug: bbb-linux-2-beaglebone-black-boot-process-rbl-spl
url: /2025/05/08/bbb-linux-2-beaglebone-black-boot-process-rbl-spl/
tags:
- Beaglebone
- Linux
series:
- BBB-Linux
series_order: 2
boards:
- Beaglebone Black
image: /uploads/2025/05/rbl.png
description: Bài này sẽ tìm hiểu kỹ hơn về quá trình RBL (ROM Bootloader) và SPL (Secondary Program Loader) mình đã nói qua ở bài 1.
wp_id: 26
---

![](/uploads/2025/05/image-3.png)

Bài này sẽ tìm hiểu kỹ hơn về quá trình RBL (ROM Bootloader) và SPL (Secondary Program Loader) mình đã nói qua ở bài 1.

**Ti AM335x CPU diagram**

![](/uploads/2025/05/image-4.png)

## 1. RBL (ROM Bootloader)

Như ảnh ở trên ta có cấu trúc AM3359 SoC, phần chip chính gồm

- Khi mở nguồn lên board sẽ chạy đoạn code RBL đầu tiên
- Luồng chạy được miêu tả trong [Reference manual](https://www.ti.com/lit/ug/spruh73q/spruh73q.pdf) như sau

![](/uploads/2025/05/image-5.png)

- Stack : Cần khởi tạo để lưu các biến cục bộ. Tuy nhiên RBL chạy từ ROM và SRAM có dung lượng rất nhỏ, còn DRAM thì lại cần được cấu hình trước khi sử dụng
  - –> Stack được đặt ngay trong Internal SRAM
- WDT (Watchdog timer ) : Được đặt 1 mức thời gian, nếu SPL không được nạp trong thời gian đó sẽ tự động reset processor
- PLL (Phase Locked Loop) : Có nhiệm vụ nâng clock lên
- Booting: Chính là thực hiện chọn thứ tự boot theo SYSBOOT[4:0]

![](/uploads/2025/05/image-6.png)

Sau khi chọn được thứ tự boot, giả dụ bạn lưu SPL tại eMMC ta sẽ có

![](/uploads/2025/05/image-7.png)

MLO sẽ khác SPL ở việc có header

![](/uploads/2025/05/image-8.png)

Copy xong và chuyển giao quyền điều khiển thì phần việc của RBL đã kết thúc

**#Tổng kết lại RBL sẽ làm**

- Stack setup
- Watchdog Timer config
- System clock config
- Check Boot Options
- Copy SPL/MLO –> Internal SRAM
- Execute SPL/MLO

## 2. MLO (Memory Loader) / SPL (Secondary Program Loader)

Ngắn gọn thì là MLO sẽ cấu hình SoC đến giai đoạn mà U-boot có thể load được lên external RAM

![](/uploads/2025/05/image-9.png)

Các task MLO/SPL sẽ làm

- UART config: cái này sẽ giúp in ra debug message (dmesg)
- Cấu hình lại PLL : clock ở mức mong muốn
- Cấu hình các thanh ghi DDR : Để sử dụng được DDR RAM
- Muxing Config: chuẩn bị các chân ngoại vi cho Boot
- Copy u-boot image : đến DDR memory và trả quyền control cho u-boot

Các bạn có thể thắc mắc 2 câu hỏi sau:

😎**1. Tại sao lại không truyền trực tiếp u-boot image vào Internal SRAM mà lại cần qua bước RBL ?**

–> Vì kích thước Internal SRAM quá nhỏ, bạn phải thu hẹp kích thước u-boot vào vừa vặn trong 128Kb là bất khả thi

![](/uploads/2025/05/image-10.png)

😎**2. Tại sao RBL không thể load trực tiếp U-boot tới DDR ?**

–> RBL do bên Vendor, SoC. Còn DDR memory thì do bên Board Manufacture thiết kế.

Do đó Texas Instrument không thể biết trước được bên sản xuất board sẽ dùng loại DDR nào.

Thông thường u-boot sẽ bao gồm cả MLO.
