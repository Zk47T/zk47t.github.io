---
title: '[Yocto-BBB] 3. Adding a password for the user'
date: '2025-07-12T09:38:00+07:00'
lastmod: '2026-06-19T14:05:04+07:00'
slug: yocto-bbb-3-them-mat-khau-cho-user
url: /en/2025/07/12/yocto-bbb-3-them-mat-khau-cho-user/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 3
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: 'Creating the meta-bbb layer and a core-image-minimal.bbappend that inherits extrausers and sets a hashed root password with EXTRA_USERS_PARAMS.'
wp_id: 284
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
In the previous 2 posts we did not set a password for the root user. In this post I add a password (since there is no sudo, I add it for root :v)

(If you run into difficulties following the blog, you can refer to my hands-on video at the end of the post)

## 1. Documentation from the Yocto Reference Manual

According to the [Yocto Reference Manual](https://docs.yoctoproject.org/1.8/ref-manual/ref-manual.html), section 7.38

![](/uploads/2025/06/image-1-2.png)

We can use usermod and useradd in the EXTRA_USER_PARAMS variable to add users or set a password for a user.

To do this we need to inherit the extrausers class. We are currently building core-image-minimal, so we need to create a bbappend for that very recipe

## 2. Create core-image-minimal.bbappend

First we need to know where core-image-minimal.bb is, so we can create the right folder structure

![](/uploads/2025/06/image-11.png)

Typing in the search bar we get meta/recipes-core/images

As described in the previous post about bitbake append, we need to create our own meta-layer so it is easy to change and override the original bitbake recipes when needed; here it is for the beaglebone black board, so I create meta-bbb

### 2.1 Create the meta-bbb meta layer

```bash
bitbake-layers create-layers meta-bbb
bitbake-layers add-layers meta-bbb
```

- create-layer creates a layer from a template, with a structure like the following

![](/uploads/2025/06/image-12.png)

- add-layer adds the newly created layer to the bblayers.conf file

### 2.2 Create recipes-core and add core-image-minimal

After meta-bbb is created successfully, we create the recipes-core/image folder with the following structure

```bash
zk47@zk47-ltu:~/Learning/poky/meta-bbb/recipes-core$ tree
.
├── images
│ └── core-image-minimal.bbappend
```

The content of core-image-minimal.bbappend matches the description in the Reference Manual

```bash
# User "root" has password set to "test" in the image.
# printf "%q" $(mkpasswd -m sha256crypt test)
# \$5\$1ywTDE4jLgPDskTp\$yK5Ap.2xjc5gYeFQ4MGvR6C0VzA4VDSMIFkQ5.TJO84
inherit extrausers
PASSWD = "\$5\$y9Aeg5ctwntRHo/g\$CAKtoTfQg7VPGfVAMGo5ZG/0GJLn3AD0JdoQ.i0dDFC"
EXTRA_USERS_PARAMS = "\
    usermod -p '${PASSWD}' root; \
    "
```

Here I don't set the password directly; I hash it with sha256 first (User: root, Password: test)

I pushed this meta-bbb to github <https://github.com/Zk47T/meta-bbb>, you can have a look; after cloning, remember to add it to bblayers.conf

```bash
bitbake-layers add-layers ../meta-bbb
```

The content of bblayers.conf is as follows

```bash
# POKY_BBLAYERS_CONF_VERSION is increased each time build/conf/bblayers.conf
# changes incompatibly
POKY_BBLAYERS_CONF_VERSION = "2"
BBPATH = "${TOPDIR}"
BBFILES ?= ""
BBLAYERS ?= " \
  /home/zk47/Learning/poky/meta \
  /home/zk47/Learning/poky/meta-yocto-bsp \
  /home/zk47/Learning/poky/meta-openembedded/meta-oe \
  /home/zk47/Learning/poky/meta-arm/meta-arm-toolchain \
  /home/zk47/Learning/poky/meta-arm/meta-arm \
  /home/zk47/Learning/poky/meta-ti/meta-ti-bsp \
  /home/zk47/Learning/poky/meta-ti/meta-ti-extras \
  /home/zk47/Learning/poky/meta-bbb \
"
```

#### 2.3 Rebuild and connect over UART

Note that whenever you change a recipe through a bbappend, or change a bb file, you should cleansstate it before building. This deletes its build output in build-bbb

```bash
bitbake -c cleansstate core-image-minimal
bitbake core-image-minimal
```

![](/uploads/2025/06/image-2-1.png)

So the setup succeeded

--> However, one thing I don't find pretty is the Poky (Yocto Project Reference Distro) text it shows. I want to change that next.

***--> Look out for post 4, where I change the Distro Description as well as the Banner to make the login screen nicer, similar to the following Orange Pi example***

![](/uploads/2025/06/image-3-1.png)

{{< youtube hDr0zcNRDq8 >}}
