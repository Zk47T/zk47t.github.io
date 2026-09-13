---
title: '[Yocto-Lichee] 2. Làm quen, flash image tới thẻ nhớ board Lichee Pi Nano'
date: '2026-09-05T21:25:15+07:00'
lastmod: '2026-09-05T21:31:40+07:00'
slug: yocto-lichee-2-lam-quen-voi-board-lichee-pi-nano
url: /2026/09/05/yocto-lichee-2-lam-quen-voi-board-lichee-pi-nano/
categories:
- LicheePi
- Yocto
tags:
- Lichee
- Linux
- Yocto
series:
- Yocto-Lichee
series_order: 2
boards:
- LicheePi Nano
image: /uploads/2026/05/screenshot-from-2026-04-14-22-10-05.png
description: Bài này thì mình sẽ hướng dẫn các bạn làm quen, và test khi mới nhận board LicheePi Nano về mà muốn kiểm tra board còn sống không :vv.
wp_id: 2572
---

Bài này thì mình sẽ hướng dẫn các bạn làm quen, và test khi mới nhận board LicheePi Nano về mà muốn kiểm tra board còn sống không :vv.

Kể chắc cũng hơi ngược khi đến bài thứ 3 trong series Yocto-Lichee mới là bài làm quen :vv . Gần đây mình nhận ra Yocto khá là phức tạp với người mới, nên mình chắc sau với các bài căn bản sẽ sang Buildroot để build được image đã :vv .

## 1. Chuẩn bị

### 1.1 Phần cứng

- Kit lichee pi nano
- Dây Micro usb cấp nguồn (Loại có truyền được dữ liệu để dùng adb)
- Dây USB - UART (Nếu muốn xem serial)

### 1.2 Tải pre-built image

Mình có put image tại đây <https://drive.google.com/drive/folders/1ng2BlJO8en3XFMxtELdVX1J9H_lbOXoK?usp=sharing>

Nó có 3 file, 1 file về câu lệnh adb, 1 file image, 1 file reame về các flash nhé. Thì bài này mình sẽ hướng dẫn các bạn kĩ hơn về từng bước theo readme này.

## 2. Flash image

### 2.1 Trên Ubuntu

Các bạn truy cập app Disks có sẵn trên Ubuntu, cắm thẻ nhớ vào sẽ thấy ở đây. Mình cắm thẻ nhớ 8Gb và nó nhận tại /dev/sda

![](/uploads/2026/09/image.png)

Tiếp tục các bạn ấn vào dấu ở góc này chọn Restore Disk Image

![](/uploads/2026/09/image-1.png)

Trỏ đến image tải về và ta sẽ sẵn sàng cho start restoring ...

![](/uploads/2026/09/image-2.png)

Đợi flash xong, các bạn cắm thẻ vào board, cài adb cho máy và thử

![](/uploads/2026/09/adb.png)

Hoặc với serial thì là "sudo picocom -b 115200 /dev/ttyUSB0"

![](/uploads/2026/09/image-3.png)

### 2.2 Trên Windows

Các bạn dùng app Rufus để flash image tải về nhé

![](/uploads/2026/09/image-4.png)

Rồi chọn device là thẻ nhớ và img tải về start là ok

Các bạn tải platformtool từ google về để có adb nhé <https://developer.android.com/tools/releases/platform-tools?hl=vi>

Ở windows thì bạn phải thêm folder chứa adb này vào path, hoặc là chạy tại ngay thư mục tải về đó

![](/uploads/2026/09/image-5.png)

## 3. Dùng adb vào shell, push, pull file

Ở image này mình đã để riêng thư mục boot, để cho nếu bạn thay đôi kernel hay build lại dtb, chỉ cần trỏ vào đây

Để push 1 file tới địa chỉ /boot trên board chẳng hạn thì ta thử

```bash
zk47@ltu:~$ touch tmp-boot-file
zk47@ltu:~$ adb push tmp-boot-file /boot
tmp-boot-file: 1 file pushed, 0 skipped.
zk47@ltu:~$ adb shell
sh-5.2# ls /boot
README.txt                       tmp-boot-file
boot.scr                         zImage
suniv-f1c100s-licheepi-nano.dtb
```

Để pull file /boot/zImage thì ta đứng từ terminal máy tính chạy

```bash
zk47@ltu:~$ adb pull /boot/zImage
/boot/zImage: 1 file pulled, 0 skipped. 1.8 MB/s (2605584 bytes in 1.404s)
zk47@ltu:~$ ls | grep zImage
zImage
```

Chúc các bạn làm quen vọc vạch board suôn sẻ.

P/s: Thực tế board cũng có sẵn image trên SPI NOR, các bạn cắm nguồn, và đọc serial là biết board sống hay khôn. Chỉ là flash lại thì bạn sẽ cần add thêm command bên linux, và config hợp lý thì mới flash được. Hình như có sunxi-tools sẵn.

Cái image của mình tiện là nó có adb, nên gửi file, và bạn sẽ không cần cắm dây uart serial luôn :vv
