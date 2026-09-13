---
title: '[Yocto-BBB] 14. X11 và RDP (Remote Desktop Protocol)'
date: '2025-10-11T09:13:00+07:00'
lastmod: '2025-09-20T22:17:03+07:00'
slug: yocto-bbb-14-x11-va-rdp
url: /2025/10/11/yocto-bbb-14-x11-va-rdp/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 14
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Vì quá trình build Weston quá phức tạp rồi, và mình cũng có thử Weston + RDP không thành, nên mình sang X11 + RDP luôn cho đỡ phức tạp
wp_id: 1017
---

Vì quá trình build Weston quá phức tạp rồi, và mình cũng có thử Weston + RDP không thành, nên mình sang X11 + RDP luôn cho đỡ phức tạp

## 1. Lý do dùng RDP

Mục tiêu của việc dùng `RDP` (Remote Desktop Protocol) này là bạn hoàn toàn có thể truy cập từ xa tới board với giao diện giống như VNC vậy .

Vậy tại sao mình lại không chọn `VNC` --> vì với X11 server thì RDP được hỗ trợ tốt hơn nhiều. VNC sẽ bảo mật hơn do có dính dáng đến cả **SSH keys**, tuy nhiên mục tiêu của mình dùng cho cá nhân nên cài đặt dễ, dùng tiện là lựa chọn tối ưu

## 2. Cách triển khai

Chắc từ bài trước mình thấy khá hay khi để cách triển khai lên đầu luôn, rồi sẽ giải thích ở 1 mục sau. Như thế các bạn sẽ dễ làm theo hơn

{{% details title="build-bbb/local.conf" closed="true" %}}

```bash
DISTRO_FEATURES:append = " systemd pam x11"
VIRTUAL-RUNTIME_init_manager = "systemd"
DISTRO_FEATURES_BACKFILL_CONSIDERED += "sysvinit"
VIRTUAL-RUNTIME_initscripts = ""
```

{{% /details %}}

{{% details title="meta-bbb/recipes-cores/images/core-image-sato.bbappend" closed="true" %}}

```bash
inherit extrausers

PASSWD = "\$5\$y9Aeg5ctwntRHo/g\$CAKtoTfQg7VPGfVAMGo5ZG/0GJLn3AD0JdoQ.i0dDFC"
EXTRA_USERS_PARAMS = "\
    usermod -p '${PASSWD}' root; \
    "

IMAGE_INSTALL:append = " \
    python3-jinja2 \
    dhcpcd \
    iproute2 \
    iputils \
    "

IMAGE_INSTALL:append = " xrdp xorgxrdp"
```

{{% /details %}}

Okay các bạn build và flash vào thẻ nhớ nhé

```bash
bitbake -c cleanall core-image-sato && bitbake core-image-sato
```

Sau khi board khởi động lên các bạn chạy các câu lệnh sau

{{% details title="Thêm rsakeys cho xrdp" closed="true" %}}

```bash
mkdir -p /etc/xrdp
xrdp-keygen xrdp /etc/xrdp/rsakeys.ini

printf 'XRDP_OPTIONS=\n'       > /etc/default/xrdp
printf 'SESMAN_OPTIONS=\n'     > /etc/default/xrdp-sesman
```

{{% /details %}}

{{% details title="Tạo script cho phiên (xrdp session)" closed="true" %}}

```bash
cat >/etc/xrdp/startwm.sh /dev/null || true
chmod 700 "$XDG_RUNTIME_DIR" 2>/dev/null || true

# Prefer Sato if present
if command -v sato-session >/dev/null 2>&1; then
  exec sato-session
fi

# Fallback: minimal Matchbox desktop
if command -v matchbox-window-manager >/dev/null 2>&1; then
  ( matchbox-window-manager -use_titlebar yes >/dev/null 2>&1 & )
  command -v matchbox-panel >/dev/null 2>&1 && ( matchbox-panel >/dev/null 2>&1 & )
  command -v matchbox-desktop >/dev/null 2>&1 && ( matchbox-desktop >/dev/null 2>&1 & )
  # Keep the session alive with a terminal
  if command -v matchbox-terminal >/dev/null 2>&1; then
    exec matchbox-terminal
  elif command -v xterm >/dev/null 2>&1; then
    exec xterm
  else
    exec sh
  fi
fi

# Last resort
exec xterm || exec sh
EOF
chmod +x /etc/xrdp/startwm.sh
systemctl restart xrdp xrdp-sesman
```

{{% /details %}}

Okay vậy là xong phần setup, giờ bạn cần kết nối mạng cho board. Các bạn có thể cắm dây Ethernet hoặc USB wifi (hiện image chưa hỗ trợ sẵn, các bạn tham khảo [bài 7 Thêm driver cho USB wifi](/2025/08/09/yocto-bbb-7-them-driver-cho-usb-wifi/) để biết cần thêm package gì )

Các bạn chạy câu lệnh sau để tìm ip của board, rồi từ host ta chạy xfreerdp (mình đang dùng wlan0 nên sẽ là show wlan0, bạn cắm dây sẽ là ip a show eth0 - theo đúng interface kết nối)

```bash
#BBB board
root@beaglebone:/etc/xrdp# ip a show wlan0
3: wlan0:  mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether a8:42:a1:b0:e6:7b brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.5/24 brd 192.168.1.255 scope global dynamic noprefixroute wlan0
       valid_lft 2043sec preferred_lft 1593sec

#Host
zk47@ltu:~$ xfreerdp /v:192.168.1.5 /u:root /p:test /dynamic-resolution /cert:ignore
```

{{% details title="Và đây là kết quả" closed="true" %}}

<video controls preload="metadata" poster="/videos/C3V6EdF0/poster.jpg" src="/videos/C3V6EdF0/rdp-x11-beagleboneblack.mp4" style="max-width:100%;margin:auto;display:block"></video>

{{% /details %}}

## 3. Tại sao lại cần làm thế :vv

### 3.1 Thay đổi local.conf

```bash
DISTRO_FEATURES:append = " systemd pam x11"
```

- Việc này đảm bảo ta dùng các service xrdp, xrdp-sesman dưới systemd unit (dễ enable/disable, journal logs,...)

- `pam`: XRDP xác thực qua `PAM`; không bật PAM thì đăng nhập XRDP sẽ thường fail (sesman không auth được).
- `x11`: vì mình **chọn X11 + xorgxrdp** (không dùng Weston)

```bash
VIRTUAL-RUNTIME_init_manager = "systemd"
```

- Ép hẳn init về systemd (không lẫn với sysvinit).

```bash
DISTRO_FEATURES_BACKFILL_CONSIDERED += "sysvinit"
```

- Nói với Yocto “đừng backfill” sysvinit khi bạn đã chọn systemd, tránh kéo các gói sysvinit vô tình.

```bash
VIRTUAL-RUNTIME_initscripts = ""
```

- Trống để **không** lôi initscripts kiểu sysvinit vào, giữ stack gọn theo systemd.

---> **Tóm lại:** Block này bảo đảm nền tảng là **systemd + PAM + X11**, đúng nhu cầu của XRDP với backend Xorg.

Mình tham khảo cách làm này tại <https://yocto.yoctoproject.narkive.com/4FfIrwaI/how-to-use-systemd-as-system-init-manager>

### 3.2 Thay đổi core-image-sato.bbappend

```bash
IMAGE_INSTALL:append = " python3-jinja2 dhcpcd iproute2 iputils"
```

- `dhcpcd`: client DHCP. dùng để cấp IP khi kết nối với wlan0
- `iproute2`: `ip addr|route|link`… thay cho `ifconfig`.
- `iputils`: có `ping`, `ping6` (nhiều bản Sato tối giản sẽ thiếu).
- `python3-jinja2`: tiện cho script/template (không bắt buộc cho XRDP, nhưng hữu ích với build scripts).

```bash
IMAGE_INSTALL:append = " xrdp xorgxrdp"
```

- `xrdp`: daemon RDP + sesman.
- `xorgxrdp`: driver/Xorg module để tạo **Xorg backend** cho phiên RDP (hỗ trợ dynamic resolution, clipboard, v.v.).

### 3.3 Tạo RSA keys & default options cho XRDP

Lúc bạn mới flash lên, nếu check status của xrdp ta sẽ thấy

{{% details title="systemctl status xrdp" closed="true" %}}

```bash
root@beaglebone:~# systemctl status xrdp
x xrdp.service - xrdp daemon
     Loaded: loaded (/lib/systemd/system/xrdp.service; enabled; vendor preset: enabled)
     Active: failed (Result: exit-code) since Sun 2023-12-24 10:50:53 UTC; 59s ago
       Docs: man:xrdp(8)
             man:xrdp.ini(5)
    Process: 321 ExecStart=/usr/sbin/xrdp $XRDP_OPTIONS (code=exited, status=1/FAILURE)

Dec 24 10:50:52 beaglebone systemd[1]: Starting xrdp daemon...
Dec 24 10:50:52 beaglebone xrdp[321]: File /etc/xrdp/rsakeys.ini is missing, create it using xrdp-keygen
Dec 24 10:50:52 beaglebone xrdp[321]: Fatal error occurred, exiting
Dec 24 10:50:53 beaglebone systemd[1]: xrdp.service: Control process exited, code=exited, status...AILURE
Dec 24 10:50:53 beaglebone systemd[1]: xrdp.service: Failed with result 'exit-code'.
Dec 24 10:50:53 beaglebone systemd[1]: Failed to start xrdp daemon.
Hint: Some lines were ellipsized, use -l to show in full.
```

{{% /details %}}

"File /etc/xrdp/rsakeys.ini is missing, create it using xrdp-keygen" do đó ta sẽ tạo dùng câu lệnh trên

`/etc/default/xrdp*` để truyền tham số daemon

### 3.4 startwm.sh

XRDP sau khi đã xác minh xong sẽ gọi script của phiên X để khởi động desktop. Ta cần cung cấp cho nó.

```bash
[ -r /etc/profile ] && . /etc/profile
```

- load biến môi trường hệ thống cho shell login

```bash
export XDG_RUNTIME_DIR=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}
mkdir -p "$XDG_RUNTIME_DIR" ; chmod 700 "$XDG_RUNTIME_DIR"
```

- Như bài Weston mình đã từng fix, mình đã phải thêm tay thư mục này. Thư mục này là sự sống còn cho rất nhiều service :vv. Nó sẽ được set khi login, nhưng cũng không ai biết nó sẽ không được set vì sao cả. Có thể script phụ trách việc tạo đã không được cài :vv

```bash
if command -v sato-session >/dev/null 2>&1; then
  exec sato-session
fi
```

- Nếu có sato-session thì vào thẳng luôn (trên STM32MP157 là mình có luôn, nhưng trên Beaglebone Black và i.mx91 mình đều không thấy có)

```bash
# Fallback nhỏ gọn: tự ghép Matchbox nếu sato-session không có
if command -v matchbox-window-manager ...; then
  ( matchbox-window-manager ... & )
  ( matchbox-panel ... & )
  ( matchbox-desktop ... & )
  # Giữ phiên sống bằng 1 app foreground:
  exec matchbox-terminal || exec xterm || exec sh
fi

# Last resort:
exec xterm || exec sh
```

**Okay vậy tóm gọn lại là kể từ lúc boot ta sẽ có chuỗi hành vi sau**

- `systemd` khởi động `xrdp.service` và `xrdp-sesman.service`.
- Client `xfreerdp` kết nối → `xrdp` chuyển sang `sesman` để xác thực (PAM).
- `sesman` tạo một **Xorg headless** qua `xorgxrdp`.
- Xorg gọi script phiên → `/etc/xrdp/startwm.sh` của bạn.
- Script set env + chạy `sato-session` (hoặc nhảy Matchbox/xterm).
- **Dynamic resolution**: backend `xorgxrdp` hỗ trợ nên `/dynamic-resolution` của `xfreerdp` hoạt động mượt ngay cả **không cắm HDMI**.

Bài này mình có tham khảo bài sau của bác Leon Anavi: <https://archive.fosdem.org/2023/schedule/event/rdp_wayland/attachments/slides/5908/export/events/attachments/rdp_wayland/slides/5908/leon_anavi_weston_rdp_fosdem_2023.pdf>

Và đây nữa : <https://archive.fosdem.org/2024/schedule/event/fosdem-2024-3242-screen-sharing-on-raspberry-pi-5-using-vnc-in-weston-and-wayland-with-the-yocto-project-and-openembedded/>

Nếu các bạn thích Build yocto trên Raspberry Pi thì các bạn ủng hộ bác trên Youtube, Linkedin nhé :

**Bài tiếp theo mình sẽ viết về cách thay đổi Boot Logo trên Beaglebone Black, mong được các bạn tiếp tục ủng hộ**
