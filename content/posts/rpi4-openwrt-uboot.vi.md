---
title: '[OpenWrt-RPi4] 2. Bring-up U-Boot trên OpenWrt image cho Raspberry Pi 4'
date: '2026-11-22T22:31:00+07:00'
lastmod: '2026-11-22T22:31:00+07:00'   # = date: bài hẹn giờ, không để git (ngày merge) làm "Cập nhật" sớm hơn ngày đăng
slug: rpi4-openwrt-uboot
authors:
- tuan
categories:
- OpenWrt
- BootProcess
- Raspberry Pi
tags:
- OpenWrt
- U-Boot
- RaspberryPi
series:
- OpenWrt-RPi4
series_order: 2
boards:
- Raspberry Pi 4
image: /uploads/2026/11/openwrt-rpi4-uboot-boot-log.webp
description: 'Chèn U-Boot vào giữa firmware Raspberry Pi và Linux kernel của OpenWrt trên Pi 4: sửa config.txt, tạo defconfig và device tree riêng, tự viết bootargs và bootcmd thay cho bootstd, sửa alias MMC để U-Boot thấy thẻ SD.'
---

## Mục tiêu

- Đưa **U-Boot** vào boot flow của **OpenWrt** trên **Raspberry Pi 4** (`bcm2711`), nằm giữa firmware của Raspberry Pi (`start4.elf` / `config.txt`) và Linux kernel (`kernel8.img`).

## 1. Build OpenWrt image cho Raspberry Pi 4

Phần này anh em đọc lại [bài viết trước](/posts/rpi4-openwrt-build/) của mình nhé.

---

## 2. Boot files của Raspberry Pi 4

Sau khi boot vào board:

```bash
cd /boot
ls
```

Có thể thấy các file:

```text
COPYING.linux
LICENCE.broadcom
bcm2711-rpi-4-b.dtb
bcm2711-rpi-400.dtb
bcm2711-rpi-cm4.dtb
config.txt
cmdline.txt
distroconfig.txt
fixup4.dat
fixup4cd.dat
fixup4x.dat
kernel8.img
overlays/
partuuid.txt
start4.elf
start4cd.elf
start4x.elf
```

Đây chính là những file mà Raspberry Pi 4 sử dụng trong quá trình boot.

---

## 3. Boot flow mặc định của Raspberry Pi 4

Điểm quan trọng đầu tiên: **Boot flow mặc định của Raspberry Pi 4 không sử dụng U-Boot.**

Flow mặc định:

```text
BOOTROM
   │
   ▼
start4.elf
   │
   ▼
config.txt
   │
   ├── Load kernel
   ├── Load Device Tree
   │
   ▼
Linux Kernel
   │
   ▼
OpenWrt
```

Trong đó:

- **BOOTROM**: code boot đầu tiên của Raspberry Pi. Trên Pi 4, BOOTROM nạp bootloader nằm trong SPI EEPROM trên board, bootloader này mới đọc thẻ SD và nạp `start4.elf` (Pi 4 không dùng `bootcode.bin` như các đời trước).
- **start4.elf**: firmware/bootloader của Raspberry Pi 4.
- **config.txt**: file cấu hình quan trọng, quyết định firmware sẽ load gì tiếp theo.
- **kernel8.img**: Linux kernel 64-bit.
- **.dtb**: Device Tree Blob.

---

## 4. `config.txt` mặc định của OpenWrt

File `config.txt` mặc định của OpenWrt gần như không chứa cấu hình boot đặc biệt:

```text
################################################################################
# Bootloader configuration - config.txt
################################################################################
# For overclocking and various other settings, see:
# https://www.raspberrypi.com/documentation/computers/config_txt.html
################################################################################
# OpenWrt config
include distroconfig.txt

[all]
# Place your custom settings here
```

Do đó, Raspberry Pi tiếp tục sử dụng các thiết lập mặc định. Một thiết lập quan trọng là:

```text
arm_64bit=1
```

Raspberry Pi 4 sẽ boot ở chế độ ARM 64-bit, vì vậy kernel mặc định là `kernel8.img`.

Flow lúc này:

```text
start4.elf
    │
    ▼
config.txt
    │
    ├── arm_64bit=1
    │
    ▼
kernel8.img
    │
    ├── bcm2711-rpi-4-b.dtb
    │
    ▼
Linux Kernel
```

---

## 5. Thêm U-Boot vào boot flow

Bây giờ mục tiêu là chèn U-Boot vào giữa Raspberry Pi firmware và Linux kernel. Cách làm là chỉnh `config.txt` để Raspberry Pi firmware load `u-boot.bin` thay vì load Linux kernel trực tiếp.

Thêm vào `config.txt`:

```text
enable_uart=1
arm_64bit=1
kernel=u-boot.bin
device_tree=bcm2711-rpi-4-b_owrt.dtb
```

Ý nghĩa từng dòng:

- `enable_uart=1`: Bật UART để debug U-Boot.
- `arm_64bit=1`: Boot ARM ở chế độ 64-bit.
- `kernel=u-boot.bin`: Thay vì load `kernel8.img`, Raspberry Pi firmware sẽ load `u-boot.bin`.
- `device_tree=bcm2711-rpi-4-b_owrt.dtb`: Sử dụng Device Tree dành cho U-Boot.

Boot flow mới:

```text
BOOTROM
   │
   ▼
start4.elf
   │
   ▼
config.txt
   │
   ├── kernel=u-boot.bin
   └── device_tree=bcm2711-rpi-4-b_owrt.dtb
   │
   ▼
U-Boot
   │
   ├── Load kernel
   ├── Load Device Tree
   │
   ▼
Linux Kernel
   │
   ▼
OpenWrt
```

Từ thời điểm U-Boot được load lên, việc Linux kernel được load như thế nào sẽ do U-Boot đảm nhiệm.

---

## 6. Build U-Boot

Sau khi đã có boot flow mới, bước tiếp theo là build U-Boot sao cho U-Boot có thể load Linux kernel của Pi 4.

Clone source:

```bash
git clone https://github.com/u-boot/u-boot.git
cd u-boot
```

Tạo branch riêng để làm việc, tách ra từ tag `v2026.07`:

```bash
git checkout -b rpi4-openwrt v2026.07
```

> **Lưu ý:** Nên tách branch từ một tag release thay vì `master`. Từ tháng 09/2026, U-Boot `master` đã xoá file `arch/arm/dts/bcm2711-rpi-4-b.dts` và bỏ dòng `CONFIG_DEFAULT_DEVICE_TREE` khỏi `rpi_4_defconfig`, nên mục 7 và 8.1 sẽ không làm theo được. Tag `v2026.07` và `v2026.10` vẫn còn file này. Mình làm trên bản `2026.07-rc1`.

---

## 7. Hai file cần quan tâm trong U-Boot

Có hai file gốc của Raspberry Pi 4 cần quan tâm:

- `configs/rpi_4_defconfig`
- `arch/arm/dts/bcm2711-rpi-4-b.dts`

Mình không muốn sửa trực tiếp hai file gốc. Thay vào đó, tạo hai file riêng:

- `configs/rpi_4_owrt_defconfig`
- `arch/arm/dts/bcm2711-rpi-4-b_owrt.dts`

Có thể copy như sau:

```bash
cd configs
cp rpi_4_defconfig rpi_4_owrt_defconfig
cd ../arch/arm/dts
cp bcm2711-rpi-4-b.dts bcm2711-rpi-4-b_owrt.dts
```

Từ đây, mình sẽ xử lý defconfig và Device Tree ở hai phần riêng biệt.

---

## 8. U-Boot defconfig

### 8.1. Đổi Device Tree mặc định

Trong `configs/rpi_4_owrt_defconfig` có dòng:

```text
CONFIG_DEFAULT_DEVICE_TREE="bcm2711-rpi-4-b"
```

Đây là Device Tree mà U-Boot sẽ sử dụng/build. Do mình đã tạo Device Tree riêng `bcm2711-rpi-4-b_owrt.dts`, nên sửa thành:

```text
CONFIG_DEFAULT_DEVICE_TREE="bcm2711-rpi-4-b_owrt"
```

### 8.2. Tắt Boot Standard

Một config khác cần đặc biệt chú ý:

```text
CONFIG_BOOTSTD_DEFAULTS=y
```

Đây là Boot Standard (`bootstd`) của U-Boot. Khi bật `bootstd`, U-Boot sẽ thực hiện quá trình bootflow discovery để tìm một bootflow hợp lệ trên các thiết bị boot. Trong quá trình này, U-Boot có thể thử các boot method như `EFI`, `PXE`, `DHCP`...

Trong khi đó, OpenWrt có boot layout riêng (`kernel`, `Device Tree`, `root filesystem`). Vì vậy nếu tiếp tục sử dụng `CONFIG_BOOTSTD_DEFAULTS=y`, có thể gặp lỗi:

```text
Card did not respond to voltage select: 110
Can not persist EFI variable without system partition
bootflow NULL with efi_mgr
```

Với boot flow hiện tại, mình sẽ không sử dụng `bootstd` mà chuyển sang boot bằng `bootargs` và `bootcmd` thủ công. Thay `CONFIG_BOOTSTD_DEFAULTS=y` bằng:

```text
# CONFIG_BOOTSTD_DEFAULTS is not set
```

### 8.3. Cấu hình `CONFIG_BOOTARGS`

Thêm:

```text
CONFIG_USE_BOOTARGS=y
CONFIG_BOOTARGS="console=tty1 console=ttyAMA0,115200 root=PARTUUID=c509a674-02 rootfstype=squashfs,ext4 rootwait"
```

`CONFIG_BOOTARGS` chính là kernel command line được truyền cho Linux kernel.

Khi Raspberry Pi boot mà không có U-Boot, thông tin này nằm trong `/boot/cmdline.txt`. Ví dụ:

```text
console=tty1 console=serial0,115200 root=@ROOT@ rootfstype=squashfs,ext4 rootwait
```

Nhưng khi đưa U-Boot vào boot flow, U-Boot không tự động sử dụng `cmdline.txt` theo cách boot flow mặc định của Raspberry Pi. Vì vậy, mình truyền trực tiếp kernel command line thông qua `CONFIG_BOOTARGS`.

`serial0` trong `cmdline.txt` là tên chung cho UART chính của Raspberry Pi. Khi truyền qua U-Boot, mình ghi thẳng tên thiết bị: `distroconfig.txt` của OpenWrt có `dtoverlay=disable-bt` cho Pi 4, nên UART ở chân GPIO 14/15 là PL011, trong Linux tên là `ttyAMA0`.

### 8.4. Vấn đề với `root=@ROOT@`

Trong `cmdline.txt`, `@ROOT@` cuối cùng sẽ được thay bằng `PARTUUID` của partition chứa root filesystem. Điểm cần chú ý là `PARTUUID` có thể thay đổi theo từng image. Ở đây, mình đã hardcode bằng cách boot OpenWrt lên board rồi kiểm tra:

```bash
cd /boot
cat cmdline.txt
```

Sau đó lấy giá trị `root=...` tương ứng và đưa vào `CONFIG_BOOTARGS`. Ví dụ với image của mình là `root=PARTUUID=c509a674-02` (image của anh em sẽ ra giá trị khác):

```text
CONFIG_BOOTARGS="console=tty1 console=ttyAMA0,115200 root=PARTUUID=c509a674-02 rootfstype=squashfs,ext4 rootwait"
```

### 8.5. Cấu hình `CONFIG_BOOTCOMMAND`

Tiếp theo:

```text
CONFIG_USE_BOOTCOMMAND=y
CONFIG_BOOTCOMMAND="fatload mmc 0:1 ${kernel_addr_r} kernel8.img; fatload mmc 0:1 ${fdt_addr_r} bcm2711-rpi-4-b.dtb; booti ${kernel_addr_r} - ${fdt_addr_r}"
```

`CONFIG_BOOTCOMMAND` là command mà U-Boot sẽ thực thi sau quá trình boot delay/countdown. Ở đây U-Boot sẽ thực hiện 3 bước:

- **Load kernel:**

  ```bash
  fatload mmc 0:1 ${kernel_addr_r} kernel8.img
  ```

  - `mmc 0:1`: partition 1 của MMC device 0.
  - `${kernel_addr_r}`: địa chỉ RAM dùng để load kernel.
  - `kernel8.img`: Linux kernel.

- **Load Device Tree:**

  ```bash
  fatload mmc 0:1 ${fdt_addr_r} bcm2711-rpi-4-b.dtb
  ```

  U-Boot load `bcm2711-rpi-4-b.dtb` vào `${fdt_addr_r}`.

- **Boot Linux:**

  ```bash
  booti ${kernel_addr_r} - ${fdt_addr_r}
  ```

  - `${kernel_addr_r}`: địa chỉ kernel.
  - `-`: không sử dụng initrd.
  - `${fdt_addr_r}`: địa chỉ Device Tree.
  - Tức là: `booti <kernel address> - <device tree address>`.

### 8.6. Địa chỉ `kernel_addr_r` và `fdt_addr_r`

Các địa chỉ này không cần tự nghĩ ra, có thể tìm trong:

```text
board/raspberrypi/rpi/rpi.env
```

### 8.7. Bật FAT command để debug

Vì boot partition của Raspberry Pi sử dụng FAT, có thể bật thêm:

```text
CONFIG_CMD_FAT=y
```

Toàn bộ thay đổi defconfig ở mục 8 nằm trong commit [`17e57b1`](https://github.com/TuanTNT19/u-boot/commit/17e57b1975d804fe88e95885c168da4ca29ba7a9) trên branch [`develop/uboot-bringup-openwrt`](https://github.com/TuanTNT19/u-boot/commits/develop/uboot-bringup-openwrt) của mình. PARTUUID trong commit là của image lúc đó, anh em thay bằng PARTUUID của mình như mục 8.4.

---

## 9. Device Tree `bcm2711-rpi-4-b_owrt.dts`

Sau khi xử lý defconfig, chuyển sang Device Tree tại `arch/arm/dts/bcm2711-rpi-4-b_owrt.dts`.

### 9.1. Vấn đề MMC

Nếu không chỉnh sửa gì thêm trong Device Tree, khi boot có thể gặp:

```text
U-Boot 2026.07-rc1-00004-g33d676df8693 (Sep 01 2026 - 19:43:26 +0700)

DRAM:  1.9 GiB
RPI 4 Model B (0xb03115)
Core:  176 devices, 18 uclasses, devicetree: board
MMC:   mmc@7e300000: 0, mmc@7e340000: 1
Loading Environment from FAT... Card did not respond to voltage select! : -110
** Bad device specification mmc 0 **
```

Có thể thấy U-Boot đang khởi tạo hai MMC device:

- `mmc0` → `0x7e300000`
- `mmc1` → `0x7e340000`

Tại sao `mmc 0` bị lỗi? Trong `CONFIG_BOOTCOMMAND`, mình đang sử dụng `fatload mmc 0:1 ...`, tức là U-Boot cần truy cập MMC device 0, nhưng vấn đề là SD card của Raspberry Pi 4 lại không nằm đây.

**Xác định SD card nằm ở đâu:**

Kiểm tra file `arch/arm/dts/bcm2711-rpi-4-b_owrt.dts` (hoặc build ra file `bcm2711-rpi-4-b_owrt.dtb` khi chưa chỉnh sửa gì rồi dùng `dtc` để dump ngược thành file `.dts`):

```c
/* EMMC2 is used to drive the SD card */
```

`emmc2` nằm tại `0x7e340000`, do đó mapping thực tế là:

```text
SD card
   │
   ▼
emmc2
   │
   ▼
0x7e340000
   │
   ▼
MMC device 1
```

→ SD card nằm tại `mmc1`.

### 9.2. Fix bằng Device Tree alias

Có thể sửa mapping của MMC bằng `aliases`. Thêm vào file `.dts`:

```dts
aliases {
    mmc0 = &emmc2;
    mmc1 = &sdhci;
};
```

Khi đó:

```text
mmc0
 │
 └──> emmc2
       │
       └──> SD card
```

Và command `fatload mmc 0:1 ...` sẽ truy cập đúng SD card.

Tham khảo commit [`5a297f0`](https://github.com/TuanTNT19/u-boot/commit/5a297f0d06e092e46c0c761207d3c710b39b2e73).

---

## 10. Script build U-Boot

Có thể thêm một script riêng để đơn giản hóa quá trình build. Ví dụ:

```bash
./build.sh rpi_4_owrt_defconfig
```

Tham khảo commit [`7ab72e1`](https://github.com/TuanTNT19/u-boot/commit/7ab72e1d28f24f836331802abd54bc2f7acd3053). Script này chỉ chạy mấy lệnh sau, anh em không dùng script thì gõ tay cũng được (cần cross compiler `aarch64-linux-gnu-`, trên Ubuntu là package `gcc-aarch64-linux-gnu`):

```bash
make distclean
make rpi_4_owrt_defconfig
make -j$(nproc) CROSS_COMPILE=aarch64-linux-gnu-
mkdir -p out
cp u-boot.bin out/
```

Trong script của mình có thêm `CC=aarch64-linux-gnu-gcc-10` vì máy mình dùng gcc 10, máy anh em có bản nào thì dùng bản đó.

---

## 11. Build U-Boot

Sau khi hoàn tất `configs/rpi_4_owrt_defconfig` và `arch/arm/dts/bcm2711-rpi-4-b_owrt.dts`, tiến hành build U-Boot.

Sau khi build xong, hai file cần quan tâm là:

- `out/u-boot.bin`
- `arch/arm/dts/bcm2711-rpi-4-b_owrt.dtb`

---

## 12. Copy U-Boot vào OpenWrt

Trên Raspberry Pi 4:

```bash
cd /boot
```

Chỉnh sửa `config.txt` thành:

```text
################################################################################
# Bootloader configuration - config.txt
################################################################################
# For overclocking and various other settings, see:
# https://www.raspberrypi.com/documentation/computers/config_txt.html
################################################################################
# OpenWrt config
include distroconfig.txt

[all]
# Place your custom settings here.
enable_uart=1
arm_64bit=1
device_tree=bcm2711-rpi-4-b_owrt.dtb
kernel=u-boot.bin
```

Sau đó copy `out/u-boot.bin` và `arch/arm/dts/bcm2711-rpi-4-b_owrt.dtb` vào `/boot`. Có thể dùng `scp`:

```bash
scp out/u-boot.bin root@<PI_IP>:/boot/
scp arch/arm/dts/bcm2711-rpi-4-b_owrt.dtb root@<PI_IP>:/boot/
```

> **Lưu ý:** Từ OpenSSH 9.0 (ví dụ Ubuntu 24.04), `scp` mặc định chạy qua giao thức SFTP, mà OpenWrt mặc định không có SFTP server. Nếu `scp` báo lỗi `sftp-server: not found` hoặc `Connection closed` thì thêm `-O` để dùng giao thức SCP cũ: `scp -O out/u-boot.bin root@<PI_IP>:/boot/`.

---

## 13. Boot thử

Sau khi copy xong, thư mục `/boot` sẽ có dạng:

```text
/boot
├── u-boot.bin
├── bcm2711-rpi-4-b_owrt.dtb
├── kernel8.img
├── config.txt
├── cmdline.txt
└── ...
```

Khởi động lại board bằng `reboot` (file đã được copy thẳng lên board nên không cần rút thẻ SD). Nếu UART đã được bật (`enable_uart=1`), có thể mở serial console để quan sát log của U-Boot.

Boot flow cuối cùng sẽ là:

```text
┌──────────────┐
│   BOOTROM    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  start4.elf  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  config.txt  │
└──────┬───────┘
       │
       │ kernel=u-boot.bin
       ▼
┌──────────────┐
│    U-Boot    │
└──────┬───────┘
       │
       ├── fatload kernel8.img
       │
       ├── fatload Device Tree
       │
       └── booti
              │
              ▼
       ┌──────────────┐
       │ Linux Kernel │
       └──────┬───────┘
              │
              ▼
          OpenWrt
```

Bài viết trên có 1 vài chỗ mình hơi hardcode, anh chị em có ý kiến gì thì cmt cùng sửa nhé.

![Log U-Boot khi boot Raspberry Pi 4](/uploads/2026/11/openwrt-rpi4-uboot-boot-log.webp)
