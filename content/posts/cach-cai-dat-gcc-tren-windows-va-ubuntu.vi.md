---
title: Cách cài đặt gcc trên Windows và Ubuntu
date: '2024-10-19T02:25:00+00:00'
lastmod: '2025-11-15T21:27:15+00:00'
slug: cach-cai-dat-gcc-tren-windows-va-ubuntu
url: /2024/10/19/cach-cai-dat-gcc-tren-windows-va-ubuntu/
tags:
- GCC
image: /uploads/2024/10/gcc_install.png
description: GCC là một trình biên dịch. Nó là một bộ công cụ biên dịch mạnh mẽ được sử dụng rộng rãi để biên dịch mã nguồn từ các ngôn ngữ lập trình như C, C++, Objectiv…
wp_id: 75
---

## 1. GCC là gì ?

 GCC là một **trình biên dịch**. Nó là một bộ công cụ biên dịch mạnh mẽ được sử dụng rộng rãi để biên dịch mã nguồn từ các ngôn ngữ lập trình như `C`, `C++`, `Objective-C`.., và nhiều ngôn ngữ khác thành mã máy (mã nhị phân có thể thực thi trên hệ điều hành).

![](/uploads/2024/10/image-1.png)

## 2. Trên windows

Trên  Windows chúng ta sẽ dùng MinGW. Các bạn truy cập trang chủ của MinGW để download file cài đặt [tại đây](https://sourceforge.net/projects/mingw/).

Sau khi đã cài đặt xong xuôi, màn hình hiển thị giao diện MinGW Installation Manager, các bạn chuột phải chọn mục sau ở MinGW Base System **mingw32-gcc bin** chọn Mark for installation

![](/uploads/blogger/788e4a50f86b.png)

Sau đó chọn mục Installation trên toolbar, chọn Apply Changes, rồi bấm Apply, MinGW sẽ tự động tải các cấu thành của GCC

![](/uploads/blogger/cd86b85b49a6.png)

Sau khi cài xong các bạn close, rồi kiểm tra lại xem GCC đã cài xong chưa bằng cách gõ câu lệnh sau trong Command Prompt

```bash
gcc -v
```

Nếu kết quả hiện ra như sau thì là ta đã cài đặt thành công

![](/uploads/blogger/9a777b04bf83.png)

## 3. Trên Ubuntu

Cài đặt gcc đơn giản hơn rất nhiều các bạn gõ  câu lệnh sau trong terminal 

```bash
sudo apt-get install gcc
gcc -v
```

![](/uploads/2024/10/image.png)

Xuất hiện dòng sau là đã cài ok

Nếu bạn muốn làm quen với Ubuntu hoặc các Distro của Linux mà không muốn cấu hình quá phức tạp, Các bạn có thể cài **Windows Subsystem for Linux** trên Windows.
