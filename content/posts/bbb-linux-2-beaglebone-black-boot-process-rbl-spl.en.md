---
title: '[BBB-Linux] 2. Beaglebone Black Boot Process - RBL, SPL'
date: '2025-05-08T15:29:00+00:00'
lastmod: '2025-11-22T15:11:09+00:00'
slug: bbb-linux-2-beaglebone-black-boot-process-rbl-spl
url: /en/2025/05/08/bbb-linux-2-beaglebone-black-boot-process-rbl-spl/
tags:
- Beaglebone
- Linux
series:
- BBB-Linux
series_order: 2
boards:
- Beaglebone Black
image: /uploads/2025/05/rbl.png
description: 'A closer look at the ROM Bootloader and the SPL/MLO on the AM335x: stack, watchdog, PLL, boot order, and why U-Boot cannot be loaded directly.'
wp_id: 26
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
![](/uploads/2025/05/image-3.png)

This post looks more closely at the RBL (ROM Bootloader) and SPL (Secondary Program Loader) stages that I mentioned in part 1.

**Ti AM335x CPU diagram**

![](/uploads/2025/05/image-4.png)

## 1. RBL (ROM Bootloader)

As in the picture above, we have the structure of the AM3359 SoC; the main chip consists of

- When the board powers up, the RBL code runs first
- The flow is described in the [Reference manual](https://www.ti.com/lit/ug/spruh73q/spruh73q.pdf) as follows

![](/uploads/2025/05/image-5.png)

- Stack: needs to be initialised to store local variables. However, the RBL runs from ROM, the SRAM is very small, and the DRAM has to be configured before it can be used
  - --> The stack is placed in the Internal SRAM
- WDT (Watchdog timer): set to a timeout; if the SPL is not loaded within that time the processor is reset automatically
- PLL (Phase Locked Loop): raises the clock
- Booting: selects the boot order according to SYSBOOT[4:0]

![](/uploads/2025/05/image-6.png)

Once the boot order is selected, suppose you store the SPL on the eMMC; then we have

![](/uploads/2025/05/image-7.png)

MLO differs from SPL in that it has a header

![](/uploads/2025/05/image-8.png)

After copying and handing over control, the RBL's work is done.

**#In summary, the RBL does**

- Stack setup
- Watchdog Timer config
- System clock config
- Check Boot Options
- Copy SPL/MLO --> Internal SRAM
- Execute SPL/MLO

## 2. MLO (Memory Loader) / SPL (Secondary Program Loader)

In short, the MLO configures the SoC up to the point where U-boot can be loaded into external RAM.

![](/uploads/2025/05/image-9.png)

The tasks MLO/SPL performs

- UART config: this lets it print debug messages (dmesg)
- Reconfigure the PLL: clock at the desired rate
- Configure the DDR registers: so the DDR RAM can be used
- Muxing Config: prepare the peripheral pins for booting
- Copy the u-boot image: into DDR memory and hand control to u-boot

You may wonder about the following 2 questions:

😎**1. Why not load the u-boot image directly into the Internal SRAM instead of going through the RBL step?**

--> Because the Internal SRAM is too small; shrinking u-boot to fit into 128Kb is impossible.

![](/uploads/2025/05/image-10.png)

😎**2. Why can't the RBL load U-boot directly into DDR?**

--> The RBL comes from the vendor, the SoC maker, while the DDR memory is designed by the board manufacturer.

So Texas Instruments cannot know in advance which DDR the board maker will use.

Usually u-boot includes the MLO as well.
