---
title: '[Linux] Board nhúng rẻ nhất có thể chạy Linux'
date: '2026-05-09T06:15:00+07:00'
lastmod: '2026-04-18T17:38:23+07:00'
slug: linux-board-nhung-re-nhat-co-the-chay-linux
url: /2026/05/09/linux-board-nhung-re-nhat-co-the-chay-linux/
categories:
- Yocto
tags:
- Linux
- Yocto
image: /uploads/2026/04/screenshot-from-2026-04-12-22-55-35.png
description: Cùng với việc vật giá leo thang, Beaglebone Black giờ cũng loanh quanh 2 triệu rồi. Mình quyết định tìm board rẻ nhất có thể chạy Linux. Tầm tầm 2 tuần, và m…
wp_id: 2179
---

Cùng với việc vật giá leo thang, Beaglebone Black giờ cũng loanh quanh 2 triệu rồi. Mình quyết định tìm board rẻ nhất có thể chạy Linux. Tầm tầm 2 tuần, và mình chốt con board mình sẽ lên series trong thời gian tới. Bởi mình nghĩ nếu board rẻ thì sẽ có nhiều người tiếp cận vọc vạch được nhất nhỉ :vv. Các bạn nhớ đọc đến cuối để biết board mình chọn nhé

## 1. Các board khá ma đạo :vv

Nhắc đến Linux ta hãy nghĩ đến các Vi xử lý MPU (ARM lõi A) chẳng hạn, chứ bạn có nghĩ đến Vi điều khiển core ARM lõi M cũng chạy được không ?

### 1.1 Arduino Uno

Trong số đó có Arduino Uno.

Bạn không nghe nhầm đâu, mình lượn lờ reddit và thấy bài này [How to design a "simple" PCB running Linux](https://www.reddit.com/r/embedded/comments/16xakmp/how_to_design_a_simple_pcb_running_linux/) trong comment trỏ đến bài này [I run Linux 6.1 on my Arduino UNO!](https://www.reddit.com/r/arduino/comments/16w4lro/i_run_linux_61_on_my_arduino_uno/)

Tất nhiên bản Linux sẽ phải lược bỏ nhiều, ban đầu tác giả mất 5 ngày để lên shell, sau khi đã tối ưu (thêm cache, ... ) thì nó mất 15 tiếng

Các bạn có thể xem tại đây

{{< youtube ZzReAELagG4 >}}

Đặc biệt nữa là bác này người Việt nữa, thật sự phục mấy bác vọc vạch sâu thế !!

### 1.2 ESP32

Cái này mình chưa đọc sâu, vì mình ít code bên esp32 nhưng có một vài bác đã thử boot được. À thì ESP32S3 mạnh hơn Uno là rõ nên boot nhanh hơn trông thấy luôn nhỉ.

Các bác tham khảo

{{< youtube 5oKeVyxgwzk >}}

### 1.3 MCU STM32

Hãng ST thì có cả dòng MPU chuyên chạy linux rồi, nhưng dòng MCU cũng có 1 số board được support từ linux luôn nhé.

Mình tham khảo bài viết tại đây [Running Mainline Linux Kernel In Stm32f429i Disc1 Evk](https://reymor.github.io/tutorials/2025/10/12/running-mainline-linux-kernel-in-stm32f429i-disc1-evk.html)

![](/uploads/2026/04/image-16.png)

Thỉnh thoảng lướt Linkedin thấy những bài rất chất lượng.

Linux có hỗ trợ cho 1 số board không có sẵn MMU (Memory Management Unit - Dùng để tạo và quản lý virtual memory) trong đó có STM32F429-DISC. Các bạn có thể xem xem board của mình có trong diện này hay không trong folder [/arch/arm/boot/dts/st của linux kernel source](https://github.com/torvalds/linux/tree/master/arch/arm/boot/dts/st)

Ví dụ mình soi trong github này thì ta được 1 số board sau

![](/uploads/2026/04/image-17.png)

Đa số là các board EVAL hay DISCO kể sẽ khá đắt cho thông dụng

Mình thì có con STM32H747I-DISCO. Chưa kịp thử thì lại cho mượn mất rồi :vv . Bạn nào có board được support có thể thử follow theo tác giả nhé

![](/uploads/2026/04/image-18.png)

À còn các con MCU nhỏ nhẹ hơn thì xưa từng có phiên bản uclinux có thể chạy được nhưng có vẻ cộng đồng không còn hoạt động nữa rồi.

## 2. Tự làm board

À thì nếu các bạn search trên mạng sẽ thấy 1 số board Linux rất rẻ như Lichee Pi Nano/Zero (Core ARM), Milk-V Duo, Duo S (core RISC-V) Bạn cũng đắn đo nhỉ, vì thiếu tài liệu.

Ấy thế mà có mấy ông lôi con chip của mấy board này ra, làm các board custom còn rẻ hơn

### 2.1 My Business Card Runs Linux

Tác giả bài viết này chắc cũng khơi mào 1 đợt làm board custom chạy được linux, mình thấy khá nhiều người làm theo

Các bạn có thể đọc tại đây <https://www.thirtythreeforty.net/posts/my-business-card-runs-linux/>

![](/uploads/2026/04/image-19.png)

Board này dùng chip F1C100S tương tự trên board Lichee Pi Nano nhưng linh kiện đơn giản hơn nhiều, USB edge cắt thế kia khá tiện

### 2.2 Run mainline Linux on $5 dollar hardware

Tác giả bài viết này cũng lấy cảm hứng từ ông George bên trên. Mình thấy blog có chi tiết hơn 1 chút, nên cũng đọc thử

Các bạn có thể tham khảo tại đây <https://popovicu.com/posts/run-mainline-linux-on-5-dollar-hardware/>

### 2.3 Mình thử tự vẽ

2 tác giả trên đều chia sẻ Schematic chứ không có PCB nên đọc xong 2 bài trên mình cũng lôi Kicad ra vẽ (Mình đang dùng Ubuntu full-time nên không có Altium :vv). Được cái học Kicad thao tác cũng nhanh nhưng mình thiếu kiến thức phần cứng và ít kinh nghiệm vẽ mạch quá :vv

Mình mất 2 ngày, 1 ngày vẽ SCH, sắp xếp linh kiện. Một ngày đi dây và tìm thử đồ đặt mua. Ấy thế xong vẫn thấy mạch sao sao :vv

![](/uploads/2026/04/image-20.png)

Kiểu dây nối tới là được, đi dây loằng ngoằng quá. Cũng tham vấn AI nhiều và ngộ ra nhiều cái :vv. Ở đây minh dùng trở 0603 thôi, trên bài là họ dùng 0402, trở và tụ nhỏ, sợ mỏ hàn đểu, thì thời gian đi tìm tụ còn lâu hơn thời gian hàn :vv (Nếu bạn nào cần thì comment mình sẽ public schematic với PCB nhé, mình vẽ hơi xấu nên chia sẻ luôn thì ngại :vv )

Kể thì cũng tính đặt, nhưng rồi vấn đề lớn nhất là nguồn cung của con F1C100S, check Shopee có nhưng giá không như mong đợi lắm. Theo tác giả năm 2024, giá F1C100S dao động tầm 1.42$ là loanh quan 30-40k, ấy thế mà giờ 2026 mình đi tìm đâu cũng tầm 100-120k đắt tầm gấp 3 lần. Và mình cũng lo về chất lượng nữa. Nhỡ có khi mình đã hàn kém rồi, lại còn dính chip đểu thì đúng combo loop không biết bao giờ cho board boot lên

Mình vẫn chấp niệm với vụ vẽ board này, nên cũng đi tham vấn nhiều nơi.

### 2.4 Đi tham vấn

Vì lo vụ chất lượng và nguồn cung nên mình có thử đi tìm các chip thay thế

Trong đó có Allwiner V3S, thì ở đây đã có [page EPCB](https://www.facebook.com/epcb.vn/posts/pfbid0ujxdQvynx6csPTYFjkFBN3ESRkvrb1ZeHQkaRdKs4UoyfmMRf6Z1muBb5kG6Y8YBl) thậm chí public PCB luôn rồi, chỉ việc lắp ráp linh kiện. Các bạn có thể tham khảo . Mỗi tội con V3S dính chung trường hợp là không biết nên mua ở đâu.

![](/uploads/2026/04/image-28.png)

Kể nếu các bạn quen đặt qua Taobao hay Aliexpress thì có thể thử nhé

Ngó sang 1 con chip cũng chung lõi ARM926EJ-S (Kiến trúc cũ nên giá thành sẽ dễ chịu) thì mình biết đến con Microchip SAM9X60 có board Curiosity. Hãng Microchip mà còn board chạy Linux chắc ở VN mình sẽ khá hiếm người dùng nhỉ

![](/uploads/2026/04/image-21.png)

Mình đã nghĩ tới thay F1C100S bằng con này, giá con này rơi vào tầm 7$ nhưng đắt xắt ra miếng mà luôn :vv , board trên thì giá 100$, nhưng nếu vẽ linh kiện tối thiểu thì hoàn toàn có thể kéo xuống tầm 2-30$

Thì có ông tác giả sau đã có khá nhiều bản vẽ liên quan các bạn có thể tham khảo <https://github.com/vd-rd>

![](/uploads/2026/04/image-22.png)

![](/uploads/2026/04/image-23.png)

Cơ mà bản Microchip SAM9X60 SBC thì ông tác giả lại vẽ chưa xong, mình cũng tính lúc rảnh minh sẽ đi dây thử 1 bản và collab với tác giả :vv .

À con SAM9X60 này lại là chân BGA dưới đáy, chứ không phải QFN chân ở rìa, do đó sẽ khó hàn hơn .

Nhưng mình vẫn khá chấp niệm với đoạn vẽ board này, mình sẽ hoàn thành trong tương lai gần. Kiểu làm chủ phần cứng, tiến tới làm BSP toàn diện, bring up từ đầu vậy :vv

## 3. Các lựa chọn khác

À thực tế còn nhiều con phổ thông hơn mà nhỉ

Như Raspberry Pi Zero, Zero 2W, hay Orange Pi Zero 2w

![](/uploads/2026/04/image-24.png)

Giá cũng rất hạt dẻ, nhưng mình vẫn ngắm mấy con còn rẻ hơn. Nếu đắt thì phải vọc được thật sâu để bõ mua.

Dòng Pi này bạn làm nhập môn cũng rất ok, phù hợp làm các cái liên quan ứng dụng

![](/uploads/2026/04/image-25.png)

Orange Pi zero 2W cũng thế, con này còn mạnh hơn khi có option 1Gb RAM đổ lên, chạy Android mượt hơn. Mỗi tội cũng ít tài liệu, mình từng dính lỗi sai màu màn mà mất 4 ngày mới ra. Mà kiểu lỗi trời ơi đất hỡi lắm. các bạn có thể đọc thêm tại </2025/06/17/orangepi-fix-loi-man-mpi3501-tft-3-5-inch-len-mau-khong-chuan/>

À các bạn hoàn toàn có thể ngó đến 1 lựa chọn tương tự dòng BBB là con Pocket Beagle 2 (Con này mình chưa thấy bên nào nhập về, các bạn có thể đặt qua Mouser). Giá rẻ bằng nửa BBB. Chip xịn hơn, đời mới hơn nhưng tính năng chung sẽ ít hơn. Rất mới, chưa có quá nhiều bài viết từ cộng đồng

![](/uploads/2026/04/image-26.png)

## 4. Thôi thì lựa chọn cuối của mình

Mình quay lại lựa chọn hạt dẻ, và dễ mua nhất. Lichee Pi Nano

Mình mua trên HShop thì giá là 175k, rất phù hợp rồi nhỉ :vv

![](/uploads/2026/04/image-27.png)

Giờ cái thiếu duy nhất là tài liệu, và mình cũng kiếm thử.

Bất ngờ nhất là lúc mình search tài liệu thì mình thấy có page tiếng Việt luôn :vv. Sốc v~ . Còn có guide Yocto và Image có sẵn luôn. Cảm ơn bác ninhnn2 Fanning nhé, các bạn có thể đọc thêm [tại đây](https://fanning.vn/study_licheepinano/markdown.html)

Mình dùng luôn image của bác Ninhnn2 flash ok, và thấy board lên thì thấy có 2 vấn đề sau, mình cũng lần lượt fix

### 4.1 Linux boot treo

Đầy đủ log sẽ như sau

```bash
[    1.322592] Waiting for root device /dev/mmcblk0p2...
[    1.350249] mmc0: host does not support reading read-only switch, assuming write-enable
[    1.358711] mmc0: new SDHC card at address 0001
[    1.365339] mmcblk0: mmc0:0001 SD 7.44 GiB
[    1.375366]  mmcblk0: p1 p2
[    1.384697] panel-simple panel: panel supply power not found, using dummy regulator
[    1.433648] random: fast init done
[    1.440866] EXT4-fs (mmcblk0p2): mounted filesystem with ordered data mode. Opts: (null)
[    1.449320] VFS: Mounted root (ext4 filesystem) on device 179:2.
[    1.462488] devtmpfs: mounted
[    1.470172] Freeing unused kernel memory: 1024K
[    1.474975] Run /sbin/init as init process
[    2.254476] EXT4-fs (mmcblk0p2): re-mounted. Opts: (null)
[    7.524835] sunxi-mmc 1c0f000.mmc: data error, sending stop command
[    8.483964] sched: RT throttling activated
[    8.523989] sunxi-mmc 1c0f000.mmc: send stop command failed
[    8.533474] i2c i2c-0: mv64xxx: I2C bus locked, block: 1, time_left: 0
[   10.644166] i2c i2c-0: mv64xxx: I2C bus locked, block: 1, time_left: 0
[   12.724169] i2c i2c-0: mv64xxx: I2C bus locked, block: 1, time_left: 0
[   14.804165] i2c i2c-0: mv64xxx: I2C bus locked, block: 1, time_left: 0
[   16.884166] i2c i2c-0: mv64xxx: I2C bus locked, block: 1, time_left: 0
[   16.890808] ov2640 0-0030: Product ID error 92:92
[   31.844135] vcc3v0: disabling
[   31.847214] vcc5v0: disabling
"
```

Vấn đề là bác í dùng image này là cho khi board kết nối tới OV2640, nhưng ở đây mình không cắm do đó ta phải disable nó đi trong Device Tree

Mình cắm lại thẻ nhớ, rồi dịch ngược DTB file

```bash
dtc -I dtb -O dts -o suniv-f1c100s-licheepi-nano.dts suniv-f1c100s-licheepi-nano.dtb
```

Rồi sửa đoạn sau

```bash
--- /tmp/original.dts   2026-04-12 22:38:30.868911191 +0700
+++ /home/zk47/Learning/licheepi-nano/suniv-f1c100s-licheepi-nano.dts   2026-04-12 21:05:20.099998282 +0700
@@ -673,7 +673,7 @@
                        resets = ;
                        pinctrl-names = "default";
                        pinctrl-0 = ;
-                       status = "okay";
+                       status = "disabled";
                        #address-cells = ;
                        #size-cells = ;

@@ -692,6 +692,7 @@
                        ctp@5d {
                                compatible = "goodix,gt911";
                                reg = ;
+                               status = "disabled";
                                interrupt-parent = ;
                                interrupts = ;
                                irq-gpios = ;
@@ -701,6 +702,7 @@
                        camera@30 {
                                compatible = "ovti,ov2640";
                                reg = ;
+                               status = "disabled";
                                pinctrl-0 = ;
                                pinctrl-names = "default";
                                clocks = ;
@@ -774,7 +776,7 @@
                        clocks = ;
                        clock-names = "bus\0isp\0ram";
                        resets = ;
-                       status = "okay";
+                       status = "disabled";
                        pinctrl-names = "default";
                        pinctrl-0 = ;
                        packed-format;
```

Về cơ bản là thêm disable cho mấy cái block không dùng như camera và i2c luôn

### 4.2 Bypass mật khẩu

À tiếp theo board boot lên được, và không dính lỗi kia nữa, nhưng image này lại có mật khẩu. Vì mình muốn test board nên mình sẽ cố bypass. Nếu phần này có gì không vừa ý thì bác Fanning cứ liên hệ em nhé, em sẽ sửa ngay :vv

Cách làm là mình sẽ sửa boot.scr trong boot để thay vì nó nhảy đến giao diện login, thì nó sẽ nhảy vào /bin/sh luôn. Rồi mình sẽ set mật khẩu ở đây

Mình tạo file boot.cmd với nội dung

```bash
setenv bootargs console=tty0 console=ttyS0,115200 panic=5 rootwait root=/dev/mmcblk0p2 rw init=/bin/sh
load mmc 0:1 0x80C00000 suniv-f1c100s-licheepi-nano.dtb
load mmc 0:1 0x80008000 zImage
bootz 0x80008000 - 0x80C00000
```

Rồi dùng mkimage để build lại boot.scr

```bash
mkimage -C none -A arm -T script -d boot.cmd boot.scr
```

Okay, copy lại file boot.scr này vào rồi ta boot board lên, giờ nó sẽ nhảy trực tiếp vào shell và ta cài mật khẩu cho root (Xong xuôi thì bạn lại sửa cái bootcmd, để nhảy vào đăng nhập root nhé)

```bash
//Cài password cho root
passwd root
sync
```

Mình tính check memory và disk thì nó bị lỗi sau,

```bash
/ # free
total        used        free      shared  buff/cache   available
Mem:   free: can't open '/proc/meminfo': No such file or directory
/ # df
Filesystem           1K-blocks      Used Available Use% Mounted on
df: /proc/mounts: No such file or directory
```

Do mình quên mất là do ta boot nhảy vào shell luôn nên nó chưa mount các pseudo filesystem, các bạn mount tay vào nhé (thông thường mount này hay đặt trong init script)

```bash
mount -t proc proc /proc
mount -t sysfs sys /sys
```

Thông số của board đây, sẽ rất hạn chế thôi

```bash
/ # df
Filesystem           1K-blocks      Used Available Use% Mounted on
/dev/root               164944      5796    146036   4% /
devtmpfs                 10820         0     10820   0% /dev
/ # free
              total        used        free      shared  buff/cache   available
Mem:          22664        5224       13944           0        3496       15408
Swap:             0           0           0
/ # uname -a
Linux (none) 5.4.77 #1 Sun Jul 25 12:26:13 +07 2021 armv5tejl GNU/Linux
```

## 5. Dự định sắp tới

Yocto-BBB đã đến đươc bài 20 rồi, mình nghĩ mình nên chuyển sang board khác cho nó đa dạng hơn tí. Chứ cứ dính vào BBB vì nó dễ thì đôi khi lại là mình làm theo hướng dẫn của người khác quá nhiều mà ít vọc vạch cái mới thật sự :vv

Mình dự tính sẽ

- Kéo support kernel mainline và Yocto Scarthgap về build cho board. Hiện bác Fanning đang dùng bản Yocto Zeus khá xưa, nọ mình build theo không được :vv . Ấy thế là lại có việc hay để vọc nhỉ :vv
- Vẽ 1 mạch boot được linux và cung cấp BSP cho nó :vv (còn chấp niệm lắm)

Bài hôm nay khá dài nhỉ, mình ngồi chém gió tí :vv Các bạn có thể mua Lichee Pi Nano học cùng mình luôn nhé, cho đông vui vì giá cả cũng phải chăng !! Hehe
