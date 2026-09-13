---
title: '[Yocto-BBB] 12. Transferring files over TFTP'
date: '2025-09-27T09:10:00+07:00'
lastmod: '2025-09-12T22:39:56+07:00'
slug: yocto-bbb-12-truyen-file-qua-tftp
url: /en/2025/09/27/yocto-bbb-12-truyen-file-qua-tftp/
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
description: 'What TFTP is, adding tftp-hpa to the image (and the meta-networking and meta-python layers it needs), static IPs over a direct Ethernet cable, setting up tftpd-hpa on the host and getting/putting files from the board.'
wp_id: 892
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
In the previous post I showed you how to transfer files over UART; in this post I show you how to transfer files over TFTP. (u-boot supports TFTP for loading files)

## 1. What is TFTP?

TFTP (Trivial File Transfer Protocol) is a **very simple** file transfer protocol running over `UDP` (port 69).

Some key characteristics:

- **Simpler than FTP**: no authentication, no username/password needed.
- **Uses UDP instead of TCP** → fast and light, but without FTP's reliability guarantees.
- **Common use**: often used in embedded environments, especially for loading firmware, kernels or rootfs over the network (for example: U-Boot uses TFTP to download images from the host to the board).
- **Limitations**: no security (no encryption, no elaborate access control), only suitable for local networks or trusted environments.
- **How it works**: the client sends a read request (RRQ) or write request (WRQ) for a file to the server, then the data is sent in blocks (512 bytes), each block acknowledged (ACK).

--> In short: **TFTP = a quick, light way to copy files over the network in embedded systems**, usually so the board can fetch the kernel/initramfs from the PC during boot.

## 2. Building a yocto image with TFTP support

In this post I am not touching `u-boot` yet; I transfer files over `TFTP` in `userspace`. So we have to add a `package` that supports it

I continue editing the `core-image-minimal.bbappend` used in the previous post

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

Here I add 3 packages

- `tftp-hpa`: provides the tftp command to transfer files
- `net-tools`: provides many commands such as ifconfig, route, ss, netstat
- `iproute2`: provides ip addr, ip link, ip route, ip neigh, ss, ...

(`ping`: already included in the lightweight `busybox`)

Okay, that's enough; build and flash.

**Oh, at this point your build fails, right? Read the FIX below**

{{% details title="HOW TO FIX THE BUILD ERROR" closed="true" %}}

Since it is a bit long, I put it in this toggle list :v. I also found it interesting, so I am writing it up.

The build error message is

```bash
Missing or unbuildable dependency chain was: ['tftp-hpa']
ERROR: Required build target 'core-image-minimal' has no buildable providers.
Missing or unbuildable dependency chain was: ['core-image-minimal', 'tftp-hpa']
```

This means it cannot find a `recipes` to build the `tftp-hpa` package.

So how did I know to add `tftp-hpa` in the first place? I wandered through some forums to see which `package` people add to send/receive over `TFTP`, and added it.

Now I went searching again. I searched the following line on google

```bash
tftp-hpa yocto
```

The first result was this page, which is exactly what I needed

```bash
https://layers.openembedded.org/layerindex/recipe/49880/
```

Reading the description, you see the recipe that builds `tftp-hpa` belongs to the `meta-networking` layer. So we need to add it to build-bbb/conf/bblayers.conf. This layer is in `yocto-bbb/meta-openembedded`

After adding it and rebuilding, we get the next error

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb$ bitbake core-image-minimal
WARNING: Layer meta-bbb should set LAYERSERIES_COMPAT_meta-bbb in its conf/layer.conf file to list the core layer names it is compatible with.
ERROR: Layer 'networking-layer' depends on layer 'meta-python', but this layer is not enabled in your configuration

Summary: There was 1 WARNING message.
Summary: There was 1 ERROR message, returning a non-zero exit code.
```

This one is easier to fix. `networking-layer` depends on `meta-python`, so we have to add that meta-layer too.

You can edit it by hand or use bitbake-layers add-layer \<path-to-layer>. In the end my build-bbb/conf/bblayers.conf is as follows:

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

## 3. Plug in Ethernet and configure the network

To start, connect `Ethernet` from the board directly to the Host, your PC.

### 3.1 Host side configuration

Check `ifconfig` for the name of the ethernet interface

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

So my `ethernet` interface is `enx207bd232cd61`. We run the following command to set a static ip and bring the `interface` up

```bash
sudo ip addr add 192.168.10.1/24 dev enx207bd232cd61
sudo ip link set enx207bd232cd61 up
```

### 3.2 Board side configuration

Similarly on the BBB

```bash
ip addr add 192.168.10.2/24 dev eth0
ip link set eth0 up
```

### 3.3 Ping test

After setting up the static ips, remember to test with `ping` to see how the connection is

```bash
ping 192.168.10.1   # from BBB
ping 192.168.10.2   # from PC
```

## 4. Configure TFTP on the host

### 4.1 Install and change the default folder

```bash
sudo apt install tftpd-hpa
sudo systemctl enable --now tftpd-hpa
```

Change the default `TFTP` folder

```bash
sudo nano /etc/default/tftpd-hpa
```

We change it to the following content. `TFTP_DIRECTORY` is simply the **Share folder** between the board and the host for sending and receiving files

```bash
# /etc/default/tftpd-hpa

TFTP_USERNAME="tftp"
TFTP_DIRECTORY="/home/zk47/Learning/TFTP"
TFTP_ADDRESS=":69"
TFTP_OPTIONS="--secure"
```

### 4.2 Local host test

On the host we test whether `TFTP` works properly

Remember to change the permissions of the folder and the mode of the new file

```bash
sudo chmod 777 /home/zk47/Learning/TFTP
touch /home/zk47/Learning/TFTP/testfile
chmod 666 testfile
```

From another folder, type the command

```bash
zk47@ltu:~/Learning/Empty$ ls
zk47@ltu:~/Learning/Empty$ tftp 127.0.0.1
tftp> get testfile
tftp> q
zk47@ltu:~/Learning/Empty$ ls
testfile
```

`TFTP` works nicely for the local test (`loopback` address 127.0.0.1)

## 5. Sending and receiving files over TFTP

On the host you have created `testfile` and tested locally. On the beaglebone board you do much the same, but with the real address of the host server.

```bash
root@beaglebone:~# tftp 192.168.10.1
tftp> get testfile
tftp> q
root@beaglebone:~# ls
testfile
```

So the transfer from the host to the board works.

Normally `tftp` also supports the `put` command, but for now the host side is still set to ***not allow creating new files***. However, `testfile` on the host already has write permission.

So we can edit `testfile` and put it back to the host.

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

And the content on the host has been updated

```bash
zk47@ltu:~/Learning/TFTP$ cat testfile
Content from beaglebone black
```

Good luck with the hands-on !!!

**In the next post I will write about RDP with the Weston backend on the Beaglebone Black. Hope you keep supporting.**
