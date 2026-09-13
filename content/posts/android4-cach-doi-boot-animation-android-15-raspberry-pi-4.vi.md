---
title: '[Android]4. Cách đổi Boot animation Android 15 Raspberry Pi 4'
date: '2025-05-05T15:16:00+00:00'
lastmod: '2025-06-28T16:40:25+00:00'
slug: android4-cach-doi-boot-animation-android-15-raspberry-pi-4
url: /2025/05/05/android4-cach-doi-boot-animation-android-15-raspberry-pi-4/
categories:
- AOSP
tags:
- Android
- Linux
- RaspberryPi
series:
- Android
series_order: 4
boards:
- Raspberry Pi 4
image: /uploads/2025/05/boot_animation.jpg
description: Về cách build Android 15 mình tham khảo tại Devlinux.vn blog Xây dựng Android Automotive 15 cho Raspberry Pi 4(https://devlinux.vn/blog/X%C3%A2y-d%E1%BB%B1ng…
wp_id: 35
---

*Về cách build Android 15 mình tham khảo tại [Devlinux.vn blog Xây dựng Android Automotive 15 cho Raspberry Pi 4](https://devlinux.vn/blog/X%C3%A2y-d%E1%BB%B1ng-Android-Automotive-15-cho-Raspberry-Pi-4)**Lưu ý duy nhất khi áp dụng guide này là đến bước 3.1 repo init, thì phải dùng lệnh (thay revision)*

```
repo init -u https://android.googlesource.com/platform/manifest -b android-15.0.0_r26
```

### A. Tổng quan

![](/uploads/blogger/32e3f775b364.jpg)

Hẳn các bạn dùng Android đều quen thuộc với việc khởi động máy sẽ có dòng Powered by Android này, tuy nhiên chúng ta hoàn toàn có thể thay đổi được Boot animation này sang 1 video hoặc hình ảnh khác.

Bởi cái hay của Android cũng như Linux là khả năng tùy biến :vMình đã thay từ giao diện màn loading Android sang Meme Cat saying Huh! này

<video controls preload="metadata" poster="/videos/F70ZX3gq/poster.jpg" src="/videos/F70ZX3gq/change_boot_animation.mp4" style="max-width:100%;margin:auto;display:block"></video>

### B. Phân tích

Android sẽ lấy Boot animation ở bootanimation.zip tại `/system/media`. Có 2 cách để đặt được boot animation của riêng bạn vào board

- Sửa lại cấu hình build, để build ra image chứa sẵn boot animation
- Thay thế trực tiếp vào `/system/media` trên board khi đã Flash xong

Cấu trúc 1 Bootanimation.zip

```
bootanimation.zip
│
└───part0 [folder name]
│   │   000.png [or .jpg]
│   │   001.png
│   │   002.png
│   │   ...
│
└───part1
│   │   000.png
│   │   001.png
│   │   002.png
│   │   ...
└───desc.txt [animation specification]
```

Bên trong 1 desc.txt sẽ có nội dung như sau

```
[width] [height] [frames per second]
[type ("p" or "c"] [loop count] [pause] [folder] [bg color (optional)]
[type ("p" or "c"] [loop count] [pause] [folder] [bg color (optional)]

Etc. End off with an empty line.
```

- [`width`]
  - Chiều rộng ảnh
- [`height`]
  - Chiều cao ảnh
- [**frames per second**]
  - Số khung hình trên giây
- [**type**]
  - Type **p** : Boot animation sẽ cắt ngay khi OS load xong --> Trông sẽ nhanh hơn
  - Type `c` : Chạy trọn vẹn cho hết Boot animation mới sang OS --> Dễ khiến người dùng nhầm là khởi động bị chậm
- [**loop count**]
  - Số lần lặp lại cho phần này
  - Lưu ý nếu đặt là 0 nó sẽ lặp lại mãi mãi
- [`pause`]
  - Dừng lại bao nhiêu khung hình giữa các part
- [`folder`]
  - folder chứa part
- [**bg color**]
  - background color

Ví dụ như

```
800 480 30
**p** 1 15 part0 FFFFFF
**p** 0 0 part1 FFFFFF
```

### C. Thực hành thôi

##### 1. Tải video mong muốn về

##### 2. Sau khi có video ta dùng ffmpeg để cắt các khung hình ra

- Nếu chưa có ta cài bằng cách

```
sudo apt update
sudo apt install ffmpeg
```

- Để đơn giản ở đây mình sẽ tạo duy nhất 1 part

```
ffmpeg -i input.mp4 -vf "fps=8,scale=1280:720" -qscale:v 6 -vframes 120 part0/%03d.jpg
```

- Cách tính thông số

```
total_frames = fps × duration_in_seconds
```

Nếu bạn muốn Boot animation có độ dài 15s, giả sử chọn fps = 8, thì ta cần tạo ra 8\*15 = 120 khung hình. **Lưu ý**: Tăng fps --> Tăng số khung hình --> Tăng kích thước bootanimation.zip. Android chỉ chấp nhận bootanimation.zip kích thước từ 2-5Mb, nếu quá sẽ không thể hiển thị

##### 3. Set config file desc.txt

Như đã miêu tả bên trên, hiện mình chọn thông số như sau

```
1280 720 8
p 1 0 part0 000000
```

##### 4. Nén thư mục part0 và desc.txt vào bootanimation.zip

```
zip -r -0 bootanimation.zip desc.txt part0
```

##### 5. Copy bootanimation.zip vào board

- Kết nối vào board thông qua adb command, tham khảo tại [[Android]2. Cách Kết nối vào Raspberry Pi 4 dùng ADB (Android Debugger Bridge)](https://www.blogger.com/blog/post/edit/4128587874461577327/6313284185185440762?hl=vi)
- Trước khi copy vào board, phải mount lại hệ thống để enable read/write, hiện tại mặc định là Read-only system. Không thể tạo 1 file mới

![](/uploads/blogger/8978625e9fd7.png)

```text
mount -o rw,remount /
```

- Mount lại hệ thống, giờ đã có thể thoải mái tạo file

![](/uploads/blogger/5aca139887bc.png)

- Ctrl + D để back ra ngoài, đến thư mục lưu bootanimation

```
adb push  /system/media
```

##### 6. Khởi động lại board và chiêm ngưỡng thành quả :v
