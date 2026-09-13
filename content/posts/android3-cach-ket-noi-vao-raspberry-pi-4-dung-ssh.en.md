---
title: '[Android] 3. How to connect to the Raspberry Pi 4 over SSH'
date: '2025-04-22T15:18:00+00:00'
lastmod: '2025-06-28T14:51:26+00:00'
slug: android3-cach-ket-noi-vao-raspberry-pi-4-dung-ssh
url: /en/2025/04/22/android3-cach-ket-noi-vao-raspberry-pi-4-dung-ssh/
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
description: 'Install Termux through adb, start sshd on the board, then ssh in on port 8022.'
wp_id: 44
translation: auto          # dịch máy từ bản tiếng Việt, chưa review kỹ - sửa trực tiếp file này
---
Reference: <https://gist.github.com/raveenb/ab3217798c827be889b83b584d70b08b>

![](/uploads/blogger/fb975454d7f4.jpg)

### 1. Preparing the host

Get adb connected to the board first, see [[Android] 2. How to connect to the Raspberry Pi 4 with ADB (Android Debug Bridge)](/en/2025/04/22/android2-cach-ket-noi-vao-raspberry-pi-4-dung-adb-android-debugger-bridge/). Download termux.apk to get a terminal on the board: <https://termux.en.download.it/android>

On the host, type:
> adb install \<termux.apk\>

![](/uploads/blogger/a547a6a75294.png)

### 2. Setting up on the board

Step 1: Open the Termux app on the board.

![](/uploads/blogger/c15c3503e0c9.jpg)

Step 2: In the Termux terminal, run these commands:
> pkg install root repo
> pkg upgrade
> pkg install termux-services

Step 3: Set a password and start sshd:
> passwd
> sshd

### 3. Connecting over ssh

Step 1: Connect both the host and the board to the same network.

Step 2: Connect with ssh, enter the password, and you're done:
> ssh -p 8022 \<board-ip\>

![](/uploads/blogger/f2b11ed6fb97.png)
