#!/usr/bin/env python3
"""
Tải toàn bộ resource (ảnh, video, poster, ảnh blogger, ảnh ngoài, data-URI) mà
WordPress export đang tham chiếu về local, và ghi ra url-map.json để bước
convert sang markdown thay URL.

Cấu trúc output (mặc định ./assets):
  assets/uploads/YYYY/MM/<file>      mirror wp-content/uploads (ảnh gốc, không ?w=)
  assets/videopress/<guid>/<file>    video gốc + poster từ VideoPress API
  assets/blogger/<hash>.<ext>        ảnh blogger.googleusercontent.com (blog cũ)
  assets/external/<hash>.<ext>       ảnh host ngoài (licdn, website-files...)
  assets/inline/<hash>.<ext>         data:image/...;base64 nhúng trong bài
  assets/url-map.json                { original_url: "assets/..." }
"""
import hashlib, json, os, re, sys, time, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from base64 import b64decode

XML = sys.argv[1] if len(sys.argv) > 1 else "embeddedlinuxa-z.WordPress.2026-09-13.xml"
OUT = sys.argv[2] if len(sys.argv) > 2 else "assets"
NS = {"wp": "http://wordpress.org/export/1.2/",
      "content": "http://purl.org/rss/1.0/modules/content/"}
WP_HOSTS = {"embeddedlinux.blog", "embedlinuxaz.wordpress.com",
            "embeddedlinux.files.wordpress.com", "embedlinuxaz.files.wordpress.com"}
UA = "Mozilla/5.0 (X11; Linux x86_64) blog-migration/1.0"

def http_get(url, binary=True, retries=4):
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
                return data if binary else data.decode("utf-8", "replace")
        except Exception as e:  # noqa
            last = e
            time.sleep(1.5 * (i + 1))
    raise last

def ext_of(url, default="bin"):
    p = urllib.parse.urlparse(url).path
    m = re.search(r"\.([a-zA-Z0-9]{2,5})$", p)
    return m.group(1).lower() if m else default

def short_hash(s):
    return hashlib.sha1(s.encode()).hexdigest()[:12]

def wp_upload_path(url):
    """https://embedlinuxaz.wordpress.com/wp-content/uploads/2026/05/a.png?w=1024 -> uploads/2026/05/a.png"""
    p = urllib.parse.urlparse(url)
    m = re.search(r"/wp-content/uploads/(.+)$", p.path)
    return "uploads/" + m.group(1) if m else None

# ---------------------------------------------------------------- collect
tree = ET.parse(XML)
items = tree.getroot().find("channel").findall("item")
jobs = {}   # original_url -> relative local path (under OUT)
inline = {} # data-uri -> local path

def add(url, rel):
    url = url.replace("&amp;", "&")
    if url not in jobs:
        jobs[url] = rel

# 1) tất cả attachment gốc
for it in items:
    if it.find("wp:post_type", NS).text == "attachment":
        u = it.find("wp:attachment_url", NS).text
        rel = wp_upload_path(u)
        if rel:
            add(u, rel)

# 2) mọi URL xuất hiện trong nội dung post/page
contents = [(it.find("title").text, it.find("content:encoded", NS).text or "")
            for it in items if it.find("wp:post_type", NS).text in ("post", "page")]
all_html = "\n".join(c for _, c in contents)

# 2a) wp-content/uploads ở bất kỳ attribute nào (src, srcset, poster, data-*, href)
for u in set(re.findall(r'https?://[^\s"\'<>)]+?/wp-content/uploads/[^\s"\'<>)]+', all_html)):
    u_clean = u.replace("&amp;", "&")
    base = u_clean.split("?")[0]
    rel = wp_upload_path(base)
    if rel:
        add(base, rel)          # tải bản gốc (bỏ ?w=...)
        if u_clean != base:
            jobs[u_clean] = rel # map cả URL có query về cùng file

# 2b) poster trong JSON của block video ({"poster":"https:\/\/..."})
for u in set(re.findall(r'"poster":"(https?:[^"]+)"', all_html)):
    u = u.replace("\\/", "/")
    rel = wp_upload_path(u.split("?")[0])
    if rel:
        add(u.split("?")[0], rel)

# 2c) ảnh blogger (blog cũ) - lấy bản gốc bằng cách đổi size segment -> s0
for u in set(re.findall(r'https?://blogger\.googleusercontent\.com/[^\s"\'<>)]+', all_html)):
    u = u.replace("&amp;", "&")
    add(u, f"blogger/{short_hash(u)}.{ext_of(u, 'png')}")

# 2d) ảnh host ngoài khác trong src=
for u in set(re.findall(r'src="(https?://[^"]+)"', all_html)):
    u = u.replace("&amp;", "&")
    host = urllib.parse.urlparse(u).netloc
    if host in WP_HOSTS or host == "blogger.googleusercontent.com":
        continue
    add(u, f"external/{short_hash(u)}.{ext_of(u, 'png')}")

# 2e) data-URI base64 nhúng thẳng trong bài
for m in re.finditer(r'src="data:(image/[a-z+]+);base64,([A-Za-z0-9+/=]+)"', all_html):
    mime, b64 = m.group(1), m.group(2)
    ext = {"image/png": "png", "image/jpeg": "jpg", "image/gif": "gif",
           "image/webp": "webp", "image/svg+xml": "svg"}.get(mime, "bin")
    inline[f"data:{mime};base64,{b64}"] = f"inline/{short_hash(b64)}.{ext}"

# 3) VideoPress: guid -> original mp4 + poster
guids = set(re.findall(r'videopress\.com/v/([A-Za-z0-9]+)', all_html)) | \
        set(re.findall(r'"guid":"([A-Za-z0-9]{8})"', all_html))
vp_meta = {}
for g in sorted(guids):
    try:
        meta = json.loads(http_get(f"https://public-api.wordpress.com/rest/v1.1/videos/{g}", binary=False))
    except Exception as e:
        print(f"[videopress] {g}: API fail {e}", file=sys.stderr)
        continue
    vp_meta[g] = {k: meta.get(k) for k in ("title", "original", "poster", "width", "height", "duration")}
    if meta.get("original"):
        add(meta["original"], f"videopress/{g}/{os.path.basename(urllib.parse.urlparse(meta['original']).path)}")
    if meta.get("poster"):
        add(meta["poster"], f"videopress/{g}/poster.{ext_of(meta['poster'], 'jpg')}")
    jobs[f"https://videopress.com/v/{g}"] = f"videopress/{g}/"

# ---------------------------------------------------------------- download
os.makedirs(OUT, exist_ok=True)
for data_uri, rel in inline.items():
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not os.path.exists(path):
        with open(path, "wb") as f:
            f.write(b64decode(data_uri.split(",", 1)[1]))

# gom các URL khác nhau nhưng cùng file đích -> chỉ tải 1 lần
targets = {}
for url, rel in jobs.items():
    if rel.endswith("/"):
        continue
    targets.setdefault(rel, url if "?" not in url else targets.get(rel, url))
for url, rel in jobs.items():          # ưu tiên URL không có query làm nguồn tải
    if not rel.endswith("/") and "?" not in url:
        targets[rel] = url

def fetch(rel, url):
    path = os.path.join(OUT, rel)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return rel, "skip", os.path.getsize(path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    src = url
    if "blogger.googleusercontent.com" in url:
        # /s16000/, /w400-h300/, /s320/ ... -> /s0/ (bản gốc)
        src = re.sub(r"/(s\d+|w\d+-h\d+(-[a-z0-9\-]+)?|s\d+-[a-z0-9\-]+)/([^/]+)$", r"/s0/\3", url)
    try:
        data = http_get(src)
    except Exception:
        if src != url:
            data = http_get(url)   # fallback URL nguyên bản
        else:
            raise
    with open(path, "wb") as f:
        f.write(data)
    return rel, "ok", len(data)

print(f"{len(targets)} files to fetch, {len(inline)} inline images extracted")
failed = []
total = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    futs = {ex.submit(fetch, rel, url): (rel, url) for rel, url in targets.items()}
    for n, fut in enumerate(as_completed(futs), 1):
        rel, url = futs[fut]
        try:
            rel, st, size = fut.result()
            total += size
            if n % 25 == 0 or st != "skip":
                print(f"[{n}/{len(targets)}] {st:4s} {size:>9d}  {rel}")
        except Exception as e:
            failed.append((url, rel, str(e)))
            print(f"[{n}/{len(targets)}] FAIL {rel}  <- {url}  ({e})", file=sys.stderr)

# ---------------------------------------------------------------- manifest
url_map = {u: f"{OUT}/{r}" for u, r in jobs.items()}
url_map.update({d: f"{OUT}/{r}" for d, r in inline.items()})
with open(os.path.join(OUT, "url-map.json"), "w") as f:
    json.dump({"url_map": url_map, "videopress": vp_meta, "failed": failed},
              f, indent=1, ensure_ascii=False)
print(f"\nDone. {len(targets)-len(failed)} ok, {len(failed)} failed, {total/1e6:.1f} MB")
print(f"url-map: {OUT}/url-map.json  ({len(url_map)} url entries)")
