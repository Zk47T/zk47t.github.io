#!/usr/bin/env python3
"""
WordPress WXR (Gutenberg HTML) -> Hugo markdown.

    wxr2md.py <export.xml> <assets-dir> <site-dir> <drafts-dir>

- Bài published  -> <site>/content/posts/<slug>.vi.md   (url: giữ nguyên /YYYY/MM/DD/slug/)
- Page published -> <site>/content/<slug>.vi.md          (url: giữ nguyên /slug/)
- draft/pending/private -> <drafts-dir>/<slug>.md         (ngoài repo, draft: true)
- Ảnh/video được tham chiếu -> copy từ <assets-dir> sang <site>/static/{uploads,videos}
"""
import html, json, os, re, shutil, sys
import xml.etree.ElementTree as ET
from datetime import datetime
from urllib.parse import urlparse, unquote

import yaml
from markdownify import MarkdownConverter

XML, ASSETS, SITE, DRAFTS = sys.argv[1:5]
NS = {"wp": "http://wordpress.org/export/1.2/",
      "content": "http://purl.org/rss/1.0/modules/content/",
      "dc": "http://purl.org/dc/elements/1.1/"}
OWN_HOSTS = ("embeddedlinux.blog", "embedlinuxaz.wordpress.com")

url_map_doc = json.load(open(os.path.join(ASSETS, "url-map.json")))
URL_MAP = url_map_doc["url_map"]          # original url -> "assets/..."
VP_META = url_map_doc["videopress"]       # guid -> {original, poster,...}

# ------------------------------------------------------------------ asset paths
def site_path_for(asset_rel):
    """'assets/uploads/2026/05/a.png' -> '/uploads/2026/05/a.png'
       'assets/blogger/x.png'         -> '/uploads/blogger/x.png'
       'assets/videopress/G/a.mp4'    -> '/videos/G/a.mp4'"""
    rel = asset_rel.split("/", 1)[1]           # drop leading 'assets/'
    top, rest = rel.split("/", 1)
    if top == "uploads":
        return "/uploads/" + rest
    if top == "videopress":
        return "/videos/" + rest
    return f"/uploads/{top}/{rest}"

used_assets = {}   # site path -> asset file path

def local_url(u):
    """Map a remote URL to a local site path if we downloaded it; else None."""
    cands = [u, html.unescape(u), u.split("?")[0], html.unescape(u).split("?")[0]]
    for c in cands:
        if c in URL_MAP:
            rel = URL_MAP[c]
            if rel.endswith("/"):
                return None
            srcfile = os.path.join(os.path.dirname(ASSETS), rel)
            if not os.path.exists(srcfile):      # tải thất bại (vd. hotlink LinkedIn đã chết)
                return None
            sp = site_path_for(rel)
            used_assets[sp] = srcfile
            return sp
    return None

# ------------------------------------------------------------------ helpers
PH = {}
def placeholder(text):
    key = f"QQPH{len(PH):04d}QQ"
    PH[key] = text
    return key

def restore(md):
    # placeholders may have been wrapped by markdownify; put each on its own block
    for k, v in PH.items():
        md = md.replace(k, v)
    return md

def internal_href(u):
    """Links to our own domain -> path only. Keep everything else."""
    p = urlparse(html.unescape(u))
    if p.netloc in OWN_HOSTS and "/wp-content/" not in p.path:
        path = p.path or "/"
        if not path.endswith("/") and "." not in os.path.basename(path):
            path += "/"
        return path + (("#" + p.fragment) if p.fragment else "")
    return u

class Conv(MarkdownConverter):
    """markdownify với vài chỉnh sửa cho nội dung Gutenberg."""
    def convert_img(self, el, text, parent_tags):
        src = el.get("src") or ""
        alt = (el.get("alt") or "").strip()
        loc = local_url(src)
        if loc:
            src = loc
        elif src.startswith("data:"):
            loc = local_url(src)
            src = loc or src
        return f"\n\n![{alt}]({src})\n\n"
    def convert_a(self, el, text, parent_tags):
        href = el.get("href") or ""
        # blogger-style <a href=big-image><img></a> -> just the image
        if el.find("img") is not None and not el.get_text(strip=True):
            return text
        new = internal_href(href)
        el["href"] = new
        if text.strip() in (href, html.unescape(href)):
            text = new
        return super().convert_a(el, text, parent_tags)
    def convert_span(self, el, text, parent_tags):
        style = el.get("style") or ""
        if "color: red" in style and text.strip():
            return f"**{text.strip()}**"
        return text
    def convert_u(self, el, text, parent_tags):
        return text
    def convert_figure(self, el, text, parent_tags):
        return text
    def convert_div(self, el, text, parent_tags):
        return text
    def convert_hr(self, el, text, parent_tags):
        return "\n\n---\n\n"

conv = Conv(heading_style="ATX", bullets="-", newline_style="BACKSLASH",
            escape_underscores=False, escape_asterisks=True, escape_misc=False,
            strong_em_symbol="*", code_language="", wrap=False)

def fence_for(code):
    ticks = "```"
    while ticks in code:
        ticks += "`"
    return ticks

def code_block(lang, body):
    body = html.unescape(body)
    body = re.sub(r"<[^>]+>", "", body)        # SyntaxHighlighter đôi khi để lại tag
    body = body.replace("\r\n", "\n").strip("\n")
    f = fence_for(body)
    return f"\n\n{f}{lang}\n{body}\n{f}\n\n"

LANG_MAP = {"cpp": "cpp", "bash": "bash", "groovy": "groovy", "text": "text",
            "c": "c", "python": "python", "sh": "bash", "shell": "bash"}

def yt_id(u):
    m = re.search(r"(?:v=|youtu\.be/|shorts/|embed/)([A-Za-z0-9_\-]{6,})", u)
    return m.group(1) if m else None

# ------------------------------------------------------------------ block handling
def convert_html(src):
    h = src

    # 0. bỏ TOC (link hard-code URL cũ; Hugo/Hextra tự sinh TOC)
    h = re.sub(r"<!-- wp:table-of-contents.*?<!-- /wp:table-of-contents -->", "", h, flags=re.S)

    # 1. code blocks -> fenced
    def _code(m):
        attrs = json.loads(m.group(1)) if m.group(1) else {}
        lang = attrs.get("language")
        if not lang and "className" in attrs:
            lm = re.search(r"language-(\w+)", attrs["className"])
            lang = lm.group(1) if lm else None
        lang = LANG_MAP.get((lang or "bash").lower(), lang or "bash")
        return placeholder(code_block(lang, m.group(2)))
    h = re.sub(r"<!-- wp:syntaxhighlighter/code(?: (\{.*?\}))? -->\s*<pre[^>]*>(.*?)</pre>\s*<!-- /wp:syntaxhighlighter/code -->",
               _code, h, flags=re.S)
    h = re.sub(r"<!-- wp:(?:code|preformatted)(?: \{.*?\})? -->\s*<pre[^>]*>(?:<code>)?(.*?)(?:</code>)?</pre>\s*<!-- /wp:(?:code|preformatted) -->",
               lambda m: placeholder(code_block("text", m.group(1))), h, flags=re.S)

    # 2. embeds
    def _embed(m):
        attrs = json.loads(m.group(1))
        u = attrs.get("url", "")
        if attrs.get("providerNameSlug") == "youtube" or "youtube.com" in u or "youtu.be" in u:
            vid = yt_id(u)
            if vid:
                return placeholder(f"\n\n{{{{< youtube {vid} >}}}}\n\n")
        return placeholder(f"\n\n<{u}>\n\n")
    h = re.sub(r"<!-- wp:embed (\{.*?\}) -->.*?<!-- /wp:embed -->", _embed, h, flags=re.S)

    # 3. VideoPress / video blocks -> <video> local
    def _video(m):
        attrs = json.loads(m.group(1)) if m.group(1) else {}
        guid = attrs.get("guid")
        gm = re.search(r"videopress\.com/v/([A-Za-z0-9]+)", m.group(2))
        guid = guid or (gm.group(1) if gm else None)
        src = poster = None
        if guid and guid in VP_META and VP_META[guid].get("original"):
            src = local_url(VP_META[guid]["original"])
            if VP_META[guid].get("poster"):
                poster = local_url(VP_META[guid]["poster"])
        if not src:
            sm = re.search(r'src="([^"]+)"', m.group(2))
            if sm:
                src = local_url(sm.group(1)) or sm.group(1)
        if not src:
            return placeholder(f"\n\n<!-- video không tải được: {m.group(0)[:120]} -->\n\n")
        p = f' poster="{poster}"' if poster else ""
        return placeholder(f'\n\n<video controls preload="metadata"{p} src="{src}" style="max-width:100%;margin:auto;display:block"></video>\n\n')
    h = re.sub(r"<!-- wp:(?:video|videopress/video)(?: (\{.*?\}))? -->(.*?)<!-- /wp:(?:video|videopress/video) -->", _video, h, flags=re.S)

    # 4. details (không lồng nhau trong export này) -> Hextra shortcode, nội dung convert đệ quy
    def _details(m):
        title = re.sub(r"<[^>]+>", "", html.unescape(m.group(1))).strip().replace('"', "'")
        inner = convert_html(m.group(2))
        return placeholder(f'\n\n{{{{% details title="{title}" closed="true" %}}}}\n\n{inner.strip()}\n\n{{{{% /details %}}}}\n\n')
    h = re.sub(r"<!-- wp:details(?: \{.*?\})? -->\s*<details[^>]*>\s*<summary>(.*?)</summary>(.*?)</details>\s*<!-- /wp:details -->",
               _details, h, flags=re.S)

    # 5. rác từ blogspot / block rỗng
    h = re.sub(r'<div class="separator"[^>]*>\s*</div>', "", h)
    h = re.sub(r"<div>\s*</div>", "", h)
    h = re.sub(r"<blockquote[^>]*>\s*</blockquote>", "", h)
    h = re.sub(r"<p>\s*(?:&nbsp;|\s)*</p>", "", h)

    # 6. hạ 1 cấp heading (h1 trong bài -> h2, vì title bài đã là h1)
    for lvl in (4, 3, 2, 1):
        h = re.sub(rf"<h{lvl}\b", f"<h{lvl+1}", h)
        h = re.sub(rf"</h{lvl}>", f"</h{lvl+1}>", h)

    # 7. bỏ mọi comment Gutenberg còn lại
    h = re.sub(r"<!-- /?wp:[^>]*-->", "", h)

    md = conv.convert(h)
    md = restore(md)
    # dọn
    md = re.sub(r"[ \t]+\n", "\n", md)
    md = re.sub(r"\n{3,}", "\n\n", md)
    md = re.sub(r"^\s*>\s*$\n?", "", md, flags=re.M)
    md = escape_angle_words(md)
    return md.strip() + "\n"

def escape_angle_words(md):
    """`bitbake -e <recipe>` trong prose -> `\<recipe>` (giữ nguyên trong code fence / HTML ta tự sinh)."""
    out, in_fence = [], False
    for line in md.split("\n"):
        if line.startswith("```") or line.startswith("````"):
            in_fence = not in_fence
        elif not in_fence and not line.lstrip().startswith(("<video", "<!--", "<http")):
            line = re.sub(r"(?<![`\\])<(?=[A-Za-z_][A-Za-z0-9_\-]*>)", r"\\<", line)
        out.append(line)
    return "\n".join(out)

# ------------------------------------------------------------------ front matter
def series_of(title):
    m = re.match(r"^\[([^\]]+)\]\s*(\d+(?:\.\d+)?)?", title)
    if not m:
        return None, None
    order = float(m.group(2)) if m.group(2) else None
    if order is not None and order.is_integer():
        order = int(order)
    return m.group(1).strip(), order

# series prefix -> board (taxonomy `boards`; trang board liệt kê series -> bài)
BOARD_OF = {
    "Yocto-BBB": "Beaglebone Black", "Boot-BBB": "Beaglebone Black", "Kernel-BBB": "Beaglebone Black",
    "BBB-Linux": "Beaglebone Black", "Android-BBB": "Beaglebone Black",
    "Yocto-Lichee": "LicheePi Nano", "Device-Driver-Lichee": "LicheePi Nano",
    "STM32MP1": "STM32MP157", "Yocto-STM32MP1": "STM32MP157",
    "Yocto-MX93": "FRDM i.MX93",
    "Android": "Raspberry Pi 4",
    "OrangePi": "Orange Pi Zero 2W",
    "Kernel-QEMU": "QEMU",
}
# page WP cũ (danh sách link) được thay bằng trang taxonomy boards, giữ URL cũ
BOARD_PAGES = {"beaglebone-black", "stm32mp157", "frdm-i-mx93"}

def first_paragraph(md):
    for block in md.split("\n\n"):
        b = block.strip()
        if not b or b.startswith(("#", "!", "```", "{{", "<", "|", "-", ">")) or "QQPH" in b:
            continue
        b = re.sub(r"[*_`\[\]]", "", b).replace("\n", " ")
        return (b[:157] + "…") if len(b) > 160 else b
    return ""

def norm_cat(c):
    c = c.strip().lstrip("#").strip()
    return None if c.lower() == "uncategorized" else c

# ------------------------------------------------------------------ main
tree = ET.parse(XML)
items = tree.getroot().find("channel").findall("item")
posts = [i for i in items if i.find("wp:post_type", NS).text in ("post", "page")]

ATT_URL = {i.find("wp:post_id", NS).text: i.find("wp:attachment_url", NS).text
           for i in items if i.find("wp:post_type", NS).text == "attachment"}

# id -> old path, để link nội bộ tới ?p=ID (nếu có) map được
id_to_path = {}
for it in posts:
    link = it.find("link").text or ""
    p = urlparse(link).path
    if "?p=" not in link:
        id_to_path[it.find("wp:post_id", NS).text] = p

report = []
for it in posts:
    PH.clear()
    ptype = it.find("wp:post_type", NS).text
    status = it.find("wp:status", NS).text
    title = (it.find("title").text or "").strip()
    slug = it.find("wp:post_name", NS).text or re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    link = it.find("link").text or ""
    raw = it.find("content:encoded", NS).text or ""
    author = it.find("dc:creator", NS).text
    date = datetime.strptime(it.find("wp:post_date", NS).text, "%Y-%m-%d %H:%M:%S")
    gmt_s = it.find("wp:post_date_gmt", NS).text
    mod = it.find("wp:post_modified", NS).text
    tz = "+07:00"
    if gmt_s and not gmt_s.startswith("0000"):
        off = date - datetime.strptime(gmt_s, "%Y-%m-%d %H:%M:%S")
        hh = int(off.total_seconds() // 3600)
        tz = f"{hh:+03d}:00"
    if ptype == "page" and slug in BOARD_PAGES:
        continue
    thumb = None
    for m in it.findall("wp:postmeta", NS):
        if m.find("wp:meta_key", NS).text == "_thumbnail_id":
            tid = m.find("wp:meta_value", NS).text
            if tid in ATT_URL:
                thumb = local_url(ATT_URL[tid])
    cats = sorted({c for c in (norm_cat(x.text) for x in it.findall("category") if x.get("domain") == "category") if c})
    tags = sorted({x.text.strip().lstrip("#").strip() for x in it.findall("category") if x.get("domain") == "post_tag"} - {""})
    series, order = series_of(title)

    md = convert_html(raw)

    fm = {"title": title,
          "date": date.strftime("%Y-%m-%dT%H:%M:%S") + tz}
    if mod and not mod.startswith("0000"):
        fm["lastmod"] = datetime.strptime(mod, "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%dT%H:%M:%S") + tz
    fm["slug"] = slug
    published = status == "publish"
    if published:
        fm["url"] = urlparse(link).path          # giữ nguyên URL cũ
    if cats:
        fm["categories"] = cats
    if tags:
        fm["tags"] = tags
    if series:
        fm["series"] = [series]
        if order is not None:
            fm["series_order"] = order
        if series in BOARD_OF:
            fm["boards"] = [BOARD_OF[series]]
    if thumb:
        fm["image"] = thumb
    desc = first_paragraph(md)
    if desc:
        fm["description"] = desc
    if author != "zk47a":
        fm["authors"] = [author]
    if not published:
        fm["draft"] = True
        fm["wp_status"] = status
    fm["wp_id"] = int(it.find("wp:post_id", NS).text)

    front = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, width=1000).strip()
    out = f"---\n{front}\n---\n\n{md}"

    if not published:
        path = os.path.join(DRAFTS, f"{slug}.md")
    elif ptype == "page":
        path = os.path.join(SITE, "content", f"{slug}.vi.md")
    else:
        path = os.path.join(SITE, "content", "posts", f"{slug}.vi.md")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(out)
    report.append((ptype, status, slug, len(md)))

# copy chỉ các asset được dùng
copied = 0
for sp, srcfile in used_assets.items():
    dst = os.path.join(SITE, "static", sp.lstrip("/"))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not os.path.exists(dst):
        shutil.copy2(srcfile, dst)
        copied += 1

from collections import Counter
print("written:", Counter((t, s) for t, s, _, _ in report))
print(f"assets referenced: {len(used_assets)}, copied: {copied}")
# cảnh báo URL ảnh còn trỏ ra ngoài
left = Counter()
for root, _, files in os.walk(os.path.join(SITE, "content")):
    for fn in files:
        for u in re.findall(r"!\[[^\]]*\]\((https?://[^)]+)\)", open(os.path.join(root, fn)).read()):
            left[urlparse(u).netloc] += 1
print("remote images still referenced:", dict(left))
