---
title: '[Yocto-BBB] 14. X11 and RDP (Remote Desktop Protocol)'
date: '2025-10-11T09:13:00+07:00'
lastmod: '2025-09-20T22:17:03+07:00'
slug: yocto-bbb-14-x11-va-rdp
url: /en/2025/10/11/yocto-bbb-14-x11-va-rdp/
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
description: 'Remote desktop into core-image-sato on the BeagleBone Black with xrdp and xorgxrdp: systemd, PAM and X11 distro features, RSA keys, a startwm.sh session script and xfreerdp from the host, with each step explained.'
wp_id: 1017
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
Since building Weston was far too complicated, and I also tried Weston + RDP without success, I switched to X11 + RDP to keep things simpler

## 1. Why use RDP

The goal of using `RDP` (Remote Desktop Protocol) is that you can access the board remotely with a graphical interface, like VNC.

So why not choose `VNC` --> because with an X11 server, RDP is much better supported. VNC is more secure since it involves **SSH keys**, but my goal is personal use, so easy setup and convenience are the best choice

## 2. How to set it up

From the previous post I found it quite nice to put the setup first and explain it in a later section. That way it is easier for you to follow

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

Okay, build and flash to the SD card

```bash
bitbake -c cleanall core-image-sato && bitbake core-image-sato
```

After the board boots, run the following commands

{{% details title="Add rsakeys for xrdp" closed="true" %}}

```bash
mkdir -p /etc/xrdp
xrdp-keygen xrdp /etc/xrdp/rsakeys.ini

printf 'XRDP_OPTIONS=\n'       > /etc/default/xrdp
printf 'SESMAN_OPTIONS=\n'     > /etc/default/xrdp-sesman
```

{{% /details %}}

{{% details title="Create the session script (xrdp session)" closed="true" %}}

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

Okay, the setup is done; now the board needs a network connection. You can plug in an Ethernet cable or a USB wifi adapter (the image does not support it out of the box yet; see [post 7, Adding a driver for a USB wifi adapter](/en/2025/08/09/yocto-bbb-7-them-driver-cho-usb-wifi/) for which packages to add)

Run the following command to find the board's ip, then from the host run xfreerdp (I use wlan0, so it is show wlan0; with a cable it would be ip a show eth0, whichever interface is connected)

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

{{% details title="And here is the result" closed="true" %}}

<video controls preload="metadata" poster="/videos/C3V6EdF0/poster.jpg" src="/videos/C3V6EdF0/rdp-x11-beagleboneblack.mp4" style="max-width:100%;margin:auto;display:block"></video>

{{% /details %}}

## 3. Why it has to be done this way :vv

### 3.1 Changes to local.conf

```bash
DISTRO_FEATURES:append = " systemd pam x11"
```

- This makes sure we run the xrdp and xrdp-sesman services as systemd units (easy enable/disable, journal logs, ...)

- `pam`: XRDP authenticates through `PAM`; without PAM, XRDP logins usually fail (sesman cannot authenticate).
- `x11`: because I **chose X11 + xorgxrdp** (not Weston)

```bash
VIRTUAL-RUNTIME_init_manager = "systemd"
```

- Forces init to systemd (not mixed with sysvinit).

```bash
DISTRO_FEATURES_BACKFILL_CONSIDERED += "sysvinit"
```

- Tells Yocto "don't backfill" sysvinit when you have chosen systemd, to avoid accidentally pulling in sysvinit packages.

```bash
VIRTUAL-RUNTIME_initscripts = ""
```

- Left empty so sysvinit-style initscripts are **not** pulled in, keeping the stack lean on systemd.

---> **In short:** this block makes sure the foundation is **systemd + PAM + X11**, exactly what XRDP with the Xorg backend needs.

I took this approach from <https://yocto.yoctoproject.narkive.com/4FfIrwaI/how-to-use-systemd-as-system-init-manager>

### 3.2 Changes to core-image-sato.bbappend

```bash
IMAGE_INSTALL:append = " python3-jinja2 dhcpcd iproute2 iputils"
```

- `dhcpcd`: DHCP client, used to get an IP when connecting on wlan0
- `iproute2`: `ip addr|route|link`… replacing `ifconfig`.
- `iputils`: has `ping`, `ping6` (many minimal Sato builds lack them).
- `python3-jinja2`: handy for scripts/templates (not required for XRDP, but useful for build scripts).

```bash
IMAGE_INSTALL:append = " xrdp xorgxrdp"
```

- `xrdp`: the RDP daemon + sesman.
- `xorgxrdp`: the driver/Xorg module that creates the **Xorg backend** for the RDP session (supports dynamic resolution, clipboard, etc.).

### 3.3 Creating RSA keys & default options for XRDP

Right after flashing, if we check the xrdp status we see

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

"File /etc/xrdp/rsakeys.ini is missing, create it using xrdp-keygen", so we create it with the command above

`/etc/default/xrdp*` passes the daemon parameters

### 3.4 startwm.sh

After authenticating, XRDP calls the X session script to start the desktop. We need to provide it.

```bash
[ -r /etc/profile ] && . /etc/profile
```

- loads the system environment variables for the login shell

```bash
export XDG_RUNTIME_DIR=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}
mkdir -p "$XDG_RUNTIME_DIR" ; chmod 700 "$XDG_RUNTIME_DIR"
```

- As in the Weston fix, I had to add this folder by hand. This folder is vital for many services :vv. It should be set at login, but nobody knows why it isn't. Maybe the script responsible for creating it was not installed :vv

```bash
if command -v sato-session >/dev/null 2>&1; then
  exec sato-session
fi
```

- If sato-session exists, go straight into it (on the STM32MP157 I have it, but on the Beaglebone Black and i.mx91 I did not find it)

```bash
# Small fallback: assemble Matchbox ourselves if sato-session is missing
if command -v matchbox-window-manager ...; then
  ( matchbox-window-manager ... & )
  ( matchbox-panel ... & )
  ( matchbox-desktop ... & )
  # Keep the session alive with one foreground app:
  exec matchbox-terminal || exec xterm || exec sh
fi

# Last resort:
exec xterm || exec sh
```

**Okay, to sum up, from boot we get the following chain of events**

- `systemd` starts `xrdp.service` and `xrdp-sesman.service`.
- The `xfreerdp` client connects → `xrdp` hands over to `sesman` for authentication (PAM).
- `sesman` creates a **headless Xorg** through `xorgxrdp`.
- Xorg calls the session script → your `/etc/xrdp/startwm.sh`.
- The script sets the env + runs `sato-session` (or falls back to Matchbox/xterm).
- **Dynamic resolution**: the `xorgxrdp` backend supports it, so `xfreerdp`'s `/dynamic-resolution` works smoothly even **with no HDMI plugged in**.

For this post I referred to this talk by Leon Anavi: <https://archive.fosdem.org/2023/schedule/event/rdp_wayland/attachments/slides/5908/export/events/attachments/rdp_wayland/slides/5908/leon_anavi_weston_rdp_fosdem_2023.pdf>

And this one too: <https://archive.fosdem.org/2024/schedule/event/fosdem-2024-3242-screen-sharing-on-raspberry-pi-5-using-vnc-in-weston-and-wayland-with-the-yocto-project-and-openembedded/>

If you like building yocto for the Raspberry Pi, support him on Youtube and Linkedin:

**In the next post I will write about changing the Boot Logo on the Beaglebone Black; hope you keep supporting**
