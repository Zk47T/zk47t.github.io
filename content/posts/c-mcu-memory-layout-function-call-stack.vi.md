---
title: '[C-MCU] 2. Memory Layout trong chương trình C'
date: '2025-12-27T06:54:00+07:00'
lastmod: '2025-12-25T21:40:33+07:00'
slug: c-mcu-memory-layout-function-call-stack
url: /2025/12/27/c-mcu-memory-layout-function-call-stack/
categories:
- BuildProcess
- C-MCU
- GCC
- Linux
series:
- C-MCU
series_order: 2
image: /uploads/2025/12/stm32f103c8-microcontroller-mcu.jpg
description: Ở bài trước, ta đã tìm hiểu về Build Process 1 chương trình code C, nay mình sẽ nói tiếp về Memory Layout (Các phân vùng trên bộ nhớ)
wp_id: 1495
---

Ở bài trước, ta đã tìm hiểu về Build Process 1 chương trình code C, nay mình sẽ nói tiếp về Memory Layout (Các phân vùng trên bộ nhớ)

## 1. Tổng quan

![](/uploads/2025/12/image-21.png)

Tương tự với bài trước, khi ta kiểm tra elf header bằng objdump với file object file, ta sẽ thấy (Đây là elf64-x86-64 sẽ có sự khác biệt nhất định với elf của MCU, mình sẽ nói kỹ hơn trên phần demo MCU sau)

```cpp
zk47@ltu:~/Learning/C-MCU/1-build-process$ objdump -h main.o

main.o:     file format elf64-x86-64

Sections:
Idx Name          Size      VMA               LMA               File off  Algn
  0 .text         00000031  0000000000000000  0000000000000000  00000040  2**0
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, CODE
  1 .data         00000000  0000000000000000  0000000000000000  00000071  2**0
                  CONTENTS, ALLOC, LOAD, DATA
  2 .bss          00000000  0000000000000000  0000000000000000  00000071  2**0
                  ALLOC
  3 .comment      0000002e  0000000000000000  0000000000000000  00000071  2**0
                  CONTENTS, READONLY
  4 .note.GNU-stack 00000000  0000000000000000  0000000000000000  0000009f  2**0
                  CONTENTS, READONLY
  5 .note.gnu.property 00000020  0000000000000000  0000000000000000  000000a0  2**3
                  CONTENTS, ALLOC, LOAD, READONLY, DATA
  6 .eh_frame     00000038  0000000000000000  0000000000000000  000000c0  2**3
                  CONTENTS, ALLOC, LOAD, RELOC, READONLY, DATA
```

Đó chính là bước mà khi ta build code, nó sẽ đến bước Assembler để chia ra các section, chỗ lưu code

Giờ mình nói qua về lý thuyết trước, sắp tới đến phần debug trên board ta sẽ thấy rõ ràng hơn từng phân khu

### 1.1 Vùng Text code (.text)

Chứa **mã máy** của chương trình (các hàm đã compile).

Thường là `read-only` (không cho ghi) để:

- Tránh code tự ghi đè chính nó.
- Cho phép nhiều process share cùng 1 bản code trong RAM.

Kích thước cố định sau khi chương trình được load.

### 1.2 Vùng Initiilized Data (.data)

Chứa **biến toàn cục hoặc static có khởi tạo giá trị khác 0**.

Được cấp phát khi chương trình bắt đầu chạy, tồn tại suốt vòng đời chương trình.

Thường được chia thành:

- `.data` (read/write) – giá trị khởi tạo được lưu trong file thực thi.

Ví dụ

```cpp
int g_value = 10;         // global, có khởi tạo -> .data
static int s_count = 5;   // static global, có khởi tạo -> .data

int main(void) {
    static int local_static = 1; // static local, có khởi tạo -> .data
    return 0;
}
```

### 1.3 BSS segment (.bss)

- Chứa **biến toàn cục hoặc static KHÔNG khởi tạo hoặc khởi tạo = 0**.

- Khi chương trình bắt đầu, OS sẽ ghi 0 toàn bộ vùng này.

```cpp
int g_uninit;           // global, không khởi tạo -> .bss
static int s_flag;      // static global, không khởi tạo -> .bss

int main(void) {
    static int local_static_zero; // static local, không khởi tạo -> .bss
    return 0;
}
```

### 1.4 Heap

- Vùng nhớ **dùng để cấp phát động** (dynamic allocation).

- Được quản lý bằng các hàm: `malloc`, `calloc`, `realloc`, `free` (C).

- Kích thước **thay đổi linh hoạt** trong lúc chạy.

- Lỗi hay gặp:
  - Memory leak (cấp phát mà không free).
  - Use-after-free, double free.

```cpp
#include

int main(void) {
    int *p = malloc(10 * sizeof(int)); // vùng nhớ này nằm trên Heap
    if (p == NULL) return -1;

    free(p); // giải phóng vùng Heap
    return 0;
}
```

### 1.5 Stack

- Vùng nhớ dùng cho:
  - **Biến local** (không có `static`).
  - **Tham số hàm**, địa chỉ trả về, các register lưu tạm…
- Cấu trúc **LIFO (Last In, First Out)**:
  - Mỗi lần gọi hàm -> tạo 1 **stack frame** mới.
  - Hết hàm -> frame bị pop, biến local bị hủy.
- Kích thước stack thường giới hạn, có thể gây **stack overflow** (do đệ quy sâu, mảng local quá lớn).

```cpp
int add(int a, int b) {
    int sum = a + b;   // sum nằm trên Stack (trong stack frame của add)
    return sum;
}

int main(void) {
    int x = 2;         // x, y nằm trên Stack (trong frame của main)
    int y = 3;
    int result = add(x, y); // khi gọi add -> tạo frame mới trên Stack
    return 0;
}
```

## 2. Linker Script

Tuy nhiên các bạn có thắc mắc, là có các phân vùng như thế. Nhưng ai, cái gì sẽ quy định độ rộng, vị trí bắt đầu kết thúc của từng phân vùng ? Đó chính là Linker Script file

Nội dung, sẽ về quy định các mục như trên. File này có đuôi .ld trên STM32IDE, ví dụ như sau

![](/uploads/2025/12/image-23.png)

{{% details title="Nội dung đầy đủ file STM32MP157CAAX_RAM.ld" closed="true" %}}

```bash
/*
******************************************************************************
**
**  File        : LinkerScript.ld
**
**  Abstract    : Linker script for STM32MP1 series
**
**                Set heap size, stack size and stack location according
**                to application requirements.
**
**                Set memory bank area and size if external memory is used.
**
**  Target      : STMicroelectronics STM32
**
**  Distribution: The file is distributed as is, without any warranty
**                of any kind.
**
*****************************************************************************
*/

/* Entry Point */
ENTRY(Reset_Handler)

/* Highest address of the user mode stack */
_estack = 0x10040000;    /* end of RAM */

_Min_Heap_Size = 0x200 ;  /* required amount of heap  */
_Min_Stack_Size = 0x400 ; /* required amount of stack */

/* Memories definition */
MEMORY
{
  m_interrupts (RX)  : ORIGIN = 0x00000000, LENGTH = 0x00000298
  m_text       (RX)  : ORIGIN = 0x10000000, LENGTH = 0x00020000
  m_data       (RW)  : ORIGIN = 0x10020000, LENGTH = 0x00020000
  m_ipc_shm    (RW)  : ORIGIN = 0x10040000, LENGTH = 0x00008000
}

 /* Symbols needed for OpenAMP to enable rpmsg */
__OPENAMP_region_start__  = ORIGIN(m_ipc_shm);
__OPENAMP_region_end__ = ORIGIN(m_ipc_shm)+LENGTH(m_ipc_shm);

/* Sections */
SECTIONS
{
  /* The startup code into ROM memory */
  .isr_vector :
  {
    . = ALIGN(4);
    KEEP(*(.isr_vector)) /* Startup code */
    . = ALIGN(4);
  } > m_interrupts

  /* The program code and other data into ROM memory */
  .text :
  {
    . = ALIGN(4);
    *(.text)           /* .text sections (code) */
    *(.text*)          /* .text* sections (code) */
    *(.glue_7)         /* glue arm to thumb code */
    *(.glue_7t)        /* glue thumb to arm code */
    *(.eh_frame)

    KEEP (*(.init))
    KEEP (*(.fini))

    . = ALIGN(4);
    _etext = .;        /* define a global symbols at end of code */
  } > m_text

  /* Constant data into ROM memory*/
  .rodata :
  {
    . = ALIGN(4);
    *(.rodata)         /* .rodata sections (constants, strings, etc.) */
    *(.rodata*)        /* .rodata* sections (constants, strings, etc.) */
    . = ALIGN(4);
  } > m_text

  .ARM.extab (READONLY) : /* The READONLY keyword is only supported in GCC11 and later, remove it if using GCC10 or earlier. */
  {
    . = ALIGN(4);
    *(.ARM.extab* .gnu.linkonce.armextab.*)
    . = ALIGN(4);
  } > m_text

  .ARM (READONLY) : /* The READONLY keyword is only supported in GCC11 and later, remove it if using GCC10 or earlier. */
  {
    . = ALIGN(4);
    __exidx_start = .;
    *(.ARM.exidx*)
    __exidx_end = .;
    . = ALIGN(4);
  } > m_text

  .preinit_array (READONLY) : /* The READONLY keyword is only supported in GCC11 and later, remove it if using GCC10 or earlier. */
  {
    . = ALIGN(4);
    PROVIDE_HIDDEN (__preinit_array_start = .);
    KEEP (*(.preinit_array*))
    PROVIDE_HIDDEN (__preinit_array_end = .);
    . = ALIGN(4);
  } > m_text

  .init_array (READONLY) : /* The READONLY keyword is only supported in GCC11 and later, remove it if using GCC10 or earlier. */
  {
    . = ALIGN(4);
    PROVIDE_HIDDEN (__init_array_start = .);
    KEEP (*(SORT(.init_array.*)))
    KEEP (*(.init_array*))
    PROVIDE_HIDDEN (__init_array_end = .);
    . = ALIGN(4);
  } > m_text

  .fini_array (READONLY) : /* The READONLY keyword is only supported in GCC11 and later, remove it if using GCC10 or earlier. */
  {
    . = ALIGN(4);
    PROVIDE_HIDDEN (__fini_array_start = .);
    KEEP (*(SORT(.fini_array.*)))
    KEEP (*(.fini_array*))
    PROVIDE_HIDDEN (__fini_array_end = .);
    . = ALIGN(4);
  } > m_text

  /* Used by the startup to initialize data */
  __DATA_ROM = .;
  _sidata = LOADADDR(.data);

  /* Initialized data sections */
  .data :  AT(__DATA_ROM)
  {
    . = ALIGN(4);
    _sdata = .;        /* create a global symbol at data start */
    *(.data)           /* .data sections */
    *(.data*)          /* .data* sections */

    . = ALIGN(4);
    _edata = .;        /* define a global symbol at data end */
  } > m_data

  __DATA_END = __DATA_ROM + (_edata - _sdata);
  text_end = ORIGIN(m_text) + LENGTH(m_text);
  ASSERT(__DATA_END  m_data
  _eirsc = LOADADDR(.resource_table) + SIZEOF(.resource_table);
  ASSERT(SIZEOF(.resource_table) == 0 || _eirsc  m_data

  /* User_heap_stack section, used to check that there is enough RAM left */
  ._user_heap_stack :
  {
    . = ALIGN(8);
    PROVIDE ( end = . );
    PROVIDE ( _end = . );
    . = . + _Min_Heap_Size;
    . = . + _Min_Stack_Size;
    . = ALIGN(8);
  } > m_data

  /* Remove information from the compiler libraries */
  /DISCARD/ :
  {
    libc.a ( * )
    libm.a ( * )
    libgcc.a ( * )
  }

  .ARM.attributes 0 : { *(.ARM.attributes) }

}
```

{{% /details %}}

Từ file linker script ta sẽ có được địa chỉ sương sương của từng vùng

```cpp
(địa chỉ CAO hơn)

+-------------------------+
| Stack (local variables) |  <-- _estack = 0x10040000
|   &local, &p            |
|   (giảm dần địa chỉ)    |
+-------------------------+
|   (vùng trống / guard)  |  <-- ~0x1003xxxx
+-------------------------+
| Heap (malloc/free)      |  <-- bắt đầu từ _end ≈ 0x1002yyyy
|   *p                    |
|   (tăng dần địa chỉ)    |
+-------------------------+
| BSS (global/static = 0) |  <-- _ebss ≈ 0x1002zzzz
|   g_uninit, s_flag      |
|   _sbss ... _ebss       |  <-- _sbss ≈ 0x1002yyyy
+-------------------------+
| Data (global/static     |  <-- _edata ≈ 0x1002xxxx
|  có khởi tạo ≠ 0)       |
|   g_value, s_count,     |
|   s_local               |
|   _sdata = 0x10020000   |  <-- 0x10020000
+-------------------------+
| Text/Code + rodata      |  <-- gần 0x1001FFFF (< 0x10020000)
|   code (main, v.v.)     |
|   const g_const         |
|   m_text:               |
|   0x10000000            |  <-- 0x10000000 (địa chỉ THẤP)
|   .. < 0x10020000       |
+-------------------------+

(địa chỉ THẤP hơn)
```

Mình sẽ có 1 bài thực hành với Linker Script sau, các bạn đón đọc nhé !!

## 3. Demo Memory Layout Cortex M4

Okay, để demo mình sẽ để 1 chương trình C nội dung tương tự như sau, rồi ta debug, và soi sang Linker Script xem có đúng như lý thuyết không nhé ?

```cpp
#include
#include

int g_value = 10;          // .data
int g_uninit;              // .bss
volatile const int g_const = 42;    // thường nằm ở text/rodata (read-only)

static int s_count = 5;    // .data
static int s_flag;         // .bss

int main(void) {
    int local = 1;         // Stack
    static int s_local = 2;// .data

    int *p = malloc(4 * sizeof(int)); // p (con trỏ) trên Stack
                                      // *p (vùng dữ liệu) trên Heap
    if (!p) return -1;

    p[0] = 100;

    printf("%d\n", p[0]);
    g_uninit = g_value + s_count + s_local;
    s_flag   = g_uninit + (int)g_const + local;

    free(p);
    return 0;
}
```

Ta debug, và được trước hết là các giá trị sau

Ở đây thì mình không chỉ khai báo, mà phải thật sự dùng chúng, tránh việc compiler thấy không dùng là sẽ tối ưu bỏ đi luôn. Với g_const mình phải thêm volatile, tránh việc thay thế giá trị trực tiếp cho các const.

![](/uploads/2025/12/image-25.png)

Ta đã thấy giá trị của từng biến rồi, giờ ta check địa chỉ của chúng xem lần lượt nó nằm đâu nhé

Giờ ta sẽ kiểm tra địa chỉ từng biến bằng cách thêm & vào đằng trước mỗi biến trong tag Expression

![](/uploads/2025/12/image-27.png)

Ánh xạ:

- `g_const = 0x100047f0`\
  → Nằm trong `m_text`: `[0x10000000 .. < 0x10020000]`\
  → Đúng vùng `Text/rodata`.
- `g_value = 0x10020000`
- `s_count = 0x10020004`
- `s_local = 0x10020008`\
  → Bắt đầu đúng tại `0x10020000` → vùng `.data` của `m_data`.\
  → Rất khớp đoạn: `_sdata = 0x10020000`.
- `s_flag = 0x100200a4`\
  → Cũng trong vùng `0x1002xxxx`, nằm sau `.data` → thuộc vùng `RAM .bss/RW`, đúng ý bạn để minh hoạ BSS (global/static = 0).
- `local = 0x1003fff4`
- `&p = 0x1003fff0`\
  → Cả hai đều **rất sát** `_estack = 0x10040000`\
  → Đúng vùng `Stack` (cao nhất, giảm dần địa chỉ).

Vậy là chuẩn rồi nhỉ :vv

```cpp
(địa chỉ CAO hơn)

0x10040000  --> _estack
+-------------------------+
| Stack (local variables) |
|   &local  = 0x1003fff4  |
|   &p      = 0x1003fff0  |
|   (giảm dần địa chỉ)    |
+-------------------------+
|   (vùng trống / guard)  |
+-------------------------+
| Heap (malloc/free)      |
|   *p  (địa chỉ xem      |
|        bằng giá trị p)  |
+-------------------------+
| BSS (global/static = 0) |
|   &s_flag = 0x100200a4  |
+-------------------------+
| Data (.data)            |
|   &g_value = 0x10020000 |
|   &s_count = 0x10020004 |
|   &s_local = 0x10020008 |
|   _sdata   = 0x10020000 |
+-------------------------+
| Text/Code + rodata      |
|   &g_const = 0x100047f0 |
|   m_text:               |
|   0x10000000 .. <       |
|              0x10020000 |
+-------------------------+

(địa chỉ THẤP hơn)
```

Bài tới mình sẽ nói về Function Call Stack

Mong được các bạn tiếp tục đón đọc và ủng hộ !!
