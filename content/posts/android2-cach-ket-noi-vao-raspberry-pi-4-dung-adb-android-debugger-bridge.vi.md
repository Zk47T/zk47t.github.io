---
title: '[Android]2. Cách Kết nối vào Raspberry Pi 4 dùng ADB (Android Debugger Bridge)'
date: '2025-04-22T15:00:00+00:00'
lastmod: '2025-06-28T14:51:53+00:00'
slug: android2-cach-ket-noi-vao-raspberry-pi-4-dung-adb-android-debugger-bridge
url: /2025/04/22/android2-cach-ket-noi-vao-raspberry-pi-4-dung-adb-android-debugger-bridge/
categories:
- AOSP
- Raspberry Pi
tags:
- Android
- RaspberryPi
series:
- Android
series_order: 2
boards:
- Raspberry Pi 4
image: /uploads/2025/04/adb.jpg
description: \ Chắc chắn rồi, phải cài adb trên máy tính đầu tiên. Có 2 cách 1 là bạn cài zip, 2 là sẽ cài package sử dung apt luôn. Mình theo cách thứ 2sudo apt install …
wp_id: 49
---

### 1. Chuẩn bị bên Host

![](/uploads/blogger/db032521f065.jpg)

\
Chắc chắn rồi, phải cài adb trên máy tính đầu tiên. Có 2 cách 1 là bạn cài zip, 2 là sẽ cài package sử dung apt luôn. Mình theo cách thứ 2*sudo apt install adb*Sau khi cài xong verify bằng*adb version*

![](/uploads/blogger/81b2dc3dabf8.png)

\

### 2. Chuẩn bị bên Raspberry Pi

B1: Kết nối Pi và máy tính sử dụng dây type C cổng nguồnB2: Vào Settings chọn About Tablet, Lướt xuống cuối. Bấm Build number 8 lần

![](/uploads/blogger/35d919e6de9e.jpg)

\
\
B3: Chọn System, vào Developer options

![](/uploads/blogger/b8f8cdd749bb.jpg)

\
B4: Chọn Use developer options, và chọn USB debugging\

![](/uploads/blogger/ae3e744c68e7.jpg)

\
B5: Check ở máy tính câu lệnh*adb devices*

![](/uploads/blogger/2d59d30a8451.png)

\
\
Đã nhận thiết bịB6 : Connect vào board và bắt đầu dùng thôi*adb root**adb shell*

![](/uploads/blogger/092bc010008b.png)

\
