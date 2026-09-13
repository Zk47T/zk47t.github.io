---
title: '[C-MCU] 2. Memory Layout in a C program'
date: '2025-12-27T06:54:00+07:00'
lastmod: '2025-12-25T21:40:33+07:00'
slug: c-mcu-memory-layout-function-call-stack
url: /en/2025/12/27/c-mcu-memory-layout-function-call-stack/
categories:
- BuildProcess
- C-MCU
- GCC
- Linux
series:
- C-MCU
series_order: 2
image: /uploads/2025/12/stm32f103c8-microcontroller-mcu.jpg
description: 'The .text, .data, .bss, heap and stack regions of a C program, how the linker script defines them, and a Cortex-M4 debug session checking every variable''s address against the theory.'
wp_id: 1495
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
In the previous post we looked at the Build Process of a C program; now I continue with the Memory Layout (the regions of memory)

## 1. Overview

![](/uploads/2025/12/image-21.png)

As in the previous post, when we inspect the elf header of the object file with objdump we see (this is elf64-x86-64, which differs somewhat from an MCU's elf; I will cover that in more detail in the MCU demo below)

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

That is the step where, when we build the code, it reaches the Assembler step and splits it into sections, the places where code is stored

Let me go over the theory first; later, when we debug on the board, we will see each region more clearly

### 1.1 Text code region (.text)

Contains the **machine code** of the program (the compiled functions).

Usually `read-only` (no writing) in order to:

- Prevent code from overwriting itself.
- Allow many processes to share one copy of the code in RAM.

Its size is fixed once the program is loaded.

### 1.2 Initialized Data region (.data)

Contains **global or static variables initialised to a non-zero value**.

Allocated when the program starts running, it lives for the whole lifetime of the program.

Usually divided into:

- `.data` (read/write): the initial values are stored in the executable file.

Example

```cpp
int g_value = 10;         // global, initialised -> .data
static int s_count = 5;   // static global, initialised -> .data

int main(void) {
    static int local_static = 1; // static local, initialised -> .data
    return 0;
}
```

### 1.3 BSS segment (.bss)

- Contains **global or static variables that are NOT initialised or initialised to 0**.

- When the program starts, the OS writes 0 over this whole region.

```cpp
int g_uninit;           // global, not initialised -> .bss
static int s_flag;      // static global, not initialised -> .bss

int main(void) {
    static int local_static_zero; // static local, not initialised -> .bss
    return 0;
}
```

### 1.4 Heap

- The memory region **used for dynamic allocation**.

- Managed with the functions `malloc`, `calloc`, `realloc`, `free` (C).

- Its size **changes flexibly** at runtime.

- Common mistakes:
  - Memory leak (allocating without freeing).
  - Use-after-free, double free.

```cpp
#include

int main(void) {
    int *p = malloc(10 * sizeof(int)); // this memory lives on the Heap
    if (p == NULL) return -1;

    free(p); // free the Heap memory
    return 0;
}
```

### 1.5 Stack

- The memory region used for:
  - **Local variables** (without `static`).
  - **Function parameters**, return addresses, temporarily saved registers…
- **LIFO (Last In, First Out)** structure:
  - Every function call -> creates a new **stack frame**.
  - When the function ends -> the frame is popped, local variables are destroyed.
- The stack size is usually limited and can cause a **stack overflow** (deep recursion, very large local arrays).

```cpp
int add(int a, int b) {
    int sum = a + b;   // sum lives on the Stack (in add's stack frame)
    return sum;
}

int main(void) {
    int x = 2;         // x, y live on the Stack (in main's frame)
    int y = 3;
    int result = add(x, y); // calling add -> a new frame on the Stack
    return 0;
}
```

## 2. Linker Script

But you may wonder: there are regions like these, but who, or what, defines the width and the start and end position of each region? That is the Linker Script file

Its content defines the items above. On STM32IDE this file has the .ld extension, for example

![](/uploads/2025/12/image-23.png)

{{% details title="Full content of STM32MP157CAAX_RAM.ld" closed="true" %}}

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

From the linker script file we get the rough address of each region

```cpp
(HIGHER addresses)

+-------------------------+
| Stack (local variables) |  <-- _estack = 0x10040000
|   &local, &p            |
|   (addresses decrease)  |
+-------------------------+
|   (free space / guard)  |  <-- ~0x1003xxxx
+-------------------------+
| Heap (malloc/free)      |  <-- starts at _end ≈ 0x1002yyyy
|   *p                    |
|   (addresses increase)  |
+-------------------------+
| BSS (global/static = 0) |  <-- _ebss ≈ 0x1002zzzz
|   g_uninit, s_flag      |
|   _sbss ... _ebss       |  <-- _sbss ≈ 0x1002yyyy
+-------------------------+
| Data (global/static     |  <-- _edata ≈ 0x1002xxxx
|  initialised ≠ 0)       |
|   g_value, s_count,     |
|   s_local               |
|   _sdata = 0x10020000   |  <-- 0x10020000
+-------------------------+
| Text/Code + rodata      |  <-- near 0x1001FFFF (< 0x10020000)
|   code (main, v.v.)     |
|   const g_const         |
|   m_text:               |
|   0x10000000            |  <-- 0x10000000 (LOW address)
|   .. < 0x10020000       |
+-------------------------+

(LOWER addresses)
```

I will do a hands-on post with the Linker Script later, stay tuned!!

## 3. Memory Layout demo on Cortex M4

Okay, for the demo I use a C program with content similar to the following, then we debug and compare with the Linker Script to see whether it matches the theory

```cpp
#include
#include

int g_value = 10;          // .data
int g_uninit;              // .bss
volatile const int g_const = 42;    // usually in text/rodata (read-only)

static int s_count = 5;    // .data
static int s_flag;         // .bss

int main(void) {
    int local = 1;         // Stack
    static int s_local = 2;// .data

    int *p = malloc(4 * sizeof(int)); // p (the pointer) on the Stack
                                      // *p (the data) on the Heap
    if (!p) return -1;

    p[0] = 100;

    printf("%d\n", p[0]);
    g_uninit = g_value + s_count + s_local;
    s_flag   = g_uninit + (int)g_const + local;

    free(p);
    return 0;
}
```

We debug, and first we get the following values

Here I don't just declare the variables, I really have to use them, otherwise the compiler sees them unused and optimises them away. For g_const I have to add volatile to avoid the value being substituted directly for the const.

![](/uploads/2025/12/image-25.png)

We have seen the value of each variable; now let's check their addresses to see where each one lives

Now we check the address of each variable by adding & in front of each variable in the Expression tab

![](/uploads/2025/12/image-27.png)

Mapping:

- `g_const = 0x100047f0`\
  → Inside `m_text`: `[0x10000000 .. < 0x10020000]`\
  → Exactly the `Text/rodata` region.
- `g_value = 0x10020000`
- `s_count = 0x10020004`
- `s_local = 0x10020008`\
  → Starts right at `0x10020000` → the `.data` region of `m_data`.\
  → Matches: `_sdata = 0x10020000`.
- `s_flag = 0x100200a4`\
  → Also in the `0x1002xxxx` range, after `.data` → belongs to the `RAM .bss/RW` region, just what we wanted to illustrate BSS (global/static = 0).
- `local = 0x1003fff4`
- `&p = 0x1003fff0`\
  → Both are **very close** to `_estack = 0x10040000`\
  → Exactly the `Stack` region (highest, growing down).

So it's spot on :vv

```cpp
(HIGHER addresses)

0x10040000  --> _estack
+-------------------------+
| Stack (local variables) |
|   &local  = 0x1003fff4  |
|   &p      = 0x1003fff0  |
|   (addresses decrease)  |
+-------------------------+
|   (free space / guard)  |
+-------------------------+
| Heap (malloc/free)      |
|   *p  (address seen     |
|        as value of p)   |
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

(LOWER addresses)
```

In the next post I will talk about the Function Call Stack

Hope you keep reading and supporting!!
