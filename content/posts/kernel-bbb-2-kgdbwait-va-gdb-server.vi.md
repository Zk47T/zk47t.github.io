---
title: '[Kernel-BBB] 2. kgdbwait và gdb server'
date: '2026-04-25T06:09:00+07:00'
lastmod: '2026-04-13T10:07:35+07:00'
slug: kernel-bbb-2-kgdbwait-va-gdb-server
url: /2026/04/25/kernel-bbb-2-kgdbwait-va-gdb-server/
categories:
- Beaglebone
- kgdb
series:
- Kernel-BBB
series_order: 2
boards:
- Beaglebone Black
image: /uploads/2026/04/screenshot-from-2026-04-04-14-00-18.png
description: Bài này mình sẽ dùng kgdbwait để ta có thể debug được kernel sớm hơn (Chưa sớm bằng qua JTAG) cũng như setup gdb server để dùng extensions của VS Code luôn :vv
wp_id: 2104
---

Bài này mình sẽ dùng kgdbwait để ta có thể debug được kernel sớm hơn (Chưa sớm bằng qua JTAG) cũng như setup gdb server để dùng extensions của VS Code luôn :vv

## 1. Cấu hình kernel command line

### 1.1 Tìm hướng đi

Ở bài trước, mình đã cố sửa boot command qua u-boot, nhưng thực tế thì

```bash
=> printenv bootargs
## Error: "bootargs" not defined
```

Và mình kiểm tra thêm

```bash
=> printenv bootcmd
bootcmd=run findfdt; run init_console; run finduuid; run distro_bootcmd
```

`distro_bootcmd` nghĩa là U-Boot dùng **distro boot** — bootargs được build từ `extlinux.conf` trên boot partition, không phải từ env variables.

Ta có 2 cách,

- 1 là các bạn tháo thẻ nhớ ra và sửa trực tiếp file /boot/extlinux/extlinux.conf

- 2 là ta sửa qua local.conf.

Mình làm yocto mà nên là mình sẽ sửa qua local.conf. Còn bạn nào thắc mắc vậy bootcmd này trong source code đang set ở đâu thì nó ở đây

![](/uploads/2026/04/image-7.png)

### 1.2 Sửa kernel command linux qua local.conf

Ta đơn giản thêm dòng sau vào local.conf

```bash
UBOOT_EXTLINUX_KERNEL_ARGS:append = " kgdboc=ttyS0,115200 kgdbwait"
```

Giờ build lại core-image-minimal rồi check output tại recipe-sysroot của core-image-minimal rồi thấy

![](/uploads/2026/04/image-8.png)

Ta đã thấy kgdbboc và kgdbwait đã được thêm

## 2. Thử kgdbwait

Ta boot board lên và bạn sẽ thấy dòng log sau

```bash
[    4.514801] KGDB: Registered I/O driver kgdboc
[    4.533500] KGDB: Waiting for connection from remote gdb...
```

Vậy là đã thành công, giờ ta tiến đến Mở gdb ở máy pc

```bash
zk47@ltu:~$ sudo gdb-multiarch ~/Youtube/Yocto/yocto-bbb/poky/build-bbb/tmp/work/beaglebone-poky-linux-gnueabi/linux-bb.org/6.12.34+git/build/vmlinux
```

À ta nhớ tắt serial UART ở terminal khác đi nhé, rồi ta setup và connect y hệt bài trước

```bash
(gdb) set serial baud 115200
(gdb) target remote /dev/ttyUSB0
Remote debugging using /dev/ttyUSB0
```

kgdbwait sẽ giúp ta debug trước khi đến login Rất hữu ích khi

- Debug **driver probe** bị crash (I2C, SPI, MMC, USB, ...)
- Debug **filesystem mount** lỗi
- Debug **module loading** có bug
- Debug kernel **panic lúc boot** trước khi lên tới login
- Board **không boot được** đến userspace → không thể `echo g`

## 3. Setup launch.json cho VS Code Stdudio

### 3.1 Setup launch.json và thử bật debug

Thực tế mình đã setup 1 lần khá tương tự trong [Yocto-BBB 18](/2026/03/31/yocto-bbb-18-debug-qua-recipe-sysroot/) các bạn có thể tham khảo trước nhé

Ta mở workdir linux-bb.org lên và tạo launch.json

![](/uploads/2026/04/image-9.png)

launch.json nội dung như sau

```bash
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "KGDB Kernel Debug (BBB)",
      "type": "cppdbg",
      "request": "launch",
      "program": "${workspaceFolder}/build/vmlinux",
      "args": [],
      "stopAtEntry": false,
      "cwd": "${workspaceFolder}",
      "environment": [],
      "externalConsole": false,
      "MIMode": "gdb",
      "miDebuggerPath": "gdb-multiarch",
      "miDebuggerServerAddress": "/dev/ttyUSB0",
      "miDebuggerArgs": "-b 115200",
      "setupCommands": [
        {
          "description": "Map kernel source paths",
          "text": "set substitute-path /usr/src/kernel /home/zk47/Youtube/Yocto/yocto-bbb/poky/build-bbb/tmp/work-shared/beaglebone/kernel-source",
          "ignoreFailures": false
        },
        {
          "description": "Enable pretty-printing",
          "text": "-enable-pretty-printing",
          "ignoreFailures": true
        }
      ]
    }
  ]
}
```

Tương tự các bạn lưu ý mấy trường như

- miDebuggerPath
- miDebuggerServerAddress
- miDebuggerArgs
- setupCommands

![](/uploads/2026/04/image-10.png)

Sau đó bấm debug và ta sẽ được giao diện debug, tuy nhiên kernel sẽ running mà ko bấm dừng được vì ta không đặt breakpoint

Nếu các bạn truy cập được vào terminal của BBB thì các bạn sẽ chạy lệnh sau để dừng kernel

```bash
echo g > /proc/sysrq-trigger
```

Tuy nhiên khi dừng, nó sẽ bắn về 1 tín hiệu phản hồi cho GDB server, nếu KGDB bên VS code không bắt đươc thì nó sẽ cứ running như ảnh trên.

### 3.1 Trick để vào được debug

Như mình nói ở trên, nếu timing không khớp thì GDB VS code sẽ không kết nối được mà bị timeout

Do đó ta dùng 1 trick là hẹn giờ cho việc bật debug rồi thoát khỏi serial terminal

Các bạn tắt debug bên VS code này, bật serial terminal lên

```bash
root@beaglebone:~# (sleep 10; echo g > /proc/sysrq-trigger) &
```

Vậy là sau 10s nó mới gửi lệnh để tạm dừng kernel

Giờ bên VS code các bạn đợi 10s rồi mở lại debug

Mặc dù kết nối vào được, nhưng ta thấy kernel rồi lại vẫn chạy tiếp ? Bởi vì ta vốn dĩ không đặt breakpoint, nhưng đặt đâu cho chắc chắn kernel sẽ nhảy vào.

Các bạn nhìn board bây giờ, thì thấy đèn nháy đúng không ? Vậy ta đặt vào hàm blinkled chứ còn gì nữa.

![](/uploads/2026/04/screenshot-from-2026-04-04-15-36-41.png)

Và thế là dừng được rồi, ta có thể debug có giao diện khá hay ho nhỉ :vv

Chúc các bạn thực hành thành công !!

P/s: Tuy nhiên đây vẫn chưa phải debug kernel từ dòng đầu tiên, nên chắc mình sẽ cần nghiên cứu thêm
