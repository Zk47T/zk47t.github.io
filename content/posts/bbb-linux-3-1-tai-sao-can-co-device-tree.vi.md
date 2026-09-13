---
title: '[BBB-Linux] 3.1 Tại sao cần có Device Tree ?'
date: '2025-05-10T11:16:00+00:00'
lastmod: '2025-09-19T21:23:18+00:00'
slug: bbb-linux-3-1-tai-sao-can-co-device-tree
url: /2025/05/10/bbb-linux-3-1-tai-sao-can-co-device-tree/
tags:
- Beaglebone
- Linux
series:
- BBB-Linux
series_order: 3.1
boards:
- Beaglebone Black
image: /uploads/2025/05/devicetree-e1751096406665.png
description: Trên 1 Board sẽ có rất nhiều ngoại vi, tuy nhiên khi OS đi vào hoạt động thì bản thân nó không thể nhận biết được các ngoại vi on-board, ngoại trừ USB (có cơ…
wp_id: 24
---

![](/uploads/blogger/30b8446785db.png)

Trên 1 Board sẽ có rất nhiều ngoại vi, tuy nhiên khi OS đi vào hoạt động thì bản thân nó không thể nhận biết được các ngoại vi on-board, ngoại trừ USB (có cơ chế Self Discoverable). Đó là lý do cần có 1 file code để định nghĩa các ngoại vi trên board.

## 1. Hard-code file ngoại vi

Cách đầu tiên để định nghĩa các ngoại vi là ta sẽ có 1 file board.c chẳng hạn. Tuy nhiên giữa các board khác nhau lại có các ngoại vi khác nhau dù vẫn dùng chung 1 SoC

![](/uploads/blogger/a5497e291cb3.png)

Điều này khiến tuy chung SoC nhưng mỗi board lại phải compile 1 kernel khác nhau phù hợp với ngoại vi có trên board. Khiến thời gian compile vừa lâu lại thiếu sự đồng nhất.

Cộng đồng Linux muốn tách biệt Linux kernel ra độc lập.

--> ARM đề xuất Device Tree (Flatenned Device Tree )

## 2. Lợi ích của Device Tree

- Dễ dàng chuyển đổi nền tảng: Device Tree hỗ trợ lập trình viên chuyển ứng dụng và hệ điều hành sang các kiến trúc phần cứng khác nhau một cách thuận tiện.
- Tách biệt phần cứng và phần mềm: Thay vì mã hóa thông tin phần cứng trực tiếp vào kernel, Device Tree cho phép mô tả phần cứng một cách linh hoạt, giảm sự phụ thuộc vào cấu hình cố định.
- Tiết kiệm công sức và thời gian: Việc phát triển và bảo trì hệ thống trên nhiều thiết bị trở nên đơn giản hơn, từ đó rút ngắn thời gian làm việc và nâng cao hiệu quả.

## 3. Device tree cấu trúc minh họa

![](/uploads/blogger/fe348508f38a.png)

- i2c1 : label
- i2c@30a20000 : tên node và unit
- compatible :
  - Xác định tên driver mà kernel sẽ sử dụng để tương thích với thiết bị.
  - Kernel sẽ dò driver theo thứ tự của các chuỗi trong danh sách này.
- reg : Mô tả vùng địa chỉ phần cứng mà thiết bị sử dụng
  - 0x30a20000 là địa chỉ bắt đầu.
  - 0x10000 là kích thước vùng nhớ (64 KB).
  - Các giá trị này có thể chia ra theo #address-cells và #size-cells.
- interrupts : Mô tả IRQ line mà thiết bị sử dụng.
  \
  - GIC_SPI: Loại ngắt từ GIC (Generic Interrupt Controller).35: Số IRQ.
  - IRQ_TYPE_LEVEL_HIGH: Kiểu kích hoạt ngắt (mức cao).
- clocks: Chỉ định clock nguồn cấp cho thiết bị.
  - &clk: Tham chiếu tới node clock.
  - IMX8MM_CLK_I2C1_ROOT: Tên clock cụ thể.
- status : trạng thái của thiết bị "okay"/"disabled"

## 4. Device Tree Load

![](/uploads/2025/05/image-16.png)

DTS (Device Tree Source) cùng với DTSI(Device Tree Source Include) sau đó qua device tree compiler để thành DTB (Device Tree Blob/Binary)

Và cũng nhờ U-boot truyền các tham số boot, Kernel sẽ biết được địa chỉ mà DTB được nạp trên RAM

![](/uploads/2025/05/image-17.png)
