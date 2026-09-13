---
title: '[Yocto-BBB] 8. Kết nối I2C với SSD1306 OLED 0.96 Inch'
date: '2025-08-16T08:05:00+07:00'
lastmod: '2025-12-09T20:54:00+07:00'
slug: yocto-bbb-8-ket-noi-voi-ssd1306-oled-0-96-inch
url: /2025/08/16/yocto-bbb-8-ket-noi-voi-ssd1306-oled-0-96-inch/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 8
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Ở bài này mình sẽ hướng dẫn các bạn cách kết nối Beaglebone Black với màn SSD1306 cũng như tạo recipes để build program cho việc tương tác này. Dưới đây là c…
wp_id: 583
---

Ở bài này mình sẽ hướng dẫn các bạn cách kết nối Beaglebone Black với màn SSD1306 cũng như tạo recipes để build program cho việc tương tác này. Dưới đây là cách kết nối

(Nếu các bạn gặp khó khăn trong quá trình thực hành theo blog, các bạn có thể tham khảo video thực hành của mình ở cuối bài )

![](/uploads/2025/07/image-45.png)

## 1. Test kết nối

### 1.1 Bổ sung package cho image

Trước khi tạo recipes và code trên yocto, mình hay test chạy thật trước cho an toàn :v. Để test thì mình sẽ thêm các package sau vào board : `gcc`, `nano`, `i2c-tools` (sẽ có `i2cdetect` tool rất tiện)

`Gcc` thuộc `packagegroup-core-buildessential` nên mình sẽ cài đủ cả. Đây là cái thay đổi trong `custom-image-minimal.bb`

![](/uploads/2025/07/image-43.png)

Flash lại và chúng ta có image có sẵn các tool kia

Các bạn có thể check package tại file manifest cùng thư mục deploy-image để xem có thật sự package của mình có trong image không

![](/uploads/2025/07/image-44.png)

### 1.2 Test kết nối i2c

#### 1.2.1 Kiểm tra enable i2c

Đây là pinout của Beaglebone Black

![](/uploads/2025/07/image-1-1.png)

Ta thấy Board đã có sẵn 2 chân ra ngoài của I2C2 tại P9-19 và P9-20, nên ta sẽ check xem nó đã được enable chưa bằng 2 câu lệnh

{{% details title="ls -l /dev/i2c*" closed="true" %}}

```bash
root@beaglebone:~# ls -l /dev/i2c*
crw------- 1 root root 89, 0 Jan  1  2000 /dev/i2c-0
crw------- 1 root root 89, 2 Jan  1  2000 /dev/i2c-2
```

Ta thấy có xuất hiện i2c-2, tuy nhiên đây là tên theo phần mềm, chưa chắc đã khớp với tên thật sự theo Reference manual, nên ta phải check kỹ hơn.

{{% /details %}}

{{% details title="ls -l /sys/bus/i2c/devices" closed="true" %}}

```bash
root@beaglebone:~# ls -l /sys/bus/i2c/devices/
total 0
lrwxrwxrwx 1 root root 0 Jan  1  2000 0-0024 -> ../../../devices/platform/ocp/44c00000.interconnect/44c00000.interconnect:segment@200000/44e0b000.target-module/44e0b000.i2c/i2c-0/0-0024
lrwxrwxrwx 1 root root 0 Jan  1  2000 0-0034 -> ../../../devices/platform/ocp/44c00000.interconnect/44c00000.interconnect:segment@200000/44e0b000.target-module/44e0b000.i2c/i2c-0/0-0034
lrwxrwxrwx 1 root root 0 Jan  1  2000 0-0050 -> ../../../devices/platform/ocp/44c00000.interconnect/44c00000.interconnect:segment@200000/44e0b000.target-module/44e0b000.i2c/i2c-0/0-0050
lrwxrwxrwx 1 root root 0 Jan  1  2000 0-0070 -> ../../../devices/platform/ocp/44c00000.interconnect/44c00000.interconnect:segment@200000/44e0b000.target-module/44e0b000.i2c/i2c-0/0-0070
lrwxrwxrwx 1 root root 0 Jan  1  2000 2-0054 -> ../../../devices/platform/ocp/48000000.interconnect/48000000.interconnect:segment@100000/4819c000.target-module/4819c000.i2c/i2c-2/2-0054
lrwxrwxrwx 1 root root 0 Jan  1  2000 2-0055 -> ../../../devices/platform/ocp/48000000.interconnect/48000000.interconnect:segment@100000/4819c000.target-module/4819c000.i2c/i2c-2/2-0055
lrwxrwxrwx 1 root root 0 Jan  1  2000 2-0056 -> ../../../devices/platform/ocp/48000000.interconnect/48000000.interconnect:segment@100000/4819c000.target-module/4819c000.i2c/i2c-2/2-0056
lrwxrwxrwx 1 root root 0 Jan  1  2000 2-0057 -> ../../../devices/platform/ocp/48000000.interconnect/48000000.interconnect:segment@100000/4819c000.target-module/4819c000.i2c/i2c-2/2-0057
lrwxrwxrwx 1 root root 0 Jan  1  2000 i2c-0 -> ../../../devices/platform/ocp/44c00000.interconnect/44c00000.interconnect:segment@200000/44e0b000.target-module/44e0b000.i2c/i2c-0
lrwxrwxrwx 1 root root 0 Jan  1  2000 i2c-2 -> ../../../devices/platform/ocp/48000000.interconnect/48000000.interconnect:segment@100000/4819c000.target-module/4819c000.i2c/i2c-2
```

Khá dài nhưng ta chỉ cần quan tâm vào địa chỉ của nó, ở đây ta thấy có 2 địa chỉ đó là `4819c000` và `44e0b000`

Check trong [Reference Manual](https://www.ti.com/lit/ug/spruh73q/spruh73q.pdf) tại Mục 2. Memory Map và tìm các địa chỉ kia `4819_c000` và `44e0_b000` (sẽ mất 1 lúc để tìm thấy) ta được Địa chỉ `I2C2` tại trang 183, và `I2C0` tại trang 180

![](/uploads/2025/07/image-47.png)

![](/uploads/2025/07/image-48.png)

Vậy i2c-2 ở đây thật sự trỏ đến i2c2 ở phần cứng, và đã được enable, vậy ta tự nhiên mà dùng thôi :v

{{% /details %}}

Sau 2 câu lệnh, ta đã check được i2c-2 thật sự là i2c2 trên phần cứng, và đã được enable vậy thì ta có thể dùng nó được

#### 1.2.2 Kiểm tra i2cdetect

Ta kết nối Beaglebone Black với SSD1306

![](/uploads/2025/08/3b9c4617572ada74833b.jpg)

- SSD1306 GND <---> BBB GND (P9.1)
- SSD1306 VCC <---> BBB VDD (P9.3)
- SSD1306 SDA <---> BBB SDA (P9.20)
- SSD1306 SCL <---> BBB SCL (P9.19)

Ta chạy lệnh dưới để detect địa chỉ, lưu ý param '2' là i2c-2, nếu là i2c-1 thì sẽ là (i2cdetect -y -r 1)

```bash
i2cdetect -y -r 2
```

![](/uploads/2025/07/image-50.png)

Board đã detect được địa chỉ của màn. I2C master slave nên sẽ luôn có 1 địa chỉ để kết nối

## 2. Chương trình in chữ lên màn SSD1306

(Các bạn có thể tham khảo ở video này để thực hành với ssd1306 package có sẵn trên Yocto, nhưng ở đây mình muốn test với 1 code C nho nhỏ mình tự làm :vv ssd1306 <https://www.youtube.com/watch?v=ReqwC9qoIJA&t=265s&ab_channel=LeonAnavi> )

Ở board đã có sẵn gcc và nano nên ta dùng luôn để build thôi.

Các bạn có thể dựa trên [Datasheet](https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf) để viết lên thư viện của ssd1306, ở đây mình có hơi lười nên tham khảo nguồn sẵn trên mạng, mình có push code này lên github. Mình muốn in ra chữ "Hello" nên chỉ tạo font bấy nhiêu chữ cái, tuy nhiên ký tự 'e' có bị nhầm sang '6' mà mình fix mãi chưa được, rất mong được sự đóng góp của các bạn.

Đây là link code : <https://github.com/Zk47T/ssd1306/blob/main/src/main.c>

Trên board các bạn tạo main.c rồi copy nội dung từ git mình vào và save

```bash
touch main.c
nano main.c
```

![](/uploads/2025/07/image-51.png)

Lưu ý đổi đúng I2C_DEV này và I2C_ADDR, sau đó compile và chạy

```bash
gcc -o ssd1306 main.c
./ssd1306
```

Kết quả in trên màn sẽ là

![](/uploads/2025/07/ed0cabb49724217a7835.jpg)

Chúc các bạn thành công, và mong nhận được sự đóng góp về việc cải thiện file [main.c](https://github.com/Zk47T/ssd1306/blob/main/src/main.c) để support chuẩn font hơn.

Bài viết đến đây đã hơi dài nên mình kết thúc tại đây

**Các bạn đón đọc bài tiếp theo, mình sẽ tạo recipes, để lấy code main.c từ trên git về build, cũng như hướng dẫn các bạn tạo patch nếu source code không ở local.**

{{< youtube GY3bBnLLjHY >}}
