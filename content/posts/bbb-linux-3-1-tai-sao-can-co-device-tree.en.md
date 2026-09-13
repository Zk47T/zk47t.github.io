---
title: '[BBB-Linux] 3.1 Why do we need a Device Tree?'
date: '2025-05-10T11:16:00+00:00'
lastmod: '2025-09-19T21:23:18+00:00'
slug: bbb-linux-3-1-tai-sao-can-co-device-tree
url: /en/2025/05/10/bbb-linux-3-1-tai-sao-can-co-device-tree/
tags:
- Beaglebone
- Linux
series:
- BBB-Linux
series_order: 3.1
boards:
- Beaglebone Black
image: /uploads/2025/05/devicetree-e1751096406665.png
description: 'Why hard-coded board files did not scale, what the Device Tree brings, how a node is structured (compatible, reg, interrupts, clocks, status) and how the DTB is loaded.'
wp_id: 24
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
![](/uploads/blogger/30b8446785db.png)

A board has many peripherals, but once the OS is running it cannot discover the on-board peripherals by itself, except USB (which has a self-discovery mechanism). That is why we need a code file that defines the peripherals on the board.

## 1. Hard-coding peripherals in a file

The first way to define peripherals is to have, say, a board.c file. However, different boards have different peripherals even when they use the same SoC.

![](/uploads/blogger/a5497e291cb3.png)

So even with the same SoC, each board had to compile its own kernel matching the peripherals on that board. Compiling took a long time and there was no consistency.

The Linux community wanted to keep the Linux kernel independent.

--> ARM proposed the Device Tree (Flattened Device Tree)

## 2. Benefits of the Device Tree

- Easy to move between platforms: the Device Tree helps developers move applications and operating systems to different hardware architectures conveniently.
- Separates hardware and software: instead of encoding hardware information directly into the kernel, the Device Tree describes the hardware flexibly, reducing the dependence on a fixed configuration.
- Saves effort and time: developing and maintaining a system across many devices becomes simpler, which shortens the work and improves efficiency.

## 3. Device tree structure, illustrated

![](/uploads/blogger/fe348508f38a.png)

- i2c1: label
- i2c@30a20000: node name and unit
- compatible:
  - Specifies the driver name the kernel will use to match the device.
  - The kernel looks for a driver in the order of the strings in this list.
- reg: describes the hardware address range used by the device
  - 0x30a20000 is the start address.
  - 0x10000 is the size of the region (64 KB).
  - These values are split according to #address-cells and #size-cells.
- interrupts: describes the IRQ line used by the device.
  \
  - GIC_SPI: interrupt type from the GIC (Generic Interrupt Controller). 35: IRQ number.
  - IRQ_TYPE_LEVEL_HIGH: interrupt trigger type (level high).
- clocks: specifies the clock source feeding the device.
  - &clk: reference to the clock node.
  - IMX8MM_CLK_I2C1_ROOT: the specific clock name.
- status: device status "okay"/"disabled"

## 4. Device Tree Load

![](/uploads/2025/05/image-16.png)

The DTS (Device Tree Source) together with DTSI (Device Tree Source Include) goes through the device tree compiler to become the DTB (Device Tree Blob/Binary).

And since U-boot passes the boot parameters, the kernel knows the address in RAM where the DTB was loaded.

![](/uploads/2025/05/image-17.png)
