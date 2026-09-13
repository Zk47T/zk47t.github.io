---
title: 'Using GCC to compile C/C++'
date: '2024-10-19T02:08:00+00:00'
lastmod: '2025-06-28T14:48:04+00:00'
slug: su-dung-gcc-bien-dich-c-c
url: /en/2024/10/19/su-dung-gcc-bien-dich-c-c/
tags:
- GCC
image: /uploads/2024/10/gcc.jpeg
description: 'What GCC is, why use it instead of a full IDE, and the four build stages (preprocessing, compiling, assembling, linking) with the gcc command for each.'
wp_id: 76
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
## What is GCC?

GCC is a **compiler**. It is a powerful compiler toolset, widely used to compile source code from languages such as C, C++, Objective-C… and many others into machine code (binary code that can run on the operating system).

## Why use GCC?

When you first get started with C/C++ programming, to run code you would normally download an IDE (Integrated Development Environment).

![What is an IDE?](/uploads/external/a3c8f48e374c.png)

An IDE is a complete integrated environment with a graphical interface that supports `debugging` and tools for managing complex projects, such as Code::Blocks, Dev C/C++ or Visual Studio… Note: Visual Studio Code is a *code editor*, not an IDE.

So if you use Visual Studio Code, or simply Notepad, to write code and then use GCC to compile it (even though the end goal is still to produce executable machine code), you get some advantages:

- Lighter and more flexible to customise.
- Cross-platform compatibility: I find this the most important one. You can write code in a `.c`/`.cpp` file anywhere and run it without installing a full IDE. Some IDEs only exist on Windows, like Visual Studio: your project lives inside a Solution and is hard to move to another operating system.

See also: [How to install GCC on Windows and Ubuntu](/en/2024/10/19/cach-cai-dat-gcc-tren-windows-va-ubuntu/).

👉 *Using GCC helps you understand better how a computer works, from typing code to getting an executable file.*

## The build process in C

The build process is a chain of processing steps in which the source files (`.c`, `.cpp`…) are the input and the output is usable binary files (hex, bin, exe…).

![Build process in C](/uploads/blogger/6c8223175372.png)

## How to use GCC?

The build process consists of **4 stages**. For example, we have a `main.c` file and a `library.h` file like this ([sample code link](https://github.com/Zk47T/Blog/tree/main/C-C%2B%2B/GCC/01-Using-GCC-Compile-C-C%2B%2B)):

![main.c](/uploads/2024/10/gcc-build-1.png)

![library.h](/uploads/2024/10/gcc-build-2.png)

### 1. Preprocessing

Wherever there is a preprocessor directive, it gets processed 😀. You recognise them by the `#` character, for example `#include`, `#define`, `#ifdef`… along with macros and comments. We type the command:

```bash
gcc -E main.c -o main.i
```

The resulting `main.i` file looks like this:

<!-- The screenshot of main.i was lost in the WordPress export (img tag without src); needs to be retaken. -->

- 👉 `#include "library.h"`: handled by inserting the whole `library.h` library at the include position.
- 👉 `#define A 1`: wherever the character `A` stands on its own, it is replaced directly with the defined value.
- 👉 `// Comment`: removed from the file.

### 2. Compiling

This stage compiles the `.i` file above towards machine code, producing `main.s`, the assembly file. Type the command:

```bash
gcc -S main.i -o main.s
```

<!-- The screenshot of main.s was lost in the WordPress export; needs to be retaken. -->

### 3. Assembling

In this step we use the `assembler`, not the compiler any more. It combines the assembly file just created with existing assembly files into an object file:

```bash
as main.s -o main.o
```

![main.o](/uploads/2024/10/gcc-build-3.png)

This file can only be read with specialised software; you can read more with the keyword **Reverse Engineering** (which is also how hackers try to crack software 😀😀).

### 4. Linking

Once we have the object file, we link the object files with the existing static libraries:

```bash
gcc -v -o main main.c
```

The final result is `main.exe` on Windows or `main` on Ubuntu. Just type `main` or `main.exe` and the program runs.

These are some of the most basic commands. Continue with the [Makefile guide](https://zk47t.blogspot.com/2024/10/su-dung-makefile-phan-1.html) to automate the build process.
