---
title: '[Fun Fact] 1. Nguồn gốc của 1 số thuật ngữ trong lập trình'
date: '2026-01-03T07:12:00+07:00'
lastmod: '2026-01-06T14:10:28+07:00'
slug: fun-fact-1-nguon-goc-cua-1-so-thuat-ngu-trong-lap-trinh
url: /2026/01/03/fun-fact-1-nguon-goc-cua-1-so-thuat-ngu-trong-lap-trinh/
categories:
- Fun-Fact
tags:
- Fun-Fact
- Linux
- Fun Fact
image: /uploads/2025/11/magnectic-core-memorymemory.jpg
description: Có bao giờ bạn thắc mắc tại sao mọi người lại dùng các thuật ngữ như "Core dumped", "bug", "mount", "unmount", "patch", "cursor".
wp_id: 1452
---

Có bao giờ bạn thắc mắc tại sao mọi người lại dùng các thuật ngữ như "Core dumped", "bug", "mount", "unmount", "patch", "cursor".

{{% details title="Tại sao 'Core dumped' chứ không phải 'Memory Dumped'" closed="true" %}}

#### Core dumped diễn ra khi nào ?

Khi chương trình bị crash (ví dụ Segmentation Fault), hệ điều hành có thể chụp lại (snapshot) toàn bộ trạng thái Bộ nhớ của Process đó tại chính thời điểm crash:

- Vùng nhớ RAM của Process
- Thanh ghi CPU (Program Counter, Stack Pointer)
- Một số thông tin Kernel, thông tin hệ điều hành liên quan

👉 File đó gọi là **core dump /**. Sau này ta dùng `gdb`, `objdump`, `kdump…` để mở ra và phân tích nguyên nhân crash.

#### . Tại sao lại gọi là “core”?

- Thời xưa (1950–1970), RAM được làm từ **magnetic-core memory** (những vòng lõi từ tính nhỏ xíu).

![](/uploads/2025/11/image-1.png)

- Khi chương trình chết, người ta “dump” (in hoặc ghi) nội dung **core memory** ra giấy, băng từ, đĩa… → gọi là **core dump**.
- Sau này RAM không còn dùng magnetic core nữa, nhưng cái **tên “core dump” vẫn được giữ nguyên**

Mình có ví dụ nhỏ sau về 1 chương trình C khi ta cố ghi vào địa chỉ con trỏ NULL thành giá trị khác

```bash
zk47@ltu:~$ cat main.c
int main(void) {
    int *p = 0;     // con trỏ NULL
    *p = 42;        // ghi vào địa chỉ 0 -> segfault (core dumped)
}

zk47@ltu:~$ gcc -o main main.c -g
zk47@ltu:~$ ./main
Segmentation fault (core dumped)
```

Chúng ta có thể cài thêm coredumpctl để tiện thao tác, ta thấy ở đây đã có stack trace ngắn gọn. Đầy đủ sẽ ở tại /var/lib/systemd/coredump/core.main.1000.dba800c9ee6645358a0a590b7a0f3feb.7665.1763201375000000.zst là 1 file nén, định dạng elf

```bash
zk47@ltu:~$ coredumpctl dump /home/zk47/main > core.main
           PID: 7665 (main)
           UID: 1000 (zk47)
           GID: 1000 (zk47)
        Signal: 11 (SEGV)
     Timestamp: Sat 2025-11-15 17:09:35 +07 (4min 4s ago)
  Command Line: ./main
    Executable: /home/zk47/main
 Control Group: /user.slice/user-1000.slice/user@1000.service/app.slice/app-org.gnome.Terminal.slice/vte-spawn-be66058d-6b3a-42b1-bde3-458a37c258f5.scope
          Unit: user@1000.service
     User Unit: vte-spawn-be66058d-6b3a-42b1-bde3-458a37c258f5.scope
         Slice: user-1000.slice
     Owner UID: 1000 (zk47)
       Boot ID: dba800c9ee6645358a0a590b7a0f3feb
    Machine ID: 1b00b882602c461d8cd1092dc2ecac33
      Hostname: ltu
       Storage: /var/lib/systemd/coredump/core.main.1000.dba800c9ee6645358a0a590b7a0f3feb.7665.1763201375000000.zst (present)
     Disk Size: 17.2K
       Message: Process 7665 (main) of user 1000 dumped core.

                Found module /home/zk47/main with build-id: c96af254eb5dafc9cd46ada1dd1a00c5024275dd
                Found module linux-vdso.so.1 with build-id: 1e83cba00162a9c0ddb5b85aa28af40a72cfd480
                Found module ld-linux-x86-64.so.2 with build-id: acaf96d7b1a6bad57b559d646233d5dc1a23257c
                Found module libc.so.6 with build-id: 4f7b0c955c3d81d7cac1501a2498b69d1d82bfe7
                Stack trace of thread 7665:
                #0  0x000062ed6932f13d n/a (/home/zk47/main + 0x113d)
                #1  0x00007ed49f429d90 __libc_start_call_main (libc.so.6 + 0x29d90)
                #2  0x00007ed49f429e40 __libc_start_main_impl (libc.so.6 + 0x29e40)
                #3  0x000062ed6932f065 n/a (/home/zk47/main + 0x1065)
```

{{% /details %}}

{{% details title="Nguồn gốc tên gọi Bug, có thật sự là 1 con côn trùng gây lỗi ?" closed="true" %}}

---

#### **1. Từ “bug” → “lỗi / trục trặc” trong kỹ thuật**

**Khoảng thập niên 1870**

- Trong giới **kỹ sư, điện tín, máy móc**, “bug” đã bắt đầu được dùng để chỉ **các lỗi, trục trặc khó chịu**.

**1878 – Thomas Edison**

- Edison viết thư có đề cập đến các “`Bugs` – những lỗi nhỏ và khó chịu” xuất hiện trong quá trình ông làm việc

**1924 – “Bug hunter” = thợ sửa chữa**

- Một tranh biếm hoạ trong tạp chí ngành điện thoại: “bug hunter” được giải thích là **tên lóng của thợ sửa chữa** – không phải người đi bắt côn trùng.

👉 Đến **giữa thập niên 40**, “bug = lỗi / trục trặc kỹ thuật” đã trở nên quá quen thuộc.

#### **2. 1947 – Con bướm trong Mark II & Grace Hopper**

**Mark II là gì?**

- **Harvard Mark II** là một **máy tính điện–cơ (electromechanical computer)** ra đời rất sớm
- Nó dùng cơ chế **rơ-le điện** (chứ chưa phải transistor). Dùng nam châm điện để hút tiếp điểm, tạo thành logic 0/1, thông dòng/Không thông dòng

![](/uploads/2025/11/image-9.png)

- Nó rất to, chiếm cả phòng, dùng cho trong tính toán khoa học/quân sự

**Sự kiện con bướm – 1947**

- Grace Hopper và các cộng sự làm việc trên **Mark II / Mark III** ở Harvard.
- Một hôm, máy bất chợt bị lỗi, họ lần ra nguyên nhân:\
  → Có **một con bướm (moth)** kẹt trong rơ-le khiến máy hoạt động sai.
- Họ gỡ con bướm ra, **dán vào sổ log** và rồi ghi rằng: “First actual case of bug being found.” (Trường hợp thực tế đầu tiên tìm thấy “bug”.)

![](/uploads/2025/11/image.png)

Chỗ này là **chơi chữ**:

- Vì trước đó, họ **đã quen dùng “bug” = lỗi kỹ thuật rồi**
- Giờ mới gặp **“bug” theo nghĩa côn trùng thật** (actual bugs)

Sổ log có con bướm hiện vẫn được lưu trong **bảo tàng Smithsonian**. Và câu chuyện này cũng trở nên rất nổi tiếng đến tận ngày nay

{{% /details %}}

{{% details title="Mount và unmount ổ đĩa có nghĩa gì" closed="true" %}}

#### 1. “Mount” ban đầu là treo cái băng / cái đĩa lên

Về tiếng Anh, *mount* vốn đã có nghĩa là **đặt, gắn, treo một vật vào đúng vị trí để dùng được** (mount a picture, mount a lens…).

Thời **những năm 1950–1970**, bộ nhớ phổ biến là:

- Băng từ (magnetic tape): cuộn băng tròn, gắn vào giá treo (**tape** drive)

![](/uploads/2025/11/image-2.png)

- Đĩa rời (disk pack): cả “chồng” to như cái nồi cơm, gắn vào ổ đĩa (**disk drive)**

![](/uploads/2025/11/image-3.png)

Muốn dùng được, **người vận hành phải “mount” cuộn băng hay disk pack đó lên drive**. Hệ thống in ra yêu cầu kiểu:

> *MOUNT TAPE VOL=123456 ON DRIVE 3*

→ Người vận hành đi lấy đúng cuộn, **gắn (mount) nó lên** ổ băng.\
Đây là nghĩa vật lý: **đem phương tiện lưu trữ gắn vào thiết bị đọc/ghi**.

#### 2. Từ “mount” vật lý → “mount filesystem” trong Unix

Khi chuyển sang hệ điều hành hiện đại:

- OS phải **biết thiết bị nào đang gắn và dùng được**, và “ghép” (attach) nó vào cây thư mục.
- Unix dùng luôn từ quen thuộc khi đó là `mount` cho thao tác này:
  - `mount` = báo cho kernel: “ổ này/partition này/filesystem này đã sẵn sàng, gắn nó vào thư mục X”.
  - `umount` = cắt nó ra khỏi cây thư mục, flush dữ liệu, cho phép tháo thiết bị an toàn.

Lệnh `mount` xuất hiện từ những phiên bản Unix đầu tiên và sau này Linux giữ nguyên cách gọi đó

{{% /details %}}

{{% details title="Bản sửa lỗi code - bản vá (Patch)" closed="true" %}}

#### 1. “Patch” gốc nghĩa là miếng vá

Trong tiếng Anh thường, `patch` là **miếng vải/miếng da vá** lên chỗ rách. Sau này, ta còn thấy quen thuộc khi patch được sử dụng trong lập trình như 1 bản vá cho code.

---

### 2. Thời paper tape & punch card (1950s–1970s)

Hồi chương trình còn được lưu trên:

- **Punched tape**: dải giấy đục lỗ liên tục

![](/uploads/2025/11/image-4.png)

- **Punch card**: từng thẻ giấy đục lỗ, xếp thành cả chương trình

![](/uploads/2025/11/image-8.png)

Lúc đó, khi phần mềm/hệ thống có lỗi, hãng sẽ gửi cho bạn **một đoạn tape/thẻ mới nhỏ** chứa phần code đã sửa.

Cách dùng:

- Với **paper tape**: cắt bỏ đoạn lỗi trên băng cũ,\
  rồi **dán (patch) đoạn tape mới vào** – đúng nghĩa vật lý “vá băng”.
- Với **punch card**: đôi khi đúng nghĩa là **dán băng keo + chad** (mẩu giấy đục lỗ) lên để sửa lỗ, hoặc thay hẳn một nhóm thẻ trong bộ thẻ.

![](/uploads/2025/11/image-6.png)

Wikipedia mô tả rất rõ: lịch sử ban đầu, nhà cung cấp phần mềm **phát hành bản vá (patch) trên giấy đục lỗ (paper tape/punch card)**, người dùng sẽ *“cắt phần sai đi và vá đoạn mới ”*.

→ Từ đó, **“patch” = miếng code nhỏ để vá chương trình hiện** có. Cho đến tận ngày nay.

{{% /details %}}

{{% details title="Con trỏ chuột với tên Cursor" closed="true" %}}

#### 1. Trước khi có máy tính

- Trong tiếng **Latin cổ**:
  - *cursor* = “người chạy, người đưa tin” (runner / courier).
- Vào **hoảng thế kỷ 16 (1590s)**:
  - Trong tiếng Anh, `cursor` bắt đầu được dùng cho **“cái trượt có vạch mảnh trên dụng cụ đo”** – một miếng nhựa trong suốt có vạch, **trượt qua lại (chạy)** trên thước để chỉ vào giá trị.

![](/uploads/2025/11/image-7.png)

👉 Tức là trước khi có máy tính rất lâu, **cursor đã là “cái trượt chạy dọc theo thước”**.

---

#### 2. Lên máy tính: từ thước trượt → con trỏ trên màn hình

- Vào thập niên **1960s**: khi xuất hiện **màn hình CRT, ta có con trỏ nhấp nháy, phím mũi tên, chuột**, người ta mượn luôn khái niệm đó:
  - **Cursor = dấu chỉ chạy quanh màn hình** để cho biết:
    - chỗ đang nhập text (caret / text cursor), hoặc
    - vị trí con trỏ chuột (mouse pointer, thường cũng gọi là *mouse cursor*).
- Trong Từ điển Etymonline ghi nhận về “cursor trên màn hình máy tính” khoảng **1967**.

👉 Vẫn là hình ảnh **“chạy qua chạy lại”** – chỉ có điều ngày xưa chạy trên thước log, còn giờ chạy trên màn hình máy tính :vv .

{{% /details %}}

{{% details title="Tham Khảo" closed="true" %}}

<https://en.wikipedia.org/wiki/Computer_programming_in_the_punched_card_era>

<https://en.wikipedia.org/wiki/Bug_(engineering)>

<https://man7.org/linux/man-pages/man8/mount.8.html>

{{< youtube qgwrt7vYY4U >}}

{{% /details %}}
