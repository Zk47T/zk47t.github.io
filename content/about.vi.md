---
title: About
date: '2025-06-28T06:49:48+00:00'
lastmod: '2026-06-21T23:45:26+00:00'
slug: about
url: /about/
description: 'I''m an Embedded Linux and Android BSP engineer with 2+ years of professional C/C++ work on automotive platforms. My focus is new-board bring-up: Device Tree,…'
wp_id: 1
---

I'm an Embedded Linux and Android BSP engineer with 2+ years of professional C/C++ work on automotive platforms. My focus is new-board bring-up: Device Tree, kernel and driver debugging, boot-chain work, and getting full IVI stacks booted on hardware that has no support yet.

I like taking a board that "doesn't work yet" and making it boot, network, and render, then writing it down so the next person can reproduce it in one pass.

Some recent work:

- Brought up a 4-port Ethernet subsystem on a custom Rockchip RK3568 board (RTL8367RB switch behind a LAN7801 USB-to-RGMII MAC) and tuned the RGMII timing until every port passed clean.
- Found and fixed a lan78xx kernel bug that left the LAN7801 MAC misconfigured and corrupting every TX frame, with the fix headed for stable.
- Ported both Android Automotive 16 and Automotive Grade Linux (Yocto) to the NXP FRDM-i.MX95, end to end, with GPU rendering on the Mali-G310.
- Authored a new TI ADS1220 IIO driver, currently under upstream review.

I also write a lot: 60+ hands-on posts on my blog across 8 hardware platforms, plus an Embedded Linux community where I share the work.\
If you work with automotive Linux, Yocto BSPs, kernel drivers, or embedded graphics, I'd love to connect.

Core skills

- Platforms: Qualcomm SA8155/SA8255/SA8150, NXP i.MX93/i.MX95, Rockchip RK3568, STM32MP157, BeagleBone, Raspberry Pi, RISC-V
- Yocto / Build: custom layers, recipes/bbappends, BBMASK/PREFERRED_PROVIDER, Buildroot, kas, GitHub Actions
- Kernel / Drivers: Device Tree and overlays, GPIO/I2C/SPI/UART, display, IIO ADC, USB-Ethernet and netdev, U-Boot/SPL, DDR training, KGDB
- Android / AOSP: AAOS bring-up, Soong/Make/Ninja, repo, fastboot/UUU, SELinux, Vehicle HAL
- Graphics: Weston/Wayland, DRM/KMS, Mali GPU stack
- Languages: C/C++ (MISRA), Python, Bash, ARM/RISC-V assembly

Find me\
👉 Blog: https://embeddedlinux.blog/\
👉 Facebook: https://www.facebook.com/people/Embedded-Linux-Blog/61579958129080/\
👉 Facebook group: https://www.facebook.com/groups/1291288389349930\
👉 LinkedIn: https://www.linkedin.com/in/zk47tien/\
👉 Email for work: zizuzacker@gmail.com
