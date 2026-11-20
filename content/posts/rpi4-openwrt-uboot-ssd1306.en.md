---
title: '[OpenWrt-RPi4] 3. Bringing up an SSD1306 in U-Boot on an OpenWrt image for the Raspberry Pi 4'
date: '2026-12-07T08:00:00+07:00'
lastmod: '2026-12-07T08:00:00+07:00'   # = date: bài hẹn giờ, không để git (ngày merge) làm "Cập nhật" sớm hơn ngày đăng
slug: rpi4-openwrt-uboot-ssd1306
authors:
- tuan
categories:
- OpenWrt
- DeviceDriver
- Raspberry Pi
tags:
- OpenWrt
- U-Boot
- SSD1306
- RaspberryPi
series:
- OpenWrt-RPi4
series_order: 3
boards:
- Raspberry Pi 4
image: /uploads/2026/11/openwrt-rpi4-ssd1306-1.webp
description: 'Bring up an SSD1306 OLED over I2C inside U-Boot on the Raspberry Pi 4: trace i2c_master_send in Linux to find the BCM2835 I2C driver, port that driver to U-Boot, then add an SSD1306 driver.'
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
## Goal

- Bring up an **SSD1306** OLED display over **I2C** in **U-Boot** running on the **Raspberry Pi 4** (`bcm2711`).

---

Now that the Pi 4 boots with U-Boot ([previous post](/en/posts/rpi4-openwrt-uboot/)), our job is to add SSD1306 display support to it. We start from how the SSD1306 is brought up in the Linux kernel.

You can find the code here:

- [ssd1306_driver](https://github.com/TuanTNT19/SnakeGame_in_BBB/tree/button_control/ssd1306_driver)
- [device_tree](https://github.com/TuanTNT19/SnakeGame_in_BBB/tree/button_control/device_tree)

To be honest, I didn't write this driver from scratch either; I collected bits from the internet and modified them )

---

## 1. Tracing `i2c_master_send()` in the Linux kernel

If you read the `ssd1306_driver` code, specifically `ssd1306_lib.c`, you will notice that almost every function is built on `i2c_master_send()`. This is a ready-made Linux API. When writing a Linux driver you normally just call it.

Let's trace this function step by step:

```text
i2c_master_send (include/linux/i2c.h)
    --> i2c_transfer_buffer_flags (drivers/i2c/i2c-core-base.c)
        --> i2c_transfer (drivers/i2c/i2c-core-base.c)
            --> __i2c_transfer (drivers/i2c/i2c-core-base.c)
                --> adap->algo->master_xfer (drivers/i2c/i2c-core-base.c)
```

The last line is the important one:

```c
adap->algo->master_xfer
```

It means a function pointer called `master_xfer` gets called. Anyone with some experience tracing Linux kernel code knows that function pointers usually live in a predefined struct and are implemented like this:

```c
.master_xfer = <func>
```

OK, let's keep tracing:

```bash
cd drivers
grep -r ".master_xfer"
```

In `drivers/i2c/busses` you will find lots of lines like:

```c
.master_xfer = ...
```

> **Note:** in newer kernels this field has been renamed to `xfer` (`master_xfer` is still there for compatibility but is deprecated). Since the Raspberry Pi `rpi-6.12.y` branch, `i2c-bcm2835.c` has `.xfer = bcm2835_i2c_xfer`, and OpenWrt currently builds the Pi 4 with kernel 6.18. If grepping for `.master_xfer` does not find `i2c-bcm2835.c`, grep for both names: `grep -rnE '\.(master_)?xfer\s*=' i2c/busses`.

So the question is: **how do we know exactly which `.master_xfer` is ours?**

This is a classic Linux kernel pattern. Notice that each `.master_xfer` sits in its own `.c` file. That means whichever `.c` file gets built, the `.master_xfer` defined in it is the implementation the kernel uses.

So we keep tracing:

```text
drivers/i2c/busses/Makefile
```

In this file, each `.c` file is built into a `.o` when the matching `CONFIG_*` is enabled. So all we need is to check which config is enabled in the kernel `.config`.

For the Raspberry Pi 4:

```text
CONFIG_I2C_BCM2835
```

is enabled, so `i2c-bcm2835.o` gets built.

→ The `.c` file we are looking for is:

```text
drivers/i2c/busses/i2c-bcm2835.c
```

---

## 2. Porting the BCM2835 I2C driver to U-Boot

OK, the next question is: **does U-Boot already support something like `i2c-bcm2835.c`?**

The answer is no. We need to port this BCM2835 I2C driver to U-Boot first.

For how to port it, see commit [`954d397`](https://github.com/TuanTNT19/u-boot/commit/954d39716a2f06a1e8390c649d723b8feed4fd26) on my [`develop/uboot-bringup-openwrt`](https://github.com/TuanTNT19/u-boot/commits/develop/uboot-bringup-openwrt) branch.

I hardcoded a few things in this port. If you have ideas, please do comment )

---

## 3. Bringing up the SSD1306 in U-Boot

With BCM2835 I2C ported, we get to the main step: bringing up the SSD1306.

### 3.1. Add the Device Tree node

Add the SSD1306 node to the Device Tree like this:

```dts
&i2c1 {
    status = "okay";

    ssd1306: ssd1306@3c {
        compatible = "tnt19,ssd1306";
        reg = <0x3c>;
        status = "okay";
    };
};
```

Here `0x3c` is the SSD1306's I2C address. `i2c1` is the I2C bus on GPIO 2 (SDA) and GPIO 3 (SCL), that is pins 3 and 5 on the 40-pin header.

### 3.2. Add the SSD1306 driver

This step is mostly: copy the driver over from Linux and hook a new driver into the U-Boot build.

See commit [`3112983`](https://github.com/TuanTNT19/u-boot/commit/31129834b31f91e2b2b04c3aefe2aa8d0c208970).

---

## 4. Build and test

OK, all done, time to build. Once you have:

```text
u-boot.bin
bcm2711-rpi-4-b_owrt.dtb
```

do the same as in the previous post:

- Replace `u-boot.bin` in `/boot` on the board with the new build.
- Replace `bcm2711-rpi-4-b_owrt.dtb` in `/boot` with the new build.

Then:

```text
Reboot Pi 4
        ↓
Boot
        ↓
U-Boot
        ↓
SSD1306
        ↓
See the result :)
```

![SSD1306 bring-up result in U-Boot (1/2)](/uploads/2026/11/openwrt-rpi4-ssd1306-1.webp)

![SSD1306 bring-up result in U-Boot (2/2)](/uploads/2026/11/openwrt-rpi4-ssd1306-2.webp)
