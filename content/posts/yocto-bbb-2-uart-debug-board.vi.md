---
title: '[Yocto-BBB] 2. UART Debug Board và Bitbake Append'
date: '2025-07-05T08:04:00+07:00'
lastmod: '2025-12-09T20:50:43+07:00'
slug: yocto-bbb-2-uart-debug-board
url: /2025/07/05/yocto-bbb-2-uart-debug-board/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 2
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Ở bài trước, chúng ta đã build thành công core-minimal-image ở bài này mình sẽ tiếp tục với việc kết nối uart debug và ôn lại về bitbake append
wp_id: 259
---

Ở bài trước, chúng ta đã build thành công core-minimal-image ở bài này mình sẽ tiếp tục với việc kết nối uart debug và ôn lại về bitbake append

(Nếu các bạn gặp khó khăn trong quá trình thực hành theo blog, các bạn có thể tham khảo video thực hành của mình ở cuối bài )

## 1. Kết nối UART debug

### 1.1 Kết nối dây

Beaglebone Black có 1 cổng micro HDMI, ta có thể mua cổng chuyển micro HDMI sang HDMI để cắm với màn hình, tuy nhiên làm thế khi tương tác ta sẽ phải cắm tiếp bàn phím khá bất tiện

Với image ta mới build là core-minimal-image, nó là image tối giản, không có giao diện, tương tác trên CLI (Command Line Interface). Do đó việc cắm qua cổng UART là cách tiếp cận hợp lý hơn.

Ngoài ra việc kết nối qua UART cũng giúp chúng ta các lỗi nếu board ta không lên. Vì nó sẽ hiển thị ra các debug message từ kernel

![](/uploads/2025/06/d0611fbf3e44891ad055.jpg)

UART Bridge là Serial TTL to USB với 2 loại mình thấy thông dụng là CP2102 (bên trái) hoặc PL2303 (bên phải).

![](/uploads/2025/06/image-7.png)

![](/uploads/2025/06/image-9.png)

Ở đây mình dùng loại PL2303. Lưu ý khi cắm dây UART giữa 2 thiết bị thì các bạn phải cắm chéo, TX thiết bị A với RX thiết bị B, RX thiết bị A với TX thiết bị B

### 1.2 Mở cổng trên Ubuntu

Trên ubuntu mình dùng tool screen, nếu máy các bạn chưa có sẵn thì hãy cài bằng cách.

```bash
sudo apt update
sudo apt install screen
```

Sau đó các bạn cắm PL2303 vào, check kết nối bằng lệnh

```bash
zk47@zk47-ltu:~$ lsusb
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 003 Device 008: ID 0bda:1100 Realtek Semiconductor Corp. HID Device
Bus 003 Device 007: ID 067b:2303 Prolific Technology, Inc. PL2303 Serial Port / Mobile Action MA-8910P
```

Ở đây đã nhận driver, các bạn check tiếp trong /dev (devices)

```bash
zk47@zk47-ltu:~$ ls /dev/ttyUSB*
/dev/ttyUSB0
```

Ở đây mình kết nối 1 usb duy nhất, nên nó đang nhận ở USB0. Ta mở cổng để bắt đầu truyền nhận dữ liệu

```bash
sudo screen /dev/ttyUSB0 115200
```

Giờ cấp nguồn, giữ phím S2 là ta sẽ thấy hiển thị ra màn debug message từ board

![](/uploads/2025/06/image-10.png)

Default user sẽ đang là root và không có mật khẩu

## 2. Bitbake append

Bài tới mình sẽ hướng dẫn các bạn cách thay đổi nội dung 1 recipe nên bài này mình sẽ nói qua lý thuyết về bitbake append với ví dụ cụ thể. Cụ thể lý thuyết các bạn có thể đọc ở đây mục 1.3.5 <https://docs.yoctoproject.org/2.5.2/bitbake-user-manual/bitbake-user-manual.html>

### 2.1 Mục tiêu

Bitbake append đúng như tên gọi, sinh ra để append vào các file bitbake gốc. Khi tạo 1 recipes, file chạy sẽ có dạng example1.bb. Nếu chúng ta không muốn sửa recipes gốc vì muốn giữ nguyên code từ upstream, ta sẽ sửa nó thông qua example1.bbappend

Khi học về bitbake append các bạn nên biết thêm khái niệm về Priority của các layer. Bitbake engine sẽ đọc các layer từ thấp lên cao, layer có priority cao có khả năng ghi đè layer có priority thấp hơn.

Việc ghi đè lại thông số hay biến sẽ giúp ta có khả năng tùy biến cao hơn. Ta clone lại 1 meta-layer từ upstream, nhưng ta không muốn ảnh hưởng đến upstream, ta sẽ tạo ra 1 meta-layer riêng rồi chỉnh sửa.

### 2.2 Ví dụ cụ thể

#### 2.2.1 Tạo 3 meta-layer với mức priority khác nhau

```bash
source oe-init-build-env build-bbb
bitbake-layers create-layer ../meta-base
bitbake-layers create-layer ../meta-append1
bitbake-layers create-layer ../meta-append2
```

Mặc định khi chạy xong ta sẽ được cấu trúc thư mục như sau

![](/uploads/2025/07/image-1.png)

Ta add layer mới tạo vào bblayers.conf bằng câu lệnh, việc này sẽ thay đổi build-bbb/conf/bblayers.conf

```bash
bitbake-layers add-layer ../meta-base ../meta-append1 ../meta-append2
```

Để sửa priority ta sửa trong conf/layer.conf của từng folder, mình sẽ để

- meta-base : BBFILE_PRIORITY_meta-base = "6"
- meta-append1 : BBFILE_PRIORITY_meta-append1 = "7"
- meta-append2 : BBFILE_PRIORITY_meta-append2 = "8"

Ta có thể chạy bitbake-layers show-layers để kiểm tra

![](/uploads/2025/07/image-6.png)

Dễ thấy trong 3 meta-layer đều có 1 recipe chung là example_0.1.bb, tuy nhiên 2 meta-append của chúng ta mục đích là append nên ta sẽ sửa đuôi của nó thành bbappend. Kết quả sẽ như sau

![](/uploads/2025/07/image-2.png)

Okay Vậy là ta đã tạo ra được được 2 meta-layer có chứa bbappend cho recipe example với base trong meta-base (***tên recipe sẽ là trước "_", 0.1 là version. Nếu muốn bbappend áp dụng cho mọi version ta cần đặt tên nó là example_%.bbappend***)

#### 2.2.2 Test thử priority

Mình sẽ để nội dung của từng file như sau ("`echo >>`" là command sẽ điền thêm vào cuối của 1 file, không thay đổi nội dung cũ)

```bash
echo 'VARIABLE = "5"' >> ../meta-base/recipes-example/example/example_0.1.bb

echo 'VARIABLE = "6"' >> ../meta-append1/recipes-example/example/example_0.1.bbappend

echo 'VARIABLE = "7"' >> ../meta-append2/recipes-example/example/example_0.1.bbappend
```

Vậy mình sẽ thử chạy xem biến VARIABLE sau cùng sẽ được set bằng mấy ?(Về ý nghĩa bitbake -e mình có giải thích ở [Bài 1 mục 4.1](/2025/06/28/yocto-bbb-1-build-beaglebone-black-image-bang-yocto-project/))

```bash
bitbake example
bitbake -e example | grep "^VARIABLE"
VARIABLE="7"
```

Kết quả đúng như ta mong đợi. Layer meta-append2 có Priority cao nhất sẽ ghi đè tất cả layer yếu hơn. Sẵn đây mình cũng sẽ nói về các toán tử gán biến trong Yocto

#### 2.2.3 Toán tử gán trong Yocto

Các bạn có thể đọc thêm về các toán tử khác tại [Bitbake User Manual](https://docs.yoctoproject.org/bitbake/2.2/bitbake-user-manual/bitbake-user-manual-metadata.html)  mục 3 Syntax and Operators

Mình thì thấy dùng nhiều nhất là các toán tử ":=","??=", "?=", "+="

- `:=` (Immediate variable expansion): Gán giá trị ngay lập tức
- `?=` (Soft assign, Default value) : Nếu không có 1 recipes nào set biến này, thì nó sẽ lấy giá trị sau "?="
  - --> *Tránh việc lỗi nếu biến không có giá trị.*
  - Poky đã cho khá nhiều lựa chọn trong local.conf, ở đây mình cố định beaglebone nên mình dùng gán trực tiếp luôn

![](/uploads/2025/07/image-11.png)

- `??=` (weak default value) : Nếu biến chưa từng được set thì sẽ lấy giá trị ở đây, hành vi set giá trị biến ngay lập tức nếu biến khác tương tác. Và nó yếu hơn "?="\

![](/uploads/2025/07/image-7.png)

- `+=` (Appending) : Đơn giản là nối chuỗi kiểu vậy

```bash
echo 'VARIABLE = "5"' >> ../meta-base/recipes-example/example/example_0.1.bb

echo 'VARIABLE += "6"' >> ../meta-append1/recipes-example/example/example_0.1.bbappend

echo 'VARIABLE += "7"' >> ../meta-append2/recipes-example/example/example_0.1.bbappend

bitbake -e example | grep "^VARIABLE"
VARIABLE="5  6  7"
```

Nhìn vào việc nối chuỗi các bạn của thấy được thứ tự khi parse recipe của bitbake engine, đó chính là từ layer có priority thấp đến priority cao

***--> Các bạn cùng đón đọc bài 3 ở mục Kế tiếp nhé, mình sẽ viết về cách thay đổi mật khẩu default khi build yocto***

{{< youtube hDr0zcNRDq8 >}}
