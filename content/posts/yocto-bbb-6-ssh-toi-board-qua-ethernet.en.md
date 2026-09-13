---
title: '[Yocto-BBB] 6. SSH into the board over Ethernet'
date: '2025-08-02T08:25:00+07:00'
lastmod: '2025-12-09T20:52:55+07:00'
slug: yocto-bbb-6-ssh-toi-board-qua-ethernet
url: /en/2025/08/02/yocto-bbb-6-ssh-toi-board-qua-ethernet/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 6
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: 'A custom-image recipe with dhcpcd, iproute2, iputils and openssh for Ethernet and SSH, then the extra packages (bash, tar, xz, procps, coreutils, curl, libstdc++, libatomic) that VS Code Remote-SSH needs.'
wp_id: 461
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
Continuing from post 5, in this post I show you how to add packages to the image so it can connect to the Internet when Ethernet is plugged in, and then SSH into the board, which makes programming easier later.

(If you run into difficulties following the blog, you can refer to my hands-on video at the end of the post)

## 1. Add packages and check

Here, to keep track of packages more easily, I create `cusom-image.bb` (really because typing `core-image-minimal` is a bit long :vvv) at ***/meta-bbb/recipes-core/images/***

Its content is as follows

```bash
SUMMARY = "My custom Linux Image"
IMAGE_INSTALL = "packagegroup-core-boot ${CORE_IMAGE_EXTRA_INSTALL}"
IMAGE_LINGUAS = " "
LICENSE = "MIT"
inherit core-image
inherit extrausers
#Set rootfs to 200MiB by default
IMAGE_OVERHEAD_FACTOR ?= "1.0"
IMAGE_ROOTFS_SIZE ?= "204800"
IMAGE_ROOTFS_MAXSIZE = "2097152"
#Change root password to test
PASSWD = "\$5\$y9Aeg5ctwntRHo/g\$CAKtoTfQg7VPGfVAMGo5ZG/0GJLn3AD0JdoQ.i0dDFC"
EXTRA_USERS_PARAMS = "\
    usermod -p '${PASSWD}' root; \
    "
IMAGE_INSTALL:append = " \
    dhcpcd \
    iproute2 \
    iputils \
    openssh \
"
```

The packages mean the following

- `dhcpcd`: provides the DHCP client (gets an IP from the router for Ethernet).
- `iproute2`: provides tools like `ip link`, `ip addr`, `ip route`.
- `iputils`: provides the `ping` tool.
- `openssh`: allows SSH from the laptop.

And that's enough; go ahead and build

```bash
bitbake -c cleanall custom-image
bitbake custom-image
```

![](/uploads/2025/07/image-12.png)

This is the result after rebooting (my custom-image.bb does not append custom-banner and the distro description from posts 3 and 4, so it is still the default).

If yours does not get an ip automatically, you can run the command

```bash
dhcpcd eth0
```

## 2. Internet connection and SSH

### 2.1 Test the Internet

Simply ping google

```bash
ping -c 4 google.com
```

![](/uploads/2025/07/image-14.png)

So we can ping google.com --> the Internet connection works

Everything looks ok, on to SSH

### 2.3 SSH from the laptop command line

```bash
ssh root@192.168.0.102
```

![](/uploads/2025/07/image-16.png)

### 2.4 Connecting from Visual Studio Code on the laptop

#### 2.4.1 Install the extension and test

We need to install the extension from Microsoft

![](/uploads/2025/07/image-17.png)

After installing, click the "><" button in the bottom left corner

Choose SSH --> Connect to Host --> Add new SSH Host, then enter

```bash
ssh root@192.168.0.102
```

Save, then go to SSH --> Connect to Host again; now the device appears here

![](/uploads/2025/07/image-18.png)

Enter the password and wait for VS Code Server to download to the board the first time, about 1 minute

However, VS Code has trouble opening the SSH session for the user interface because our image is missing packages VS Code needs

You can click Diagnose with Copilot to find out what to do next, or More Actions to look at the error Output log in more detail.

![](/uploads/2025/07/image-20.png)

--> So we need to add the packages **bash, tar, xz, procps, coreutils, curl**.

#### 2.4.2 Install more packages and test again

![](/uploads/2025/07/image-22.png)

Note: every time you ssh after rebuilding the image, the beaglebone regenerates its ssh key at boot, so on the laptop side I also have to delete the old key in `.ssh/know_host` and accept the new one

![](/uploads/2025/07/image-21.png)

This time VS Code shows a new error

![](/uploads/2025/07/image-24.png)

We have to install `libgcc`, `libstdc++`, `libatomic` as well. In the end our IMAGE_INSTALL:append is

![](/uploads/2025/07/image-27.png)

Now build and flash the sd card again. We connect successfully

![](/uploads/2025/07/image-26.png)

--> However, Ethernet is only convenient when you sit near the router; taking the board somewhere means carrying a cable too, which is inconvenient.

***--> In the next post I will show you how to install a USB wifi driver for the Beaglebone Black, still with a Yocto build***

{{< youtube acngfYNlXYo >}}
