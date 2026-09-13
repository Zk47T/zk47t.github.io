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
 *  Sửa code sau này: dán code mới -> Save -> Deploy -> Manage deployments -> (bút chì) Edit -> Version: New version -> Deploy (giữ nguyên URL).
 *
 * Không nhận được email? Trong trình soạn thảo Apps Script chọn hàm `testEmail` ở thanh trên -> Run.
 *  Lần đầu Google sẽ hỏi quyền gửi mail: cho phép. Kết quả (và lỗi nếu có) hiện ở "Execution log".
 *  Mỗi bình luận cũng ghi kết quả gửi mail vào cột "mail" (sent / lỗi) trong sheet.
 *
 * Quyền: dòng @OnlyCurrentDoc ở đầu file giới hạn script chỉ được đụng vào đúng Google Sheet này (không đọc được Sheet/Drive khác).
 *
 * Quản lý: mỗi bình luận là 1 dòng trong sheet "comments". Muốn ẩn: đặt cột hidden = TRUE. Muốn xoá: xoá dòng.
 * Mỗi bình luận mới gửi 1 email về OWNER_EMAIL (Gmail thường: tối đa khoảng 100 mail/ngày).
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

const HEADER = ['id', 'time', 'thread', 'url', 'title', 'name', 'body', 'hidden', 'mail'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
    sh.getRange('C:G').setNumberFormat('@');   // lưu dạng chữ
  }
  if (sh.getRange(1, HEADER.length).getValue() === '') sh.getRange(1, HEADER.length).setValue(HEADER[HEADER.length - 1]);   // sheet cũ chưa có cột "mail"
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
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

/** GET ?thread=<id>  ->  {ok, comments:[{id,time,name,body}]} */
function doGet(e) {
  const thread = clean_(e && e.parameter && e.parameter.thread).slice(0, 200);
  if (!thread) return json_({ ok: false, error: 'invalid' });
  const rows = sheet_().getDataRange().getValues().slice(1);
  const comments = rows
    .filter(function (r) { return String(r[2]) === thread && !isHidden_(r[7]); })
    .map(function (r) { return { id: String(r[0]), time: new Date(r[1]).toISOString(), name: String(r[5]), body: String(r[6]) }; });
  return json_({ ok: true, comments: comments });
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
  const key = 'cd_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, name.toLowerCase() + '|' + thread));
  if (cache.get(key)) return json_({ ok: false, error: 'slow_down' });
  const bucket = 'g_' + Math.floor(Date.now() / (GLOBAL_WINDOW_S * 1000));

  const id = Utilities.getUuid();
  const now = new Date();
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
  } finally {
    lock.releaseLock();
  }
  cache.put(key, '1', COOLDOWN_S);

  // gửi mail không được thì vẫn giữ bình luận, nhưng ghi lỗi vào cột "mail" và Executions log
  let mailStatus = 'sent';
  try {
    notify_(name, title, url, body, id);
  } catch (err) {
    mailStatus = 'error: ' + err;
    console.error('MailApp failed: ' + err);
  }
  sh.getRange(row, HEADER.length).setValue(mailStatus);
  return json_({ ok: true, comment: { id: id, time: now.toISOString(), name: name, body: body } });
}

function notify_(name, title, url, body, id) {
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: '[' + SITE_NAME + '] Bình luận mới từ ' + name + ': ' + title,
    body: name + ' vừa bình luận tại ' + SITE_URL + url + '\n\n' + body +
          '\n\n---\nẨn bình luận này: mở Google Sheet, dòng có id ' + id + ', đặt cột hidden = TRUE.\n' +
          SpreadsheetApp.getActiveSpreadsheet().getUrl()
  });
}

/** Chạy tay trong trình soạn thảo (chọn testEmail -> Run) để cấp quyền gửi mail và kiểm tra. */
function testEmail() {
  Logger.log('Tài khoản chạy script: ' + Session.getEffectiveUser().getEmail());
  Logger.log('Quota mail còn lại hôm nay: ' + MailApp.getRemainingDailyQuota());
  notify_('Test', 'Kiểm tra email thông báo', '/test/', 'Nếu bạn nhận được mail này thì thông báo bình luận đã chạy.', 'test');
  Logger.log('Đã gửi tới ' + OWNER_EMAIL + '. Kiểm tra Inbox, Spam và All Mail.');
}
