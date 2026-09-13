---
title: '[Yocto-BBB] 9. Sử dụng devtool, tạo patch và cách cài file IPK'
date: '2025-08-23T08:52:00+07:00'
lastmod: '2025-12-09T20:54:44+07:00'
slug: yocto-bbb-9-su-dung-devtool-tao-patch-va-file-ipk
url: /2025/08/23/yocto-bbb-9-su-dung-devtool-tao-patch-va-file-ipk/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 9
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Ở bài 5 về thêm driver cho USB wifi mình đã từng hướng dẫn các bạn cách tạo recipes thủ công để lấy code từ git về build. ở bài 8 vừa rồi, mình cũng có để co…
wp_id: 636
---

Ở bài 5 về thêm driver cho **USB wifi** mình đã từng hướng dẫn các bạn cách tạo `recipes` thủ công để lấy code từ git về build. ở bài 8 vừa rồi, mình cũng có để code `main.c` xử lý i2c trên git, tuy nhiên khi copy về board ta sẽ phải sửa lại `I2C_DEV` và `I2C_ADDR` cho đúng.

(Nếu các bạn gặp khó khăn trong quá trình thực hành theo blog, các bạn có thể tham khảo video thực hành của mình ở cuối bài )

Ở bài này mình sẽ hướng dẫn các bạn tương tác với source code git đã có sẵn recipes và cả tạo mới recipes sử dụng các command như **devtool modify, devtool add, devtool finish**. Sau đó mình sẽ hướng dẫn thêm về tạo patch

## 1. Sử dụng devtool

### 1.1 Devtool tạo recipes mới

Giờ ta có code trên git là <https://github.com/Zk47T/ssd1306> ta muốn tạo `recipes` lấy code này về.

Ta sẽ sử dụng command của `devtool` (mình hay nhớ là developement tool).

```bash
devtool add ssd1306 https://github.com/Zk47T/ssd1306.git --srcbranch main
```

Việc này sẽ tạo recipes `ssd1306`, source từ git, với branch main trong `workspace` tại thư mục `build-bbb`

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb/workspace$ tree
.
├── appends
│   └── ssd1306_git.bbappend
├── conf
│   └── layer.conf
├── README
├── recipes
│   └── ssd1306
│       └── ssd1306_git.bb
└── sources
    └── ssd1306
        ├── README.md
        └── src
            └── main.c

7 directories, 6 files
```

Mình sẽ đi vào từng file này có ý nghĩa như nào ở mục `devtool modify` sau bởi ý nghĩa của folder `workspace` này là giống nhau.

Và rồi tạm thời mình sẽ không thay đổi gì. Finish luôn

```bash
devtool finish ssd1306 ../meta-bbb/recipes-display/ssd1306
```

Việc này sẽ copy `ssd1306` `recipes` tới folder mục tiêu kia

```bash
├── recipes-display
│   └── ssd1306
│       └── ssd1306_git.bb
```

Vậy là đã xong bước add 1 recipes mới lấy source từ git.

### 1.2 Devtool sửa lại sửa code từ git

#### 1.2.1 Bitbake thông thường

Bây giờ mình đã có recipes rồi cho cả `SSD1306` và **USB Wifi Driver**

Nếu bình thường bạn bitbake luôn thì bitbake thông thường sẽ chạy 1 số task chính lần lượt như sau

- `do_fetch` : fetch code từ git về
- `do_unpack` : giải nén source code ra thư mục `tại biến $S`
- `do_patch` : áp dụng các bản vá (`.patch`) từ recipe hoặc layer
- `do_compile` : biên dịch source
- `do_install` : cài đặt file output vào thư mục giả lập rootfs
- `do_package` : đóng gói các file đã cài đặt thành các gói `.ipk`, `.deb`, hoặc `.rpm` tuỳ distro

Và rồi output sẽ ở đây

```bash
/build-bbb/tmp/work/armv7at2hf-neon-poky-linux-gnueabi/ssd1306/1.0+gitAUTOINC+b1397ef7ec-r0/git
```

Nếu các bạn muốn thấy rõ hơn lần lượt từng task làm gì thì có thể chạy như sau để theo dõi sự thay đổi

```bash
bitbake -c
bitbake -c fetch ssd1306
```

Tuy nhiên thì không nên thay đổi code từ git trong tmp, bởi tmp mà temporary thôi. Muốn nhanh ta sẽ vẫn dùng tạm dừng ở do_patch rồi sửa rồi `do_package` cũng ok nhưng không ai làm thế cả :v

#### 1.2.2 Devtool modify

Cách hiệu quả để build package có sự thay đổi trong source code mà code lại nằm trên git đó là ta dùng `devtool modify`

```bash
devtool modify ssd1306
```

Sau đó ta sẽ làm việc trong `build-bbb/workspace`, thay đổi tùy ý, rồi bitbake để build.

Nhưng các bạn có thắc mắc là tại sao với lần này thì khi build bitbake không lấy source từ git mà lại lấy source từ `workspace` không ?

Ta đi vào từng file trong thư mục workspace

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb/workspace$ tree
.
├── appends
│   └── ssd1306_git.bbappend
├── conf
│   └── layer.conf
├── README
├── recipes
│   └── ssd1306
│       └── ssd1306_git.bb
└── sources
    └── ssd1306
        ├── README.md
        └── src
            └── main.c

7 directories, 6 files
```

{{% details title="appends/ssd1306_git.bbappend" closed="true" %}}

```bash
FILESEXTRAPATHS:prepend := "${THISDIR}/${PN}:"
FILESPATH:prepend := "/home/zk47/Learning/yocto-bbb/build-bbb/workspace/sources/ssd1306/oe-local-files:"
# srctreebase: /home/zk47/Learning/yocto-bbb/build-bbb/workspace/sources/ssd1306

inherit externalsrc
# NOTE: We use pn- overrides here to avoid affecting multiple variants in the case where the recipe uses BBCLASSEXTEND
EXTERNALSRC:pn-ssd1306 = "/home/zk47/Learning/yocto-bbb/build-bbb/workspace/sources/ssd1306"
EXTERNALSRC_BUILD:pn-ssd1306 = "/home/zk47/Learning/yocto-bbb/build-bbb/workspace/sources/ssd1306"

# initial_rev: b1397ef7ec704d8631b73b2c0521f9c804954d3a
```

Cái lưu ý nhất ở đây là ta thấy set 2 macro

`EXTERNALSRC` và `EXTERNALSRC_BUILD` : mang ý nghĩa là giờ build thì sẽ lấy từ external source chứ không phải từ git nữa.

Devtool sẽ lần lượt `do_fetch`, `do_unpack`, `do_patch`, `do_configure` tại thư mục `workspace` này, code từ git giờ đã ở `workspace`.

Branch main sẽ trở thành branch devtool sau khi đã apply patch đầy đủ.

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb/workspace/sources/ssd1306$ git branch
* devtool
  main
```

{{% /details %}}

{{% details title="conf/layer.conf" closed="true" %}}

```bash
# ### workspace layer auto-generated by devtool ###
BBPATH =. "${LAYERDIR}:"
BBFILES += "${LAYERDIR}/recipes/*/*.bb \
            ${LAYERDIR}/appends/*.bbappend"
BBFILE_COLLECTIONS += "workspacelayer"
BBFILE_PATTERN_workspacelayer = "^${LAYERDIR}/"
BBFILE_PATTERN_IGNORE_EMPTY_workspacelayer = "1"
BBFILE_PRIORITY_workspacelayer = "99"
LAYERSERIES_COMPAT_workspacelayer = "${LAYERSERIES_COMPAT_core}"
```

Lưu ý nhất ở đây là dòng

```bash
BBFILE_PRIORITY_workspacelayer = "99"
```

Việc này có nghĩa là workspace là layer có priority cao nhất, có khả năng ghi đè toàn bộ các layer thấp hơn.

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb$ bitbake-layers show-layers
NOTE: Starting bitbake server...
WARNING: Layer meta-bbb should set LAYERSERIES_COMPAT_meta-bbb in its conf/layer.conf file to list the core layer names it is compatible with.
layer                 path                                      priority
==========================================================================
meta                  /home/zk47/Learning/yocto-bbb/poky/meta   5
meta-poky             /home/zk47/Learning/yocto-bbb/poky/meta-poky  5
meta-yocto-bsp        /home/zk47/Learning/yocto-bbb/poky/meta-yocto-bsp  5
meta-oe               /home/zk47/Learning/yocto-bbb/meta-openembedded/meta-oe  5
meta-arm-toolchain    /home/zk47/Learning/yocto-bbb/meta-arm/meta-arm-toolchain  5
meta-arm              /home/zk47/Learning/yocto-bbb/meta-arm/meta-arm  5
meta-ti-bsp           /home/zk47/Learning/yocto-bbb/meta-ti/meta-ti-bsp  6
meta-ti-extras        /home/zk47/Learning/yocto-bbb/meta-ti/meta-ti-extras  6
meta-bbb              /home/zk47/Learning/yocto-bbb/meta-bbb    15
workspace             /home/zk47/Learning/yocto-bbb/build-bbb/workspace  99
```

{{% /details %}}

`--->` **Vậy khi chạy devtool modify ta sẽ thấy các tác dụng chính sau:**

- Kéo code từ git về local, đưa nó vào workspace
- Tạo `workspace` layer với `priority` cao nhất, add vào `build-bbb/bbblayers.conf`
- Set source giờ là `EXTERNALSRC` không còn dính dáng gì đến git nữa

Vậy là nếu các bạn đã sử dụng `devtool` thì các thay đổi trong layer hay git liên quan đến code không còn ý nghĩa nữa bởi ta đã cho nó thành local rồi :vv

## 2. Tạo patch

Việc tạo `patch` này sẽ có ích chính khi bạn tương tác với 1 `recipes` code lấy từ git mà git đó bạn không có quyền `commit`, hoặc đơn giản là đang chờ `merge`.

### 2.1 Tạo môi trường sạch :v

Thông thường khi tạo patch thì mình không hay dùng trong workspace nữa, nên mình sẽ xóa `ssd1306` trong `workspace` đi.

Mình sẽ xóa các folder và file sau

```bash
/build-bbb/workspace/sources/ssd1306
/build-bbb/workspace/appends/ssd1306_git.bbappend
```

Mình không biết cách này chính quy không nhưng mình thường làm thế nếu muốn tương tác với code trên git thay vì trên local.

Hoặc các bạn xóa thư mục `workspace` rồi xóa `workspace` layer trong `/build-bbb/conf/bblayers.conf`

Rồi mình sẽ clean và build lại để có folder git trong build-bbb

```bash
bitbake -c cleanall ssd1306
bitbake ssd1306
```

### 2.2 Thay đổi và tạo patch

Mở git folder và check branch

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb/tmp/work/armv7at2hf-neon-poky-linux-gnueabi/ssd1306/1.0+gitAUTOINC+b1397ef7ec-r0/git$ git branch
* main
```

Thay đổi code main.c, Như ở bài trước thì mình có lưu ý việc `I2C_ADDR` và `I2C_DEV` có thể khác nhau và đúng vậy. Code gốc mình chạy cho `STM32MP157` nên với **Beaglebone Black** khác nhau duy nhất 1 cái nhỏ là BBB dùng `i2c-2`

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb/tmp/work/armv7at2hf-neon-poky-linux-gnueabi/ssd1306/1.0+gitAUTOINC+b1397ef7ec-r0/git$ git diff src/main.c
diff --git a/src/main.c b/src/main.c
index 5e1136d..628dc29 100644
--- a/src/main.c
+++ b/src/main.c
@@ -8,7 +8,7 @@
 #include

 #define I2C_ADDR 0x3C
-#define I2C_DEV "/dev/i2c-1"
+#define I2C_DEV "/dev/i2c-2"

 int i2c_fd;
```

Sau khi sửa code, các bạn commit và tạo patch

```bash
git add src/main.c
git commit -m "ssd1306-bbb"
git format-patch HEAD~1
```

Thế là nó sẽ tạo ra patch với name lấy từ commit message, patch lấy từ HEAD-1 --> HEAD : `0001-ssd1306-bbb.patch`

```bash
zk47@ltu:~/Learning/yocto-bbb/build-bbb/tmp/work/armv7at2hf-neon-poky-linux-gnueabi/ssd1306$ tree
.
└── 1.0+gitAUTOINC+b1397ef7ec-r0
    ├── git
    │   ├── 0001-ssd1306-bbb.patch
    │   ├── README.md
    │   └── src
    │       └── main.c
```

#### 2.3 Sửa recipes để build có apply patch

Copy `0001-ssd1306-bbb.patch` tới `meta-bbb/recipes-display/ssd1306/ssd1306`

```bash
meta-bbb/recipes-display/ssd1306$ tree
.
├── ssd1306
│   └── 0001-ssd1306-bbb.patch
└── ssd1306_git.bb
```

Ta sửa nội dung file `ssd1306_git.bb` như sau rồi build thôi

```bash
LICENSE = "CLOSED"
LIC_FILES_CHKSUM = ""

FILESEXTRAPATHS:prepend := "${THISDIR}/${PN}:"

SRC_URI = "git://github.com/Zk47T/ssd1306.git;protocol=https;branch=main \
           file://0001-ssd1306-bbb.patch"

PV = "1.0+git${SRCPV}"
SRCREV = "b1397ef7ec704d8631b73b2c0521f9c804954d3a"

S = "${WORKDIR}/git"

do_compile() {
    ${CC} ${LDFLAGS} ${S}/src/main.c -o ssd1306
}

do_install() {
    install -d ${D}${bindir}
    install -m 0755 ssd1306 ${D}${bindir}/ssd1306
}
```

`do_compile` và `do_install` thì không khác gì việc bạn làm các hành vi sau trên board cả

```bash
gcc main.c -o ssd1306
cp ssd1306 /usr/bin
chmod 0755 /usr/bin/ssd1306
```

Đây là output

![](/uploads/2025/07/image-53.png)

- `patches` 0001 đã được copy vào git directory
- `main.c` đã được apply patch
- thư mục image đã xuất hiện `/usr/bin/ssd1306`

## 3. Sử dụng file IPK

Với các bài trước để có thể add package này vào image, thì bạn chỉ việc thêm `ssd1306` vào `IMAGE_INSTALL:append`. Tuy nhiên giả dụ mình build xong muốn test trên 1 board đã được flash rồi thì sao ?

Đó là lúc ta sử dụng file `IPK`. Các bạn dùng android từng nghe thấy file `apk` thì cái này cũng tương tự

### 3.1 Add thêm package opkg

Để cài được `IPK` ta cần add thêm package `opkg` vào board.

Nếu các bạn dùng ubuntu thì cũng quen với việc sử dụng `dpkg` để cài file `.deb` vậy. Ở đây tương tự thế. `IPK` là **internet package**, còn `opkg` là **package manager**

Build lại image rồi flash vào board

### 3.2 Copy và cài đặt ipk vào board

Ta thấy bức ảnh ở trên có deploy-ipks, các bạn copy cái ipk đầu tiên vào board. `ssd1306_1.0+git0+b1397ef7ec-r0_armv7at2hf-neon.ipk` Tiện nhất thì sẽ dùng `scp`

Mình vẫn chưa để mặc định nên mỗi lần khởi động lên đều phải kết nối mạng lại

```bash
ip link set wlan0 up
wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant.conf
dhcpcd wlan0
```

Rồi `scp` để copy file đến board

```bash
zk47@ltu:~$ scp ssd1306_1.0+git0+b1397ef7ec-r0_armv7at2hf-neon.ipk root@172.20.10.3:~/
root@172.20.10.3's password:
ssd1306_1.0+git0+b1397ef7ec-r0_armv7at2hf-neo 100% 2946   423.5KB/s   00:00
```

Giờ thì cài `IPK` thôi

```bash
mount -o rw,remount /
opkg install --force-reinstall --force-depends ssd1306_1.0+git0+b1397ef7ec-r0_armv7at2hf-neon.ipk
```

- Thông thường trên board sẽ để `read-only` nên mình ở đây `mount` lại với quyền `read-write`
- `--force-reinstall` : nếu trên board từng có package này rồi thì mình phải force reinstall thì nó mới cài lại
- `--force-depends`: bỏ qua việc depends, ban đầu mình gặp lỗi mismatch `glib` version, nhưng code mình có gì đâu nên chênh lib không quan trọng :vv

Giờ bạn check trong `/usr/bin` là sẽ có ssd1306, và ta hoàn toàn có thể chạy trực tiếp từ bắt kỳ đâu

```bash
root@beaglebone:~# ls -l /usr/bin/ssd1306
-rwxr-xr-x 1 root root 5916 Jul 17  2025 /usr/bin/ssd1306
root@beaglebone:~# ssd1306
root@beaglebone:~#
```

Bài này mình viết khá dài vì mình muốn cái thực hành này xuyên suốt. Nếu có sai sót gì mong được các bạn đọc đóng góp.

**Ở bài tiếp theo mình sẽ thêm support cho Boot từ eMMC**

{{< youtube EQOzIyOo1_c >}}
