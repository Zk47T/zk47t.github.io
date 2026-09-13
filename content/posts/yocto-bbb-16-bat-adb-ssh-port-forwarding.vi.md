---
title: '[Yocto-BBB] 16. Bật ADB, SSH Port-Forwarding'
date: '2025-11-22T06:46:00+07:00'
lastmod: '2026-01-06T13:31:30+07:00'
slug: yocto-bbb-16-bat-adb-ssh-port-forwarding
url: /2025/11/22/yocto-bbb-16-bat-adb-ssh-port-forwarding/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 16
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: 'ADB: Android Debug Bridge'
wp_id: 1694
---

ADB: Android Debug Bridge

Ở bài này, mình sẽ hướng dẫn với các bạn cách config để build image với ADB giúp cho việc truyền file qua USB thuận tiện hơn. Cũng như Port Forwarding, để ta có thể dùng ssh thông qua USB.

## 1. Android Debug Bridge (ADB)

![](/uploads/2025/11/image-14.png)

### 1.1 Tổng quan

Nếu chỉ nhìn vào định nghĩa về ADB, có thể nhiều bạn sẽ nghĩ thì mình đang build Yocto, sao lại dùng Android gì đó ở đây. Thực tế ADB nó là command-line tool, dùng cho USB. Do đó, nó là 1 công cụ hữu dụng khi sử dụng kết nối qua USB, chứ không chỉ dùng riêng cho Android.

### 1.2 Công dụng của ADB

ADB là 1 công cụ đa dụng làm được rất nhiều thứ. Cá nhân mình thì dùng nhiều nhất để truy cập terminal từ board, và copy file từ board tới host và ngược lại.

Một số command mình hay dùng

#### 1.2.1. adb devices

Kiểm tra xem có thiết bị nào đang kết nối không

```bash
zk47@ltu:~$ adb devices
List of devices attached
0123456789ABCDEF	device
38191JEHN00602	device
```

#### 1.2.2 adb root

Chạy adb-server với root

#### 1.2.3 adb shell

Truy cập terminal trên board.

```bash
zk47@ltu:~$ adb shell
sh-5.1# uname -a
Linux beaglebone 6.1.80-ti #1 SMP PREEMPT Fri Mar 22 02:57:54 UTC 2024 armv7l armv7l armv7l GNU/Linux
```

#### 1.2.4 adb pull & adb push

Pull: kéo, copy file từ board về

Push : Đẩy 1 file từ host tới board

```bash
sh-5.1# pwd
/home/root
sh-5.1# touch test.file
sh-5.1# exit
zk47@ltu:~$ adb pull /home/root/test.file .
/home/root/test.file: 1 file pulled, 0 skipped.
zk47@ltu:~$ ls -al test.file
-rw-r--r-- 1 zk47 zk47 0 Thg 11 18 19:49 test.file
```

#### 1.2.5 adb kill-server

Kill process adb hiện tại

## 2. Tích hợp ADB vào Yocto build image

Trước hết, mình search thử trên mạng xem mọi người sẽ làm như nào. Thì mình thấy recipes của openembedded tại <https://layers.openembedded.org/layerindex/recipe/399905/>

android-tools thuộc meta-oe của meta-openembedded

![](/uploads/2025/11/image-15.png)

Và 1 hướng dẫn từ guide sau <https://community.nxp.com/t5/i-MX-Processors-Knowledge-Base/adbd-test-on-Yocto/ta-p/1763377>

Do đó, sau vài lần test, mình đi đến được cách build hoạt động hiệu quả trên Beaglebone Black sau.

### 2.1 Sửa local.conf

Ta thêm dòng sau vào ${BUILDDIR}/conf/local.conf

```bash
#Chuyển sang systemd, chạy adbd service
DISTRO_FEATURES:append = " systemd "
VIRTUAL-RUNTIME_init_manager = "systemd"
DISTRO_FEATURES_BACKFILL_CONSIDERED += "sysvinit"
VIRTUAL-RUNTIME_initscripts = ""

#Thêm hỗ trợ usb
KERNEL_MODULE_AUTOLOAD:append = " evdev usbhid "

#Thêm package android tool
IMAGE_INSTALL:append = "android-tools android-tools-adbd"
PREFERRED_PROVIDER_android-tools-conf = "android-tools-conf-configfs"
```

### 2.2 Tạo recipes image

Ở đây để tránh việc phải thêm thắt 1 recipes bbappend ở các bài, mình tạo 1 recipes là my-image.bb luôn

```bash
SUMMARY = "My custom Linux Image"
IMAGE_INSTALL = "packagegroup-core-boot ${CORE_IMAGE_EXTRA_INSTALL}"
IMAGE_LINGUAS = " "
LICENSE = "MIT"
inherit core-image

inherit extrausers
#User = "root" - Pass = "test"
PASSWD = "\$5\$y9Aeg5ctwntRHo/g\$CAKtoTfQg7VPGfVAMGo5ZG/0GJLn3AD0JdoQ.i0dDFC"
EXTRA_USERS_PARAMS = "\
    usermod -p '${PASSWD}' root; \
    "

#Network  và ssh package
IMAGE_INSTALL:append = " \
    dhcpcd \
    iw \
    wpa-supplicant \
    linux-firmware \
    net-tools \
    iproute2 \
    openssh \
"

#SSH VSCode server package
IMAGE_INSTALL:append = " \
    bash \
    tar \
    xz \
    procps \
    coreutils \
    curl \
    libgcc \
    libstdc++ \
    libatomic \
"
```

Các bạn cũng nhớ thêm poky/meta-openembedded/meta-oe vào ${BUILDDIR}/conf/bblayers.conf

Và giờ build thôi

```bash
bitbake my-image
```

## 3. Flash và test adb

Vẫn như thường lệ, bạn dùng bmaptool và flash image.

Ta check trạng thái của service adbd

```bash
root@beaglebone:~# systemctl status android-tools-adbd.service
* android-tools-adbd.service - Android Debug Bridge
     Loaded: loaded (/lib/systemd/system/android-tools-adbd.service; enabled; vendor preset: enabled)
    Drop-In: /lib/systemd/system/android-tools-adbd.service.d
             `-10-adbd-configfs.conf
     Active: inactive (dead)
  Condition: start condition failed at Sun 2023-12-24 10:50:39 UTC; 26s ago
             `- ConditionPathExists=/etc/usb-debugging-enabled was not met

Dec 24 10:50:39 beaglebone systemd[1]: Android Debug Bridge was skipped because of a failed condition check (ConditionPathExists=/etc/usb-debugging-enabled).
```

Vậy là adbd start không thành công, nhưng cách fix thì cũng đã hiển thị rõ trong log, service này có ConditionPathExists=/etc/usb-debugging-enabled , do đó ta cần tạo folder này

```bash
root@beaglebone:~# mkdir /etc/usb-debugging-enabled
root@beaglebone:~# systemctl restart android-tools-adbd.service
[ 1667.131481] file system registered
[ 1667.329830] ffs_data_put(): freeing
[ 1667.387046] unloading
[ 1667.448546] file system registered
[ 1667.593878] read descriptors
[ 1667.596846] read strings
root@beaglebone:~# systemctl status android-tools-adbd.service
* android-tools-adbd.service - Android Debug Bridge
     Loaded: loaded (/lib/systemd/system/android-tools-adbd.service; enabled; vendor preset: enabled)
    Drop-In: /lib/systemd/system/android-tools-adbd.service.d
             `-10-adbd-configfs.conf
     Active: active (running) since Sun 2023-12-24 11:53:28 UTC; 2s ago
    Process: 361 ExecStartPre=/usr/bin/android-gadget-setup adb (code=exited, status=0/SUCCESS)
    Process: 370 ExecStartPre=/usr/bin/android-gadget-setup (code=exited, status=0/SUCCESS)
    Process: 389 ExecStartPost=/usr/bin/android-gadget-start (code=exited, status=0/SUCCESS)
   Main PID: 388 (adbd)
      Tasks: 4 (limit: 1040)
     Memory: 432.0K
     CGroup: /system.slice/android-tools-adbd.service
             `- 388 /usr/bin/adbd

Dec 24 11:53:24 beaglebone systemd[1]: Starting Android Debug Bridge...
Dec 24 11:53:24 beaglebone android-gadget-setup[372]: killall: adbd: no process killed
Dec 24 11:53:28 beaglebone systemd[1]: Started Android Debug Bridge.
```

Ngon ngay :vv

Giờ đứng từ máy tính. Các bạn tải Android-Platform Tool từ trang của Google về nhé <https://developer.android.com/tools/releases/platform-tools>

Sau khi cài xong Platform-tools chính là ADB trên host, ta test và kết nối thành công

```bash
zk47@ltu:~$ adb devices
List of devices attached
0123456789ABCDEF	device

zk47@ltu:~$ adb shell
sh-5.1# uname -a
Linux beaglebone 6.1.80-ti #1 SMP PREEMPT Fri Mar 22 02:57:54 UTC 2024 armv7l armv7l armv7l GNU/Linux
```

Lưu ý trên Beaglebone Black, bạn nhớ kết nối board tới host qua chân mini USB thay vì chân USB nhé. Bởi chân mini USB này mới là USB OTG - USB Client, cho phép biến Beaglebone Black đóng vai trò như 1 thiết bị ngoại vi cắm tới host

![](/uploads/2025/11/image-20.png)

## 4. Port forwarding SSH qua ADB

Nhưng vấn đề của ADB là dù rất tiện khi bạn chỉ cần cắm qua USB. Nhưng nó vẫn không có giao diện để tiện làm việc như MobaXterm hay VSCode. Do đó ở đây mình sẽ kéo port dùng cho ssh ra cổng ADB, để ta đứng từ PC có thể SSH tới đây

![](/uploads/2025/11/image-17.png)

Mình sẽ làm tương tự như trên đây.

Tại host ta chạy script với nội dung sau

```bash
#!/usr/bin/env bash
#
# Setup SSH over ADB for a Yocto/BBB device and forward port for VS Code
#

set -u

ADB=${ADB:-adb}
SSH_PORT=${1:-2222}       # local port to forward to device's :22

echo "[*] Using ADB binary: ${ADB}"
echo "[*] Local SSH port for forwarding: ${SSH_PORT}"
echo

echo "[*] Waiting for ADB device..."
${ADB} wait-for-device

echo "[*] Trying to restart adbd as root (ignore error if not supported)..."
if ! ${ADB} root >/dev/null 2>&1; then
    echo "    (adbd root not supported or already root; continuing)"
fi
sleep 2

echo "[*] Trying to remount / as read-write (may be already rw or read-only)..."
if ! ${ADB} shell "mount -o remount,rw /" >/dev/null 2>&1; then
    echo "    (remount / failed; rootfs may already be rw or is truly read-only)"
fi

echo "[*] Setting root shell to /bin/bash if available..."
${ADB} shell "command -v bash >/dev/null 2>&1 && chsh -s /bin/bash root || true"

echo "[*] Setting root password to 'root' (lab use only – change in real setups)..."
${ADB} shell "echo -e 'root\nroot' | passwd root" || true

echo "[*] Updating /etc/ssh/sshd_config to allow root/password login..."
${ADB} shell "sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config" || true
${ADB} shell "sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config" || true

echo "[*] Generating SSH host keys if needed (ssh-keygen -A)..."
${ADB} shell "ssh-keygen -A" >/dev/null 2>&1 || true

echo "[*] Restarting SSH daemon/socket on device..."
${ADB} shell "systemctl restart sshd.socket 2>/dev/null || \
              systemctl restart sshd 2>/dev/null || \
              service ssh restart 2>/dev/null || \
              /etc/init.d/sshd restart 2>/dev/null || true"

echo "[*] Setting up ADB port forwarding: host tcp:${SSH_PORT} -> device tcp:22..."
${ADB} forward "tcp:${SSH_PORT}" tcp:22

echo
echo "=== SSH over ADB is ready ==="
echo "Connect from host with:"
echo "  ssh -p ${SSH_PORT} root@127.0.0.1"
echo
echo "VS Code Remote-SSH settings:"
echo "  Host: localhost"
echo "  Port: ${SSH_PORT}"
echo "  User: root"
echo
```

Sau đó bạn thêm config vào VS code nhé (Tương tự với bài Yocto-BBB 6)

```bash
ssh -p 2222 root@127.0.0.1
```

Và tada, ta đã có giao diện để lập trình thuận tiện hơn

![](/uploads/2025/11/image-19.png)

{{< youtube 2w9-aQVQ2YE >}}
