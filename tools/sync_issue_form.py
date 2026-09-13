#!/usr/bin/env python3
"""Sinh .github/ISSUE_TEMPLATE/new-post.yml (form "Gửi bài viết") với danh sách series và board lấy từ content/.

Chạy lại mỗi khi thêm series hoặc board mới:  python3 tools/sync_issue_form.py
"""
import collections, glob, json, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, ".github", "ISSUE_TEMPLATE", "new-post.yml")


def front_matter(path):
    text = open(path, encoding="utf-8").read()
    return text.split("---", 2)[1] if text.startswith("---") else ""


def list_field(fm, key):
    m = re.search(r"^%s:\n((?:- .*\n)+)" % key, fm, re.M)
    return [x[2:].strip().strip("'\"") for x in m.group(1).splitlines()] if m else []


series = collections.Counter()
for f in glob.glob(os.path.join(ROOT, "content", "posts", "*.vi.md")):
    for s in list_field(front_matter(f), "series"):
        series[s] += 1
series_names = [s for s, _ in sorted(series.items(), key=lambda kv: (-kv[1], kv[0]))]

boards = []
for f in sorted(glob.glob(os.path.join(ROOT, "content", "boards", "*", "_index.vi.md"))):
    m = re.search(r"^title:\s*(.+)$", front_matter(f), re.M)
    if m:
        boards.append(m.group(1).strip().strip("'\""))

q = lambda s: json.dumps(s, ensure_ascii=False)          # chuỗi YAML an toàn (JSON là tập con của YAML)
opts = lambda items, pad: "\n".join(" " * pad + "- " + q(x) for x in items)

NEW_SERIES = "Series mới (ghi tên ở ô bên dưới) / New series"
NO_SERIES = "Bài lẻ, không thuộc series / Standalone post"
OTHER_BOARD = "Board khác (ghi ở ô bên dưới) / Other board"
NO_BOARD = "Không dùng board cụ thể / No specific board"

yml = f'''# SINH TỰ ĐỘNG bởi tools/sync_issue_form.py, đừng sửa tay danh sách series/board (sửa script rồi chạy lại).
name: "Gửi bài viết / Submit a post"
description: "Viết bài cho Embedded Linux Blog bằng markdown, chọn series và board muốn đăng vào."
title: "[Bài viết] "
labels: ["bai-viet-moi"]
body:
  - type: markdown
    attributes:
      value: |
        Cảm ơn bạn muốn viết cùng blog! Điền form bên dưới, mình sẽ đọc, góp ý ngay trong issue này, rồi đăng lên blog kèm tên bạn trên bảng **Người đóng góp**.
        *Thanks for writing with us! Fill in the form; we review it here and publish it with your name on the Contributors board.*

        - Nội dung viết bằng **markdown**. Ảnh chụp màn hình: kéo thả thẳng vào ô nội dung, GitHub tự tải lên.
        - Lệnh và code để trong khối ```` ```bash ```` (hoặc ```` ```c ````, ```` ```dts ````...) để blog tô màu.
        - Chưa xong cũng gửi được, cứ ghi "bản nháp" ở tiêu đề.

  - type: input
    id: author
    attributes:
      label: "Tên hiển thị / Display name"
      description: "Tên sẽ hiện ở bài viết và bảng Người đóng góp."
      placeholder: "Nguyễn Văn A"
    validations:
      required: true

  - type: input
    id: author-bio
    attributes:
      label: "Giới thiệu ngắn về bạn / Short bio"
      description: "Một dòng, hiện trên card tác giả. Kèm link GitHub/LinkedIn nếu muốn."
      placeholder: "Embedded Linux engineer · https://github.com/..."

  - type: input
    id: post-title
    attributes:
      label: "Tiêu đề bài / Post title"
      placeholder: "Build Yocto cho board XYZ"
    validations:
      required: true

  - type: dropdown
    id: language
    attributes:
      label: "Ngôn ngữ / Language"
      options:
        - "Tiếng Việt"
        - "English"
        - "Cả hai (viết cả 2 bản) / Both"
      default: 0
    validations:
      required: true

  - type: dropdown
    id: series
    attributes:
      label: "Muốn đăng vào series nào? / Which series?"
      description: "Chỉ là nguyện vọng, mình có thể gợi ý series phù hợp hơn."
      options:
{opts([NO_SERIES] + series_names + [NEW_SERIES], 8)}
      default: 0
    validations:
      required: true

  - type: input
    id: series-detail
    attributes:
      label: "Tên series mới hoặc vị trí mong muốn / New series name or position"
      placeholder: "Ví dụ: Yocto-RPi5, hoặc: sau bài Yocto-BBB 20"

  - type: dropdown
    id: boards
    attributes:
      label: "Board / Boards"
      multiple: true
      options:
{opts(boards + [OTHER_BOARD, NO_BOARD], 8)}

  - type: input
    id: board-detail
    attributes:
      label: "Board khác / Other board"
      placeholder: "Ví dụ: Raspberry Pi 5, RZ/V2L EVKIT"

  - type: input
    id: tags
    attributes:
      label: "Tag / Tags"
      description: "Cách nhau bằng dấu phẩy."
      placeholder: "yocto, u-boot, device tree"

  - type: textarea
    id: summary
    attributes:
      label: "Tóm tắt 1-2 câu / Summary"
      description: "Hiện dưới tiêu đề trong danh sách bài và kết quả tìm kiếm."
    validations:
      required: true

  - type: textarea
    id: content
    attributes:
      label: "Nội dung bài (markdown) / Post content (markdown)"
      description: "Dùng ## cho mục lớn, ### cho mục nhỏ. Kéo thả ảnh vào đây."
      placeholder: |
        ## 1. Chuẩn bị

        Mô tả phần cứng, phiên bản phần mềm...

        ```bash
        bitbake core-image-minimal
        ```

        ## 2. ...
    validations:
      required: true

  - type: checkboxes
    id: consent
    attributes:
      label: "Xác nhận / Confirmation"
      options:
        - label: "Bài do mình viết, ảnh do mình chụp hoặc được phép dùng. / I wrote this post and may use its images."
          required: true
        - label: "Đồng ý để blog đăng bài, sửa lỗi chính tả và định dạng, ghi tên mình là tác giả. / I agree the blog may publish it with light edits, credited to me."
          required: true
'''
open(OUT, "w", encoding="utf-8").write(yml)
print(f"wrote {os.path.relpath(OUT, ROOT)}: {len(series_names)} series, {len(boards)} boards")
