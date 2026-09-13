---
title: '[Linux] Cấu hình chuột Logitech bằng Bash Scripts'
date: '2025-05-24T08:27:00+00:00'
lastmod: '2025-09-14T12:14:12+00:00'
slug: linux-cau-hinh-chuot-logitech-bang-bash-scripts
url: /2025/05/24/linux-cau-hinh-chuot-logitech-bang-bash-scripts/
tags:
- Linux
image: /uploads/2025/05/button.png
description: Mỗi ngày mò học thêm 1 tí trên Linux. Bình thường con chuột Logitech G402 của mình chạy trên Windows thì có thể dùng G Hub để cấu hình, tuy nhiên trên Ubuntu…
wp_id: 21
---

Mỗi ngày mò học thêm 1 tí trên Linux. Bình thường con chuột Logitech G402 của mình chạy trên Windows thì có thể dùng G Hub để cấu hình, tuy nhiên trên Ubuntu hiện tại thì chưa được support. Mình thì rất hay nghe nhạc, và thường hay để 2 trong 5 phím sườn là tăng giảm âm lượng, nay rảnh rảnh thử ngồi nghiên cứu tí. Cụ thể là Key 5 là tăng, Key 4 là giảm.

![](/uploads/blogger/7f7eb4d0913c.png)

### 1. Phân tích

#### 1.1 Input từ chuột

Đầu tiên là phải check được sự kiện nhấn 2 nút đó trên con chuột được máy tính nhận ra sao. Ta sẽ dùng command evtest

```bash
zk47@ubuntu:/etc/udev/rules.d$ evtest
No device specified, trying to scan all of /dev/input/event*
Not running as root, no devices may be available.
Available devices:
/dev/input/event0:	Sleep Button
/dev/input/event1:	Lid Switch
/dev/input/event2:	Power Button
/dev/input/event3:	AT Translated Set 2 keyboard
/dev/input/event4:	SYNA801B:00 06CB:CEC7 Mouse
/dev/input/event5:	SYNA801B:00 06CB:CEC7 Touchpad
/dev/input/event6:	TPPS/2 Elan TrackPoint
/dev/input/event7:	Logitech Gaming Mouse G402
/dev/input/event8:	Logitech Gaming Mouse G402 Keyboard
/dev/input/event9:	       USB KEYBOARD
/dev/input/event10:	       USB KEYBOARD System Control
/dev/input/event11:	       USB KEYBOARD Consumer Control
/dev/input/event12:	Intel HID events
/dev/input/event13:	ThinkPad Extra Buttons
/dev/input/event14:	Video Bus
/dev/input/event15:	Video Bus
/dev/input/event16:	sof-hda-dsp Mic
/dev/input/event17:	sof-hda-dsp Headphone
/dev/input/event18:	sof-hda-dsp HDMI/DP,pcm=3
/dev/input/event19:	sof-hda-dsp HDMI/DP,pcm=4
/dev/input/event20:	sof-hda-dsp HDMI/DP,pcm=5
Select the device event number [0-20]: [0-20]:
```

Evtest mang nghĩa event test tức sẽ bắt các sự kiện đầu vào, ở đây máy mình đã detect được Logitech Gaming mouse G402 tại /dev/input/event7, thử test thôi

![](/uploads/blogger/b35b6de140f3.png)

Key 5 trên chuột đang là BTN_EXTRA, Key 4 trên chuột đang là BTN_SIDE

Và hành vi value 1 là nhấn, value 0 là thả.

Vậy là chúng ta đã biết phải check tín hiệu gì ở đâu rồi.

#### 1.2 Command tăng giảm âm lượng

```bash
pactl set-sink-volume @DEFAULT_SINK@ +5%
```

- `pactl`: PulseAudio control

– `set-sink-volume` : command option để set audio volume của PulseAudio\
– `@DEFAULT_SINK`: tự detect là hiện tại đang dùng nguồn audio nào thay vì chỉ đích danh

– `+5%` : tăng thêm 5% volume so với hiện tại

## 2. Bắt đầu thôi

### 2.1 Những dòng code đầu tiên

Hì, phân tích được rồi thì code luôn chứ còn gì nữa

```bash
#!/bin/bash

TARGET_NAME="Logitech Gaming Mouse G402"

# Use /sys to detect the correct event device
for dev in /dev/input/event*; do
    sys_name=$(cat /sys/class/input/$(basename "$dev")/device/name 2>/dev/null)
    if [[ "$sys_name" == "$TARGET_NAME" ]]; then
        TARGET_DEV="$dev"
        break
    fi
done

if [[ -z "$TARGET_DEV" ]]; then
    echo "Device '$TARGET_NAME' not found."
    exit 1
fi

echo "Using device: $TARGET_DEV"

# Start monitoring key events (BTN_EXTRA=276, BTN_SIDE=275)
evtest "$TARGET_DEV" | while read -r line; do
    if echo "$line" | grep -q "EV_KEY.*code 276.*value 1"; then
        echo "Volume Up"
        pactl set-sink-volume @DEFAULT_SINK@ +5%
    elif echo "$line" | grep -q "EV_KEY.*code 275.*value 1"; then
        echo "Volume Down"
        pactl set-sink-volume @DEFAULT_SINK@ -5%
    fi
done
```

Ở đây mình chỉ đơn giản là cấu hình 2 button, làm cho toàn bộ button và cho nhiều loại chuột thì hơi vất.

Tuy nhiên khi chạy lại gặp vấn đề sau. Nếu chạy với sudo thì command pactl chạy không chuẩn, nếu không chạy với sudo thì user hiện tại không có quyền đọc input tại /dev/input/\*.

```bash
zk47@ubuntu:~/logitech_mouse$ ./mouse.sh
Using device: /dev/input/event7
evtest: Permission denied
You do not have access to /dev/input/event7. Try running as root instead.
zk47@ubuntu:~/logitech_mouse$ sudo ./mouse.sh
Using device: /dev/input/event16
Connection failure: Connection refused
pa_context_connect() failed: Connection refused
```

Vậy là user zk47 đang chưa có quyền input, ta check bằng câu lệnh groups

```bash
zk47@ubuntu:/etc/udev/rules.d$ groups
zk47 adm dialout cdrom sudo dip plugdev
```

–> Thêm user với quyền input

#### 2.2 Cấu hình lại quyền input cho user

##### Step 1: Tạo file rule

Để việc cấu hình cho user vĩnh viễn, ta sẽ dùng đến udev (userspace device). Ta tạo ra 1 file rule cho nó.

```bash
sudo nano /etc/udev/rules.d/99-input-permissions.rules
```

– 99 : Mức ưu tiên cao (rule được xếp theo mức ưu tiên bằng số, số càng to ưu tiên càng cao)

– input-permissions: chỉ đơn giản là tên thôi

-.rules: extension chuẩn

Trong file rules ta add thông tin sau

```text
SUBSYSTEM=="input", GROUP="input", MODE="0664"
KERNEL=="event*", SUBSYSTEM=="input", GROUP="input", MODE="0664"
```

**Rule 1:** `SUBSYSTEM=="input", GROUP="input", MODE="0664"`

- `SUBSYSTEM=="input"` = Khớp toàn bộ thiết bị input (chuột, keyboards, …)
- `GROUP="input"` = Set group owner to `input`
- `MODE="0664"` = Set permissions `rw-rw-r--`
  - Owner (root): read + write
  - Group (input): read + write
  - Others: read only

**Rule 2:** `KERNEL=="event*", SUBSYSTEM=="input", GROUP="input", MODE="0664"`

- `KERNEL=="event*"` = Match với toàn bộ `/dev/input/event*` files
- Quyền tương tự với bên trên
- Rule này cụ thể hơn

##### Step 2: Thêm user tới input group

```bash
sudo usermod -a -G input $USER
```

– a : append (Không xóa đi group hiện tại)

– G input : group input

– $USER : user hiện tại

##### Step 3: Apply changes

```bash
# Reload udev rules
sudo udevadm control --reload-rules

# Trigger udev to reprocess existing devices
sudo udevadm trigger

# Or simply reboot
sudo reboot
```

–> Máy tính khởi động lại, chạy script và tận hưởng thành quả thôi :v
