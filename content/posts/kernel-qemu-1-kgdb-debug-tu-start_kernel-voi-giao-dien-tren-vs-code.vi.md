---
title: '[Kernel-QEMU] 1. KGDB debug từ start_kernel với giao diện trên VS Code'
date: '2026-05-02T06:27:00+07:00'
lastmod: '2026-04-13T10:09:13+07:00'
slug: kernel-qemu-1-kgdb-debug-tu-start_kernel-voi-giao-dien-tren-vs-code
url: /2026/05/02/kernel-qemu-1-kgdb-debug-tu-start_kernel-voi-giao-dien-tren-vs-code/
categories:
- QEMU
- kgdb
tags:
- BootProcess
- Linux
- Kernel-QEMU
boards:
- QEMU
image: /uploads/2026/04/screenshot-from-2026-04-05-09-25-55.png
description: Như mình đã nói bên bài Kernel-BBB 2, hiện tại nếu không dùng JTAG bên BBB thì khả năng sẽ không debug kernel từ dòng đầu tiên được. Do đó mình sẽ quay sang …
wp_id: 2135
---

Như mình đã nói bên bài Kernel-BBB 2, hiện tại nếu không dùng JTAG bên BBB thì khả năng sẽ không debug kernel từ dòng đầu tiên được. Do đó mình sẽ quay sang hướng QEMU để kiểm soát toàn bộ vụ code này.

À với bài này mình sẽ clone từ source và build các thành phần liên quan, không dùng Yocto nữa (If yocto is my strength, what am i without Yocto :vv Haha)

## 1. Cài đặt các package cần thiết

Lượn lờ một loạn các Prerequisites của từng project, ta sẽ có được các package cần thiết. Ở đây mình sẽ phải cần cross-compiler, kernel, QEMU, busybox, gdb-multiarch

```bash
# Cross-compiler arm64
sudo apt-get install -y gcc-aarch64-linux-gnu

# Build tools kernel
sudo apt-get install -y build-essential flex bison libssl-dev libelf-dev \
    bc dwarves pahole

# Build tools QEMU
sudo apt-get install -y ninja-build pkg-config libglib2.0-dev libpixman-1-dev \
    python3-venv

# GDB multiarch (debug cross-arch)
sudo apt-get install -y gdb-multiarch
```

## 2. Clone và build source code

### 2.1 Linux kernel (linux-next)

#### 2.1.1 Clone Linux Kernel

Mình clone kernel developement tree về, clone đầy đủ. Hoặc bạn có thể clone mainline linux về

```bash
mkdir -p ~/kernel-qemu/ && cd ~/kernel-qemu

git clone --depth 1 https://git.kernel.org/pub/scm/linux/kernel/git/next/linux-next.git

cd  linux-next
```

#### 2.1.2 Cấu hình và build

Ta tạo defconfig

```bash
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- defconfig
```

Ta bật tiếp config cho kgdb và các feature hỗ trợ debug

```bash
./scripts/config --enable DEBUG_INFO
./scripts/config --enable DEBUG_INFO_DWARF5
./scripts/config --enable GDB_SCRIPTS
./scripts/config --enable FRAME_POINTER
./scripts/config --enable KGDB
./scripts/config --enable KGDB_SERIAL_CONSOLE
./scripts/config --enable DEBUG_KERNEL

./scripts/config --disable RANDOMIZE_BASE
./scripts/config --enable EARLY_PRINTK
./scripts/config --enable DYNAMIC_DEBUG
./scripts/config --enable FTRACE
./scripts/config --enable MAGIC_SYSRQ
./scripts/config --enable DETECT_HUNG_TASK
./scripts/config --enable PROVE_LOCKING
```

Rồi build thôi (Nếu phải lựa chọn gì thì tạm thời bạn cứ bấm Enter 1 loạt nhé)

```bash
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- -j$(nproc)
```

Build lần đầu sẽ khá lâu và ta lưu ý đến 2 file output sau

```bash
arch/arm64/boot/Image    ← Binary kernel image (QEMU load file này)
vmlinux                  ← ELF với debug symbols (GDB dùng file này)
```

### 2.2 QEMU

#### 2.2.1 Clone QEMU

```bash
mkdir -p ~/kernel-qemu/ && cd ~/kernel-qemu

git clone https://gitlab.com/qemu-project/qemu.git
cd qemu

git submodule update --init --recursive
```

#### 2.2.2 Build QEMU cho aarch64

```bash
cd ~/kernel-qemu/qemu

mkdir -p build-aarch64 && cd build-aarch64
../configure --target-list=aarch64-softmmu --enable-debug

make -j$(nproc)
```

Sau khi build xong output sẽ nằm ở

```bash
~/kernel-qemu/qemu/build-aarch64/qemu-system-aarch64
```

Ta Kiểm tra bằn cách

```bash
~/kernel-qemu/qemu/build-aarch64/qemu-system-aarch64 --version
```

### 2.3 BusyBox

Clone và cấu hình build

```bash
cd ~/kernel-qemu

git clone https://git.busybox.net/busybox
cd busybox

# Default config
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- defconfig

sed -i 's/# CONFIG_STATIC is not set/CONFIG_STATIC=y/' .config

# Build
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- -j$(nproc)

make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- install
```

Output giờ nằm trong _install/

## 3. Tạo root filesystem và đóng gói thành initramfs

Vụ tạo root filesystem thủ công này mình cũng từng hướng dẫn các bạn qua bài [Boot-BBB 4](/2025/11/15/boot-bbb-4-tao-root-filesystem-thu-cong-voi-busybox/) đó, các bạn có thể tham khảo lại series để hiểu kĩ hơn.

```bash
cd ~/kernel-qemu/

mkdir -p initramfs/{bin,sbin,etc,proc,sys,dev,tmp,usr/bin,usr/sbin}

cp -a busybox/_install/* initramfs/

cat > initramfs/init  ../initramfs.cpio.gz
cd ..
```

Về cơ bản sẽ là tạo cấu trúc folder root, đoạn mkdir command đầu này

Rồi sẽ tạo init script, mount các pseudo file, rồi chạy /bin/sh để lên shell

Ở đây initramfs là init-ram-filesystem. Tức mình đang nén lại thành cpio, rồi khi chạy sẽ giải nén root file system trên RAM luôn. Như BBB là minh có thẻ nhớ phân vùng thật nên là tạo file thật. Còn ở đây QEMU mình đang không chia phân vùng riêng cho nó, nên để RFS trên RAM luôn cho tiện.

## 4. Khởi chạy QEMU

Vậy là đủ để ta thử debug QEMU rồi

```bash
~/kernel-qemu/qemu/build-aarch64/qemu-system-aarch64 \
    -machine virt \
    -cpu cortex-a57 \
    -nographic \
    -smp 1 \
    -m 512M \
    -kernel ~/kernel-qemu/linux-next/arch/arm64/boot/Image \
    -initrd ~/kernel-qemu/initramfs.cpio.gz \
    -append "console=ttyAMA0 nokaslr" \
    -s -S
```

- -machine virt : virtual platform do QEMU tự định nghĩa, không mô phỏng board nào cả
- -cpu cortex-a57 : CPU model (aarch64)
- -nographic: tắt GUI, dùng CLI thôi :vv
- -smp 1 : Symmetric Multi-Processing Là 1 core thôi, sau khi học context switch giữa các core sẽ nâng lên 2, 4 sau :vv
- -m 512M : 512MB RAM
- -kernel ...IMAGE : load kernel trực tiếp vào RAM, bỏ qua bootloader. Mình sẽ hướng dẫn dùng cả u-boot ở các bài sau
- -initrd : nạp initramfs
- append: kernel command line
- -s : -gdb tcp::1234 . Kiểu default port
- -S : đóng bang CPU ngay khi khởi động, CPU không chạy instructions nào cho đến khi GDB connect

Và từ 1 terminal khác bạn chạy gdb

```bash
cd ~/kernel-qemu/linux-next
gdb-multiarch vmlinux
```

Rồi gõ các lệnh như ảnh dưới

```bash
target remote localhost:1234
break start_kernel
continue
list
```

![](/uploads/2026/04/image-12.png)

## 5. Setup launch.json VS Code

Thì các bạn lại vào linux-next folder, tạo launch.json lên khá y hệt như bài [Yocto-BBB 18](/2026/03/31/yocto-bbb-18-debug-qua-recipe-sysroot/)

Ở đây mình mở, folder rồi tạo tại .vscode/launch.json

(**các bạn lưu ý đổi lại sourceFileMap theo đúng địa chỉ linux-next các bạn clone về nhé** )

![](/uploads/2026/04/image-14.png)

{{% details title="Nội dung như sau" closed="true" %}}

```bash
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Kernel Debug (QEMU aarch64)",
      "type": "cppdbg",
      "request": "launch",
      "program": "${workspaceFolder}/vmlinux",
      "args": [],
      "stopAtEntry": true,
      "cwd": "${workspaceFolder}",
      "environment": [],
      "externalConsole": false,
      "MIMode": "gdb",
      "miDebuggerPath": "gdb-multiarch",
      "miDebuggerServerAddress": "localhost:1234",
      "setupCommands": [
        {
          "description": "Enable pretty-printing",
          "text": "-enable-pretty-printing",
          "ignoreFailures": true
        },
        {
          "description": "Set architecture to aarch64",
          "text": "set architecture aarch64",
          "ignoreFailures": false
        },
        {
          "description": "Load kernel GDB helper scripts",
          "text": "source ${workspaceFolder}/scripts/gdb/vmlinux-gdb.py",
          "ignoreFailures": true
        },
        {
          "description": "Disable pagination",
          "text": "set pagination off",
          "ignoreFailures": true
        },
        {
          "description": "Set auto-load safe-path",
          "text": "set auto-load safe-path ${workspaceFolder}",
          "ignoreFailures": true
        }
      ],
      "sourceFileMap": {
        "/home/zk47/kernel-qemu/linux-next": "${workspaceFolder}"
      }
    }
  ]
}
```

{{% /details %}}

Giờ bạn vào init/main.c và đặt break point tại start_kernel ok rồi nhé

![](/uploads/2026/04/image-15.png)

Lưu ý mỗi lần các bạn bấm nút hủy phiên gdb, thì qemu cũng sẽ tắt, do đó sẽ cần bật lại nhé, các bạn bấm restart cũng vậy

Chúc các bạn thực hành thành công :vv !!
