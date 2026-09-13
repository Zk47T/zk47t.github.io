# Embedded Linux Blog: source of https://embeddedlinux.blog

Static site: [Hugo](https://gohugo.io) + a small theme of its own (`layouts/`, `assets/`), search by [Pagefind](https://pagefind.app). Deployed to GitHub Pages on every push to `main`.

Vietnamese lives at the site root (all URLs from the old WordPress site are preserved), English lives under `/en/`.

## Write a post

**Not into Git?** Use the form: [Submit a post](https://github.com/Zk47T/zk47t.github.io/issues/new?template=new-post.yml). You write markdown in the browser (drag images straight in), pick the series and boards you have in mind, and add tags. The maintainer reviews it in the issue, then publishes it as a normal post credited to you. The series and board choices in the form come from the site content: run `python3 tools/sync_issue_form.py` after adding a series or board.

**Comfortable with Git?** Open a pull request directly:

1. Create `content/posts/<slug>.vi.md` (Vietnamese) and/or `content/posts/<slug>.en.md` (English). Same `<slug>` = same post in two languages; the VI/EN switch in the top bar links them.
2. Front matter:

   ```yaml
   ---
   title: "[Yocto-BBB] 21. Tên bài"
   date: 2026-09-20T09:00:00+07:00
   description: Một câu tóm tắt, hiện trong card và meta description.
   image: /uploads/2025/06/sddefault.jpg   # thumbnail (ảnh đại diện series)
   series: [Yocto-BBB]                     # tên series, xem /series/
   series_order: 21                        # thứ tự trong series
   boards: [Beaglebone Black]              # board, xem /boards/
   categories: [Yocto]
   tags: [beaglebone, yocto]
   # authors: [your-id]                   # only if you are not the site owner, see "Authors"
   ---
   ```

   The URL becomes `/posts/<slug>/`; it never depends on the date, so you can change `date` freely. Do **not** add `url:` to new posts; it only exists on migrated posts to keep their old WordPress addresses.
3. Markdown. Images go in `static/uploads/<year>/<month>/`, referenced as `/uploads/<year>/<month>/file.png`. Fenced code blocks get syntax highlighting and a copy button. Collapsible section:

   ```
   {{%/* details title="Giải thích" closed="true" */%}}
   ...markdown...
   {{%/* /details */%}}
   ```

   YouTube: `{{</* youtube VIDEO_ID */>}}`. Local video: `<video controls src="/videos/..."></video>`.
4. Preview: `hugo server` → http://localhost:1313. Open a PR; the site deploys when it is merged.

Posts in a series are read as one stream: when you reach the end of a post the next one in the series loads underneath (`params.infinite_scroll` in `hugo.yaml`).

## Authors

Every post has an author card (under the table of contents) and a byline; the home page shows the contributors board; `/authors/<id>/` lists an author's posts.

- Authors live in `data/authors.yaml` (name, role, motto, quote, links, `vi`/`en` variants). **Logo or drawn avatar only, no portrait photos.**
- Posts in `content/posts/` default to `tien` (a `cascade` in `content/posts/_index.*.md`). A guest post just adds `authors: [your-id]` to its front matter.
- To add yourself: add an entry to `data/authors.yaml` and create `content/authors/<id>/_index.vi.md` + `_index.en.md` with a `title:` (your display name). Your name then appears on the board automatically.

## Code blocks

- ```` ```bash ```` (also `sh`, `shell`, `console`, `zsh`) is rendered by the theme's own terminal highlighter (`layouts/_partials/term-highlight.html`), Ubuntu/Tango colours: `user@host` green, path blue, command names green, options cyan, strings yellow, variables magenta, `# comments` grey. Lines that start with a prompt (`zk47@host:~$ cmd`, `root@board:~# cmd`, `$ cmd`) are treated as commands and the lines after them as output; in a block without prompts every line is a command. The copy button skips the prompt. Add new command names to `$cmds` in that partial if yours is not coloured.
- Any other language (`cpp`, `python`, `yaml`, …) goes through Chroma (GitHub theme).
- Use `` `inline code` `` for file names, versions, commands, variables; they render as small boxes. Use **bold** only for emphasis in prose. (`tools/bold2code.py` did this conversion once for the migrated posts.)

## Home page board strip

`params.hero_boards` in `hugo.yaml` lists the boards in the strip (a continuous slideshow that pauses on hover; `hero_marquee: false` makes it static). Drop the picture in `static/img/boards/<name>.webp` (≈900 px wide, transparent or white background looks best); a missing file shows a placeholder icon, so entries can be added before the picture exists.

Board pages (`content/boards/<slug>/_index.*.md`) take `image:` too; without it the newest post's thumbnail is used.

Image credits: Raspberry Pi 4: Laserlicht, Wikimedia Commons, CC BY-SA 4.0; Raspberry Pi 5: Simon Waldherr, Wikimedia Commons, CC BY 4.0; QEMU logo: Benoît Canet, Wikimedia Commons, CC BY 3.0 (`params.image_credits`). Other board photos are the author's own or vendor press images.

## Translate a post

Every migrated post has an English twin: `content/posts/<slug>.en.md`, served at `/en/<same path>/`. The VI/EN switch in the top bar and the `hreflang` tags link the two.

- Front matter is copied from the Vietnamese file; only `title`, `description` and `url` (prefixed with `/en/`) change, plus `translation: auto`, which shows a small "Translated from the Vietnamese original" note with a link back. Remove that line once a human has reviewed the text.
- Code blocks stay byte-for-byte identical to the Vietnamese post; only Vietnamese comments inside them are translated.
- Links to other posts point to their `/en/` versions.
- Helper used for the bulk translation: `tools/translate_prep.py prep <slug>` prints the prose with code blocks replaced by placeholders, `tools/translate_prep.py assemble <slug>` puts the translated prose back together with the original code, rewrites internal links and refuses output containing em or en dashes.

## Boards and series

- `boards` and `series` are taxonomies. A board page (`/beaglebone-black/`, `/boards/licheepi-nano/`, …) lists every series on that board, each expanded into its numbered posts. Board pages are `content/boards/<slug>/_index.{vi,en}.md` (title, description, image).
- The **Boards** entry in the sidebar is a dropdown of all boards.

## Local build

```bash
hugo --gc --minify            # → public/
npx --yes pagefind --site public   # search index (also done in CI)
```

## Layout

```
content/            markdown (posts/, boards/, series/, authors/, about)
static/uploads/     images     static/videos/  videos     static/img/  logo, board photos
layouts/            templates (sidebar, topbar, home, post, series, boards, docs, 404)
assets/css/main.css theme      assets/css/chroma.css  syntax colours (hugo gen chromastyles)
assets/js/main.js   theme toggle, sidebar, copy code, TOC highlight, search, infinite scroll
tools/              one-off migration scripts from WordPress
```

