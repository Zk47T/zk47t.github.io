---
title: '[OpenWrt-RPi4] 3. Bring-up SSD1306 trên U-Boot cho OpenWrt image với Raspberry Pi 4'
date: '2026-11-22T22:32:00+07:00'
lastmod: '2026-11-22T22:32:00+07:00'   # = date: bài hẹn giờ, không để git (ngày merge) làm "Cập nhật" sớm hơn ngày đăng
slug: rpi4-openwrt-uboot-ssd1306
authors:
- tuan
categories:
- OpenWrt
- DeviceDriver
- Raspberry Pi
tags:
- OpenWrt
- U-Boot
- SSD1306
- RaspberryPi
series:
- OpenWrt-RPi4
series_order: 3
boards:
- Raspberry Pi 4
image: /uploads/2026/11/openwrt-rpi4-ssd1306-1.webp
description: 'Bring-up màn OLED SSD1306 qua I2C ngay trong U-Boot trên Raspberry Pi 4: trace i2c_master_send trong Linux để tìm driver I2C BCM2835, port driver đó sang U-Boot rồi thêm driver SSD1306.'
---

## Mục tiêu

- Bring-up màn hình OLED **SSD1306** qua giao diện **I2C** trên **U-Boot** chạy cho **Raspberry Pi 4** (`bcm2711`).

---

Sau khi boot được Pi 4 với U-Boot ([bài trước](/posts/rpi4-openwrt-uboot/)), công việc của chúng ta bây giờ là thêm tính năng cho màn SSD1306 vào đây. Ta cần tham khảo flow bring-up SSD1306 trên Linux Kernel.

Mọi người tham khảo code ở đây nhé:

- [ssd1306_driver](https://github.com/TuanTNT19/SnakeGame_in_BBB/tree/button_control/ssd1306_driver)
- [device_tree](https://github.com/TuanTNT19/SnakeGame_in_BBB/tree/button_control/device_tree)

Thật ra đây cũng không phải driver mình viết từ đầu đâu, mình cóp nhặt trên mạng về rồi sửa thôi )

---

## 1. Trace flow `i2c_master_send()` trong Linux Kernel

Anh em vào đọc code của `ssd1306_driver`, cụ thể là file `ssd1306_lib.c`, sẽ thấy một điều: gần như mọi hàm đều được xây dựng từ hàm `i2c_master_send()`. Đây là một API có sẵn trong Linux. Bình thường nếu viết driver trên Linux thì chỉ cần gọi API này ra dùng.

Ta trace lần lượt hàm này:

```text
i2c_master_send (include/linux/i2c.h)
    --> i2c_transfer_buffer_flags (drivers/i2c/i2c-core-base.c)
        --> i2c_transfer (drivers/i2c/i2c-core-base.c)
            --> __i2c_transfer (drivers/i2c/i2c-core-base.c)
                --> adap->algo->master_xfer (drivers/i2c/i2c-core-base.c)
```

Dòng cuối cùng này khá quan trọng:

```c
adap->algo->master_xfer
```

Tức là một function pointer có tên `master_xfer` sẽ được gọi. Nếu anh em nào có kinh nghiệm trace code Linux Kernel thì đều biết function pointer thường nằm trong một struct có sẵn, sau đó được implement kiểu như:

```c
.master_xfer = <func>
```

OK, vậy bây giờ ta trace tiếp:

```bash
cd drivers
grep -r ".master_xfer"
```

Ta sẽ thấy trong thư mục `drivers/i2c/busses` có rất nhiều dòng theo kiểu:

```c
.master_xfer = ...
```

> **Lưu ý:** Trong kernel mới, field này được đổi tên thành `xfer` (`master_xfer` vẫn còn để tương thích nhưng đã deprecated). Từ nhánh `rpi-6.12.y` của Raspberry Pi, `i2c-bcm2835.c` ghi `.xfer = bcm2835_i2c_xfer`, mà OpenWrt hiện build Pi 4 với kernel 6.18. Nếu grep `.master_xfer` không thấy `i2c-bcm2835.c` thì grep cả hai tên: `grep -rnE '\.(master_)?xfer\s*=' i2c/busses`.

Vậy câu hỏi đặt ra là: **Làm sao biết chính xác `.master_xfer` mà mình cần là cái nào?**

Đây chính là một cơ chế khá kinh điển trong Linux Kernel. Anh em chú ý sẽ thấy mỗi `.master_xfer` nằm trong một file `.c` riêng biệt. Điều đó có nghĩa là: file `.c` nào được build thì `.master_xfer` được định nghĩa trong file đó chính là implementation mà kernel sử dụng.

Vậy ta tiếp tục trace:

```text
drivers/i2c/busses/Makefile
```

Trong file này, mỗi file `.c` sẽ được build thành `.o` khi một `CONFIG_*` tương ứng được bật. Vậy bây giờ chỉ cần kiểm tra trong `.config` của kernel xem config nào đang được bật.

Với Raspberry Pi 4:

```text
CONFIG_I2C_BCM2835
```

sẽ được bật, từ đó `i2c-bcm2835.o` được build.

→ File `.c` mà chúng ta cần tìm là:

```text
drivers/i2c/busses/i2c-bcm2835.c
```

---

## 2. Port BCM2835 I2C sang U-Boot

OK, đến đây câu hỏi đặt ra là: **Một file như `i2c-bcm2835.c` đã được U-Boot support sẵn chưa?**

Câu trả lời là chưa. Chúng ta cần port phần I2C BCM2835 này vào U-Boot trước.

Hướng dẫn port, anh em có thể tham khảo commit [`954d397`](https://github.com/TuanTNT19/u-boot/commit/954d39716a2f06a1e8390c649d723b8feed4fd26) trên branch [`develop/uboot-bringup-openwrt`](https://github.com/TuanTNT19/u-boot/commits/develop/uboot-bringup-openwrt) của mình.

Trong đoạn port này mình có hardcode ở một vài chỗ. Anh em có ý kiến gì thì tích cực comment nhé )

---

## 3. Bring-up SSD1306 trên U-Boot

Sau khi port xong BCM2835 I2C, chúng ta sẽ đến bước chính: Bring-up SSD1306.

### 3.1. Thêm Device Tree

Anh em thêm node SSD1306 vào Device Tree như sau:

```dts
&i2c1 {
    status = "okay";

    ssd1306: ssd1306@3c {
        compatible = "tnt19,ssd1306";
        reg = <0x3c>;
        status = "okay";
    };
};
```

Ở đây `0x3c` là địa chỉ I2C của màn SSD1306. `i2c1` là bus I2C ở chân GPIO 2 (SDA) và GPIO 3 (SCL), tức pin 3 và pin 5 trên header 40 pin.

### 3.2. Thêm SSD1306 Driver

Bước này thì gần như là: Copy driver từ Linux sang + thêm cơ chế build driver mới vào U-Boot.

Anh em có thể tham khảo commit [`3112983`](https://github.com/TuanTNT19/u-boot/commit/31129834b31f91e2b2b04c3aefe2aa8d0c208970).

---

## 4. Build và test

OK, xong rồi thì giờ build thôi. Sau khi build được:

```text
u-boot.bin
bcm2711-rpi-4-b_owrt.dtb
```

ta lại làm tương tự như phần trước:

- Thay thế `u-boot.bin` trong `/boot` trên board bằng file vừa build.
- Thay thế `bcm2711-rpi-4-b_owrt.dtb` trong `/boot` bằng file vừa build.

Sau đó:

```text
Reboot Pi 4
        ↓
Boot
        ↓
U-Boot
        ↓
SSD1306
        ↓
Xem kết quả :)
```

![Kết quả bring-up SSD1306 trên U-Boot (1/2)](/uploads/2026/11/openwrt-rpi4-ssd1306-1.webp)

![Kết quả bring-up SSD1306 trên U-Boot (2/2)](/uploads/2026/11/openwrt-rpi4-ssd1306-2.webp)
