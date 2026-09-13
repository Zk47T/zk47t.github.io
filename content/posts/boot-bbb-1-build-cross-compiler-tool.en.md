---
title: '[Boot-BBB] 1. Build a cross compiler toolchain with crosstool-ng'
date: '2025-10-25T08:03:00+07:00'
lastmod: '2025-10-25T18:56:09+07:00'
slug: boot-bbb-1-build-cross-compiler-tool
url: /en/2025/10/25/boot-bbb-1-build-cross-compiler-tool/
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
description: 'First post of the Boot-BBB series (no Yocto): why a cross compiler, building crosstool-ng, configuring an ARM Cortex-A8 toolchain for the BeagleBone Black and testing it with qemu-arm.'
wp_id: 1128
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
Hi everyone, today I am starting a new series called Boot-BBB. This series is independent of the Yocto-BBB series. Here I will not use yocto; instead I will build crosstool-ng, u-boot, buildroot and busybox from source.

## 1. Why we start with the cross compiler toolchain

Embedded Linux consists of 4 main components

- Toolchain: the compiler and some other tools to produce code for the device.
- Bootloader: the program that initialises the board and loads the kernel
- Kernel: the heart of the system, managing resources and talking to the hardware
- Root file system: contains the libraries and programs that run once the kernel has finished initialising

A toolchain has two kinds of compiler:

- **Native compiler**: compiles **on** and **for** the same architecture (e.g. build on ARM for ARM).
- `Cross-compiler`: compiles **on** one architecture (an x86_64 laptop) but produces code **for** another architecture (ARM).

In practice, a `cross-compiler` is usually faster and more convenient for developers (the build machine is more powerful, and it is easy to automate).

In this post I use `crosstool-ng` to create a toolchain for `cross-compile`.

## 2 Compile crosstool-ng

Clone the source code

```bash
git clone https://github.com/crosstool-ng/crosstool-ng
cd crosstool-ng/
```

Configure it locally instead of exporting to PATH

```bash
./bootstrap
./configure --enable-local
```

Then compile

```bash
make
```

## 3. Create a toolchain for the Beaglebone Black with crosstool-ng

You can check the sample list to see which boards match; here the Beaglebone Black uses an a8 chip, so I check

```bash
zk47@ltu:~/Learning/Bootlin_practice/tmp/crosstool-ng$ ./ct-ng list-samples | grep a8
[L...]   arm-cortex_a8-linux-gnueabi

./ct-ng arm-cortex_a8-linux-gnueabi
```

Okay, now we have to pick the right build options

```bash
./ct-ng menuconfig
```

The interface looks like this

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
    - C++ = \* (press space to toggle)

Then choose save and exit

Okay, let's build

```bash
./ct-ng build
```

Wait for it to finish; your output will be in

```bash
$HOME/x-tools/arm-training-linux-uclibcgnueabihf/bin
```

To use it from anywhere, add it to the PATH of the current session

```bash
export PATH=$HOME/x-tools/arm-training-linux-uclibcgnueabihf/bin:$PATH
```

## 4. Test the newly created toolchain

Let's try compiling this extremely simple C code

```cpp
#include
#include

int main (void)
{
    printf( "Hello world!\n" );
    return EXIT_SUCCESS;
}
```

Save it as helloworld.c

Compile it with the command

```bash
arm-linux-gcc -o helloworld helloworld.c
```

Copy this helloworld to the board and run it and it will be fine. Or we can simply test with qemu-arm

```bash
sudo apt install qemu-user
```

If you run it right away you get an error

```bash
zk47@ltu:~/Learning/Bootlin_practice/tmp/crosstool-ng$ qemu-arm hello
qemu-arm: Could not open '/lib/ld-uClibc.so.0': No such file or directory
```

So we need to point it to the libraries when running

```bash
zk47@ltu:~/Learning/Bootlin_practice/tmp/crosstool-ng$ qemu-arm -L ~/x-tools/arm-training-linux-uclibcgnueabihf/arm-training-linux-uclibcgnueabihf/sysroot hello
Hello world!
```

## 5. References:

- <https://blog.billvanleeuwen.ca/creating-a-cross-compiling-toolchain-for-beaglebone-black-with-crosstool-ng>
- <https://bootlin.com/training/>
- <https://www.udemy.com/course/embedded-linux-step-by-step-using-beaglebone/>
