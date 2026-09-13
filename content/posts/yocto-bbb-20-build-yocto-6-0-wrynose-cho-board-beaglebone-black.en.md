---
title: '[Yocto-BBB] 20. Building Yocto 6.0 Wrynose for the Beaglebone Black'
date: '2026-06-20T06:09:00+07:00'
lastmod: '2026-06-26T10:10:45+07:00'
slug: yocto-bbb-20-build-yocto-6-0-wrynose-cho-board-beaglebone-black
url: /en/2026/06/20/yocto-bbb-20-build-yocto-6-0-wrynose-cho-board-beaglebone-black/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 20
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: 'What changed in Yocto 6.0 Wrynose (no more poky repo, layers cloned side by side, nodistro by default) and the steps to build for MACHINE beaglebone with openembedded-core, meta-ti and meta-arm.'
wp_id: 2541
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
It has been a full year since I posted my first article about building Yocto for the Beaglebone Black. At first I used Kirkstone, then updated to Scarthgap and thought that would last quite a while :vv, but Wrynose brings fairly big structural changes. So I am writing this extra post on how to build with the new version; I think from 6.0 onwards the structure will stay the same.

## 1. Preparing the host machine

```bash
sudo apt install -y gawk wget git diffstat unzip texinfo gcc build-essential \
     chrpath socat cpio python3 python3-pip python3-pexpect xz-utils \
     debianutils iputils-ping python3-git python3-jinja2 python3-subunit \
     zstd liblz4-tool file locales libacl1
sudo locale-gen en_US.UTF-8
```

## 2. Clone the source code

Back when we were learning, most of us cloned poky, the Yocto Project's reference distro, and built around it. In real work, projects always define their own distro. So now poky git is no longer supported; instead there is meta-poky with the poky distro inside. If we want it we select it; otherwise we just take the core openembedded-core and the needed meta layers

```bash
mkdir -p ~/yocto-bbb/layers
cd ~/yocto-bbb/layers
```

We put the cloned meta layers in the layers folder (following the [standard guide from the Yocto Project](https://docs.yoctoproject.org/dev-manual/poky-manual-setup.html#use-git-to-clone-the-layers))

```bash
git clone -b 2.18    https://git.openembedded.org/bitbake
git clone -b wrynose https://git.openembedded.org/openembedded-core
git clone -b wrynose https://git.yoctoproject.org/meta-yocto
```

Add the BSP and extra layers for the Beaglebone Black

```bash
git clone -b wrynose https://git.openembedded.org/meta-openembedded
git clone -b wrynose https://git.yoctoproject.org/meta-arm
git clone -b wrynose https://git.yoctoproject.org/meta-ti
```

## 3. Initialise the environment and build

### 3.1 Initialise the environment

Now oe-init-build-env comes from openembedded-core, not poky, so the default is DISTRO = "nodistro".

```bash
cd ~/yocto-bbb/
source layers/openembedded-core/oe-init-build-env build-bbb
```

This command will

- Set $OEROOT: defines the root folder of yocto
- Set $PATH: adds bitbake to the path of the terminal session, like adding to the environment variables on Windows
- Set $BUILDDIR: selects the output folder ./build-bbb (the default is build, but if you build for several boards it is better to separate them)
- Set $BBPATH: so bitbake can find the layers
- Create the $BUILDDIR folder structure

### 3.2 Edit the conf files

First, add the layers to bblayers.conf

```bash
bitbake-layers add-layer ../layers/meta-yocto/meta-poky
bitbake-layers add-layer ../layers/meta-yocto/meta-yocto-bsp
bitbake-layers add-layer ../layers/meta-openembedded/meta-oe
bitbake-layers add-layer ../layers/meta-arm/meta-arm-toolchain
bitbake-layers add-layer ../layers/meta-arm/meta-arm
bitbake-layers add-layer ../layers/meta-ti/meta-ti-bsp
bitbake-layers add-layer ../layers/meta-ti/meta-ti-extras
bitbake-layers add-layer ../layers/meta-ti/meta-beagle
bitbake-layers show-layers
```

Okay, now open build-bbb/conf/local.conf and add the line MACHINE = "beaglebone", and the config is done

Since I cloned meta-poky above, you can also set DISTRO = "poky" and do the same things as in the old guide.

### 3.3 And build

```bash
bitbake core-image-minimal
```

For flashing and debugging, see the 2 posts [Yocto-BBB 1](/en/2025/06/28/yocto-bbb-1-build-beaglebone-black-image-bang-yocto-project/) and [Yocto-BBB 2](/en/2025/07/05/yocto-bbb-2-uart-debug-board/) !!

Good luck with the hands-on
