---
title: '[Yocto-BBB] 12. Truyền file qua TFTP'
date: '2025-09-27T09:10:00+07:00'
lastmod: '2025-09-12T22:39:56+07:00'
slug: yocto-bbb-12-truyen-file-qua-tftp
url: /2025/09/27/yocto-bbb-12-truyen-file-qua-tftp/
categories:
- Yocto
tags:
- Beaglebone
- Linux
series:
- Yocto-BBB
series_order: 12
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Bài trước mình đã hướng dẫn các bạn truyền file qua UART, bài này mình sẽ hướng dẫn các bạn cách truyền file qua TFTP. (u-boot có hỗ trợ TFTP để load file)
wp_id: 892
---

Bài trước mình đã hướng dẫn các bạn truyền file qua UART, bài này mình sẽ hướng dẫn các bạn cách truyền file qua TFTP. (u-boot có hỗ trợ TFTP để load file)

## 1. TFTP là gì ?

TFTP (Trivial File Transfer Protocol) là một giao thức truyền tệp **rất đơn giản**, hoạt động trên `UDP` (port 69).

Một số đặc điểm chính:

- **Đơn giản hơn FTP**: không có xác thực, không cần username/password.
- **Dùng UDP thay vì TCP** → nhanh, nhẹ, nhưng không đảm bảo độ tin cậy như FTP.
- **Ứng dụng phổ biến**: thường dùng trong môi trường nhúng, đặc biệt cho việc nạp firmware, kernel, hay rootfs qua mạng (ví dụ: U-Boot dùng TFTP để tải image từ host sang board).
- **Hạn chế**: không có bảo mật (không mã hóa, không kiểm soát truy cập phức tạp), chỉ phù hợp trong mạng nội bộ hoặc môi trường tin cậy.
- **Nguyên tắc hoạt động**: client gửi yêu cầu đọc (RRQ) hoặc ghi (WRQ) file tới server, sau đó dữ liệu truyền thành từng block (512 byte), mỗi block được xác nhận (ACK).

--> Nói ngắn gọn: **TFTP = cách nhanh, nhẹ để copy file qua mạng trong hệ thống nhúng**, thường để board lấy kernel/initramfs từ PC trong giai đoạn boot.

## 2. Build yocto image hỗ trợ TFTP

Bài này mình chưa động đến `u-boot`, mà mình sẽ truyền file qua `TFTP` trên `userspace`. Nên ta phải thêm `package` để hỗ trợ việc đó

Mình sửa tiếp `core-image-minimal.bbappend` đang dùng ở bài trước

```bash
inherit extrausers
TMPDIR = "${TOPDIR}/tmp"
# User "root" has password set to "test" in the image.
# printf "%q" $(mkpasswd -m sha256crypt test)
# \$5\$1ywTDE4jLgPDskTp\$yK5Ap.2xjc5gYeFQ4MGvR6C0VzA4VDSMIFkQ5.TJO84
PASSWD = "\$5\$y9Aeg5ctwntRHo/g\$CAKtoTfQg7VPGfVAMGo5ZG/0GJLn3AD0JdoQ.i0dDFC"
EXTRA_USERS_PARAMS = "\
    usermod -p '${PASSWD}' root; \
    "
# Add for UART file transfer
IMAGE_INSTALL:append = " \
  lrzsz \
"

# Add support for TFTP file transfer
IMAGE_INSTALL:append = " \
  tftp-hpa \
  net-tools \
  iproute2 \
"
```

Ở đây mình thêm 3 package

- `tftp-hpa` : cung cấp tftp command để truyền file
- `net-tools` : cung cấp nhiều command như ifconfig, route, ss, netstat
- `iproute2` : cung cấp ip addr, ip link, ip route, ip neigh, ss,...

(`ping` : đã đươc include trong `busybox` bản lightweight)

Okay vậy là đủ rồi các bạn Build, Flash.

**À đến đây các bạn build sẽ lỗi phải không ? Cùng đọc FIX làm dưới đây nhé**

{{% details title="CÁCH FIX BUILD LỖI" closed="true" %}}

Vì sẽ hơi dài nên mình để trong toggle list này :v. Mình cũng thấy hay hay nữa nên mình sẽ viết.

Thông báo build lỗi sẽ là

```bash
Missing or unbuildable dependency chain was: ['tftp-hpa']
ERROR: Required build target 'core-image-minimal' has no buildable providers.
Missing or unbuildable dependency chain was: ['core-image-minimal', 'tftp-hpa']
```

Cái này sẽ được hiểu nó không tìm thấy `recipes` để build cho package `tftp-hpa`.

Thế ban đầu tại sao mình lại biết `tftp-hpa` để mà thêm? Thì mình đi lượn 1 số diễn đàn xem họ thêm `package` gì để truyền nhận `TFTP` được thì mình thêm vào.

Giờ mình lại đi tìm tiếp. Mình search dòng sau trên google

```bash
tftp-hpa yocto
```

Kết quả ra trang này đầu tiên và cũng chính là thứ mình cần

```bash
https://layers.openembedded.org/layerindex/recipe/49880/
```

Các bạn đọc mô tả sẽ thấy recipes build `tftp-hpa` này thuộc vào Layer `meta-networking`. Do đó ta cần add cái này vào build-bbb/conf/bblayers.conf. Layer này thì nằm trong `yocto-bbb/meta-openembedded`

Sau khi thêm và build lại ta lại thấy lỗi tiếp như sau

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb$ bitbake core-image-minimal
WARNING: Layer meta-bbb should set LAYERSERIES_COMPAT_meta-bbb in its conf/layer.conf file to list the core layer names it is compatible with.
ERROR: Layer 'networking-layer' depends on layer 'meta-python', but this layer is not enabled in your configuration

Summary: There was 1 WARNING message.
Summary: There was 1 ERROR message, returning a non-zero exit code.
```

Lần này thì fix dễ hơn. `networking-layer` phụ thuộc vào `meta-python`. Do đó ta sẽ phải add tiếp meta-layer này.

Các bạn có thể sửa bằng tay, hoặc dùng bitbake-layers add-layers \<path-to-layer>. Sau cùng build-bbb/conf/bblayers.conf của mình như sau :

```bash
# POKY_BBLAYERS_CONF_VERSION is increased each time build/conf/bblayers.conf
# changes incompatibly
POKY_BBLAYERS_CONF_VERSION = "2"

BBPATH = "${TOPDIR}"
BBFILES ?= ""

BBLAYERS ?= " \
  /home/zk47/Learning/yocto-bbb/poky/meta \
  /home/zk47/Learning/yocto-bbb/poky/meta-poky \
  /home/zk47/Learning/yocto-bbb/poky/meta-yocto-bsp \
  /home/zk47/Learning/yocto-bbb/meta-openembedded/meta-oe \
  /home/zk47/Learning/yocto-bbb/meta-arm/meta-arm-toolchain \
  /home/zk47/Learning/yocto-bbb/meta-arm/meta-arm \
  /home/zk47/Learning/yocto-bbb/meta-ti/meta-ti-bsp \
  /home/zk47/Learning/yocto-bbb/meta-ti/meta-ti-extras \
  /home/zk47/Learning/yocto-bbb/meta-bbb \
  /home/zk47/Learning/yocto-bbb/meta-openembedded/meta-python \
  /home/zk47/Learning/yocto-bbb/meta-openembedded/meta-networking \
  "
```

{{% /details %}}

## 3. Cắm Ethernet và Cấu hình mạng

Để bắt đầu các bạn cắm `Ethernet` từ board tới trực tiếp máy Host là PC của bạn.

### 3.1 Cấu hình phía Host

Các bạn check `ifconfig` xem tên ethernet interface

{{% details title="ifconfig" closed="true" %}}

```bash
zk47@ltu:~$ ifconfig
enx207bd232cd61: flags=4163  mtu 1500
        inet 192.168.10.1  netmask 255.255.255.0  broadcast 0.0.0.0
        inet6 fe80::baa9:5f6d:2de1:8159  prefixlen 64  scopeid 0x20
        ether 20:7b:d2:32:cd:61  txqueuelen 1000  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 8974  bytes 1983414 (1.9 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 8974  bytes 1983414 (1.9 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

wlp0s20f3: flags=4163  mtu 1500
        inet 192.168.1.19  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 2402:9d80:854:e290:49de:1a3b:524c:e455  prefixlen 64  scopeid 0x0
        inet6 2402:9d80:854:e290:9d08:178:e63:f837  prefixlen 64  scopeid 0x0
        inet6 fe80::f19b:6180:2774:2711  prefixlen 64  scopeid 0x20
        ether 10:91:d1:9e:bb:8c  txqueuelen 1000  (Ethernet)
        RX packets 434632  bytes 492104577 (492.1 MB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 116294  bytes 46891184 (46.8 MB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

{{% /details %}}

Vậy là interface `ethernet` của mình sẽ `enx207bd232cd61`. Ta chạy lệnh sau để set ip tĩnh, cũng như bật `interface` lên

```bash
sudo ip addr add 192.168.10.1/24 dev enx207bd232cd61
sudo ip link set enx207bd232cd61 up
```

### 3.2 Cấu hình phía Board

Tương tự với board BBB

```bash
ip addr add 192.168.10.2/24 dev eth0
ip link set eth0 up
```

### 3.3 Test ping

Sau khi setup ip tĩnh xong. Các bạn nhớ test `ping` xem kết nối ra sao

```bash
ping 192.168.10.1   # from BBB
ping 192.168.10.2   # from PC
```

## 4.Cấu hình TFTP tại host

### 4.1 Cài và sửa default folder

```bash
sudo apt install tftpd-hpa
sudo systemctl enable --now tftpd-hpa
```

Sửa lại folder default `TFTP`

```bash
sudo nano /etc/default/tftpd-hpa
```

Ta sửa lại với nội dung như sau. `TFTP_DIRECTORY` bạn hiểu đơn giản là **Share folder** chung giữa board với host để gửi nhận file vậy

```bash
# /etc/default/tftpd-hpa

TFTP_USERNAME="tftp"
TFTP_DIRECTORY="/home/zk47/Learning/TFTP"
TFTP_ADDRESS=":69"
TFTP_OPTIONS="--secure"
```

### 4.2 Test local host

Ở host ta test thử xem `TFTP` hoạt động chuẩn chưa

Các bạn nhớ đổi quyền cho folder và mode cho file mới tạo

```bash
sudo chmod 777 /home/zk47/Learning/TFTP
touch /home/zk47/Learning/TFTP/testfile
chmod 666 testfile
```

Đứng ở 1 folder khác các bạn gõ lệnh

```bash
zk47@ltu:~/Learning/Empty$ ls
zk47@ltu:~/Learning/Empty$ tftp 127.0.0.1
tftp> get testfile
tftp> q
zk47@ltu:~/Learning/Empty$ ls
testfile
```

`TFTP` hoạt động ngon lành cho local test (`loopback` address 127.0.0.1)

## 5.Truyền nhận file qua TFTP

Tại host bạn đã tạo `testfile` và test local rồi. Trên board beaglebone các bạn làm khá tương tự nhưng với địa chỉ chuẩn của host server.

```bash
root@beaglebone:~# tftp 192.168.10.1
tftp> get testfile
tftp> q
root@beaglebone:~# ls
testfile
```

Thế là truyền tự host sang board thành công.

Thông thường `tftp` hỗ trợ cả lệnh `put`, tuy nhiên hiện ta vẫn đang để bảo mật bên host là ***không cho tạo file mới***. Tuy nhiên do `testfile` bên host đã có quyền write.

Do đó ta hoàn toàn có thể sửa `testfile` rồi put lại bên host.

```bash
root@beaglebone:~# ls
testfile
root@beaglebone:~# cat testfile
root@beaglebone:~# echo "Content from beaglebone black" > testfile
root@beaglebone:~# ls
testfile
root@beaglebone:~# cat testfile
Content from beaglebone black
root@beaglebone:~# tftp 192.168.10.1
tftp> put testfile
tftp> q
root@beaglebone:~#
```

Và nội dung tại host đã được sửa theo

```bash
zk47@ltu:~/Learning/TFTP$ cat testfile
Content from beaglebone black
```

Chúc các bạn thực hành thành công !!!

**Ở bài tới mình sẽ viết về RDP với backend Weston trên Beaglebone Black. Mong đuọc các bạn tiếp tục ủng hộ.**
