/** @OnlyCurrentDoc */
/**
 * Bình luận cho Embedded Linux Blog: Google Apps Script + Google Sheet (miễn phí, chạy bằng tài khoản Google của chủ blog).
 *
 * Cài đặt (khoảng 5 phút):
 *  1. Tạo Google Sheet mới (tên tuỳ ý) -> Extensions -> Apps Script -> xoá code mẫu, dán toàn bộ file này -> Save.
 *  2. Deploy -> New deployment -> Select type: Web app
 *       Execute as: Me        Who has access: Anyone
 *     -> Deploy -> cấp quyền (Sheet + gửi mail) -> copy "Web app URL" (dạng https://script.google.com/macros/s/.../exec).
 *  3. Dán URL đó vào `params.comments.endpoint` trong hugo.yaml, push.
 *  4. (Nên làm) Chọn hàm `installWarmTrigger` ở thanh trên -> Run: cứ 4 giờ script tự nạp sẵn bộ nhớ đệm,
 *     người đọc gần như không bao giờ phải chờ đọc Sheet.
 *  Sửa code sau này: dán code mới -> Save -> Deploy -> Manage deployments -> (bút chì) Edit -> Version: New version -> Deploy (giữ nguyên URL).
 *
 * Bình luận nằm ở đâu: tab "comments" trong chính Google Sheet này.
 * Tốc độ: danh sách bình luận của mọi bài được giữ trong CacheService (6 giờ). Sheet chỉ bị đọc 1 lần khi bộ nhớ đệm trống
 *  (1 lượt đọc nạp cho cả site), bình luận mới được thêm thẳng vào bộ nhớ đệm. Bài có rất nhiều bình luận chỉ trả phần mới nhất
 *  vừa giới hạn 100KB của CacheService (kèm tổng số).
 * Kiểm duyệt: email báo mỗi bình luận mới có link "Ẩn bình luận" bấm 1 lần (link có chữ ký bí mật, người khác không tạo được),
 *  hoặc đặt cột hidden = TRUE trong Sheet rồi chạy hàm `refreshCache` (hoặc chờ tối đa 4-6 giờ).
 *
 * An toàn: người đọc chỉ gọi được doGet/doPost bên dưới. Họ không sửa được code, không đọc được Sheet (chỉ thấy bình luận
 *  chưa ẩn), không gửi được mail tới ai khác ngoài OWNER_EMAIL, không đọc được hộp thư (script chỉ có quyền GỬI mail).
 *  Quan trọng: KHÔNG chia sẻ quyền chỉnh sửa Google Sheet này cho ai (người sửa được Sheet sửa được cả script).
 *  Dòng @OnlyCurrentDoc ở đầu file giới hạn script chỉ đụng được đúng Sheet này.
 *
 * Không nhận được email? Chọn hàm `testEmail` -> Run, xem "Execution log". Gmail thường: tối đa khoảng 100 mail/ngày.
 */
const OWNER_EMAIL = 'zizuzacker@gmail.com';
const SITE_URL = 'https://embeddedlinux.blog';
const SITE_NAME = 'Embedded Linux Blog';
const SHEET_NAME = 'comments';
const MAX_NAME = 40;
const MAX_BODY = 2000;
const MAX_LINKS = 2;          // chống spam: quá 2 link thì từ chối
const MIN_ELAPSED_MS = 3000;  // chống bot: gửi trong vòng 3 giây sau khi mở trang thì từ chối
const COOLDOWN_S = 30;        // cùng tên + cùng bài: phải cách nhau 30 giây
const GLOBAL_MAX = 20;        // cả site tối đa 20 bình luận mới mỗi 10 phút: chặn spam dồn dập, giữ quota mail và Sheet
const GLOBAL_WINDOW_S = 600;
const CACHE_S = 21600;        // 6 giờ, mức tối đa CacheService cho phép
const CACHE_VALUE_MAX = 95000; // CacheService: tối đa 100KB mỗi giá trị

const HEADER = ['id', 'time', 'thread', 'url', 'title', 'name', 'body', 'hidden', 'mail'];
const COL = { id: 1, time: 2, thread: 3, url: 4, title: 5, name: 6, body: 7, hidden: 8, mail: 9 };
const BUILT_KEY = 'built_v2';  // danh sách khoá của các bài có bình luận; có khoá này + bài không nằm trong danh sách = 0 bình luận

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    const sheets = ss.getSheets();
    // Sheet mới tinh chỉ có 1 tab trống: dùng luôn tab đó thay vì tạo thêm tab
    if (sheets.length === 1 && sheets[0].getLastRow() === 0) { sh = sheets[0]; sh.setName(SHEET_NAME); }
    else sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
    sh.getRange('C:G').setNumberFormat('@');   // lưu dạng chữ
  }
  if (sh.getRange(1, COL.mail).getValue() === '') sh.getRange(1, COL.mail).setValue('mail');   // sheet cũ chưa có cột "mail"
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function page_(title, text) {
  const esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  return HtmlService.createHtmlOutput('<meta name="viewport" content="width=device-width,initial-scale=1"><div style="font:16px/1.6 system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px"><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p></div>').setTitle(title);
}

// bỏ ký tự điều khiển (giữ xuống dòng nếu multiline), gộp khoảng trắng cho trường một dòng
function clean_(s, multiline) {
  s = String(s == null ? '' : s);
  s = Array.from(s).filter(function (ch) {
    const c = ch.charCodeAt(0);
    if (multiline && (c === 10 || c === 13)) return true;
    return c >= 32 && c !== 127;
  }).join('');
  if (!multiline) s = s.replace(/\s+/g, ' ');
  return s.trim();
}

// ô bắt đầu bằng = + - @ bị Sheets coi là công thức: thêm dấu ' để luôn là chữ
function safeCell_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function isHidden_(v) {
  return v === true || String(v).toUpperCase() === 'TRUE';
}

function hash_(s) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s));
}

function threadKey_(thread) {
  return 't_' + hash_(thread);
}

// Gói danh sách (cũ -> mới) thành giá trị cache <= CACHE_VALUE_MAX: bỏ bớt bình luận cũ nhất nếu quá lớn
function pack_(comments) {
  let list = comments, text = JSON.stringify({ total: comments.length, comments: list });
  while (text.length > CACHE_VALUE_MAX && list.length > 1) {
    list = list.slice(Math.ceil(list.length / 10));
    text = JSON.stringify({ total: comments.length, comments: list });
  }
  return text;
}

/** Đọc Sheet 1 lần, nạp bộ nhớ đệm cho MỌI bài. Trả về map thread -> [bình luận chưa ẩn, cũ -> mới]. */
function rebuildAll_() {
  const sh = sheet_();
  const last = sh.getLastRow();
  const groups = {};
  if (last > 1) {
    const rows = sh.getRange(2, 1, last - 1, COL.hidden).getValues();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r[COL.id - 1] || isHidden_(r[COL.hidden - 1])) continue;
      const t = String(r[COL.thread - 1]);
      (groups[t] = groups[t] || []).push({ id: String(r[COL.id - 1]), time: new Date(r[COL.time - 1]).toISOString(), name: String(r[COL.name - 1]), body: String(r[COL.body - 1]) });
    }
  }
  const cache = CacheService.getScriptCache();
  const values = {};
  Object.keys(groups).forEach(function (t) { values[threadKey_(t)] = pack_(groups[t]); });
  const keys = Object.keys(values);
  const old = cache.get(BUILT_KEY);
  if (old) {   // bài không còn bình luận hiện (vừa ẩn hết): xoá khoá cũ
    const stale = JSON.parse(old).filter(function (k) { return !(k in values); });
    if (stale.length) cache.removeAll(stale);
  }
  for (let i = 0; i < keys.length; i += 500) {
    const part = {};
    keys.slice(i, i + 500).forEach(function (k) { part[k] = values[k]; });
    cache.putAll(part, CACHE_S);
  }
  cache.put(BUILT_KEY, JSON.stringify(keys), CACHE_S);
  return groups;
}

// Trả về dữ liệu từ cache nếu chắc chắn đúng, null nếu phải đọc lại Sheet.
// Chỉ tin khoá của bài khi bài có trong danh sách mới nhất (tránh khoá cũ còn sót sau khi ẩn bình luận).
// CacheService có thể tự bỏ bớt khoá trước hạn: bài có trong danh sách mà mất khoá thì đọc lại Sheet.
function fromCache_(got, tk) {
  if (!got[BUILT_KEY]) return null;
  if (JSON.parse(got[BUILT_KEY]).indexOf(tk) < 0) return { total: 0, comments: [] };
  return got[tk] ? JSON.parse(got[tk]) : null;
}

function listThread_(thread) {
  const cache = CacheService.getScriptCache();
  const tk = threadKey_(thread);
  const hit = fromCache_(cache.getAll([tk, BUILT_KEY]), tk);
  if (hit) return hit;
  const lock = LockService.getScriptLock();       // nhiều người mở cùng lúc khi cache trống: chỉ 1 người đọc Sheet
  lock.waitLock(20000);
  try {
    const again = fromCache_(cache.getAll([tk, BUILT_KEY]), tk);
    if (again) return again;
    const all = rebuildAll_()[thread] || [];
    return JSON.parse(pack_(all));
  } finally {
    lock.releaseLock();
  }
}

// khoá bí mật cho link ẩn/hiện: sinh 1 lần, lưu trong Script Properties (chỉ chủ project thấy, không nằm trong code)
function secret_() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty('MODERATION_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('MODERATION_SECRET', s); }
  return s;
}

function sign_(action, id) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(action + ':' + id, secret_()));
}

function moderationLink_(action, id) {
  return ScriptApp.getService().getUrl() + '?action=' + action + '&id=' + encodeURIComponent(id) + '&sig=' + encodeURIComponent(sign_(action, id));
}

/** GET ?thread=<id>                                ->  {ok, total, comments:[{id,time,name,body}]} (cũ -> mới)
 *  GET ?action=hide|show&id=<id>&sig=<chữ ký>      ->  trang HTML xác nhận (link trong email kiểm duyệt) */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'hide' || p.action === 'show') return moderate_(p.action, String(p.id || ''), String(p.sig || ''));
  const thread = clean_(p.thread).slice(0, 200);
  if (!thread) return json_({ ok: false, error: 'invalid' });
  const data = listThread_(thread);
  return json_({ ok: true, total: data.total, comments: data.comments });
}

function moderate_(action, id, sig) {
  if (!id || sig !== sign_(action, id)) return page_('Link không hợp lệ', 'Link kiểm duyệt sai hoặc đã bị sửa.');
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last > 1) {
    const found = sh.getRange(2, COL.id, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
    if (found) {
      const row = found.getRow();
      sh.getRange(row, COL.hidden).setValue(action === 'hide');
      const name = sh.getRange(row, COL.name).getValue();
      rebuildAll_();
      return action === 'hide'
        ? page_('Đã ẩn bình luận', 'Bình luận của ' + name + ' đã được ẩn khỏi blog. Muốn hiện lại: bấm link "Hiện lại" trong email.')
        : page_('Đã hiện lại bình luận', 'Bình luận của ' + name + ' đã hiện lại trên blog.');
    }
  }
  return page_('Không tìm thấy', 'Bình luận này không còn trong Sheet (có thể đã bị xoá).');
}

/** POST (JSON gửi dạng text/plain) {thread,url,title,name,body,elapsed,website}  ->  {ok, comment} */
function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'invalid' }); }

  if (d.website) return json_({ ok: true, comment: null });   // honeypot: bot điền ô ẩn, giả vờ thành công
  const thread = clean_(d.thread).slice(0, 200);
  const url = clean_(d.url).slice(0, 300);
  const title = clean_(d.title).slice(0, 200);
  const name = clean_(d.name).slice(0, MAX_NAME);
  const body = clean_(d.body, true).slice(0, MAX_BODY);

  if (!thread || !name || !body || !/^\/[\w\-./%~]*$/.test(url)) return json_({ ok: false, error: 'invalid' });
  if (Number(d.elapsed || 0) < MIN_ELAPSED_MS) return json_({ ok: false, error: 'too_fast' });
  if ((body.match(/https?:\/\//gi) || []).length > MAX_LINKS) return json_({ ok: false, error: 'too_many_links' });

  const cache = CacheService.getScriptCache();
  const cooldownKey = 'cd_' + hash_(name.toLowerCase() + '|' + thread);
  if (cache.get(cooldownKey)) return json_({ ok: false, error: 'slow_down' });
  const bucket = 'g_' + Math.floor(Date.now() / (GLOBAL_WINDOW_S * 1000));

  const id = Utilities.getUuid();
  const now = new Date();
  const comment = { id: id, time: now.toISOString(), name: name, body: body };
  const sh = sheet_();
  let row;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const used = Number(cache.get(bucket) || 0);
    if (used >= GLOBAL_MAX) return json_({ ok: false, error: 'slow_down' });
    cache.put(bucket, String(used + 1), GLOBAL_WINDOW_S);
    sh.appendRow([id, now, safeCell_(thread), safeCell_(url), safeCell_(title), safeCell_(name), safeCell_(body), false, '']);
    row = sh.getLastRow();
    // thêm thẳng vào bộ nhớ đệm của bài (nếu cache đang có), không cần đọc lại Sheet
    const tk = threadKey_(thread);
    const got = cache.getAll([tk, BUILT_KEY]);
    const manifest = got[BUILT_KEY] ? JSON.parse(got[BUILT_KEY]) : null;
    if (manifest && manifest.indexOf(tk) >= 0 && got[tk]) {
      const cur = JSON.parse(got[tk]);
      const packed = JSON.parse(pack_(cur.comments.concat([comment])));
      cache.put(tk, JSON.stringify({ total: cur.total + 1, comments: packed.comments }), CACHE_S);
    } else if (manifest && manifest.indexOf(tk) < 0) {       // bài chưa có bình luận nào: tạo mới trong cache
      cache.put(tk, pack_([comment]), CACHE_S);
      manifest.push(tk);
      cache.put(BUILT_KEY, JSON.stringify(manifest), CACHE_S);
    } else {
      cache.remove(BUILT_KEY);                              // cache không chắc đúng: lần đọc sau nạp lại từ Sheet
    }
  } finally {
    lock.releaseLock();
  }
  cache.put(cooldownKey, '1', COOLDOWN_S);

  // gửi mail không được thì vẫn giữ bình luận, nhưng ghi lỗi vào cột "mail" và Executions log
  let mailStatus = 'sent';
  try {
    notify_({ id: id, row: row, sheetId: sh.getSheetId(), name: name, title: title, url: url, body: body });
  } catch (err) {
    mailStatus = 'error: ' + err;
    console.error('MailApp failed: ' + err);
  }
  sh.getRange(row, COL.mail).setValue(mailStatus);
  return json_({ ok: true, comment: comment });
}

function notify_(c) {
  const rowLink = SpreadsheetApp.getActiveSpreadsheet().getUrl() + '#gid=' + c.sheetId + '&range=A' + c.row;
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: '[' + SITE_NAME + '] ' + c.name + ' bình luận: ' + c.title,
    body: c.name + ' vừa bình luận bài "' + c.title + '"\n' + SITE_URL + c.url + '#comments\n\n' +
          c.body + '\n\n' +
          '----\n' +
          'Ẩn bình luận này (bấm 1 lần): ' + moderationLink_('hide', c.id) + '\n' +
          'Hiện lại: ' + moderationLink_('show', c.id) + '\n' +
          'Xem dòng trong Sheet: ' + rowLink + '\n'
  });
}

/** Chạy tay: nạp lại bộ nhớ đệm ngay (sau khi sửa/xoá dòng trực tiếp trong Sheet). */
function refreshCache() {
  const groups = rebuildAll_();
  Logger.log('Đã nạp bộ nhớ đệm cho ' + Object.keys(groups).length + ' bài.');
}

/** Trigger định kỳ gọi hàm này để bộ nhớ đệm không bao giờ trống. */
function warmCache() {
  rebuildAll_();
}

/** Chạy tay 1 lần: tạo trigger nạp bộ nhớ đệm mỗi 4 giờ (chạy lại không tạo trùng). */
function installWarmTrigger() {
  const exists = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'warmCache'; });
  if (!exists) ScriptApp.newTrigger('warmCache').timeBased().everyHours(4).create();
  rebuildAll_();
  Logger.log(exists ? 'Trigger đã có sẵn, đã nạp lại bộ nhớ đệm.' : 'Đã tạo trigger warmCache mỗi 4 giờ và nạp bộ nhớ đệm.');
}

/** Chạy tay trong trình soạn thảo (chọn testEmail -> Run) để cấp quyền gửi mail và kiểm tra. */
function testEmail() {
  Logger.log('Tài khoản chạy script: ' + Session.getEffectiveUser().getEmail());
  Logger.log('Quota mail còn lại hôm nay: ' + MailApp.getRemainingDailyQuota());
  notify_({ id: 'test', row: 1, sheetId: sheet_().getSheetId(), name: 'Test', title: 'Kiểm tra email thông báo', url: '/test/', body: 'Nếu bạn nhận được mail này thì thông báo bình luận đã chạy.' });
  Logger.log('Đã gửi tới ' + OWNER_EMAIL + '. Kiểm tra Inbox, Spam và All Mail.');
}
