---
title: '[Yocto-BBB] 19. Cấu hình share state , đẩy nhanh quá trình build'
date: '2026-04-11T06:54:00+07:00'
lastmod: '2026-04-04T14:13:35+07:00'
slug: yocto-bbb-19-cau-hinh-share-state-day-nhanh-qua-trinh-build
url: /2026/04/11/yocto-bbb-19-cau-hinh-share-state-day-nhanh-qua-trinh-build/
categories:
- Yocto
tags:
- Beaglebone
- Linux
- Yocto
series:
- Yocto-BBB
series_order: 19
boards:
- Beaglebone Black
image: /uploads/2025/06/sddefault.jpg
description: Ở đây mình dùng nginx, các bạn hoàn toàn có thể dùng các cách đơn giản hơn. Vì ở đây đơn giản là share cái folder sstate-cache, từ 1 máy khác đã build yocto …
wp_id: 2032
---

## 1. Thiết lập HTTP server

Ở đây mình dùng nginx, các bạn hoàn toàn có thể dùng các cách đơn giản hơn. Vì ở đây đơn giản là share cái folder sstate-cache, từ 1 máy khác đã build yocto sang 1 máy cùng mạng

```bash
sudo apt update
sudo apt install nginx -y

cat << 'EOF' | sudo tee /etc/nginx/sites-available/yocto-sstate
server {
    listen 8080;
    server_name _;

    location /sstate-cache/ {

        alias /home/zk47/Youtube/Yocto/yocto-bbb/poky/build-bbb/sstate-cache/;
        autoindex on;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/yocto-sstate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Tuy nhiên khi thử vào đường link thì nó lại bị 403 Forbidden

Do đó ta phải sửa lại cấu hình. NGINX (chạy dưới user www-data) hiện đang không có quyền try cập vào thư mục sstate-cache vì thư mục home của máy đang khóa quyền đọc, thực thi đối với các user khác

Do đó ta sẽ đổi user chạy NGINX thành user hiện tại luôn, user mình là zk47

```bash
sudo sed -i 's/user www-data;/user zk47;/g' /etc/nginx/nginx.conf
# Restart nginx
sudo systemctl restart nginx
```

Okay giờ vào lại link trên ta đã thấy folder share state

![](/uploads/2026/03/image-3.png)

Như ở đây là ta đã đem được folder lên trên mạng rồi

## 2. Cấu hình bên client

### 2.1 Cấu hình

Ở bài này để demo nên mình đã build lại mới hẳn yocto-bbb

Trong local.conf (Nên copy y nguyên từ server sang)

```bash
MACHINE = "beaglebone"
DISTRO ?= "poky"

SSTATE_MIRRORS ?= "file://.* http://192.111.63.101:8080/sstate-cache/PATH;downloadfilename=PATH"
BB_HASHSERVE = "192.111.63.101:8687"
BB_SIGNATURE_HANDLER = "OEEquivHash"
```

{{% details title="Ở đây ta có lựa chọn BB_SIGNATURE_HANDLER = 'OEEquivHash'" closed="true" %}}

chỉ định cho BitBake sử dụng **signature handler** (bộ xử lý chữ ký) có tên `OEEquivHash` — đây là bộ xử lý hỗ trợ **Hash Equivalence** (tương đương hash).

Trong Yocto/BitBake, mỗi task (ví dụ `do_compile`, `do_install`) được gán một **task hash** dựa trên đầu vào (source code, biến cấu hình, dependencies…). Hash này quyết định có thể tái sử dụng `sstate-cache` (kết quả build đã có) hay phải build lại.

Với signature handler mặc định (`OEBasicHash`), nếu bất kỳ đầu vào nào thay đổi → hash thay đổi → phải build lại, **ngay cả khi kết quả đầu ra thực tế giống hệt nhau**.

`OEEquivHash` giải quyết vấn đề này bằng cách:

1. Sau khi một task chạy xong, nó tính **output hash** (hash của đầu ra thực tế).
2. Output hash được gửi lên **hash equivalence server** (trong file của bạn là `BB_HASHSERVE = "192.111.63.101:8687"`).
3. Server lưu mapping: *task hash A* → *output hash X*.
4. Khi một máy khác (hoặc build khác) có *task hash B* khác nhưng server biết rằng output hash cũng sẽ là *X* → BitBake coi hai task là **tương đương** và tái sử dụng sstate-cache có sẵn thay vì build lại.

Ví dụ thực tế

- Bạn thay đổi một comment trong recipe → task hash thay đổi, nhưng file binary output vẫn giống hệt.
- Với `OEBasicHash`: build lại toàn bộ.
- Với `OEEquivHash`: server nhận ra output hash giống → **bỏ qua, dùng cache** → tiết kiệm thời gian đáng kể.

{{% /details %}}

### 2.2 Kết quả

Và thế là chạy thôi

```bash
source oe-init-build-env build-bbb
bitbake core-image-minimal
```

```bash
Checking sstate mirror object availability: 100% |###############################################################################################################################| Time: 0:01:12
Sstate summary: Wanted 1914 Local 0 Mirrors 520 Missed 1394 Current 0 (27% match, 0% complete)
NOTE: Executing Tasks
Setscene tasks: 1914 of 1914
```

Tỉ lệ này mới chỉ là 27% match chưa cao lắm, do giữa 2 máy mình vẫn có những config khác nhau

Nếu các bạn chạy xong 1 máy, mà copy thẳng config y hệt và cấu trúc y hệt. Cache có thể lên tới 99%

Bài này khá ngắn, nhưng mình vẫn viết vì mình thấy nó khá hữu dụng, hi vọng giúp được mọi người :vv
