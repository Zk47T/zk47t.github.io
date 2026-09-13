---
title: '[GIT] 1. Git send-email (patching the Linux kernel)'
date: '2026-02-28T10:17:25+07:00'
lastmod: '2026-02-28T10:31:15+07:00'
slug: git-1-git-send-email-patch-linux-kernel-source
url: /en/2026/02/28/git-1-git-send-email-patch-linux-kernel-source/
categories:
- git
tags:
- Linux
- GIT
image: /uploads/2026/02/image_2026-02-28_101555393.png
description: 'Setting up git send-email with Gmail, creating a patch, checking it with checkpatch.pl, finding maintainers with get_maintainer.pl, and sending it with a cover letter.'
wp_id: 1954
translation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này
---
I plan to send proposals to 2 Google Summer of Code 2026 projects this year, so here is a small skill I just learned. It is quite simple: git send-email. It is used by community projects that don't use github or gitlab pull requests but a mailing list instead: you create a patch and send it to the maintainer of the subsystem. The most typical example is the Linux Kernel. I will use the Linux Kernel codebase as the example in this post :vv (Oh, I don't have any merged patch yet, but I will work towards one in the near future :vv)

## 1. Installation and configuration

### 1.1 Install the package

First, we add git send-email to git. I am on Ubuntu, so I use the following command

```bash
sudo apt-get install git-email
```

### 1.2 Configure gitconfig

We configure gitconfig with the user name and the sendemail config

```bash
vi ~/.gitconfig
```

Remember to put in your own name and email. Here I use gmail, so the configuration is as follows

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

## 2. Creating and checking a patch

I demo it right on the linux source code base :vv. Oh, this project is quite heavy, about 5.8Gb, so if you just want to try it out you can use another project :vv

```bash
git clone git://git.kernel.org/pub/scm/linux/kernel/git/next/linux-next.git
```

We change a few things and commit

```bash
zk47@ltu:~/gsoc/linux-next$ git log -1

commit 50d718464f2bc261b038de63bb90a8a08665a3c5 (HEAD -> master)
Author: ...
Date:   Sat Feb 28 09:28:29 2026 +0700

    Demo git send-email

    Demo git send-email test
```

I usually create the patch with the following command

```bash
zk47@ltu:~/gsoc/linux-next$ git format-patch HEAD~1

0001-Demo-git-send-email.patch
```

Linux provides scripts to check whether the patch is valid

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

Clearly the Signed-off field is missing here, so we simply amend the commit and create a new patch

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

Okay, the patch check passes; on to the next step

```bash
zk47@ltu:~/gsoc/linux-next$ ./scripts/checkpatch.pl 0001-Demo-git-send-email.patch

total: 0 errors, 0 warnings, 7 lines checked

0001-Demo-git-send-email.patch has no obvious style problems and is ready for submission.
```

## 3. Finding the maintainer's email and sending the patch

### 3.1 Git send-email

Projects have documentation saying that, depending on where you changed the code, you send the patch to the maintainer responsible for that area.

Here linux also provides a script that finds the emails to send to :vv

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

Something like this; here I only edited .gitignore for testing, so it is not really a subsystem maintainer :vv

Oh, this script can also search by code file, for example

```bash
zk47@ltu:~/gsoc/linux-next$ scripts/get_maintainer.pl drivers/media/usb/uvc/uvc_driver.c

Laurent Pinchart  (maintainer:USB VIDEO CLASS)
Hans de Goede  (maintainer:USB VIDEO CLASS)
Mauro Carvalho Chehab  (maintainer:MEDIA INPUT INFRASTRUCTURE (V4L/DVB))
linux-media@vger.kernel.org (open list:USB VIDEO CLASS)
linux-kernel@vger.kernel.org (open list)
```

In practice you should add the maintainers and mailing lists to the patch itself, then the send-email command is simpler :vv

(You should CC your own email so you join the thread and can follow the conversation more easily)

```bash
git format-patch -1  --to=maintainer1 --to=maintainer2 --cc=maillist1 --cc=maillist2
```

And finally we use the command

```bash
git send-email
```

If you did not add cc to the patch, we use

```bash
git send-email  --to=maintainer1 --to=maintainer2 --cc=maillist1 --cc=maillist2
```

### 3.2 Setting the password for gmail smtp

At this point these 2 messages appear

```bash
Send this email? ([y]es|[n]o|[e]dit|[q]uit|[a]ll): y
Password for 'smtp://...%40gmail.com@smtp.gmail.com:587':
```

We have to set the smtp password for your email. I use gmail, so I have to configure it in my google account

Go to <https://myaccount.google.com/apppasswords>

![](/uploads/2026/02/image.png)

Give the app a name, then click Create; a pop-up shows a one-line code; copy that code into the terminal and the mail will be sent

![](/uploads/2026/02/image-1.png)

And it is sent successfully; since you CC'd your own email, you also get the notification

## 4. Notes

Oh, 2 notes: when sending a patch you can also add a cover letter with the --compose option. Here you add a message for the maintainer, for example "Hello, My name is Nguyen Van A, i found this bug when testing this feature ...."

```bash
git send-email --compose
```

And you should set the subject of the cover letter email to match the subject of the patch you send, so they sit in the same place; what's the word, they get attached to the same thread and kept in one conversation instead of being split into 2 separate mails.

The maintainer receives 2 mails: 1 is the cover letter, 2 is the patch. That way, instead of writing a very long description in the patch, we can keep it short and discuss in depth in the cover letter

I don't know if there are mistakes in my post; I welcome feedback from readers

For sending patches to the linux kernel, you can take the free Linux Foundation course here: <https://trainingportal.linuxfoundation.org/courses/a-beginners-guide-to-linux-kernel-development-lfd103>
