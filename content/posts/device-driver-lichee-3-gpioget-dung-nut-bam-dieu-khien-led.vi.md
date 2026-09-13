---
title: '[Device-Driver-Lichee] 3. Gpioget, Dùng nút bấm điều khiển led'
date: '2026-06-13T06:23:00+07:00'
lastmod: '2026-07-11T10:06:08+07:00'
slug: device-driver-lichee-3-gpioget-dung-nut-bam-dieu-khien-led
url: /2026/06/13/device-driver-lichee-3-gpioget-dung-nut-bam-dieu-khien-led/
categories:
- DeviceDriver
- LicheePi
- Linux
series:
- Device-Driver-Lichee
series_order: 3
boards:
- LicheePi Nano
image: /uploads/2026/05/screenshot-from-2026-05-24-19-03-08.png
description: Nói là dùng nút bấm, mà mình lục tung đống đồ điện tử lên không thấy con nút bấm cắm nào, toàn nút bấm dán. Nên bài này mình sẽ dùng biến trở nhưng với vai t…
wp_id: 2484
---

Nói là dùng nút bấm, mà mình lục tung đống đồ điện tử lên không thấy con nút bấm cắm nào, toàn nút bấm dán. Nên bài này mình sẽ dùng biến trở nhưng với vai trò tương tự nút bấm nhé :vv

## 1. Kết nối led và biến trở

![](/uploads/2026/06/4acccfc095f414aa4de5.jpg)

2 Chân bên ngoài biến trở lần lượt là điện và đất, dây đỏ là điện 3.3V, dây nâu là đất

Dây tín hiệu ở giữa mình nối với A0

![](/uploads/2026/06/potentiometersymbolschematic.jpg)

Bạn hiểu đơn giản, nếu xoay hết về phía 1 VCC thì đầu 2 sẽ nhận mức cao, xoay hết về phía 3 GND sẽ nhận mức thấp

## 2. Kiểm tra mức logic

Vẫn trong bộ command từ libgpiod, bài này mình sẽ dùng gpioget nhé

Để theo dõi trực quan mình kết hợp với câu lệnh watch. Các bạn gõ

```bash
watch -n 0.1 gpioget gpiochip0 0
```

Lệnh này sẽ kiểm tra kết quả gpioget kia sau mỗi 0.1s

## 3. Dùng biến trở điều khiển led

Hay thực tế sẽ là dùng tín hiệu chân A0 điều khiển chân A3, dạng dạng như vậy

### 3.1 Polling

Polling hiểu đơn giản là bạn sẽ liên tục truy vấn giá trị từ bên biến trở sau 1 khoảng thời gian

Ta chạy script đơn giản như sau, kết hợp gpioget và echo brightness từ bài 1 (Do minh đã định nghĩa led trong device tree nên không dùng gpioset được nữa)

```bash
prev=-1
while true; do
    val=$(gpioget gpiochip0 0)
    if [ "$val" != "$prev" ]; then
        echo $val > /sys/class/leds/myled/brightness
        prev=$val
    fi
done
```

Ở đây mình chạy 1 vòng lặp, kiểm tra giá trị GPIO A0 lưu vào val, nếu val khác giá trị cũ thì đổi trạng thái nó và đưa nó tới led.

### 3.2 Ngắt

Nhưng thay vì việc CPU phải liên tục polling như thế, thì ta nên dùng ngắt. Chỉ khi nào trạng thái biến trở thay đổi sang mức logic khác thì ta mới thay đổi trạng thái led

Ở đây mình sẽ sửa tại device tree để define button nhé. Trong lúc mình sửa thì lại thấy chân PA0 không có line ngắt, do đó mình sẽ đổi sang chân E3 nhé

![](/uploads/2026/06/c1d1f347-4824-4fa2-9427-177343261f00.jpeg)

Nếu các bạn cố chấp giữ chân A0 thì nó sẽ bị lỗi

```bash
root@f1c100s:~# dmesg | grep button
[    1.562036] gpio-keys buttons: Unable to get irq number for GPIO 0, error -22
[    1.569381] gpio-keys: probe of buttons failed with error -22
```

Sau khi đổi chân xong, ta sửa tiếp device tree và build lại nhé

Mình sẽ thêm button node vào ngay trên node led hôm nọ

```bash
buttons {
		compatible = "gpio-keys";

		button0 {
			label = "button0";
			gpios = ; /* PE3, mức thấp = nhấn */
			linux,code = ; /* input event code gửi lên userspace */
		};
	};
```

Như mình đã miêu tả thì E3 = GPIO4-3.

compatible là ở đây mình dùng 1 driver có sẵn trong linux. Đến bài sau nữa, kernel module mình sẽ miêu tả kĩ hơn về cái này

linux,code = \<BTN_0> là mình cũng dùng cái event ngắt của linux luôn, tí mình sẽ dùng evtest mô tả cho các bạn.

Git diff của file dts sẽ trông như này

```bash
                regulator-max-microvolt = ;
        };
+
+       /*
+        * compatible = "gpio-keys": tên driver cố định trong kernel,
+        * dùng cho mọi GPIO button/switch dù không phải bàn phím.
+        */
+       buttons {
+               compatible = "gpio-keys";
+
+               button0 {
+                       label = "button0";
+                       gpios = ; /* PE3, mức thấp = nhấn */
+                       linux,code = ; /* input event code gửi lên userspace */
+               };
+       };
+
+       leds {
+               compatible = "gpio-leds";
+
+               led0 {
+                       label = "myled";
+                       gpios = ; /* PA3 */
+               };
+       };
```

Mình có tạo script để build rồi giờ các bạn chỉ cần chạy

```bash
cd Lichee-Nano-Device-Driver
$Lichee-Nano-Device-Driver$ ./scripts/build-dtb.sh
```

Là okay, rồi thay thế cái output/suniv-f1c100s-licheepi-nano.dtb vào cái dtb hiện có trên thẻ nhớ bạn là reboot okay

Sau khi reboot các bạn thử check mấy command sau nhé

Của mình sẽ ra kết quả như sau

```bash
root@f1c100s:~# dmesg | grep button
[    1.566153] input: buttons as /devices/platform/buttons/input/input0
root@f1c100s:~# gpioinfo | grep button
	line 131:      unnamed    "button0"   input   active-low [used]
```

Là ta đã cấu hình thành công, còn giờ để test sự kiện gpio-keys, ta dùng evtest, button được đăng ký tại input/input0

```bash
root@f1c100s:/sys/class/leds/myled# evtest /dev/input/event0
Input driver version is 1.0.1
Input device ID: bus 0x19 vendor 0x1 product 0x1 version 0x100
Input device name: "buttons"
Supported events:
  Event type 0 (EV_SYN)
  Event type 1 (EV_KEY)
    Event code 256 (BTN_0)
Properties:
Testing ... (interrupt to exit)
Event: time 1520602447.153664, type 1 (EV_KEY), code 256 (BTN_0), value 0
Event: time 1520602447.153664, -------------- SYN_REPORT ------------
Event: time 1520602447.903631, type 1 (EV_KEY), code 256 (BTN_0), value 1
Event: time 1520602447.903631, -------------- SYN_REPORT ------------
Event: time 1520602448.603643, type 1 (EV_KEY), code 256 (BTN_0), value 0
Event: time 1520602448.603643, -------------- SYN_REPORT ------------
Event: time 1520602449.013625, type 1 (EV_KEY), code 256 (BTN_0), value 1
```

Để hiểu hơn về cái evtest này các bạn có thể đọc thêm tại </2025/05/24/linux-cau-hinh-chuot-logitech-bang-bash-scripts/>

Tức là ở đây ta đã nhận biết trạng thái của biến trở mỗi khi thay đổi mức logic, không phải qua polling, mà sẽ qua event, mỗi khi có event ta sẽ bắt được

Kết hợp với cách điều khiển led dùng echo brightness ta có script đơn giản sau

```bash
evtest /dev/input/event0 | while read line; do
    if echo "$line" | grep -q "BTN_0.*value 0"; then
        echo 1 > /sys/class/leds/myled/brightness
    elif echo "$line" | grep -q "BTN_0.*value 1"; then
        echo 0 > /sys/class/leds/myled/brightness
    fi
done
```

Cách làm này vẫn chưa chính quy vì ngắt sẽ phải xuống kernel space, đó là lý do mà ta sẽ có Kernel module.

Các bạn cùng đón đọc bài sau mình sẽ viết về kernel module nhé !!

Chúc các bạn thực hành thành công !!
