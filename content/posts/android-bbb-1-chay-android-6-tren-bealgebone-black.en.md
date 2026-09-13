---
title: '[Android-BBB] 1. Running Android 6 on the Beaglebone Black'
date: '2026-01-24T21:24:47+07:00'
lastmod: '2026-01-27T20:10:56+07:00'
slug: android-bbb-1-chay-android-6-tren-bealgebone-black
url: /en/2026/01/24/android-bbb-1-chay-android-6-tren-bealgebone-black/
categories:
- AOSP
tags:
- Android
- Beaglebone
- Linux
- Android-BBB
boards:
- Beaglebone Black
image: /uploads/2026/01/screenshot-from-2026-01-27-20-10-02.png
description: 'Why building Android 4 to 6 for the BeagleBone Black from source is painful today, using the prebuilt 2net images instead, flashing them, and the power supply issue with a 7 inch screen.'
wp_id: 1675
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
Of course, the Beaglebone Black only has 512Mb, so it can hardly run Android smoothly. I tried it, and wrote this post so anyone planning to try can have the experience :vv

## 1. Android 6 Image

### 1.1 Building the image yourself

You can follow this github page to build the image yourself: <https://github.com/csimmonds/android4beagle>

![](/uploads/2025/11/image-11.png)

But Android 4, 5, 6 came out more than 10 years ago. To build them you will probably need Docker with an Ubuntu image around 15.10 or even 13.10

In fact I followed it and still got errors while building, having to downgrade python, gcc, java, and still errors everywhere. Many git repos also no longer exist. So it is hard to rebuild.

So we go the easier way

### 1.2 Using a ready-made Image

From the 2net site, the author provides 3 images

![](/uploads/2025/11/image-12.png)

You can download them directly through the links. But whether the site is broken or not, clicking the links did not download for me, so I used wget. Use one of the 3 commands here for Android 4.4.4, 5.1.1, 6.0

```bash
wget www.2net.co.uk/downloads/a4b-images/kk4.4/a4b-android-4.4.4_r2-bbb.img.xz
wget www.2net.co.uk/downloads/a4b-images/l5.1/a4b-android-5.1.1-bbb.img.xz
wget www.2net.co.uk/downloads/a4b-images/m6.0/a4b-android-6.0-bbb.img.xz
```

If you use Windows you can download Axel and paste the link in; axel's github is here <https://github.com/nishad/axel-for-windows>

As described, axel speeds up the download by using more connections for one file

![](/uploads/2025/11/image-13.png)

## 2. Flash the image and test

### 2.1 Flash the image

On linux, I extract the .img.xz file to .img and then use the command. For \<name-of-devices> you can check with lsblk to find the name of your SD card

```bash
sudo dd if= of=/dev/ bs=4M status=progress conv=fsync
```

Although the image is only 200Mb, I found the copy took very long, about 15-20 minutes. So don't worry if it seems to hang a bit

On Windows you can use tools to flash. I used to borrow RPI Imager for this :vv

### 2.2 Testing the image

Here I use an external 5V 2A supply for the Beaglebone Black and plug in a 7 inch Waveshare screen for the interface. And yet the Serial Log kept showing the USB port disconnecting. Strangely, when I built an image with Yocto, even one with a GUI like core-image-sato, this never happened.

This happens when the BBB cannot supply enough power to the screen, so I used an external supply for the screen, and plugged a mouse and keyboard into the Beaglebone instead of using touch.

And tada, here is the result

{{< youtube XL-kIY8IkSU >}}

## 3. References

<https://www.2net.co.uk/android4beagle.html>
