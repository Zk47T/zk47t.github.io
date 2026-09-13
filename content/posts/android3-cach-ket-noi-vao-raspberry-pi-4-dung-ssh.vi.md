---
title: '[Android]3. Cách Kết nối vào Raspberry Pi 4 dùng SSH'
date: '2025-04-22T15:18:00+00:00'
lastmod: '2025-06-28T14:51:26+00:00'
slug: android3-cach-ket-noi-vao-raspberry-pi-4-dung-ssh
url: /2025/04/22/android3-cach-ket-noi-vao-raspberry-pi-4-dung-ssh/
categories:
- AOSP
- Raspberry Pi
tags:
- Android
- RaspberryPi
series:
- Android
series_order: 3
boards:
- Raspberry Pi 4
image: /uploads/2025/04/ssh.jpg
description: Tham khảo tại  <https://gist.github.com/raveenb/ab3217798c827be889b83b584d70b08b>
wp_id: 44
---

Tham khảo tại  <https://gist.github.com/raveenb/ab3217798c827be889b83b584d70b08b>

![](/uploads/blogger/fb975454d7f4.jpg)

\

### 1. Chuẩn bị bên host

Kết nối được adb vào board, tham khảo [[Android]2. Cách Kết nối vào Raspberry Pi 4 dùng ADB (Android Debugger Bridge)](https://zk47t.blogspot.com/2025/04/android2-cach-ket-noi-vao-raspberry-pi.html)Tải termux.apk để sử dụng terminal trên board tại đây <https://termux.en.download.it/android>\
Tại host gõ
> adb install

\

![](/uploads/blogger/a547a6a75294.png)

\

### 2. Cài đặt trên board

B1: Mở Termux app trên board

![](/uploads/blogger/c15c3503e0c9.jpg)

\
B2: Trong terminal của Termux gõ các command
> pkg install root repopkg upgradepkg install termux-services

B3: Setup mật khẩu và start sshd
> passwdsshd

### 3. Kết nối ssh

B1: Kết nối cả host và board vào cùng 1 mạngB2: Kết nối ssh, nhập mật khẩu và done
> ssh -p 8022

![](/uploads/blogger/f2b11ed6fb97.png)

\
\
\
\
\
\
