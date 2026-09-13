---
title: '[Yocto-BBB] 13. Build weston, sửa lỗi input, dnd.'
date: '2025-10-04T12:15:29+07:00'
lastmod: '2026-01-07T21:06:29+07:00'
slug: yocto-bbb-13-build-weston-sua-loi-input-dnd
url: /2025/10/04/yocto-bbb-13-build-weston-sua-loi-input-dnd/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 13
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Lúc bắt tay vào làm minh không nghĩ mình sẽ viết bài này, mà mình nghĩ sẽ làm bài RDP + Weston luôn. Vì trên con STM32MP157 thì build cái được ngay, nhưng tr…
wp_id: 934
---

Lúc bắt tay vào làm minh không nghĩ mình sẽ viết bài này, mà mình nghĩ sẽ làm bài **RDP + Weston** luôn. Vì trên con `STM32MP157` thì build cái được ngay, nhưng trên con **Beaglebone Black** này, mình mất 2 ngày mới làm cho `Weston` có vẻ hoạt động đúng được.

Cách làm trong bài là cách mình khiến nó chạy được lên giao diện, nhận chuột, bàn phím. Nhưng mình tin `Weston` vẫn chưa hoạt động chuẩn hẳn.

**Beaglebone black** với phần cứng đã khá cũ nên phải tinh chỉnh rất nhiều mới lên được Weston. Mình sẽ làm 2 mục. 1 là Cách sửa, 2 là tại sao mình đi đến cách sửa đấy.

Mong các bạn sẽ không phải trải qua việc build `Weston` trên **Beaglebone Black** khổ sở như mình :vv.

Các bạn có thể làm theo mục 1 rồi sang bài **14. Weston + RDP** luôn nhé

## 1. Cách sửa

{{% details title="local.conf" closed="true" %}}

```bash
DISTRO_FEATURES:append = " systemd pam"
VIRTUAL-RUNTIME_init_manager = "systemd"
DISTRO_FEATURES_BACKFILL_CONSIDERED += "sysvinit"
VIRTUAL-RUNTIME_initscripts = ""

#Nếu dùng Yocto 4.0 Kirkstone thì ưu tiên version 8.0.0
PREFERRED_VERSION_weston = "8.0.0"

IMAGE_INSTALL:append = " libxcursor evtest libinput xkeyboard-config weston-examples adwaita-icon-theme hicolor-icon-theme udev adwaita-icon-theme-cursors libinput-bin "

IMAGE_INSTALL:append = " kernel-modules kernel-module-evdev kernel-module-usbhid "

KERNEL_MODULE_AUTOLOAD:append = " evdev usbhid "
```

{{% /details %}}

Nếu dùng Yocto 5.0 thì không cần phải thêm và sửa weston.bb và weston.bbappend như dưới đây

{{% details title="weston.bb" closed="true" %}}

Beaglebone Black không tương thích với Weston 10.0, do đó ta phải giảm nó xuống Weston 8.0. Mà bản Weston 8.0 này ở poky/dunfell. Do đó bạn clone về rồi copy sang layer của bạn

```bash
git clone -b kirkstone git://git.yoctoproject.org/poky/
```

Mình vẫn đang dùng meta-bbb là layer riêng nên mình sẽ copy tới đây, cấu trúc sau cùng có dạng như sau

```bash
zk47@ltu:~/Learning/yocto-bbb/meta-bbb/recipes-graphics$ tree
.
└── wayland
    ├── libinput
    │   ├── CVE-2022-1215.patch
    │   └── determinism.patch
    ├── libinput_1.15.2.bb
    ├── mtdev_1.1.6.bb
    ├── wayland
    │   ├── 0001-build-Fix-strndup-detection-on-MinGW.patch
    │   ├── 0001-meson-tests-add-missing-dependencies-on-protocol-hea.patch
    │   ├── 0002-Do-not-hardcode-the-path-to-wayland-scanner.patch
    │   ├── 0002-meson.build-find-the-native-wayland-scanner-directly.patch
    │   ├── CVE-2021-3782.patch
    │   └── run-ptest
    ├── weston
    │   ├── 0001-weston-launch-Provide-a-default-version-that-doesn-t.patch
    │   ├── 0002-desktop-shell-Remove-no-op-de-activation-of-the-xdg-.patch
    │   ├── 0003-desktop-shell-Rename-gain-lose-keyboard-focus-to-act.patch
    │   ├── 0004-desktop-shell-Embed-keyboard-focus-handle-code-when-.patch
    │   ├── weston.desktop
    │   ├── weston.png
    │   └── xwayland.weston-start
    ├── weston_8.0.0.bb
    ├── weston_8.0.0.bbappend
    ├── weston-init
    │   ├── 71-weston-drm.rules
    │   ├── init
    │   ├── qemuall
    │   │   └── weston.ini
    │   ├── qemux86
    │   │   └── weston.ini
    │   ├── qemux86-64
    │   │   └── weston.ini
    │   ├── weston.env
    │   ├── weston.ini
    │   ├── weston@.service
    │   └── weston-start
    └── weston-init.bb
```

Ở đây, mình đã xóa đi 2 file dưới để tránh xung đột meson build

```bash
wayland-protocols_1.25.bb
wayland_1.18.0.bb
```

Sau đó các bạn phải đi sửa cú pháp của file bb trong folder sang cú pháp yocto mới. Nhìn chung các bạn build xong nó sẽ báo lỗi, và lỗi chỗ này cũng dễ sửa thôi.

```bash
FILES_${PN} ---> FILES:${PN}
do_install_append ---> do_install:append
```

Ở weston_8.0.0.bb các bạn lưu ý thêm 3 dòng này trước do_install:append

```bash
USERADD_PACKAGES = "${PN}"
GROUPADD_PARAM:${PN} = "--system weston-launch"
USERADD_PARAM:${PN} = "--system --home /nonexistent --no-create-home --shell /bin/false weston"
```

Okay, các bạn có thể tham khảo code trên github của mình ở đây <https://github.com/Zk47T/meta-bbb/tree/main/recipes-graphics/wayland>

{{% /details %}}

{{% details title="weston.bbappend" closed="true" %}}

```bash
PACKAGECONFIG:append = " libinput"
RDEPENDS:${PN}:append = " libxcursor adwaita-icon-theme-cursors"
```

{{% /details %}}

Okay sau khi các bạn build và khởi động lên thành công, các bạn sửa tiếp cho mình 2 file sau

{{% details title="/etc/xdg/weston/weston.ini" closed="true" %}}

```bash
# /etc/xdg/weston/weston.ini
[core]
backend=fbdev-backend.so
renderer=pixman
xwayland=false
require-input=false
cursor-theme=Adwaita
cursor-size=24

[shell]
locking=false
panel-color=0x90ff0000
background-color=0xff002244
```

{{% /details %}}

{{% details title="/etc/systemd/system/weston.service" closed="true" %}}

```bash
[Unit]
Description=Weston Wayland Compositor on tty1
After=systemd-udev-settle.service
Wants=systemd-udev-settle.service
Conflicts=getty@tty1.service

[Service]
Type=simple
ExecStartPre=/bin/rm -f /run/user/0/wayland-0.lock
ExecStartPre=/bin/mkdir -p -m 0700 /run/user/0
ExecStartPre=/bin/chown root:root /run/user/0
Environment=XDG_RUNTIME_DIR=/run/user/0
Environment=XCURSOR_PATH=/usr/share/icons
Environment=XCURSOR_THEME=Adwaita

ExecStart=/usr/bin/weston --tty=1 --backend=fbdev-backend.so --log=/var/log/weston.log

Restart=on-failure
RestartSec=1
TimeoutStopSec=5s
KillMode=mixed
ExecStopPost=/bin/rm -f /run/user/0/wayland-0.lock
User=root

[Install]
WantedBy=graphical.target
```

{{% /details %}}

`weston.ini` thì có sẵn trên board, các bạn xóa trắng đi rồi điền nội dung kia. `weston.service` thì các bạn tạo mới bằng `touch`

Okay, và sau đó ta chạy các câu lệnh sau

```bash
systemctl stop weston
rm -f /run/user/0/wayland-0.lock
mkdir -p -m 0700 /run/user/0
chown root:root /run/user/0

printf "%s\n" "blacklist ili9341" "blacklist drm_mipi_dbi" > /etc/modprobe.d/blacklist-ili9341.conf
sync

systemctl stop getty@tty1.service
systemctl disable getty@tty1.service
systemctl mask weston@.service

systemctl daemon-reload
systemctl reset-failed weston
systemctl enable weston
sync
reboot
```

Chờ `reboot` sẽ có 1 task là đợi 3 phút, các bạn cho chạy xong task đấy rồi tút nguồn mở lên lại là ok.

{{% details title="Kết quả sẽ như sau" closed="true" %}}

![](/uploads/2025/09/bbb-yocto-weston.jpg)

![](/uploads/2025/09/bbb-yocto-weston2.jpg)

{{% /details %}}

## 2. Tại sao mình lại sửa như thế

### 2.1 Cài weston service systemd

Chắc chắn rồi, động đến image này, đầu tiên mình sẽ build rồi flash test luôn

```bash
bitbake core-image-weston
```

Rồi, mở board lên, màn hình đen . Mình tính chạy

```bash
systemctl status weston
```

Thì nhận ra nếu ko cài, thì yocto măc định là `systemV`, do đó mình phải sửa `local.conf` và cài lại để sang `systemd` cho tiện.

```bash
#local.conf

DISTRO_FEATURES:append = " systemd pam"
VIRTUAL-RUNTIME_init_manager = "systemd"
DISTRO_FEATURES_BACKFILL_CONSIDERED += "sysvinit"
VIRTUAL-RUNTIME_initscripts = ""
```

Cài lại và board lên lại, lần này minh chạy **chay** trước xem sao

```bash
weston --backend=drm-backend.so --tty=1 --log=/var/log/weston.log
```

Vẫn lỗi, mình thử tìm lỗi trong `weston.log` trên mạng các kiểu không được, mình cho vào chatgpt 5 thinking, check lỗi, và nó phân tích ra là

```bash
2. DRM backend crash
Segmentation fault
...
GL vendor: Imagination Technologies
GL renderer: PowerVR SGX 530

👉 Here Weston actually initializes the DRM + EGL + PowerVR driver, but segfaults afterwards.
This is a known issue with Weston 10.x on BeagleBone Black’s SGX530 driver:

The gl-renderer.so in Weston 10 tries to use features that the old PVR SGX530 doesn’t support → segfault.

On Debian/Yocto with BBB, Weston 8.0.0 is usually used (with patches for SGX530). Later Weston versions (>9) are unstable with TI’s PVR userspace.
```

Oh, vậy mình thử hạ từ 10.0 xuống 8.0.

Mình sẽ clone `poky/dunfell`, rồi copy vào `meta-bbb` như mình đã nói bên trên.

Build với Weston 8.0 ok

Mình sửa lại `weston.ini`, và `weston.service`

{{% details title="/etc/xdg/weston/weston.ini" closed="true" %}}

```bash
[core]
backend=fbdev-backend.so
renderer=pixman
require-input=false

[shell]
locking=false
panel-color=0x90ff0000
background-color=0xff002244
```

{{% /details %}}

{{% details title="/etc/systemd/system/weston.service" closed="true" %}}

```bash
[Unit]
Description=Weston Wayland Compositor on tty1
After=systemd-user-sessions.service
Conflicts=getty@tty1.service

[Service]
ExecStart=/usr/bin/weston --tty=1 --backend=fbdev-backend.so --log=/var/log/weston.log
Restart=on-failure
RestartSec=2
User=root
WorkingDirectory=/root

[Install]
WantedBy=graphical.target
```

```bash
systemctl daemon-reload
systemctl disable getty@tty1.service
systemctl enable weston.service
systemctl start weston.service
```

{{% /details %}}

Tuy nhiên service vẫn `failed`

{{% details title="systemctl status weston" closed="true" %}}

```bash
root@beaglebone:~# systemctl status weston

* weston.service - Weston Wayland Compositor on tty1

Loaded: loaded (/etc/systemd/system/weston.service; enabled; vendor preset: disabled)

Active: activating (auto-restart) (Result: exit-code) since Sun 2023-12-24 11:01:13 UTC; 1s ago Process: 342

ExecStart=/usr/bin/weston --tty=1 --backend=fbdev-backend.so --renderer=pixman --log=/var/log/weston.log (code=exited, status=1/FAILURE)

Main PID: 342 (code=exited, status=1/FAILURE)
```

{{% /details %}}

### 2.2. Check /var/log/weston.log và phát hiện lỗi

Mình quyết định vào đọc trong `/var/log/weston.log` và thấy lỗi rõ mồn một rồi

{{% details title="/var/log/weston.log" closed="true" %}}

```bash
Date: 2023-12-24 UTC [10:59:52.229]
weston 8.0.0 https://wayland.freedesktop.org
Bug reports to: https://gitlab.freedesktop.org/wayland/weston/issues/
Build: 8.0.0 [10:59:52.230]
Command line: /usr/bin/weston --tty=1 --backend=fbdev-backend.so --renderer=pixman --log=/var/log/weston.log [10:59:52.230]
OS: Linux, 6.1.80-ti, #1 SMP PREEMPT Fri Mar 22 02:57:54 UTC 2024, armv7l [10:59:52.230]

fatal: environment variable XDG_RUNTIME_DIR is not set.

Refer to your distribution on how to get it, or http://www.freedesktop.org/wiki/Specifications/basedir-spec on how to implement it.
```

{{% /details %}}

`XDG_RUNTIME_DIR` không được đặt. Đây có vẻ là 1 lỗi kinh điển của Wayland. Bởi mình từng dính 1 số lần.

Vậy thì sửa tiếp thôi, tạm thời hardcode mình sửa lại `weston.service` thêm lấy dòng

```bash
Environment=XDG_RUNTIME_DIR=/run/user/0
```

Rồi khởi động lại `weston service`, check status. Lần này ta thấy xuất hiện lỗi mới.

{{% details title="systemctl status weston" closed="true" %}}

```bash
root@beaglebone:~# systemctl status weston -l

* weston.service - Weston Wayland Compositor on tty1

Loaded: loaded (/etc/systemd/system/weston.service; enabled; vendor preset: disabled)

Active: active (running) since Sun 2023-12-24 11:04:11 UTC; 15s ago Process: 508

ExecStartPre=/bin/mkdir -p /run/user/0 (code=exited, status=0/SUCCESS)

Main PID: 510 (weston) Tasks: 3 (limit: 1040)

Memory: 11.7M

CGroup: /system.slice/weston.service
|- 510 /usr/bin/weston --tty=1 --backend=fbdev-backend.so
|- 511 /usr/libexec/weston-keyboard
- 512 /usr/libexec/weston-desktop-shell

Dec 24 11:04:11 beaglebone weston[510]: [11:04:11.803] libwayland: unable to lock lockfile /run/user/0/wayland-0.lock, maybe another compositor is running

Dec 24 11:04:11 beaglebone weston[510]: [11:04:11.803] Loading module '/usr/lib/weston/desktop-shell.so'

Dec 24 11:04:11 beaglebone weston[510]: [11:04:11.812] launching '/usr/libexec/weston-keyboard'

Dec 24 11:04:11 beaglebone weston[510]: [11:04:11.819] launching '/usr/libexec/weston-desktop-shell'

Dec 24 11:04:12 beaglebone weston[511]: could not load cursor 'dnd-move'

Dec 24 11:04:12 beaglebone weston[512]: could not load cursor 'dnd-move'

Dec 24 11:04:12 beaglebone weston[511]: could not load cursor 'dnd-copy'

Dec 24 11:04:12 beaglebone weston[511]: could not load cursor 'dnd-none'

Dec 24 11:04:12 beaglebone weston[512]: could not load cursor 'dnd-copy'

Dec 24 11:04:12 beaglebone weston[512]: could not load cursor 'dnd-none'
```

{{% /details %}}

### 2.3 Fix "could not load cursor 'dnd-none'"

(`dnd` = drag-and-drop)

Theo mình tìm hiểu thì là weston đang không tìm thấy theme, hay dữ liệu cho cursor. Và check trên board chúng ta cũng đang không hề thấy `/dev/input`. Dù rằng hiện tại mình đang cắm màn hình, chuột, bàn phím vào đủ cả.

Để thêm Weston theme thì mình cài thêm `adwaita-icon-theme` `adwaita-icon-theme-cursors` . Cũng như fix lỗi input bằng cách thêm libinput ...

Ta sửa `local.conf` sang như sau

{{% details title="local.conf" closed="true" %}}

```bash
DISTRO_FEATURES:append = " systemd pam"
VIRTUAL-RUNTIME_init_manager = "systemd"
DISTRO_FEATURES_BACKFILL_CONSIDERED += "sysvinit"
VIRTUAL-RUNTIME_initscripts = ""

PREFERRED_VERSION_weston = "8.0.0"

IMAGE_INSTALL:append = " libxcursor evtest libinput xkeyboard-config weston-examples adwaita-icon-theme hicolor-icon-theme udev adwaita-icon-theme-cursors libinput-bin "

# Image side (pull in all modules or just what you need)
IMAGE_INSTALL:append = " kernel-modules kernel-module-evdev kernel-module-usbhid "

KERNEL_MODULE_AUTOLOAD:append = " evdev usbhid "
```

{{% /details %}}

Build lại và giờ trên board ta đã có `/dev/input/event*` nhận các event từ chuột, bàn phím, cảm ứng. Để biết từ /dev/input/event này các bạn có thể làm được gì, các bạn có thể xem qua bài mình từng viết sau : </2025/05/24/linux-cau-hinh-chuot-logitech-bang-bash-scripts/>

ta cũng thấy các dữ liệu dnf trong /usr/share/icons/Adwaita/cursors

```bash
root@beaglebone:~# ls /usr/share/icons/Adwaita/cursors/ | grep dnf*
dnd-ask
dnd-copy
dnd-link
dnd-move
dnd-no-drop
dnd-none
```

Ta sửa lại `weston.service` để follow theo theme `Adwaita`, sau khi sửa đã không còn xuất hiện lỗi `dnd` nữa

{{% details title="weston.service" closed="true" %}}

```bash
[Unit]
Description=Weston Wayland Compositor on tty1
After=systemd-user-sessions.service
Conflicts=getty@tty1.service

[Service]
ExecStartPre=/bin/rm -f /run/user/0/wayland-0.lock
ExecStartPre=/bin/mkdir -p /run/user/0
Environment=XDG_RUNTIME_DIR=/run/user/0
Environment=XCURSOR_PATH=/usr/share/icons
Environment=XCURSOR_THEME=Adwaita
ExecStart=/usr/bin/weston --tty=1 --backend=fbdev-backend.so --log=/var/log/weston.log
Restart=on-failure
RestartSec=2
User=root

[Install]
WantedBy=graphical.target
```

{{% /details %}}

Tuy nhiên vẫn còn 1 lỗi warning xuất hiện ở `/var/log/weston.log`

```bash
[10:55:04.327] libwayland: unable to lock lockfile /run/user/0/wayland-0.lock, maybe another compositor is running

warning: XDG_RUNTIME_DIR "/run/user/0" ... must be 0700 (current 755)
```

Về lỗi lock, sau tìm hiểu thì mình nhận ra có cả 1 thằng là `weston@.service` đang chạy nữa. Nên minh phải mask nó đi, cũng như mình đang chạy với tty1, nên cũng tắt luôn thằng `getty@tty1`

Tuy nhiên còn 1 lỗi nữa liên quan đến spi `ili9341`, và `dri`. Mình thì không biết tại sao có cái này, có vẻ như trong device tree có và set up sai. Nên mình cũng blacklist nó luôn

Vậy sau cùng mình đi đến cách làm sửa cuối cùng như trong mục 1.
