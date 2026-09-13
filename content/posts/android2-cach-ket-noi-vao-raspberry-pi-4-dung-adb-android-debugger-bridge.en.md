---
title: '[Android] 2. How to connect to the Raspberry Pi 4 with ADB (Android Debug Bridge)'
date: '2025-04-22T15:00:00+00:00'
lastmod: '2025-06-28T14:51:53+00:00'
slug: android2-cach-ket-noi-vao-raspberry-pi-4-dung-adb-android-debugger-bridge
url: /en/2025/04/22/android2-cach-ket-noi-vao-raspberry-pi-4-dung-adb-android-debugger-bridge/
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
description: 'Install adb on the host, enable USB debugging on the Pi, then adb devices / adb root / adb shell.'
wp_id: 49
translation: auto          # dịch máy từ bản tiếng Việt, chưa review kỹ - sửa trực tiếp file này
---
### 1. Preparing the host

![](/uploads/blogger/db032521f065.jpg)

Obviously, adb has to be installed on the computer first. There are two ways: install the zip, or install the package with apt. I went with the second one:

*sudo apt install adb*

After installing, verify with *adb version*

![](/uploads/blogger/81b2dc3dabf8.png)

### 2. Preparing the Raspberry Pi

Step 1: Connect the Pi and the computer with a USB Type-C cable through the power port.

Step 2: Go to Settings, choose About Tablet, scroll to the bottom and tap Build number 8 times.

![](/uploads/blogger/35d919e6de9e.jpg)

Step 3: Choose System, then Developer options.

![](/uploads/blogger/b8f8cdd749bb.jpg)

Step 4: Enable Use developer options and enable USB debugging.

![](/uploads/blogger/ae3e744c68e7.jpg)

Step 5: On the computer, check with *adb devices*

![](/uploads/blogger/2d59d30a8451.png)

The device is detected.

Step 6: Connect to the board and start using it: *adb root*, *adb shell*

![](/uploads/blogger/092bc010008b.png)
