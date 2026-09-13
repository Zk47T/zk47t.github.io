---
title: '[Device-Driver-Lichee] 2. Blink led bằng gpioset, tạo led node Device Tree'
date: '2026-06-06T06:46:00+07:00'
lastmod: '2026-06-26T22:22:10+07:00'
slug: device-driver-lichee-2-blink-led-bang-gpioset-tao-led-node-device-tree
url: /2026/06/06/device-driver-lichee-2-blink-led-bang-gpioset-tao-led-node-device-tree/
categories:
- DeviceDriver
- LicheePi
- Linux
series:
- Device-Driver-Lichee
series_order: 2
boards:
- LicheePi Nano
image: /uploads/2026/05/screenshot-from-2026-05-24-19-03-08.png
description: Okay, sau bài 1 ta đã có 1 board lên được terminal để vọc vạch rồi, giờ đến Hello world của thế giới nhúng. Ta thử Blink Led nhé
wp_id: 2433
---

Okay, sau bài 1 ta đã có 1 board lên được terminal để vọc vạch rồi, giờ đến Hello world của thế giới nhúng. Ta thử Blink Led nhé

## 1. LicheePi Nano pinout

Các bạn lên mạng tìm sipeed licheepi nano là sẽ ra 1 loạt, đây là pinout từ Sipeed

![](/uploads/2026/05/image-2.png)

Mình thì hàn chân xuống nên mặt thẻ nhớ lại bên trên :vv

Nhìn chung tạm thời là bạn kết nối UART debug tới board này, cũng như cắm led. Mình đang cắm led qua trở, Cathode nối đến GND, Anode nối đến GPIO A3 nhé. Như hình bên dưới

![](/uploads/2026/05/37aeee4fca654b3b1274.jpg)

À có 1 kinh nghiệm xương máu là làm việc với hardware các bạn nên test kĩ phần cứng trước. Do đó ở đây mình thay vì nối với A3, mình nối với chân 3V3 để nó thông mạch và thấy đèn sáng thử đã nhỉ :vv . Vậy là phần cứng không có vấn đề gì :vv.

Vậy để đèn sáng ta sẽ cần mức logic ở A3 là cao đúng không ?

Ta đi tiếp đến phần 2.

## 2. Sử dụng gpioset để blink led

### 2.1 Cách tính chân GPIO

Nếu các bạn nhìn vào tên GPIO của các board thì có thể mỗi board có 1 kiểu đánh khác nhau. Nhưng sau cùng nó sẽ quy về 1 con số. Từ con số đó ta tính được địa chỉ thanh ghi mà ta cần tác động tới. Ví dụ GPIO0 thì có địa chỉ là 1000, thì GPIO1 sẽ à 1032 chẳng hạn thì offset là 32 x 1.

Ngày xưa thực tế chân chỉ đánh số theo thứ tự tăng dần. Giờ người ta hay đánh theo chữ + số để ta dễ hình dung, chia hơn :vv

Mỗi 1 Bank GPIO có 32 pin

Mỗi hãng sẽ có 1 kiểu kiểu đánh khác nhau

Ở Board LicheePi Nano này thì Mỗi chữ cái đại diện 1 bank A là bank0, B là bank1, C là bank2, ...

Ví dụ PA0 = GPIO-0, PE3 = 32x4 + 3 = GPIO 131

Còn ví dụ trên Beaglebone Black lại khác

![](/uploads/2026/05/image-3.png)

```bash
GPIO46   = 32 + 8x1 + 6       = GPIO1 B6

GPIO60   = 32 + 8x3 + 4       = GPIO1 D4

GPIO1 A3 = 1 x 32 + 0 x 8 + 3 = 35

GPIO3 D7 = 3 x 32 + 3 x 8 + 7 = 127
```

Kiểu đánh GPIO1-A3 = GPIO 35 mình gặp bên Rockchip RK3576.

Sau cùng đối với linux thì ta sẽ dùng dạng GPIO + số nhiều nhất (Ví dụ GPIO 136, GPIO 192)

Okay, vậy thì dù ghi cách nào thì ta cũng sẽ có thể quy đổi nó về số được rồi

### 2.2 Dùng gpioset để blink led

Okay, để đơn giản hóa mọi thứ, mình hướng dẫn mọi người dùng command từ libgpiod. (Ở đây mình dùng version 1.6)

Ta cần mức logic cao để sáng đúng không, do đó ta gõ

```bash
gpioset gpiochip0 3=1
```

gpiochip0 3 chính là GPIO0-A3 đó :vv

Giờ đến Blink Led

```bash
while true; do
    gpioset -m time -s 1 gpiochip0 3=1   # giữ HIGH 1 giây
    gpioset -m time -s 1 gpiochip0 3=0   # giữ LOW  1 giây
done
```

Giờ nếu các bạn kiểm tra bằng gpioinfo, ta sẽ thấy GPIO A3 là unused. (Ở đây line A3 đã thành output do gpioset có cơ chế tự động) Vì nó là unused nên bất kì đối tượng nào cũng có thể điều khiển nó được.

```bash
root@f1c100s:/boot# gpioinfo
gpiochip0 - 192 lines:
	line   0:      unnamed       unused   input  active-high
	line   1:      unnamed       unused   input  active-high
	line   2:      unnamed       unused   input  active-high
	line   3:      unnamed       unused  output  active-high
```

Trên 1 board với mạch PCB custom, mình đã nối cứng GPIO A3 từ chip ra với LED rồi, mình không muốn chân này hiển thị cho các đối tượng khác nữa, thì ta phải khai báo cho nó :vv

## 3. Khai báo led node device tree

### 3.1 Device tree là gì ?

Hiểu đơn giản device tree là file định nghĩa phần cứng hiện có trên board. Các bạn có thể đọc thêm tại </2025/05/10/bbb-linux-3-1-tai-sao-can-co-device-tree/>

Khi build kernel cho cùng 1 SoC nhưng phần cứng trên board khác nhau, ta phải build 1 kernel image hoàn toàn khác. Thì giờ ta tách phần cứng kia ra thành 1 file nạp riêng (Device Tree Blob)

![](/uploads/2026/05/image-4.png)

### 3.2 Thêm node led thôi

Các bạn vào tại

```bash
Lichee-Nano-Device-Driver/linux/arch/arm/boot/dts/suniv-f1c100s-licheepi-nano.dts
```

Rồi sửa chỗ sau (Mình sẽ giải thích cụ thể từng dòng ở mục 3.3)

```bash
diff --git a/arch/arm/boot/dts/suniv-f1c100s-licheepi-nano.dts b/arch/arm/boot/dts/suniv-f1c100s-licheepi-nano.dts
index c16838bfe113..d27d7fdcf37b 100644
--- a/arch/arm/boot/dts/suniv-f1c100s-licheepi-nano.dts
+++ b/arch/arm/boot/dts/suniv-f1c100s-licheepi-nano.dts
@@ -27,6 +27,15 @@
                regulator-min-microvolt = ;
                regulator-max-microvolt = ;
        };
+
+       leds {
+               compatible = "gpio-leds";
+
+               led0 {
+                       label = "myled";
+                       gpios = ; /* PA3 */
+               };
+       };
 };

 &pio {
```

Và ta build lại DTB theo guide từ bài 1, đầu tiên ta set toolchain

```bash
export ARCH=arm
export CROSS_COMPILE=arm-linux-gnueabi-
```

Rôi ta build

```bash
cd Lichee-Nano-Device-Driver
make -C linux -j$(nproc) suniv-f1c100s-licheepi-nano.dtb
cp u-boot-f1c100s/u-boot-sunxi-with-spl.bin output/
```

Nếu các bạn không có 2 dòng export kia nó sẽ gọi đến make từ host, chứ không phải arm-linux-gnueabi-make, để ta cross compile

Okay, giờ device tree mới đã có mặt tại output/

Ta cắm thẻ nhớ vào rồi thay thế file hiện có trên board.(Lưu ý thay sda bằng đúng thẻ nhớ của bạn nhé )

```bash
 export PART=/dev/sda
sudo umount ${PART}1 2>/dev/null

sudo mount ${PART}1 /mnt
sudo cp output/suniv-f1c100s-licheepi-nano.dtb       /mnt/
sudo umount /mnt
```

Giờ kiểm tra gpioinfo ta sẽ thấy

```bash
root@f1c100s:~# gpioinfo
gpiochip0 - 192 lines:
	line   0:      unnamed       unused   input  active-high
	line   1:      unnamed       unused   input  active-high
	line   2:      unnamed       unused   input  active-high
	line   3:      unnamed      "myled"  output  active-high [used]
```

Giờ nếu ta cố tình chạy thử gpioset nó sẽ hiện lỗi

```bash
root@f1c100s:~# gpioset gpiochip0 3=1
gpioset: error setting the GPIO line values: Device or resource busy
```

Còn led ta sẽ nằm tại

```bash
root@f1c100s:/sys/class/leds# ls
myled
root@f1c100s:/sys/class/leds# ls myled
brightness      device          max_brightness  subsystem       trigger         uevent
```

Để đèn sáng, ta sẽ echo 1 tới brighness, do đó để nhấp nháy ta sẽ dùng

```bash
while true; do
    echo 1 >   /sys/class/leds/myled/brightness
    sleep 1
    echo 0 >   /sys/class/leds/myled/brightness
    sleep 1
done
```

### 3.3 Giải thích về node Device Tree

Nhìn trong code, sau khi apply patch kia ta sẽ có dạng như sau

![](/uploads/2026/05/image-5.png)

Ở đây

- compatible là kiểu bạn sẽ dùng driver gì. Các bạn có thể thấy mình không hề làm gì để bảo là lưu led này tại /sys/class/leds/ đi, hay tạo brightness đi. Mà mình chỉ đơn giản thêm compatible = "gpio-leds" . Sẽ có 1 driver làm công đoạn còn lại. (Khi các bạn học đến kernel module, các bạn sẽ dễ hình dung hơn đoạn binding này )
- Tại sao lại define leds, rồi mới tới led0 ?
  - Tại vì mình dùng gpio-leds driver, nó yêu cầu thế. Device tree sẽ có schema để check xem đúng cấu trúc đúng kiểu không, nếu sai build sẽ lỗi
- label thì đơn giản là tên cái sẽ chiếm chân này, chính là cái bạn nhìn thấy ở gpioinfo kia
- gpios
  - ở đây &pio bằng gì thì bạn lại phải xem thêm về 2 file include
    - suniv-f1c100s.dtsi
    - dt-bindings/gpio/gpio.h
  - Về cơ bản nếu bạn từng lập trình thanh ghi rôi thì sẽ phải có 1 cái define base address cho GPIO, rồi ta sẽ nhìn số kia để tính offset.

À các bạn có thể cài thêm dtc-compiler để decompile chính cái file suniv-f1c100s-licheepi-nano.dtb cho dễ hình dung

```bash
dtc -I dtb -O dts -o decompile.dts suniv-f1c100s-licheepi-nano.dtb
```

Lướt xuống cuối file decompile.dts ta sẽ thấy

```bash
leds {
		compatible = "gpio-leds";

		led0 {
			label = "myled";
			gpios = ;
		};
	};
```

Các define &pio đã được đưa về tiêu chuẩn đúng của define GPIO pin :vv

Qua Device Tree Compiler thì output sẽ ở kiểu chung, chứ nếu chỉ nhìn vào dts trong kernel thì thực tế mỗi board lại 1 kiểu do tùy define macro :vv

Do đó sẽ tùy vào define theo board mà ta dùng khác nhau 1 chút :vv

Cảm ơn các bạn đã đọc đến đây !!

Chúc các bạn thực hành thành công và đón đọc Bài Device Driver 2 : gpioget, nút nhấn và ngắt nhé !!
