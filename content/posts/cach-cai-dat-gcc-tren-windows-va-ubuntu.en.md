---
title: 'How to install gcc on Windows and Ubuntu'
date: '2024-10-19T02:25:00+00:00'
lastmod: '2025-11-15T21:27:15+00:00'
slug: cach-cai-dat-gcc-tren-windows-va-ubuntu
url: /en/2024/10/19/cach-cai-dat-gcc-tren-windows-va-ubuntu/
tags:
- GCC
image: /uploads/2024/10/gcc_install.png
description: 'Installing GCC with MinGW on Windows and with apt on Ubuntu, and checking that it works.'
wp_id: 75
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
## 1. What is GCC?

 GCC is a **compiler**. It is a powerful compiler toolset widely used to compile source code from programming languages such as `C`, `C++`, `Objective-C`.., and many other languages into machine code (binary code that can run on the operating system).

![](/uploads/2024/10/image-1.png)

## 2. On windows

On Windows we use MinGW. Go to the MinGW homepage to download the installer [here](https://sourceforge.net/projects/mingw/).

Once installation is finished, the MinGW Installation Manager window appears; right-click the following item under MinGW Base System, **mingw32-gcc bin**, and choose Mark for installation

![](/uploads/blogger/788e4a50f86b.png)

Then choose Installation on the toolbar, choose Apply Changes, then click Apply; MinGW will download the GCC components automatically

![](/uploads/blogger/cd86b85b49a6.png)

After it finishes, close it and check whether GCC is installed by typing the following command in Command Prompt

```bash
gcc -v
```

If the result looks like this, the installation succeeded

![](/uploads/blogger/9a777b04bf83.png)

## 3. On Ubuntu

Installing gcc is much simpler; type the following command in the terminal 

```bash
sudo apt-get install gcc
gcc -v
```

![](/uploads/2024/10/image.png)

When this line appears, it is installed

If you want to get familiar with Ubuntu or other Linux distros without complicated setup, you can install **Windows Subsystem for Linux** on Windows.
