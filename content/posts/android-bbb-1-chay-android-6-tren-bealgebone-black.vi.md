---
title: '[Android-BBB] 1. Chạy Android 6 trên Bealgebone Black'
date: '2026-01-24T21:24:47+07:00'
lastmod: '2026-01-27T20:10:56+07:00'
slug: android-bbb-1-chay-android-6-tren-bealgebone-black
url: /2026/01/24/android-bbb-1-chay-android-6-tren-bealgebone-black/
categories:
- AOSP
tags:
- Android
- Beaglebone
- Linux
- Android-BBB
boards:
- Beaglebone Black
image: /uploads/2026/01/screenshot-from-2026-01-27-20-10-02.png
description: Chắc chắn rồi Beaglbone Black chỉ có 512Mb, nên khó mà có thể chạy Android 1 cách mượt mà được. Mình làm thử, và viết bài này để những ai định thử, thì có th…
wp_id: 1675
---

Chắc chắn rồi Beaglbone Black chỉ có 512Mb, nên khó mà có thể chạy Android 1 cách mượt mà được. Mình làm thử, và viết bài này để những ai định thử, thì có thể trải nghiệm nhé :vv

## 1. Android 6 Image

### 1.1 Tự build image

Các bạn co thể follow theo trang github này để tự build image: <https://github.com/csimmonds/android4beagle>

![](/uploads/2025/11/image-11.png)

Nhưng Android 4,5,6 đã có từ hơn 10 năm trước. Để build được nó, có lẽ các bạn sẽ cần dùng Docker với image Ubuntu tầm 15.10 hoặc thậm chỉ 13.10

Và thực tế mình đã làm theo và vẫn lỗi khi build, với việc phải kéo version python, gcc, java, xuống thấp hơn mà vẫn toàn lỗi. Cũng như nhiều git repo đã không còn nữa. Nên khó mà build lại được.

Do đó ta đến với cách dễ hơn

### 1.2 Sử dụng Image có sẵn

Đến từ trang 2net, tác giả đã cung cấp ta 3 image

![](/uploads/2025/11/image-12.png)

Các bạn có thể tải về trực tiếp qua link. Nhưng không biết web lỗi hay không mà mình bấm link không tải đươc, do đó mình dùng wget. Các bạn dùng 1 trong 3 câu lệnh ở đây cho Android 4.4.4, 5.1.1, 6.0

```bash
wget www.2net.co.uk/downloads/a4b-images/kk4.4/a4b-android-4.4.4_r2-bbb.img.xz
wget www.2net.co.uk/downloads/a4b-images/l5.1/a4b-android-5.1.1-bbb.img.xz
wget www.2net.co.uk/downloads/a4b-images/m6.0/a4b-android-6.0-bbb.img.xz
```

Nếu các bạn dùng Windows có thể tải Axel về rồi copy link vào nhé, github của axel ở đây <https://github.com/nishad/axel-for-windows>

Dùng axel như miêu tả sẽ giúp đẩy nhanh quá trình tải bằng cách dùng nhiều Connect cho 1 file hơn

![](/uploads/2025/11/image-13.png)

## 2. Flash image và test

### 2.1 Flash image

Trên linux, mình giải nén file .img.xz thành .img rồi dùng lệnh. \<name-of-devices> các bạn có thể check bằng lsblk để tìm tên thẻ nhớ nhé

```bash
sudo dd if= of=/dev/ bs=4M status=progress conv=fsync
```

Mặc dù image chỉ 200Mb, nhưng mình thấy quá trình copy này rất lâu, rơi vào tầm 15-20 phút. Nên nếu thấy nó đơ một chút cũng không lo nhé

Trên Windows các bạn có thể dùng các tool để flash. Mình trước còn hay dùng ké luôn cái RPI Imager :vv

### 2.2 Test image

Ở đây mình dùng nguồn ngoài cấp cho Bealgebone Black, 5V 2A, cắm 1 màn Waveshare 7 inch để có giao diện. Ấy vậy mà trong Log Serial thì bị ngắt kết nối tới cổng USB liên tục. Lạ là khi build image bằng Yocto kể cả có giao diện như core-image-sato, thì cũng ko gặp trường hợp này.

Cái này xảy ra khi BBB không đủ nguồn cấp cho Màn, do đó mình dùng nguồn ngoài cho màn hình. Và cắm chuột và bàn phím vào Bealgebone thay vì cảm ứng.

Và tada, đây là kết quả

{{< youtube XL-kIY8IkSU >}}

## 3. Tham khảo

<https://www.2net.co.uk/android4beagle.html>
