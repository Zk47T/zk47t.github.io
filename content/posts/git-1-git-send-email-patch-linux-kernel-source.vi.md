---
title: '[GIT] 1. Git send-email (patch Linux kernel)'
date: '2026-02-28T10:17:25+07:00'
lastmod: '2026-02-28T10:31:15+07:00'
slug: git-1-git-send-email-patch-linux-kernel-source
url: /2026/02/28/git-1-git-send-email-patch-linux-kernel-source/
categories:
- git
tags:
- Linux
- GIT
image: /uploads/2026/02/image_2026-02-28_101555393.png
description: Mình dự tính gửi proposal cho 2 project Google summer of code 2026 năm nay, do đó có 1 kĩ năng nhỏ mình mới tìm hiểu được. Nó khá đơn giản thôi đó là git sen…
wp_id: 1954
---

Mình dự tính gửi proposal cho 2 project Google summer of code 2026 năm nay, do đó có 1 kĩ năng nhỏ mình mới tìm hiểu được. Nó khá đơn giản thôi đó là git send-email. Cái này thì sẽ dùng cho các community project không dùng github hay gitlab để có thể tạo pull request, mà sẽ dùng mailling list, các bạn sẽ tạo patch gửi tới maintainer của subsystem. Tiêu biểu nhất chính là như Linux Kernel. Mình sẽ lấy ví dụ trong bài này với Linux Kernel codebase luôn nhé :vv (À mình chưa có patch nào được merge đâu nhưng sẽ phấn đấu trong tương lai gần :vv )

## 1. Cài đặt và cấu hình

### 1.1 Cài package

Trước hết, ta cài thêm git send-email vào git. Mình đang dùng Ubuntu nên sẽ dùng câu lệnh sau

```bash
sudo apt-get install git-email
```

### 1.2 Cấu hình gitconfig

Ta cấu hình gitconfig để rõ tên user và sendemail config

```bash
vi ~/.gitconfig
```

Các bạn nhớ thay tên và email của các bạn vào nhé. Ở đây mình dùng gmail nên sẽ có cấu hình sau

```bash
[sendemail]
    smtpserver = smtp.gmail.com
    smtpserverport = 587
    smtpencryption = tls
    smtpuser = your-email@example.com
    smtpfrom = Your Name

[user]
	email = your-email@example.com
	name = Your Name
```

## 2. Tạo patch và kiểm tra patch

Mình demo trên linux source code base luôn :vv , à project này khá nặng rơi vào 5,8Gb, do đó các bạn nếu chỉ thử thì có thể dùng các project khác nhé :vv

```bash
git clone git://git.kernel.org/pub/scm/linux/kernel/git/next/linux-next.git
```

Ta thay đổi vài chỗ rồi commit

```bash
zk47@ltu:~/gsoc/linux-next$ git log -1

commit 50d718464f2bc261b038de63bb90a8a08665a3c5 (HEAD -> master)
Author: ...
Date:   Sat Feb 28 09:28:29 2026 +0700

    Demo git send-email

    Demo git send-email test
```

Mình thường hay tạo patch bằng câu lệnh sau

```bash
zk47@ltu:~/gsoc/linux-next$ git format-patch HEAD~1

0001-Demo-git-send-email.patch
```

Linux cung cấp cho ta scripts để kiểm tra lại patch xem đã hợp lệ chưa

```bash
zk47@ltu:~/gsoc/linux-next$ ./scripts/checkpatch.pl 0001-Demo-git-send-email.patch

WARNING: Missing commit description - Add an appropriate one

ERROR: Missing Signed-off-by: line(s)

total: 1 errors, 1 warnings, 7 lines checked

NOTE: For some of the reported defects, checkpatch may be able to
      mechanically convert to the typical style using --fix or --fix-inplace.

0001-Demo-git-send-email.patch has style problems, please review.

NOTE: If any of the errors are false positives, please report
      them to the maintainer, see CHECKPATCH in MAINTAINERS.
```

Dễ thấy ở đây ta thiếu đi trường Signed-off, do đó ta thêm đơn giản amend lại commit và tạo lại 1 patch mới

```bash
zk47@ltu:~/gsoc/linux-next$ git commit --amend -s --no-edit

[master 9abbf2fb8f6d] Demo git send-email
 Date: Sat Feb 28 09:28:29 2026 +0700
 1 file changed, 1 insertion(+)

zk47@ltu:~/gsoc/linux-next$ git log -1

commit 9abbf2fb8f6d9f285a25ad74e729c57d2cf5d26c (HEAD -> master)
Author: ....
Date:   Sat Feb 28 09:28:29 2026 +0700

    Demo git send-email

    Demo git send-email test

    Signed-off-by: ....
```

Okay vậy là đã pass bước kiểm tra patch, ta sang bước tiếp theo

```bash
zk47@ltu:~/gsoc/linux-next$ ./scripts/checkpatch.pl 0001-Demo-git-send-email.patch

total: 0 errors, 0 warnings, 7 lines checked

0001-Demo-git-send-email.patch has no obvious style problems and is ready for submission.
```

## 3. Tìm email maintainer và gửi patch

### 3.1 Git send-email

Các dự án sẽ có tài liệu về việc bạn thay đổi code ở đâu thì sẽ gửi patch cho maintainer chịu trách nhiệm quản lý chỗ đó.

Ở đây linux cũng cung cấp script giúp ta tìm ra email để gửi luôn :vv

```bash
zk47@ltu:~/gsoc/linux-next$ ./scripts/get_maintainer.pl 0001-Demo-git-send-email.patch

Miguel Ojeda  (commit_signer:4/6=67%,authored:1/6=17%,added_lines:1/6=17%)
Mauro Carvalho Chehab  (commit_signer:2/6=33%,authored:1/6=17%,added_lines:1/6=17%)
Nathan Chancellor  (commit_signer:2/6=33%)
Jonathan Corbet  (commit_signer:2/6=33%)
Masahiro Yamada  (commit_signer:1/6=17%)
Ard Biesheuvel  (authored:1/6=17%,added_lines:1/6=17%)
WangYuli  (authored:1/6=17%,added_lines:1/6=17%)
Andrii Nakryiko  (authored:1/6=17%,added_lines:1/6=17%,removed_lines:1/1=100%)
linux-kernel@vger.kernel.org (open list)
```

Kiểu kiểu như này, ở đây mình sửa cái gitignore tạm nên không phải maintainer subsystem lắm nhỉ :vv

À script này cũng hỗ trợ tìm theo file code luôn nhé, ví dụ như

```bash
zk47@ltu:~/gsoc/linux-next$ scripts/get_maintainer.pl drivers/media/usb/uvc/uvc_driver.c

Laurent Pinchart  (maintainer:USB VIDEO CLASS)
Hans de Goede  (maintainer:USB VIDEO CLASS)
Mauro Carvalho Chehab  (maintainer:MEDIA INPUT INFRASTRUCTURE (V4L/DVB))
linux-media@vger.kernel.org (open list:USB VIDEO CLASS)
linux-kernel@vger.kernel.org (open list)
```

Thực tế thì các bạn nên thêm maintainer, mailist vào chính patch luôn, thì câu lệnh send-email sẽ đơn giản hơn :vv

(Các bạn nên CC chính mail của bạn thân để tham gia vào luồng chat và dễ dàng theo dõi nội dung hơn mail)

```bash
git format-patch -1  --to=maintainer1 --to=maintainer2 --cc=maillist1 --cc=maillist2
```

Và cuối cùng thì ta sẽ dùng lệnh

```bash
git send-email
```

Nếu bạn không thêm cc vào sẵn patch thì ta sẽ dùng

```bash
git send-email  --to=maintainer1 --to=maintainer2 --cc=maillist1 --cc=maillist2
```

### 3.2 Cài mật khẩu cho smtp gmail

Đến đây sẽ có 2 dòng thông báo này hiện lên

```bash
Send this email? ([y]es|[n]o|[e]dit|[q]uit|[a]ll): y
Password for 'smtp://...%40gmail.com@smtp.gmail.com:587':
```

Ta phải cài thêm password mail smtp email của bạn. Ở đây mình dùng gmail do đó mình phải cấu hình trong google account

Các bạn truy cập <https://myaccount.google.com/apppasswords>

![](/uploads/2026/02/image.png)

Đặt 1 tên ứng dụng, rồi bấm Tạo, ở đây sẽ hiện lên 1 pop up 1 dòng mã, các bạn copy 1 dòng mã này vào terminal là sẽ gửi được mail

![](/uploads/2026/02/image-1.png)

Vậy là gửi được thành công rồi, do các bạn có CC mail của bản thân nên sẽ cũng nhận được thông báo

## 4. Lưu ý

À có 2 lưu ý là khi gửi patch, các bạn hoàn toàn có thể thêm cover letter, với option --compose. Ở đây các bạn sẽ thêm các tin nhắn cho maintainer chẳng hạn, ví dụ như "Hello, My name is Nguyen Van A, i found this bug when testing this feature ...."

```bash
git send-email --compose
```

Và các bạn nên sửa subject của email cover letter này trùng với subject của patch bạn gửi luôn, để nó trong cùng 1 chỗ, dùng từ gì nhỉ, kiểu nó sẽ đươc gắn cùng 1 chủ đề và được để trong cùng 1 hộp thay vì tách ra 2 mail độc lập.

Maintainer sẽ nhận đươc 2 mail, 1 là mail cover letter, 2 là mail patch. Như thế thay vì viết description trong patch thật dài, ta có thể viết ngắn gọn và trao đổi sâu trong cover letter

Không biết bài viết của mình có sai sót ở đâu không, mong được các bạn đọc đóng góp ý kiến

Về viêc gửi patch đến linux kernel, các bạn có thể tham gia học khóa học miễn phí từ Linux Foundation tại đây : <https://trainingportal.linuxfoundation.org/courses/a-beginners-guide-to-linux-kernel-development-lfd103>
