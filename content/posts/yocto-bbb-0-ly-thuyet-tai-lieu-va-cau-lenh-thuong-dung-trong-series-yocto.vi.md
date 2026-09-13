---
title: '[Yocto-BBB] 0. Lý thuyết, Tài liệu, và câu lệnh thường dùng trong Series Yocto'
date: '2025-06-27T09:26:00+07:00'
lastmod: '2025-10-20T18:14:18+07:00'
slug: yocto-bbb-0-ly-thuyet-tai-lieu-va-cau-lenh-thuong-dung-trong-series-yocto
url: /2025/06/27/yocto-bbb-0-ly-thuyet-tai-lieu-va-cau-lenh-thuong-dung-trong-series-yocto/
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
description: Khi thực hành theo các bài trong series, có những câu lệnh mình thường dùng, có 1 số lý thuyết có thể dễ quên, và 1 số tài liệu phụ. Ở bài này mình sẽ tổng h…
wp_id: 869
---

Khi thực hành theo các bài trong series, có những câu lệnh mình thường dùng, có 1 số lý thuyết có thể dễ quên, và 1 số tài liệu phụ. Ở bài này mình sẽ tổng hợp lại để cho các bạn dễ theo dõi, làm theo hơn .

## 1. Lý thuyết

{{% details title="Yocto Project là gì ?" closed="true" %}}

```bash
Dự án mã nguồn mở giúp build hệ điều hành Linux tùy chỉnh cho thiết bị nhúng.
```

{{% /details %}}

{{% details title="Poky là gì ?" closed="true" %}}

```bash
Reference distribution của Yocto Project.
Nó không phải là một Linux distro cho người dùng cuối
Mà là bộ “demo + template”: gồm BitBake, metadata cơ bản (recipes, classes, conf)
và các layer chuẩn (meta, meta-poky, meta-yocto-bsp).
```

{{% /details %}}

{{% details title="Open Embedded là gì ?" closed="true" %}}

```bash
Framework nền tảng của Yocto, cung cấp metadata, recipes và công cụ để build Linux
```

{{% /details %}}

{{% details title="Bitbake là gì ?" closed="true" %}}

```bash
Công cụ build chính của Yocto (giống make), đọc recipe và thực thi các bước build.
```

{{% /details %}}

{{% details title="Recipes là gì ?" closed="true" %}}

```bash
File mô tả cách fetch, compile, cài đặt gói phần mềm (giống công thức build).
```

{{% /details %}}

{{% details title="Layer là gì ?" closed="true" %}}

```bash
Tập hợp recipes, config, class… để tổ chức và mở rộng build (vd: meta-oe, meta-bbb).
```

{{% /details %}}

{{% details title="File .bb, .bbappend, .bbclass" closed="true" %}}

```bash
.bb: recipe chính.

.bbappend: file bổ sung/ghi đè recipe gốc mà không cần sửa trực tiếp.

.bbclass: File tái sử dụng logic chung cho nhiều recipes
```

{{% /details %}}

## 2. Tài liệu

1. Reference Manual Beaglebone Black : <https://www.ti.com/lit/ug/spruh73q/spruh73q.pdf?ts=1757666524292&ref_url=https%253A%252F%252Fwww.google.com%252F>
2. Yocto Project Reference Manual: <https://docs.yoctoproject.org/ref-manual/index.html>

## 3. Câu lệnh thường dùng

### 3.1 Yocto command

```bash
source poky/oe-init-build-end
#Khởi tạo môi trường build, add bitbake vào PATH
```

```bash
bitbake
# build
```

```bash
bitbake -c
# build  từ đầu cho đến hết
```

```bash
bitbake -e  | grep ^
# lấy được các biến môi trường (env) của recipes
# grep dòng bắt đầu bởi
```

```bash
bitbake-layers show-recipes
# Hiển thị địa chỉ toàn bộ recipes (file .bb) đang để tại meta-layer nào
# Nếu chỉ đích danh  thì chỉ hiện meta-layer chứa nó
bitbake-layers show-recipes
```

```bash
bitbake-layers show-appends
# Tương tự với câu lệnh trên nhưng sẽ hiển thị địa chỉ file append (bbapend)
```

```bash
bitbake-layers show-layers
# Hiển thị toàn bộ layers trong /conf/bbalyers.conf với Priority
```

```bash
bitbake-layers create-layer
# Tạo layer mới
```

```bash
bitbake-layers add-layer
# add layer tới bblayers.conf
```

```bash
oe-pkgdata-util lookup-recipe kernel
# Tim recipes kernel để các bạn có thể tạo file append
```

```bash
bitbake -c menuconfig virtual/kernel
# Bật menuconfig sửa kernel build config
```

### 3.2 Linux command

```bash
lsblk
# list block, dùng để check địa chỉ thẻ nhớ
# ví dụ như /dev/sda, /dev/sdb, /dev/mmcblk0
```

```bash
bmaptool copy .wic.xz
# Flash thẻ nhớ với image, ví dụ như
bmaptool copy core-image-minimal-beaglebone.wic.xz /dev/mmcblk0
```

```bash
find . -name
# dùng để tìm kiếm đệ quy bắt đầu từ folder hiện tại tìm file-name
```

```bash
df -h
# disk filesystem
# -h : Human readable, đổi sang hệ Gb, Mb, Kb cho ngừời dễ đọc
```

```bash
free -h
# check dung lượng memory (RAM)
```
