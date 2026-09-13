---
title: Sử dụng GCC biên dịch C/C++
date: '2024-10-19T02:08:00+00:00'
lastmod: '2025-06-28T14:48:04+00:00'
slug: su-dung-gcc-bien-dich-c-c
url: /2024/10/19/su-dung-gcc-bien-dich-c-c/
tags:
- GCC
image: /uploads/2024/10/gcc.jpeg
description: GCC là một trình biên dịch. Nó là một bộ công cụ biên dịch mạnh mẽ được sử dụng rộng rãi để biên dịch mã nguồn từ các ngôn ngữ lập trình như C, C++, Objectiv…
wp_id: 76
---


## GCC là gì?

GCC là một **trình biên dịch** (compiler). Nó là bộ công cụ biên dịch mạnh mẽ, được dùng rộng rãi để biên dịch mã nguồn từ các ngôn ngữ như C, C++, Objective-C… và nhiều ngôn ngữ khác thành mã máy (mã nhị phân có thể thực thi trên hệ điều hành).

## Tại sao cần dùng GCC?

Khi mới làm quen với lập trình C/C++, để chạy được code thông thường các bạn sẽ tải thêm một IDE (Integrated Development Environment).

![What is an IDE?](/uploads/external/a3c8f48e374c.png)

Một IDE là một môi trường tích hợp đầy đủ, có giao diện đồ hoạ hỗ trợ `debugging` và các công cụ quản lý dự án phức tạp, ví dụ như Code::Blocks, Dev C/C++ hoặc Visual Studio… Lưu ý: Visual Studio Code là một *code editor*, chưa phải là IDE.

Do đó, nếu dùng Visual Studio Code hoặc đơn giản là Notepad để gõ code rồi dùng GCC để biên dịch (tuy mục đích cuối cùng vẫn là tạo ra mã máy thực thi) thì bạn sẽ có một số ưu điểm sau:

- Nhẹ hơn và tuỳ biến linh hoạt hơn.
- Tương thích đa nền tảng: cái này mình thấy là quan trọng nhất. Bạn có thể gõ code ra một file `.c`/`.cpp` ở bất kỳ đâu để chạy mà không cần cài một IDE đầy đủ. Có những IDE chỉ có trên Windows như Visual Studio: project của bạn sẽ nằm trong một Solution, khó mang sang hệ điều hành khác.

Xem thêm: [Cách cài đặt GCC trên Windows và Ubuntu](/2024/10/19/cach-cai-dat-gcc-tren-windows-va-ubuntu/).

👉 *Sử dụng GCC sẽ giúp bạn hiểu rõ hơn cách máy tính chạy, từ bước gõ code cho đến khi ra được file thực thi.*

## Build process trong C

Quá trình xây dựng (build process) là một chuỗi các bước xử lý, trong đó các file mã nguồn (`.c`, `.cpp`…) được dùng làm đầu vào, và kết quả đầu ra là các file nhị phân có thể sử dụng (hex, bin, exe…).

![Build process trong C](/uploads/blogger/6c8223175372.png)

## Sử dụng GCC thế nào?

Build process bao gồm **4 giai đoạn**. Ví dụ ta có file `main.c` và file `library.h` như sau ([link code mẫu](https://github.com/Zk47T/Blog/tree/main/C-C%2B%2B/GCC/01-Using-GCC-Compile-C-C%2B%2B)):

![main.c](/uploads/2024/10/gcc-build-1.png)

![library.h](/uploads/2024/10/gcc-build-2.png)

### 1. Tiền xử lý (Preprocessing)

Chỗ nào có chỉ thị tiền xử lý sẽ được xử lý 😀. Dấu hiệu nhận biết là ký tự `#`, ví dụ `#include`, `#define`, `#ifdef`… cùng với đó là các macro và comment. Ta gõ câu lệnh:

```bash
gcc -E main.c -o main.i
```

File `main.i` thu được sẽ có kết quả như sau:

<!-- Ảnh chụp nội dung main.i bị mất trong export WordPress (thẻ img không có src), cần chụp lại. -->

- 👉 `#include "library.h"`: được xử lý bằng cách chèn toàn bộ thư viện `library.h` vào vị trí include.
- 👉 `#define A 1`: chỗ nào có ký tự `A` đứng đơn lẻ sẽ được thay trực tiếp bằng giá trị đã định nghĩa.
- 👉 `// Comment`: được xoá khỏi file.

### 2. Biên dịch (Compiling)

Quá trình này biên dịch file `.i` bên trên sang mã máy, tạo ra file `main.s` là file assembly. Các bạn gõ câu lệnh:

```bash
gcc -S main.i -o main.s
```

<!-- Ảnh chụp nội dung main.s bị mất trong export WordPress, cần chụp lại. -->

### 3. Assembling

Bước này ta dùng `assembler` chứ không dùng compiler nữa. Nó sẽ gộp file assembly vừa tạo với các file assembly có sẵn, tạo thành file object:

```bash
as main.s -o main.o
```

![main.o](/uploads/2024/10/gcc-build-3.png)

Với file này thì phải dùng các phần mềm chuyên dụng mới đọc được nội dung; các bạn có thể đọc thêm với keyword **Reverse Engineering** (cũng là cách hacker tìm cách crack phần mềm 😀😀).

### 4. Linking

Sau khi đã có file object, ta link các file object với static library có sẵn:

```bash
gcc -v -o main main.c
```

Kết quả sau cùng là file `main.exe` trên Windows hoặc `main` trên Ubuntu. Các bạn chỉ cần gõ `main` hoặc `main.exe` là chương trình sẽ được thực thi.

Đây là một vài câu lệnh cơ bản nhất. Các bạn đọc tiếp [hướng dẫn về Makefile](https://zk47t.blogspot.com/2024/10/su-dung-makefile-phan-1.html) để có thể tự động hoá quá trình build.
