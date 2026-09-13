---
title: '[C-MCU] 1. Build Process chương trình code C'
date: '2025-12-20T06:57:00+07:00'
lastmod: '2025-12-20T07:38:01+07:00'
slug: c-mcu-1-build-process-chuong-trinh-code-c
url: /2025/12/20/c-mcu-1-build-process-chuong-trinh-code-c/
categories:
- BuildProcess
- C-MCU
- GCC
series:
- C-MCU
series_order: 1
image: /uploads/2025/12/stm32f103c8-microcontroller-mcu.jpg
description: Các bạn đã code 1 chương trình với ngôn ngữ C nhiều, nhưng đã bao giờ các bạn thắc mắc nó sẽ chạy những cái gì đằng sau trước khi ra được file executable sau…
wp_id: 1507
---

Các bạn đã code 1 chương trình với ngôn ngữ C nhiều, nhưng đã bao giờ các bạn thắc mắc nó sẽ chạy những cái gì đằng sau trước khi ra được file executable sau cùng không. Hôm nay mình sẽ giải thích điều đó

## 1. Chuẩn bị máy host

Để phục vụ cho bài hôm nay, các bạn cần chuẩn bị GCC để compile code C, về câu lệnh thì không có sự khác nhau nhiều giữa 2 bên. Các bạn có thể tham khảo cách cài tại [Cách cài đặt gcc trên Windows và Ubuntu](/2024/10/19/cach-cai-dat-gcc-tren-windows-va-ubuntu/)

Vậy là ta đã có GCC, khi cài bên Windows các bạn nhớ lựa chọn để thêm PATH Gcc vào biến môi trường nhé.

Bình thường code bằng VS code, hoặc Dev C++ thì ta sẽ cần Compiler riêng như này. Nhưng nếu các bạn cài các IDE như Visual Studio, hoặc CLion, nó sẽ có các Compiler tích hợp sẵn, khiến bạn chỉ cần tải về và dùng.

Tuy nhiên, đặc điểm của các IDE này là cực kỳ ngốn RAM :vv .

![](/uploads/2025/12/image-13.png)

## 2. Các bước khi build chương trình C

Quá trình build (Build process) là một chuỗi các bước xử lý mà trong đó các file mã nguồn (như .c, .cpp, …) được sử dụng làm đầu vào, và kết quả đầu ra là các file nhị phân có thể sử dụng (hex, bin, exe,…).

Nó bao gồm 4 giai đoạn chính

![](/uploads/2025/12/image-14.png)

- Preprocessor (Tiền xử lý): Xóa bỏ toàn bộ comment, include các thư viện cần thiết. Input: .c, .cpp --> Output : .i
- Compile (Biên dịch) Biên dịch code C sang code assembly. Input : .i --> Output: .s, .asm
- Assembler: Input: .s, .asm --> Output: .o . Output ở đây sẽ là các object file.
- Linking : Ta link các object file, các thư viện tĩnh lại (.a, .lib) . Input: .o, .a --> Output: .exe, executable file

## 3. Chạy gcc thôi

Mình sẽ minh họa về quá trình build trên với 3 file, main.c, library.h, library.c

Mình sẽ để code tại đây <https://github.com/Zk47T/C-MCU/tree/main/1-build-process>

Mình sẽ có 1 chương trình gốc là main.c, thư viện library.h, library.c

{{% details title="main.c" closed="true" %}}

```cpp
#include "library.h"
int main(void) {
    int x = DEFAULT_X;   // sẽ được preprocessor thay bằng 2
    int y = DEFAULT_Y;   // sẽ được preprocessor thay bằng 3
    int result = add(x, y);
    return result;
}
```

{{% /details %}}

{{% details title="library.h" closed="true" %}}

```cpp
#define DEFAULT_X 2
#define DEFAULT_Y 3
int add(int a, int b);
//End of library
```

{{% /details %}}

{{% details title="library.c" closed="true" %}}

```cpp
#include "library.h"
int add(int a, int b) {
    return a + b;
}
```

{{% /details %}}

Ta chạy câu lệnh sau để nó output toàn bộ các file, chứ không chỉ file executable sau cùng

```bash
gcc -Wall -save-temps main.c library.c -o demo
```

![](/uploads/2025/12/image-15.png)

1 Loạt file đã được tạo ra, ta đi lần lượt các file .i, .s, .o, rồi executable file (demo) sau cùng

### 3.1 Tiền xử lý Preprocessor

![](/uploads/2025/12/image-18.png)

Ta đã thấy Quá trình Tiền xử lý đã xóa đi các comment, thay thế trực tiếp các vị trí dùng Macro (DEFAULT_X, DEFAULT_Y) bằng giá trị tương ứng.

### 3.2 Biên dịch

Quá trình này sẽ tạo ra file asssembly

![](/uploads/2025/12/image-19.png)

### 3.3 Assembler

Từ file assembly chuyển thành file object, như ở đây là định dạng ELF, không xem được bằng text file thường mà cần các công cụ chuyên dụng hơn như objdump

![](/uploads/2025/12/image-20.png)

1 file elf là Executable Linker format, ta cùng kiểm tra elf header file của demo-library.o

```bash
objdump -h demo-library.o
demo-library.o:     file format elf64-x86-64
Sections:
Idx Name          Size      VMA               LMA               File off  Algn
  0 .text         00000018  0000000000000000  0000000000000000  00000040  2**0
                  CONTENTS, ALLOC, LOAD, READONLY, CODE
  1 .data         00000000  0000000000000000  0000000000000000  00000058  2**0
                  CONTENTS, ALLOC, LOAD, DATA
  2 .bss          00000000  0000000000000000  0000000000000000  00000058  2**0
                  ALLOC
  3 .comment      0000002e  0000000000000000  0000000000000000  00000058  2**0
                  CONTENTS, READONLY
  4 .note.GNU-stack 00000000  0000000000000000  0000000000000000  00000086  2**0
                  CONTENTS, READONLY
  5 .note.gnu.property 00000020  0000000000000000  0000000000000000  00000088  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  6 .eh_frame     00000038  0000000000000000  0000000000000000  000000a8  2**3
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, DATA
```

Cái này sẽ còn liên quan đến Memory Layout, và Linker Script,... Mình sẽ giải thích kĩ hơn ở bài sau. Ở bài này các bạn hiểu là đến đây, chương trình đã biên dịch sang mã máy, đối với Linux, ta sẽ tạo các section, trong object file để Linker ở giai đoạn sau dễ hiểu.

Thực tế quá trình Assembler này cũng rất phức tạp. Ở bài này các bạn hiểu là quá trình này sẽ chuyển code asm sang thành mã máy. Nó sẽ gồm các bước

- Đọc và phân tích file assmebly, bỏ khoảng trắng
- Chuyển code asm thành machine code (opcodes)
- Xử lý label, symbol
- Chia các section trong object file như elf header file kia
- Tạo bảng symbol
- Đóng gói tất cả vào 1 object file

### 3.4 Linking

Đúng như tên gọi của nó, bước này là bước ta sẽ link hết các object file lại để tạo ra file thực thi sau cùng.

Vậy thực tế là library.c và main.c đến bứớc Assembler vẫn đang độc lập với nhau. Bằng chứng các bạn có thể xóa hết các file output trước, và chạy lại lệnh sau để chỉ dừng tại bước Assembler file main.c thôi

```bash
gcc -Wall -save-temps -c main.c -o main.o
```

Ta vẫn sẽ thấy ra 3 file là main.i, main.o, main.s

Nhưng đến bước Linking, ta thật sự build ra executable file sau cùng, mà chỉ dùng main.o không có library.o, ta sẽ găp lỗi

```bash
gcc main.o -o demo
/usr/bin/ld: main.o: in function `main':
main.c:(.text+0x25): undefined reference to `add'
collect2: error: ld returned 1 exit status
```

Tức là GCC không hiểu hàm add là gì cả, ta dùng nhưng ko có chỗ định nghĩa

Okay, đến đây các bạn đã hiểu về Build Process trong C rồi chứ.

Ở bài tới mình sẽ nói rõ hơn về **Memory Layout, Function Call Stack**
