---
title: '[Yocto-BBB] 0. Theory, documents, and common commands in the Yocto series'
date: '2025-06-27T09:26:00+07:00'
lastmod: '2025-10-20T18:14:18+07:00'
slug: yocto-bbb-0-ly-thuyet-tai-lieu-va-cau-lenh-thuong-dung-trong-series-yocto
url: /en/2025/06/27/yocto-bbb-0-ly-thuyet-tai-lieu-va-cau-lenh-thuong-dung-trong-series-yocto/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 0
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: 'A cheat sheet for the Yocto-BBB series: what Yocto, Poky, OpenEmbedded, BitBake, recipes and layers are, reference documents, and the Yocto and Linux commands used most often.'
wp_id: 869
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
When following the posts in the series, there are commands I use often, some theory that is easy to forget, and some extra documents. In this post I gather them together so it is easier for you to follow along.

## 1. Theory

{{% details title="What is the Yocto Project?" closed="true" %}}

```bash
Open-source project for building custom Linux operating systems for embedded devices.
```

{{% /details %}}

{{% details title="What is Poky?" closed="true" %}}

```bash
Reference distribution of the Yocto Project.
It is not a Linux distro for end users
but a "demo + template" kit: BitBake, basic metadata (recipes, classes, conf)
and the standard layers (meta, meta-poky, meta-yocto-bsp).
```

{{% /details %}}

{{% details title="What is OpenEmbedded?" closed="true" %}}

```bash
The foundation framework of Yocto, providing the metadata, recipes and tools to build Linux
```

{{% /details %}}

{{% details title="What is Bitbake?" closed="true" %}}

```bash
Yocto's main build tool (like make): reads recipes and runs the build steps.
```

{{% /details %}}

{{% details title="What are Recipes?" closed="true" %}}

```bash
A file describing how to fetch, compile and install a software package (like a build recipe).
```

{{% /details %}}

{{% details title="What is a Layer?" closed="true" %}}

```bash
A collection of recipes, configs, classes… to organise and extend the build (e.g. meta-oe, meta-bbb).
```

{{% /details %}}

{{% details title=".bb, .bbappend, .bbclass files" closed="true" %}}

```bash
.bb: the main recipe.

.bbappend: a file that adds to/overrides the original recipe without editing it directly.

.bbclass: a file for logic shared by many recipes
```

{{% /details %}}

## 2. Documents

1. Beaglebone Black Reference Manual: <https://www.ti.com/lit/ug/spruh73q/spruh73q.pdf?ts=1757666524292&ref_url=https%253A%252F%252Fwww.google.com%252F>
2. Yocto Project Reference Manual: <https://docs.yoctoproject.org/ref-manual/index.html>

## 3. Common commands

### 3.1 Yocto commands

```bash
source poky/oe-init-build-end
#Initialise the build environment, add bitbake to PATH
```

```bash
bitbake
# build
```

```bash
bitbake -c
# build  from start to finish
```

```bash
bitbake -e  | grep ^
# get the environment variables (env) of recipes
# grep lines starting with
```

```bash
bitbake-layers show-recipes
# Show where every recipe (.bb file) lives, i.e. in which meta-layer
# If you name  explicitly, only the meta-layer containing it is shown
bitbake-layers show-recipes
```

```bash
bitbake-layers show-appends
# Same as the command above but shows the paths of append files (bbappend)
```

```bash
bitbake-layers show-layers
# Show every layer in /conf/bbalyers.conf with its Priority
```

```bash
bitbake-layers create-layer
# Create a new layer
```

```bash
bitbake-layers add-layer
# add a layer to bblayers.conf
```

```bash
oe-pkgdata-util lookup-recipe kernel
# Find the kernel recipe so you can create an append file
```

```bash
bitbake -c menuconfig virtual/kernel
# Open menuconfig to change the kernel build config
```

### 3.2 Linux commands

```bash
lsblk
# list block devices, used to find the SD card device
# for example /dev/sda, /dev/sdb, /dev/mmcblk0
```

```bash
bmaptool copy .wic.xz
# Flash the SD card with the image, for example
bmaptool copy core-image-minimal-beaglebone.wic.xz /dev/mmcblk0
```

```bash
find . -name
# recursive search from the current folder for file-name
```

```bash
df -h
# disk filesystem
# -h : Human readable, shows Gb, Mb, Kb so it is easier to read
```

```bash
free -h
# check memory (RAM) usage
```
