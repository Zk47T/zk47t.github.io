---
title: '[Yocto-Lichee] 0. Building Yocto Zeus for the Lichee Pi Nano'
date: '2026-05-16T06:02:00+07:00'
lastmod: '2026-05-08T13:37:21+07:00'
slug: yocto-lichee-0-build-yocto-zeus-cho-board-lichee-pi-nano
url: /en/2026/05/16/yocto-lichee-0-build-yocto-zeus-cho-board-lichee-pi-nano/
categories:
- LicheePi
- Yocto
tags:
- Lichee
- Linux
- Yocto
series:
- Yocto-Lichee
series_order: 0
boards:
- LicheePi Nano
image: /uploads/2026/05/screenshot-from-2026-04-14-22-10-05.png
description: 'Building fanning''s Yocto Zeus (3.0) BSP for the LicheePi Nano today: an Ubuntu 20.04 Docker build environment, a fixed fork of meta-f1c100s, then flashing the sunxi-sdimg to an SD card.'
wp_id: 2271
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
I have decided to use the Lichee Pi Nano as the cheap board for the upcoming Device Driver series. I found a [guide from fanning (ninhnn2)](https://fanning.vn/study_yocto/build_nano_yocto_licheepi_nano.html) showing how to build for this board with Yocto Zeus (3.0), from 6 years ago. Many thanks to him for creating the BSP meta layer for it; the hardest part is already done !!

I tried following it right away and quite a lot of things failed. So this post updates the things I fixed so that, first of all, the image builds. In the next post I will move up to Yocto Scarthgap for the board. So if you want something much simpler, wait for my Yocto-Lichee 1 post

## 1. Preparing the host machine

There is one big problem: my machine runs Ubuntu 22.04; building Yocto 5.0 is fine, but switching to Yocto 3.0 fails in a huge number of ways (missing headers, symbol changes in glib and other packages).

Since I use 22.04, I have to build with an Ubuntu 20.04 Docker image instead (if you use Ubuntu 24.04 you almost certainly should use Docker, since 24.04 adds a lot of security that makes building very hard). If you already use Ubuntu 20.04, things are much simpler: just install the packages and follow the same steps

Create the docker file

{{% details title="Dockerfile" closed="true" %}}

```bash
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=en_US.UTF-8

# Yocto Zeus build dependencies
RUN apt-get update && apt-get install -y \
    gawk wget git diffstat unzip texinfo \
    gcc g++ build-essential chrpath socat cpio \
    python3 python3-pip python3-pexpect python3-git python3-jinja2 \
    python3-dev python3-setuptools swig \
    python2 python2-dev \
    libtool autoconf automake \
    xz-utils debianutils iputils-ping \
    libsdl1.2-dev xterm \
    file lz4 zstd \
    locales sudo \
    && rm -rf /var/lib/apt/lists/*

# Locale setup (required by bitbake)
RUN locale-gen en_US.UTF-8
# u-boot 2018.01 uses Python 2 — python2-dev provides the headers for pylibfdt

# Create non-root user (bitbake refuses to run as root)
RUN useradd -m -s /bin/bash builder && \
    echo "builder ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER builder
WORKDIR /home/builder

CMD ["/bin/bash"]
```

{{% /details %}}

If you don't have docker yet, follow the [guide from Docker itself](https://docs.docker.com/engine/install/ubuntu/)

{{% details title="How to install Docker" closed="true" %}}

```bash
# Add the Docker GPG key + repository
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update

# Install Docker
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Let the user run docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker run hello-world
```

{{% /details %}}

If you use a real 20.04 machine, install the following packages and configure the locale

```bash
sudo apt-get update && sudo apt-get install -y \
    gawk wget git diffstat unzip texinfo \
    gcc g++ build-essential chrpath socat cpio \
    python3 python3-pip python3-pexpect python3-git python3-jinja2 \
    python3-dev python3-setuptools swig \
    python2 python2-dev \
    libtool autoconf automake \
    xz-utils debianutils iputils-ping \
    libsdl1.2-dev xterm \
    file lz4 zstd \
    locales

sudo locale-gen en_US.UTF-8
export LANG=en_US.UTF-8
```

## 2. Clone the source code and build

We clone the source code one by one; after fixing it I forked meta-f1c100s on my github. I also opened a pull request, but I don't know whether the author will merge it, so here I use my fix to get it working first

```bash
cd ~
mkdir yocto
cd yocto
git clone -b zeus git://git.yoctoproject.org/poky.git
cd poky

# meta layer that supports most tools and libraries needed for a Linux distro
git clone -b zeus https://github.com/openembedded/meta-openembedded.git

# meta layer to compile qt5 and install it into the rom for the LicheePi Nano
git clone -b zeus https://github.com/meta-qt5/meta-qt5.git

# meta layer for the LicheePi Nano board (Linux kernel, u-boot)
git clone -b zeus https://github.com/Zk47T/meta-f1c100s.git
```

If you use a real machine, here we run

```bash
# Initialise the yocto build environment
source oe-init-build-env build-f1c100s

# copy the example configs I prepared
cp ../meta-f1c100s/conf/sample/normal-yocto/bblayers.conf.sample ./conf/bblayers.conf
cp ../meta-f1c100s/conf/sample/normal-yocto/local.conf.sample ./conf/local.conf

bitbake core-image-minimal
```

And that's it; if you are using Docker, we use

```bash
cd ~/yocto/poky

# 1. Build Docker
docker build -t yocto-zeus -f meta-f1c100s/Dockerfile .
# 2. Run the container
docker run -it --name yocto-build -v ~/yocto:/workdir yocto-zeus

# --- TRONG CONTAINER ---
# 3. Init + copy configs + build
cd /workdir/poky
source oe-init-build-env build-f1c100s
cp ../meta-f1c100s/conf/sample/normal-yocto/bblayers.conf.sample ./conf/bblayers.conf
cp ../meta-f1c100s/conf/sample/normal-yocto/local.conf.sample ./conf/local.conf
bitbake core-image-minimal
```

Building the Docker image takes a while to install the packages, and building core-image-minimal is 1608 tasks; consider tuning these 2 settings if your machine is a VM, to avoid running out of RAM

```bash
# BB_NUMBER_THREADS ?= "3"
# PARALLEL_MAKE ?= "-j 3"
```

Mine is a native machine, so I let it run at full speed

## 3. Flash and test the image

After the build, the output is at

```bash
poky/build-f1c100s/tmp-glibc/deploy/images/f1c100s
```

The file we care about is (note the file name: it includes the build date, so my name will differ from yours)

```bash
core-image-minimal-f1c100s-20260414131351.rootfs.sunxi-sdimg.img
```

We flash it to the board with the command

```bash
sudo dd bs=4M if=core-image-minimal-f1c100s-20260414131351.rootfs.sunxi-sdimg.img of=/dev/sdx conv=fsync
```

Remember to umount the partitions on /dev/sdx first

And here is the result

![](/uploads/2026/04/image-29.png)

![](/uploads/2026/04/image-30.png)

Besides building from scratch like this, you can also download the ready-made image from ninhnn2 here <https://fanning.vn/study_licheepinano/markdown.html>

Thanks for reading to the end. Good luck with the hands-on !!
