---
title: '[Yocto-STM32MP1] 2. Tạo patch device tree kernel, mở i2c'
date: '2025-12-13T07:18:00+07:00'
lastmod: '2025-12-12T09:26:26+07:00'
slug: yocto-stm32mp1-2-tao-patch-device-tree-kernel-mo-i2c
url: /2025/12/13/yocto-stm32mp1-2-tao-patch-device-tree-kernel-mo-i2c/
categories:
- STM32MP
- Yocto
tags:
- Linux
- Yocto
series:
- Yocto-STM32MP1
series_order: 2
boards:
- STM32MP157
image: /uploads/2025/10/embedded-linuxlinux.png
description: Ở bài này mình sẽ hướng dẫn các bạn cách tạo patch device tree kernel, để enable i2c5 trên board
wp_id: 1496
---

Ở bài này mình sẽ hướng dẫn các bạn cách tạo patch device tree kernel, để enable i2c5 trên board

## 1. Tài liệu và phần cứng

Các bạn đọc trong [User Manual](https://www.st.com/resource/en/user_manual/um2534-discovery-kits-with-stm32mp157-mpus-stmicroelectronics.pdf) của hãng, trang số 8 ta sẽ có Hardware block diagram, miêu tả các biểu đồ các kết nối hiện tại được kéo ra từ chip

![](/uploads/2025/12/image.png)

Ta thấy i2c1, i2c4 đã dược sử dụng cho các ngoại vi khác

Tiếp tục xuống trang 31, để đọc kĩ hơn về GPIO

![](/uploads/2025/12/image-2.png)

Vậy là ta đã thấy chân PA12, PA11 kéo ra ngoài, là 2 chân cho SDA, SCL i2c5 trên board.

Vậy giờ ta check xem liệu i2c5 đã được enable chưa tương tự với bài [[Yocto-BBB] 8. Kết nối I2C với SSD1306 OLED 0.96 Inch](/2025/08/16/yocto-bbb-8-ket-noi-voi-ssd1306-oled-0-96-inch/). Trên bản core-image-minimal, ta check

```bash
root@stm32mp1:~# ls -l /dev/i2c*
crw-------    1 root     root       89,   0 Jan  1  2000 /dev/i2c-0
crw-------    1 root     root       89,   1 Jan  1  2000 /dev/i2c-1
crw-------    1 root     root       89,   2 Jan  1  2000 /dev/i2c-2
root@stm32mp1:~# ls /sys/bus/i2c/devices/
0-0039  0-004a  1-0028  1-0033  i2c-0   i2c-1   i2c-2
root@stm32mp1:~# ls -l /sys/bus/i2c/devices/
lrwxrwxrwx    1 root     root             0 Jan  1  2000 0-0039 -> ../../../devices/platform/soc/5c007000.bus/40012000.i2c/i2c-0/0-0039
lrwxrwxrwx    1 root     root             0 Jan  1  2000 0-004a -> ../../../devices/platform/soc/5c007000.bus/40012000.i2c/i2c-0/0-004a
lrwxrwxrwx    1 root     root             0 Jan  1  2000 1-0028 -> ../../../devices/platform/soc/5c007000.bus/5c002000.i2c/i2c-1/1-0028
lrwxrwxrwx    1 root     root             0 Jan  1  2000 1-0033 -> ../../../devices/platform/soc/5c007000.bus/5c002000.i2c/i2c-1/1-0033
lrwxrwxrwx    1 root     root             0 Jan  1  2000 i2c-0 -> ../../../devices/platform/soc/5c007000.bus/40012000.i2c/i2c-0
lrwxrwxrwx    1 root     root             0 Jan  1  2000 i2c-1 -> ../../../devices/platform/soc/5c007000.bus/5c002000.i2c/i2c-1
lrwxrwxrwx    1 root     root             0 Jan  1  2000 i2c-2 -> ../../../devices/platform/soc/5c007000.bus/40012000.i2c/i2c-0/i2c-2
```

Cái ta cần để ý là, địa chỉ i2c. Vậy là có 2 i2c đã được enable

```bash
40012000.i2c
40012000.i2c
5c002000.i2c
5c002000.i2c
40012000.i2c
5c002000.i2c
40012000.i2c
```

Ta vào Reference manual, mục Table 9 2.5.2 Memory Map and register boundary addresses. Ta sẽ thấy đây chính là i2c1 và i2c4 mình đã nói ở trên.

![](/uploads/2025/12/image-3.png)

![](/uploads/2025/12/image-4.png)

Vậy giờ ta cần enable được i2c5

![](/uploads/2025/12/image-5.png)

## 2. Kiểm tra device tree sau khi build

### 2.1 Tạo patch

Ta cùng check 1 loạt các device tree output để xem ta có gì

```bash
zk47@zk47-ltu:~/Learning/yocto-mp1/build-mp1$ find . -name "stm32mp157d-dk1.dts"
./tmp/work/x86_64-linux/tf-a-tools-native/v2.10.13-stm32mp-r2/git/fdts/stm32mp157d-dk1.dts
./tmp/work/x86_64-linux/tf-a-tools-native/v2.10.13-stm32mp-r2/git/.pc/0001-v2.10-stm32mp-r2.patch/fdts/stm32mp157d-dk1.dts
./tmp/work/x86_64-linux/u-boot-tools-stm32mp-native/v2023.10-stm32mp-r2/git/.pc/0001-v2023.10-stm32mp-r2.patch/arch/arm/dts/stm32mp157d-dk1.dts
./tmp/work/x86_64-linux/u-boot-tools-stm32mp-native/v2023.10-stm32mp-r2/git/arch/arm/dts/stm32mp157d-dk1.dts
./tmp/work/stm32mp1-poky-linux-gnueabi/optee-os-stm32mp/4.0.0-stm32mp-r2/git/core/arch/arm/dts/stm32mp157d-dk1.dts
./tmp/work/stm32mp1-poky-linux-gnueabi/optee-os-stm32mp/4.0.0-stm32mp-r2/git/.pc/0001-4.0.0-stm32mp-r2.patch/core/arch/arm/dts/stm32mp157d-dk1.dts
./tmp/work-shared/stm32mp1/uboot-source/.pc/0001-v2023.10-stm32mp-r2.patch/arch/arm/dts/stm32mp157d-dk1.dts
./tmp/work-shared/stm32mp1/uboot-source/arch/arm/dts/stm32mp157d-dk1.dts
./tmp/work-shared/stm32mp1/kernel-source/.pc/0001-v6.6-stm32mp-r2.patch/arch/arm/boot/dts/st/stm32mp157d-dk1.dts
./tmp/work-shared/stm32mp1/kernel-source/arch/arm/boot/dts/st/stm32mp157d-dk1.dts
./tmp/work-shared/stm32mp1/tfa-source/fdts/stm32mp157d-dk1.dts
./tmp/work-shared/stm32mp1/tfa-source/.pc/0001-v2.10-stm32mp-r2.patch/fdts/stm32mp157d-dk1.dts
```

Ta để ý các file chính, kiểm tra xem có liên quan gì đến i2c5 không

```bash
/home/zk47/Learning/yocto-mp1/build-mp1/tmp/work-shared/stm32mp1/kernel-source/arch/arm/boot/dts/st/stm32mp157d-dk1.dts

/home/zk47/Learning/yocto-mp1/build-mp1/tmp/work-shared/stm32mp1/kernel-source/arch/arm/boot/dts/st/stm32mp157d-dk1.dts
```

Rồi lại

```bash
/home/zk47/Learning/yocto-mp1/build-mp1/tmp/work-shared/stm32mp1/kernel-source/arch/arm/boot/dts/st/stm32mp15xx-dkx.dtsi
```

Ở file này ta thấy

![](/uploads/2025/12/image-9.png)

Trạng thái hiện giờ đang là disbled, do đã ta sẽ cần đổi nó sang "okay"

Vậy ta sẽ thêm cụm sau vào file stm32mp157d-dk1.dts

```bash
&i2c5 {
	pinctrl-names = "default", "sleep";
	pinctrl-0 = ;
	pinctrl-1 = ;
	i2c-scl-rising-time-ns = ;
	i2c-scl-falling-time-ns = ;
	clock-frequency = ;
	status = "okay";
};
```

Ta dùng 1 trick sau, các bạn copy file kia về 1 folder, nhân bản nó lên. Bản gốc ta đặt tên là stm32mp157d-dk1.dts.orig, bản sửa thêm node i2c5, ta để tên là stm32mp157d-dk1.dts.

Giờ ta chạy lệnh

```bash
git diff --no-index stm32mp157d-dk1.dts.orig stm32mp157d-dk1.dts > 0001-add-i2c-userspace-sts.patch
```

Tuy nhiên trong patch này, nó đang để đường dẫn tương đối tới thư mục hiện tại, do đó cần sửa đúng path theo source linux. Ta sửa patch thành như sau

![](/uploads/2025/12/image-8.png)

Vậy là ta đã có patch, giờ cần tạo meta-layers, và recipes kernel

### 2.2 Tạo meta-layer và recipe kernel

Ở đây, mình tạo meta-stm32mp1 để tùy chỉnh, và với cấu trúc folder như sau

![](/uploads/2025/12/image-7.png)

Tuy nhiên ta chưa biết recipe kernel tên là gì, để ta thêm 1 bbappend cho nó. Do đó ta check bằng câu lệnh

```bash
zk47@zk47-ltu:~/Learning/yocto-mp1/build-mp1$ oe-pkgdata-util lookup-recipe kernel
linux-stm32mp
```

Okay giờ ta tạo linux-stm32mp_%.bbappend là okay

```bash
zk47@zk47-ltu:~/Learning/yocto-mp1/build-mp1$ cat /home/zk47/Learning/yocto-mp1/meta-stm32mp1/recipes-kernel/linux/linux-stm32mp_%.bbappend
FILESEXTRAPATHS_prepend := "${THISDIR}/stm32mp1:"
SRC_URI += "file://0001-add-i2c-userspace-dts.patch"
```

Tuy nhiên để tiện cho việc debug i2c, ta thêm cái sau vào core-image-minimal.bbappend

```bash
IMAGE_INSTALL:append = " i2c-tools"
```

## 3. Check i2c trên board

Sau khi đã sửa các config trên ta build lại

```bash
bitbake core-image-minimal
```

Giờ check i2c5, ta đã thấy enable i2c với địa chỉ 40015000, chính là i2c5

![](/uploads/2025/12/image-10.png)

Và ta cũng có tool cho i2c, ta cắm ssd1306 vào và test

![](/uploads/2025/12/image-11.png)

![](/uploads/2025/12/image-12.png)

Các bạn có thể tiếp tục lập trình với màn i2c ssd1306 , tham khảo bài [[Yocto-BBB] 8. Kết nối I2C với SSD1306 OLED 0.96 Inch](/2025/08/16/yocto-bbb-8-ket-noi-voi-ssd1306-oled-0-96-inch/) nhé

Chúc các bạn thực hành thành công !!
