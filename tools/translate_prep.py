#!/usr/bin/env python3
"""Hỗ trợ dịch bài: tách code block ra (giữ nguyên byte), chỉ dịch phần văn, rồi ghép lại thành <slug>.en.md.

  translate_prep.py prep  <slug>...     in ra front matter rút gọn + phần văn với placeholder ⟦CODE_n⟧, lưu code vào $TR_DIR/<slug>.codes.json
  translate_prep.py assemble <slug>...  đọc $TR_DIR/<slug>.en.txt (title:/description:/---/body dịch) -> content/posts/<slug>.en.md
"""
import re, sys, os, json, glob

TR = os.environ.get("TR_DIR", "/tmp/claude-1000/tr")
POSTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "content", "posts")
CODE = re.compile(r"^```.*?^```[ \t]*$", re.S | re.M)

def split_fm(s):
    _, fm, body = s.split("---", 2)
    return fm, body

def prep(slug):
    src = os.path.join(POSTS, f"{slug}.vi.md")
    s = open(src, encoding="utf-8").read()
    fm, body = split_fm(s)
    codes = []
    def repl(m):
        codes.append(m.group(0)); return f"⟦CODE_{len(codes)}⟧"
    prose = CODE.sub(repl, body)
    os.makedirs(TR, exist_ok=True)
    json.dump(codes, open(os.path.join(TR, f"{slug}.codes.json"), "w", encoding="utf-8"), ensure_ascii=False)
    title = re.search(r"^title: (.*)$", fm, re.M).group(1)
    desc = re.search(r"^description: (.*)$", fm, re.M)
    print(f"=== {slug}\ntitle: {title}\ndescription: {desc.group(1) if desc else ''}\n---{prose.rstrip()}\n")

def assemble(slug):
    src = os.path.join(POSTS, f"{slug}.vi.md")
    fm, _ = split_fm(open(src, encoding="utf-8").read())
    codes = json.load(open(os.path.join(TR, f"{slug}.codes.json"), encoding="utf-8"))
    en = open(os.path.join(TR, f"{slug}.en.txt"), encoding="utf-8").read()
    head, body = en.split("\n---\n", 1)
    title = re.search(r"^title: (.*)$", head, re.M).group(1).strip()
    desc = re.search(r"^description: (.*)$", head, re.M).group(1).strip()
    # placeholder: mỗi cái đúng 1 lần
    used = [int(x) for x in re.findall(r"⟦CODE_(\d+)⟧", body)]
    assert sorted(used) == list(range(1, len(codes) + 1)), f"{slug}: placeholders {sorted(used)} vs {len(codes)} code blocks"
    assert "\u2014" not in en and "\u2013" not in en, f"{slug}: em/en-dash in translation"
    # link nội bộ tới bài khác -> bản /en/
    urls = set()
    for f in glob.glob(os.path.join(POSTS, "*.vi.md")):
        m = re.search(r"^url: (/\d{4}/\d\d/\d\d/[^\s]+)$", open(f, encoding="utf-8").read(), re.M)
        if m: urls.add(m.group(1))
    body = re.sub(r"\]\((/\d{4}/\d\d/\d\d/[^)#\s]+/)(#[^)]*)?\)", lambda m: f"](/en{m.group(1)}{m.group(2) or ''})" if m.group(1) in urls else m.group(0), body)
    # code: dòng tiếng Việt trong code block -> bản dịch trong $TR_DIR/codelines.json (nếu có)
    cl_path = os.path.join(TR, "codelines.json")
    cl = json.load(open(cl_path, encoding="utf-8")) if os.path.exists(cl_path) else {}
    codes = ["\n".join(cl.get(l, l) for l in c.split("\n")) for c in codes]
    body = re.sub(r"⟦CODE_(\d+)⟧", lambda m: codes[int(m.group(1)) - 1], body)
    def q(v): return "'" + v.replace("'", "''") + "'"
    fm2 = re.sub(r"^title: .*$", "title: " + q(title), fm, count=1, flags=re.M)
    if re.search(r"^description: .*$", fm2, re.M):
        fm2 = re.sub(r"^description: .*$", "description: " + q(desc), fm2, count=1, flags=re.M)
    else:
        fm2 = fm2.rstrip("\n") + "\ndescription: " + q(desc) + "\n"
    fm2 = re.sub(r"^url: /", "url: /en/", fm2, count=1, flags=re.M)
    fm2 = fm2.rstrip("\n") + "\ntranslation: auto          # dịch từ bản tiếng Việt, chưa review kỹ; sửa trực tiếp file này\n"
    out = os.path.join(POSTS, f"{slug}.en.md")
    open(out, "w", encoding="utf-8").write("---" + fm2 + "---\n" + body.strip("\n") + "\n")
    print("wrote", out, f"({len(body)} chars)")

if __name__ == "__main__":
    cmd, slugs = sys.argv[1], sys.argv[2:]
    for s in slugs:
        s = os.path.basename(s).replace(".vi.md", "")
        (prep if cmd == "prep" else assemble)(s)
