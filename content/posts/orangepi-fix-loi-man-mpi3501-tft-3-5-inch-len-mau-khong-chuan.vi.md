---
title: '[OrangePi] Fix lỗi màn MPI3501 TFT 3.5 inch lên màu không chuẩn'
date: '2025-06-17T15:25:00+00:00'
lastmod: '2026-05-09T08:48:33+00:00'
slug: orangepi-fix-loi-man-mpi3501-tft-3-5-inch-len-mau-khong-chuan
url: /2025/06/17/orangepi-fix-loi-man-mpi3501-tft-3-5-inch-len-mau-khong-chuan/
categories:
- Orange Pi
tags:
- Linux
- OrangePi
boards:
- Orange Pi Zero 2W
image: /uploads/2025/06/orange-pi-zero-2w.png
description: Mình có con board Orange pi zero 2w, có thể coi là 1 phiên bản hiệu năng cao mà lại rẻ hơn Raspberry Pi Zero 2w. Đánh đổi của nó là ít tài liệu và thiếu supp…
wp_id: 15
---

Mình có con board Orange pi zero 2w, có thể coi là 1 phiên bản hiệu năng cao mà lại rẻ hơn Raspberry Pi Zero 2w. Đánh đổi của nó là ít tài liệu và thiếu support hơn. Mình nhận ra sâu sắc điều này hơn khi gặp vấn đề màn hình chạy trên board hiển thị màu không đúng

## 1. Vấn đề

![](/uploads/blogger/d5d9ef08c56a.png)

Mình muốn có con màn để hiển thị, vừa rẻ vừa tiện cho việc cắm. Board có sẵn output ra mini HDMI. Nên sẽ có 1 số lựa chọn về màn như

1. **Màn có HDMI MPI3508** : Đặt shopee nước ngoài tầm 300k, nhưng phải thêm dây và cổng chuyển nữa, nên sẽ lên tầm 400k.
2. **Màn SPI chính hãng Waveshare** : <https://www.waveshare.com/wiki/3.5inch_RPi_LCD_(C)>. Ngon, bổ rồi nhưng tất nhiên chính hãng thì không rẻ ~500k
3. **Màn SPI clone MPI 3501**: <http://www.lcdwiki.com/3.5inch_RPi_Display>, giá con này chỉ 200k shopee, cắm SPI rất tiện

--> Chọn màn clone MPI 3501 là rõ rồi \
Màn MPI3501 là màn clone của màn Waveshare, 2 con dùng chung chip xử lý ILI9486 và chip cảm ứng ADS7846 . Tuy nhiên khi cùng 1 device tree setup, màn waveshare thì lên màu chuẩn,còn  màn MPI3501 lại bị lỗi màu trên board Orange Pi Zero 2W

![](/uploads/blogger/cbb22a068d24.png)

Bên trái là MPI3501, bên phải là màn Waveshare. Orange Pi thì nó đáng ra phải là màu cam rồi :v \
-->Đồ rẻ thì phải làm nhiều thôi. Làm xong lại học được nhiều thứ

### **2. BẮT ĐẦU KIỂM TRA**

### 2.1 Cài overlay

Hệ điều hành mình dùng là Debian Bookworm Kernel 6.1. Thực tế về cách cài thì tương tự với nhau trên những image mà trang chủ Orange Pi support (<http://www.orangepi.org/html/hardWare/computerAndMicrocontrollers/service-and-support/Orange-Pi-Zero-2W.html>). Lúc mình cài được là đang chạy Armbian.

Mình dựa theo hướng dẫn tại đây <https://github.com/dev-null2019/orangepizero2w35tft>. Với màn waveshare là khởi động lại là lên màu đúng cảm ứng ok luôn. Còn màn clone thì bị như trên.

Mình sợ rằng bản thân cái màn đang hiển thị bị sai nên cũng đã cấu hình trên Raspberry Pi 4 theo nhà sản xuất (<https://github.com/goodtft/LCD-show>), thì nó vẫn ra đúng màu như thường

![](/uploads/blogger/2093d45e8d28.jpg)

**--> Có vẻ vấn đề là driver.**

#### 2.2 Kiểm tra driver

##### **2.2.1 Trên Raspberry Pi 4**

Đầu tiên do trên Raspberry Pi 4 màn chạy ra màu chuẩn nên mình kiểm tra driver đang được dùng ở đây. Với các board nhúng này đã lên được màn thì đa phần sẽ có device frame buffer tương ứng cho driver. Check bằng câu lệnh

![](/uploads/2025/06/image-28.png)

Hiểu đơn giản màn bạn hiển thị chính là hiển thị cái frame buffer này. Nó đang ở dạng raw data . Dữ liệu ở đây hiện đang được tạo bởi DRM (Direct Rendering Manager ) driver cho ILI9486.

Lấy tên driver bằng cách

```bash
cat /sys/class/graphics/fb/name
```

![](/uploads/2025/06/image-29.png)

Trước đó do cắm HDMI PI đã nhận fb0, cắm tiếp màn MPI3501, board khởi tạo fb1, với driver name `fb_ili9486`

#### 2.2.2 Trên Orange Pi Zero 2W

Làm tương tự trên OPi ta thu được

```bash
orangepi@orangepi:/boot$ cat /sys/class/graphics/fb0/name
ili9486drmfb
```

Vậy là giữa 2 con đang có sự khác nhau về driver.

**--> Build thử Driver fb_ili9486 xem sao**

#### **2.2.3 Build Driver fb_ili9486**

Mình tìm source code của con orange pi. Check name và kernel ta được

```bash
orangepi@orangepi:/boot$ uname -a
Linux Gigi-Connect 6.1.31-sun50iw9 #1.0.2 SMP Thu Jul 11 17:24:28 CST 2024 aarch64 GNU/Linux
orangepi@orangepi:/boot$ lsb_release -a
No LSB modules are available.
Distributor ID:    Debian
Description:    Orange Pi 1.0.2 Bookworm
Release:    12
Codename:    bookworm
```

Thế là đi tìm source code, được nguồn https://github.com/orangepi-xunlong/linux-orangepi

Tạo môi trường build các thứ, ra được file .ko để insmod bên orange pi.

Tuy nhiên không hiểu sao insmod luôn bị Invalid Symbol mà không biết xem ở đâu, cấu hình đúng kernel Check bằng modinfo rồi :v.

**--> Đổi sang xem liệu có thể thay đổi BGR không**

### 2.2 Thay đổi BGR cho màn

Mình đi đến cách tiếp cận này khi tự build và cài driver không khả quan. Và còn đọc được trên diễn đàn là fb_ili9486 không còn được support sau bản kernel 5.4

Vậy màn theo cảm quan là đang bị ngược màu, nhưng làm sao để check là nó thật sự bị ngược màu không.

**--> Viết 1 script python đơn giản rồi output ra màn**

```bash
python3 -c 'open("red.raw", "wb").write(b"\xF8\x00" * 153600)'
sudo dd if=red.raw of=/dev/fb0 bs=1

python3 -c 'open("green.raw", "wb").write(b"\x07\xE0" * 153600)'
sudo dd if=green.raw of=/dev/fb0 bs=1

python3 -c 'open("blue.raw", "wb").write(b"\x00\x1F" * 153600)'
sudo dd if=blue.raw of=/dev/fb0 bs=1
```

Việc test thế này giúp mình nhận ra nó thật sự bị ngược màu

```bash
Red. —> blue
Green —> red
Blue. —> green
```

Tuy nhiên ngược thế này là do framebuffer đã bị ngược sẵn rồi hay ra tới màn nó mới bị ngược**--> Dịch chính framebuffer ra thôi**

```bash
sudo ffmpeg -f fbdev -framerate 1 -i /dev/fb0 -vframes 1 framebuffer.png
```

Mở file png thì thấy màu vẫn chuẩn :v**--> Lỗi config trên màn**

#### **2.3.1 Đọc kỹ hơn về Config:**

 Có 2 cái mình đã đọc:

1. <https://github.com/goodtft/LCD-show/blob/master/LCD35-show> : Cách cài đặt cho RPI 4 từ nhà sản xuất

2. <https://github.com/dev-null2019/orangepizero2w35tft> : Cách add overlay device tree

--> Cả 2 đều sẽ thêm device tree để cấu hình cho ili9486 và ads7846.

--> 1 bên thêm thủ công, 1 bên thêm command có sẵn là orangepi-add-overlay

![](/uploads/blogger/f8b41b6ab73e.png)

Mục đích :

- Tạo file calib cho x11 server (calib cảm ứng cũng như fb)
- Compile dts file to dtbo rồi copy tới /boot/overlay-user
- Thêm overlay-user= vào /boot/orangepiEnv.txt

##### 2.3.2 Đọc kỹ Device tree file

Dễ thấy ngay trường bgr = . Hiểu thì nó sẽ là Blue-green-red thứ tự như nào.

![](/uploads/2025/06/image-26.png)

Như vớ được vàng, mình thay nó sang như ở trên rồi reboot

–> Không có gì thay đổi

Mình bắt đầu nghi ngờ không biết trường này có được parse khi duyệt device tree không. Nên phải check.

![](/uploads/2025/06/image-27.png)

Mình check bằng việc đọc device tree ra, và bgr có được apply và thay đổi ở đây

Vậy chỉ còn 1 trường là khả nghi nhất, đó là trường init

```bash
init = ;
```

**--> Sau khi đọc thêm datasheet của ILI9486 mình cuối cùng cũng biết cách để đổi BGR của màn** (<https://www.hpinfotech.ro/ILI9486.pdf>)

### **3. GIẢI PHÁP**

Trường init này chính là init command sẽ được gửi tới màn lúc khởi động, Được nói cụ thể ở mục 8 từ trang 147

![](/uploads/blogger/3ae797df4793.png)

Nó sẽ là Command + Parameter, và cần đặc biệt lưu ý đến Command 36h 

![](/uploads/blogger/d319e2eb6f1d.png)

Parameter bit D3 sẽ define RGB-BGR cái nào sẽ được áp dụng

--> Việc này sẽ ghi đè lại trường BGR define bên device tree bên trên

--> Sửa Device tree thôi. Mình sửa trường init 2 cái command 0x100036 mình đều để parameter 0x48 (ban đầu 0x08 không được, nên mình đã thử thêm 1 số cái nữa, và cuối cùng 0x48 được :v )

Device tree sau cùng sẽ có dạng init kiểu

```bash
init = ;
```

PS: Phải hạ cả max speed of spi (cái này thì không hiểu tại sao lắm)

Và kết quả khi khởi đôngj lại là màn đã lên đúng

![](/uploads/blogger/11382bc5ac58.jpg)

Cứ thế thôi :v

P/s: Vô cùng cảm ơn robertoj từ forum Armbian

<https://forum.armbian.com/topic/52880-orangepi-zero-2w-wrong-color-display-on-mpi3501>
