---
title: '[Boot-BBB] 1. Build Cross compiler tool crosstool-ng'
date: '2025-10-25T08:03:00+07:00'
lastmod: '2025-10-25T18:56:09+07:00'
slug: boot-bbb-1-build-cross-compiler-tool
url: /2025/10/25/boot-bbb-1-build-cross-compiler-tool/
categories:
- BootProcess
tags:
- Beaglebone
- BootProcess
- Linux
series:
- Boot-BBB
series_order: 1
boards:
- Beaglebone Black
image: /uploads/2025/09/maxresdefault.jpg
description: Chào các bạn, hôm nay mình sẽ bắt đầu 1 series mới mang tên Boot-BBB. Series này sẽ độc lập với series Yocto-BBB. Ở đây mình sẽ không dùng đến yocto mà sẽ bu…
wp_id: 1128
---

Chào các bạn, hôm nay mình sẽ bắt đầu 1 series mới mang tên Boot-BBB. Series này sẽ độc lập với series Yocto-BBB. Ở đây mình sẽ không dùng đến yocto mà sẽ build từ source cho crosstool-ng, u-boot, buildroot, busybox.

## 1. Tại sao ta bắt đầu với cross compiler tool

Embedded Linux (Nhúng Linux) sẽ bao gồm 4 thành phần chính

- Toolchain: Compiler (trình biên dịch) và 1 số tool khác để tạo ra code cho thiết bị.
- Bootloader: Chương trình khởi tạo cho board, và nạp kernel
- Kernel : Trái tim của hệ thống, kiểm soát tài nguyên và giao tiếp phần cứng
- Root file system: Chứa các thư viện, và chương trình chạy 1 khi kernel khởi tạo xong

Trong toolchain có hai kiểu trình biên dịch:

- **Native compiler**: Biên dịch **trên** và **cho** cùng một kiến trúc (ví dụ: build trên ARM cho ARM).
- `Cross-compiler`: Biên dịch **trên** một kiến trúc (x86_64 laptop) nhưng tạo mã **cho** kiến trúc khác (ARM).

Trong thực tế, `cross-compiler` thường nhanh và tiện hơn cho nhà phát triển (máy build mạnh hơn, dễ tự động hoá).

Bài này mình sẽ dùng `crosstool-ng` để tạo toolchain phục vụ `cross-compile`.

## 2 Compile croosstool-ng

Clone source code về

```bash
git clone https://github.com/crosstool-ng/crosstool-ng
cd crosstool-ng/
```

Cấu hình trực tiếp tại local thay vì export tới PATH

```bash
./bootstrap
./configure --enable-local
```

Rồi compile thôi

```bash
make
```

## 3. Tạo Toolchain cho Beaglebone black bằng crosstool-ng

Các bạn có thể check list sameple xem khớp với các board nào, ở đây Beaglebone Black minh là chip a8, do đó mình check

```bash
zk47@ltu:~/Learning/Bootlin_practice/tmp/crosstool-ng$ ./ct-ng list-samples | grep a8
[L...]   arm-cortex_a8-linux-gnueabi

./ct-ng arm-cortex_a8-linux-gnueabi
```

Okay giờ ta phải chọn tùy chọn việc build đúng

```bash
./ct-ng menuconfig
```

Giao diện sẽ có dạng

![](/uploads/2025/09/image-8.png)

- Paths and misc options:
  - Logging:
    - Maximum Log Level to see = DEBUG
- Target options
  - Target optimisations:
    - Use specific FPU = vfpv3
    - Floating point to hardware = FPU
- Toolchain Options
  - Tuple completion and aliasing
    - Tuple's vendor string = training
    - Tuple's alias = arm-linux
- Operating System
  - Target for OS
    - Options for linux
      - Version of linux = 5.15.x
- C library
  - C library = uClibc-ng
- C compiler
  - Options for gcc
    - Version of gcc (11.x.x)
  - Additional supported languages:
    - C++ = \* (bấm space để đổi trạng thái)

Sau đó chọn save rồi exit

Okay rồi build thôi

```bash
./ct-ng build
```

Đợi cho xong, output của bạn sẽ ở

```bash
$HOME/x-tools/arm-training-linux-uclibcgnueabihf/bin
```

Để có thể sử dụng từ bất kỳ đâu, các bạn add vào PATH của phiên hiện tại

```bash
export PATH=$HOME/x-tools/arm-training-linux-uclibcgnueabihf/bin:$PATH
```

## 4. Test thử toolchain mới tạo ra

Ta sẽ thử compile code C vô cùng đơn giản sau

```cpp
#include
#include

int main (void)
{
    printf( "Hello world!\n" );
    return EXIT_SUCCESS;
}
```

Bạn lưu với tên helloworld.c

Ta compile nó với câu lệnh

```bash
arm-linux-gcc -o helloworld helloworld.c
```

Các bạn copy helloworld này lên board chạy là sẽ ok. hoặc ta có thể test đơn giản với qemu-arm

```bash
sudo apt install qemu-user
```

Nếu giờ bạn chạy luôn sẽ báo lỗi

```bash
zk47@ltu:~/Learning/Bootlin_practice/tmp/crosstool-ng$ qemu-arm hello
qemu-arm: Could not open '/lib/ld-uClibc.so.0': No such file or directory
```

Do đó ta cần link thêm thư viện khi chạy

```bash
zk47@ltu:~/Learning/Bootlin_practice/tmp/crosstool-ng$ qemu-arm -L ~/x-tools/arm-training-linux-uclibcgnueabihf/arm-training-linux-uclibcgnueabihf/sysroot hello
Hello world!
```

## 5. Tham khảo :

- <https://blog.billvanleeuwen.ca/creating-a-cross-compiling-toolchain-for-beaglebone-black-with-crosstool-ng>
- <https://bootlin.com/training/>
- <https://www.udemy.com/course/embedded-linux-step-by-step-using-beaglebone/>
