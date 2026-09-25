// Berliner Kiez-Check – Kiez-Stories (kurze Foto-/Video-/Text-Stories, laufen automatisch ab)
// Nutzer-Stories erscheinen erst nach Admin-Freigabe. Nur der Admin veröffentlicht direkt.
// © 2026 DeindigitalerhelferCenter

const now = () => Date.now();
const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);
const clean = (s, n = 200) => (s == null ? '' : String(s)).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const J = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', ...h } });
const H = 3600e3, D = 24 * H;

/* ---------- Einstellungen ---------- */
export const KINDS = ['news', 'traffic', 'event', 'warn', 'info', 'politics'];
const HOURS = { news: 48, traffic: 48, warn: 48, info: 48, politics: 48, event: 48 }; // Event: bis Veranstaltungstag (max. 30 Tage)
const BGS = ['blau', 'weiss', 'rot', 'gelb'];
const QUOTA_EMAIL_DAY = 3;   // Stories pro E-Mail und Tag
const QUOTA_IP_DAY = 5;      // Stories pro Anschluss (IP) und Tag
const PENDING_MAX = 50;      // Mehr offene Stories nimmt das Formular nicht an
const IMG_MAX = 2.5e6, VID_MAX = 15e6;
const IMG_T = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };
const VID_T = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
const PUBF = 'id,kind,kiez,headline,sub,bg,i18n,media_key,media_type,poster_key,link_url,wa,source,author,ad,sponsor,event_date,created_at,approved_at,expires_at';

function safeUrl(u) {
  u = clean(u, 300);
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; }
}
function evEnd(dateStr) { // Ende des Veranstaltungstages (Berlin, grob 23:59 MEZ)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) return 0;
  return Date.parse(dateStr + 'T23:59:00+01:00') || 0;
}
function expiryFor(kind, eventDate, hours) {
  const t = now();
  if (hours) return t + Math.min(Math.max(+hours || 48, 1), 24 * 60) * H;
  if (kind === 'event') { const e = evEnd(eventDate); if (e > t) return Math.min(e, t + 30 * D); }
  return t + (HOURS[kind] || 48) * H;
}
async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function b64(buf) {
  let s = ''; const u = new Uint8Array(buf);
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}

/* ---------- Öffentlich: aktive Stories (+ automatische) ---------- */
export async function storiesPublic(url, env, KIEZE) {
  const t = now();
  const r = await env.DB.prepare(`SELECT ${PUBF} FROM stories WHERE status='approved' AND expires_at > ? ORDER BY ad DESC, approved_at DESC LIMIT 120`).bind(t).all();
  const items = (r.results || []).map(x => { try { x.i18n = JSON.parse(x.i18n || '{}'); } catch { x.i18n = {}; } return x; });
  let auto = [];
  if (url.searchParams.get('auto') !== '0') {
    try { auto = await autoStories(env, KIEZE); } catch { auto = []; }
  }
  return J({ items, auto }, 200, { 'cache-control': 'public, max-age=60' });
}

/* ---------- Öffentlich: Story einsenden (Status „pending“) ---------- */
export async function storySubmit(req, env, KIEZE) {
  const fd = await req.formData();
  if (fd.get('hp')) return J({ ok: true });
  if (fd.get('consent') !== '1' || fd.get('rights') !== '1') return J({ error: 'consent' }, 400);

  const d = {
    kind: clean(fd.get('kind'), 20),
    kiez: clean(fd.get('kiez'), 40),
    headline: clean(fd.get('headline'), 90),
    sub: clean(fd.get('sub'), 180),
    bg: clean(fd.get('bg'), 10),
    source: clean(fd.get('source'), 80),
    author: clean(fd.get('author'), 40),
    email: clean(fd.get('email'), 120).toLowerCase(),
    event_date: clean(fd.get('event_date'), 10),
    lang: ['de', 'tr', 'en'].includes(fd.get('lang')) ? fd.get('lang') : 'de'
  };
  const link = safeUrl(fd.get('link_url'));
  if (!KINDS.includes(d.kind)) return J({ error: 'field', field: 'kind' }, 400);
  if (!KIEZE[d.kiez]) return J({ error: 'field', field: 'kiez' }, 400);
  if (d.headline.length < 4) return J({ error: 'field', field: 'headline' }, 400);
  if (!BGS.includes(d.bg)) d.bg = 'blau';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return J({ error: 'field', field: 'email' }, 400);
  if (link === null) return J({ error: 'field', field: 'link_url' }, 400);
  if (d.kind === 'event' && !evEnd(d.event_date)) return J({ error: 'field', field: 'event_date' }, 400);

  // Kontingente
  const t = now();
  const pend = await env.DB.prepare("SELECT COUNT(*) AS n FROM stories WHERE status='pending'").first();
  if (pend && pend.n >= PENDING_MAX) return J({ error: 'full' }, 429);
  const em = await env.DB.prepare('SELECT COUNT(*) AS n FROM stories WHERE email=? AND created_at>?').bind(d.email, t - D).first();
  if (em && em.n >= QUOTA_EMAIL_DAY) return J({ error: 'quota' }, 429);
  const ipHash = await sha('story:' + (req.headers.get('cf-connecting-ip') || 'x') + (env.ADMIN_TOKEN || 'salt'));
  const ipn = await env.DB.prepare('SELECT COUNT(*) AS n FROM stories WHERE ip=? AND created_at>?').bind(ipHash, t - D).first();
  if (ipn && ipn.n >= QUOTA_IP_DAY) return J({ error: 'quota' }, 429);

  // Medien
  const id = uid();
  const m = await saveMedia(fd, env, id);
  if (m.error) return J({ error: m.error }, 400);

  // KI-Vorprüfung + Übersetzung (nur Hinweis für den Admin, gibt nichts automatisch frei)
  const ai = await aiStory(d, m.aiImage, env);
  const i18n = ai && ai.i18n ? ai.i18n : {};
  const note = ai ? ((ai.ok ? 'OK' : 'PRÜFEN') + (ai.flags && ai.flags.length ? ' [' + ai.flags.join(', ') + ']' : '') + ' – ' + (ai.reason || '')) : '';

  await env.DB.prepare(`INSERT INTO stories (id,kind,kiez,headline,sub,bg,lang,i18n,media_key,media_type,poster_key,link_url,wa,source,author,email,ip,ad,sponsor,event_date,status,mod_note,views,created_at,updated_at,approved_at,expires_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'',?,?,?,?,0,'',?,'pending',?,0,?,?,0,0)`)
    .bind(id, d.kind, d.kiez, d.headline, d.sub, d.bg, d.lang, JSON.stringify(i18n), m.key, m.type, m.poster, link || '', d.source, d.author, d.email, ipHash, d.event_date, note, t, t).run();
  return J({ ok: true, id });
}

async function saveMedia(fd, env, id) {
  const f = fd.get('media');
  const res = { key: '', type: '', poster: '', aiImage: null };
  if (!f || typeof f !== 'object' || !f.size) return res;
  if (IMG_T[f.type]) {
    if (f.size > IMG_MAX) return { error: 'photo' };
    const buf = await f.arrayBuffer();
    res.key = `st/${id}.${IMG_T[f.type]}`; res.type = 'image';
    await env.BUCKET.put(res.key, buf, { httpMetadata: { contentType: f.type } });
    if (f.type !== 'image/png') res.aiImage = { type: f.type, data: b64(buf) };
  } else if (VID_T[f.type]) {
    if (f.size > VID_MAX) return { error: 'video' };
    res.key = `st/${id}.${VID_T[f.type]}`; res.type = 'video';
    await env.BUCKET.put(res.key, f.stream(), { httpMetadata: { contentType: f.type } });
    const p = fd.get('poster');
    if (p && typeof p === 'object' && p.size && p.size < 1e6 && p.type === 'image/jpeg') {
      const pb = await p.arrayBuffer();
      res.poster = `st/${id}-p.jpg`;
      await env.BUCKET.put(res.poster, pb, { httpMetadata: { contentType: 'image/jpeg' } });
      res.aiImage = { type: 'image/jpeg', data: b64(pb) };
    }
  } else return { error: 'photo' };
  return res;
}

async function aiStory(d, image, env) {
  if (!env.ANTHROPIC_API_KEY) return null;
  const prompt = `Du prüfst eine kurze Nutzer-Story für eine Berliner Kiez-App (lokale Nachrichten, Verkehr, Veranstaltungen, Hinweise).
Art: ${d.kind}
Überschrift: ${d.headline}
Zusatztext: ${d.sub || '(keiner)'}
Quelle (Angabe des Nutzers): ${d.source || '(keine)'}
${image ? 'Das Bild der Story ist angehängt.' : 'Kein Bild.'}

Aufgaben:
1) flags: Liste aus diesen Kürzeln, falls zutreffend: "name" (voller Name oder erkennbare Privatperson, Kennzeichen), "gewalt" (Gewalt, Blut, Verletzte), "werbung" (Werbung/Verkaufsangebot), "politik" (Parteien, Wahlen, politische Meinung), "fremd" (Logos oder Screenshots anderer Medien/Instagram-Seiten, fremde Wasserzeichen), "fahrt" (während der Fahrt am Steuer gefilmt), "beleidigung", "falsch" (offensichtlich unglaubwürdig), "erotik".
2) ok=true nur, wenn keine flags gesetzt sind.
3) Übersetze Überschrift und Zusatztext sachlich nach Deutsch, Türkisch und Englisch (Überschrift max. 90 Zeichen, Zusatztext max. 180 Zeichen). Nichts hinzuerfinden.

Antworte AUSSCHLIESSLICH mit JSON ohne Markdown:
{"ok":true,"flags":[],"reason":"kurz auf Deutsch","i18n":{"de":{"h":"","s":""},"tr":{"h":"","s":""},"en":{"h":"","s":""}}}`;
  const content = image ? [{ type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } }, { type: 'text', text: prompt }] : prompt;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 700, messages: [{ role: 'user', content }] })
    });
    if (!r.ok) return null;
    const j = await r.json();
    const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').replace(/```json|```/g, '').trim();
    const o = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    const i18n = {};
    for (const l of ['de', 'tr', 'en']) if (o.i18n && o.i18n[l]) i18n[l] = { h: clean(o.i18n[l].h, 90), s: clean(o.i18n[l].s, 180) };
    return { ok: o.ok === true, flags: Array.isArray(o.flags) ? o.flags.map(x => clean(x, 20)).slice(0, 8) : [], reason: clean(o.reason, 200), i18n };
  } catch { return null; }
}

/* ---------- Öffentlich: Aufruf zählen (für Sponsoren-Berichte) ---------- */
export async function storyView(req, env) {
  let id = '';
  try { id = String((await req.json()).id || ''); } catch { }
  if (/^[a-z0-9]{12}$/.test(id)) await env.DB.prepare("UPDATE stories SET views=views+1 WHERE id=? AND status='approved'").bind(id).run();
  return J({ ok: true });
}

/* ---------- Medien ausliefern (mit Range für Videos auf iPhone) ---------- */
export async function storyMedia(key, req, env) {
  const range = req.headers.get('range');
  let o;
  const m = range && range.match(/bytes=(\d+)-(\d*)/);
  if (m) {
    const head = await env.BUCKET.head(key);
    if (!head) return new Response('Not found', { status: 404 });
    const size = head.size, start = +m[1], end = m[2] ? Math.min(+m[2], size - 1) : size - 1;
    if (start >= size) return new Response('', { status: 416, headers: { 'content-range': `bytes */${size}` } });
    o = await env.BUCKET.get(key, { range: { offset: start, length: end - start + 1 } });
    return new Response(o.body, {
      status: 206, headers: {
        'content-type': (head.httpMetadata && head.httpMetadata.contentType) || 'application/octet-stream',
        'content-range': `bytes ${start}-${end}/${size}`, 'content-length': String(end - start + 1),
        'accept-ranges': 'bytes', 'cache-control': 'public, max-age=86400'
      }
    });
  }
  o = await env.BUCKET.get(key);
  if (!o) return new Response('Not found', { status: 404 });
  return new Response(o.body, {
    headers: { 'content-type': (o.httpMetadata && o.httpMetadata.contentType) || 'application/octet-stream', 'accept-ranges': 'bytes', 'content-length': String(o.size), 'cache-control': 'public, max-age=86400' }
  });
}

/* ---------- Admin ---------- */
export async function adminStories(req, env, p, url, KIEZE) {
  if (p === '/api/admin/stories') {
    const v = url.searchParams.get('status');
    const t = now();
    let q, b = [];
    if (v === 'approved') { q = "status='approved' AND expires_at > ?"; b.push(t); }
    else if (v === 'old') { q = "(status='rejected' OR (status='approved' AND expires_at <= ?))"; b.push(t); }
    else q = "status='pending'";
    const r = await env.DB.prepare(`SELECT ${PUBF},email,status,mod_note,views FROM stories WHERE ${q} ORDER BY created_at DESC LIMIT 200`).bind(...b).all();
    const c = await env.DB.prepare("SELECT SUM(status='pending') AS pending, SUM(status='approved' AND expires_at > ?) AS approved, SUM(status='rejected' OR (status='approved' AND expires_at <= ?)) AS old FROM stories").bind(t, t).first();
    return J({ items: r.results || [], counts: c || {} });
  }
  if (p === '/api/admin/story/set' && req.method === 'POST') {
    const { id, status, hours } = await req.json();
    const row = await env.DB.prepare('SELECT * FROM stories WHERE id=?').bind(String(id)).first();
    if (!row) return J({ error: 'not_found' }, 404);
    if (status === 'delete') { await deleteStory(row, env); return J({ ok: true }); }
    if (status === 'approved') {
      const exp = expiryFor(row.kind, row.event_date, hours);
      await env.DB.prepare("UPDATE stories SET status='approved', approved_at=?, expires_at=?, updated_at=? WHERE id=?").bind(now(), exp, now(), row.id).run();
      return J({ ok: true, expires_at: exp });
    }
    if (status === 'rejected') {
      await env.DB.prepare("UPDATE stories SET status='rejected', updated_at=? WHERE id=?").bind(now(), row.id).run();
      return J({ ok: true });
    }
    if (status === 'extend') {
      const base = Math.max(row.expires_at || 0, now());
      await env.DB.prepare('UPDATE stories SET expires_at=?, updated_at=? WHERE id=?').bind(base + Math.min(Math.max(+hours || 24, 1), 24 * 60) * H, now(), row.id).run();
      return J({ ok: true });
    }
    return J({ error: 'status' }, 400);
  }
  // Admin veröffentlicht direkt (auch Sponsor-Stories)
  if (p === '/api/admin/story/save' && req.method === 'POST') {
    const fd = await req.formData();
    const ad = fd.get('ad') === '1';
    const d = {
      kind: ad ? 'info' : clean(fd.get('kind'), 20),
      kiez: clean(fd.get('kiez'), 40),
      headline: clean(fd.get('headline'), 90),
      sub: clean(fd.get('sub'), 180),
      bg: BGS.includes(fd.get('bg')) ? fd.get('bg') : 'blau',
      source: clean(fd.get('source'), 80),
      sponsor: clean(fd.get('sponsor'), 60),
      wa: clean(fd.get('wa'), 30).replace(/[^\d+]/g, ''),
      event_date: clean(fd.get('event_date'), 10)
    };
    const link = safeUrl(fd.get('link_url'));
    if (!KINDS.includes(d.kind)) return J({ error: 'field', field: 'kind' }, 400);
    if (!KIEZE[d.kiez]) return J({ error: 'field', field: 'kiez' }, 400);
    if (d.headline.length < 2) return J({ error: 'field', field: 'headline' }, 400);
    if (link === null) return J({ error: 'field', field: 'link_url' }, 400);
    if (ad && !d.sponsor) return J({ error: 'field', field: 'sponsor' }, 400);
    const id = uid();
    const m = await saveMedia(fd, env, id);
    if (m.error) return J({ error: m.error }, 400);
    const ai = await aiStory(d, null, env);
    const hours = ad ? Math.min(Math.max(+fd.get('days') || 7, 1), 60) * 24 : (+fd.get('hours') || 0);
    const t = now(), exp = expiryFor(d.kind, d.event_date, hours);
    await env.DB.prepare(`INSERT INTO stories (id,kind,kiez,headline,sub,bg,lang,i18n,media_key,media_type,poster_key,link_url,wa,source,author,email,ip,ad,sponsor,event_date,status,mod_note,views,created_at,updated_at,approved_at,expires_at)
      VALUES (?,?,?,?,?,?,'de',?,?,?,?,?,?,?,'Kiez-Check','admin','',?,?,?,'approved','Admin',0,?,?,?,?)`)
      .bind(id, d.kind, d.kiez, d.headline, d.sub, d.bg, JSON.stringify(ai && ai.i18n ? ai.i18n : {}), m.key, m.type, m.poster, link || '', d.wa, d.source, ad ? 1 : 0, d.sponsor, d.event_date, t, t, t, exp).run();
    return J({ ok: true, id, expires_at: exp });
  }
  return null;
}

async function deleteStory(row, env) {
  for (const k of [row.media_key, row.poster_key]) if (k && /^st\/[a-z0-9]{12}(-p)?\.[a-z0-9]{3,4}$/.test(k)) await env.BUCKET.delete(k);
  await env.DB.prepare('DELETE FROM stories WHERE id=?').bind(row.id).run();
}

/* ---------- Täglich (Cron): abgelaufene Stories + Dateien löschen ---------- */
export async function storiesCleanup(env) {
  const t = now();
  // Abgelaufen seit 1 Tag, abgelehnt seit 3 Tagen, unbearbeitet seit 14 Tagen
  const r = await env.DB.prepare(`SELECT id, media_key, poster_key FROM stories WHERE
    (status='approved' AND expires_at < ?) OR (status='rejected' AND updated_at < ?) OR (status='pending' AND created_at < ?) LIMIT 500`)
    .bind(t - D, t - 3 * D, t - 14 * D).all();
  for (const row of r.results || []) await deleteStory(row, env);
  return (r.results || []).length;
}

/* ---------- Automatische Stories (ohne Admin-Arbeit) ---------- */
async function autoStories(env, KIEZE) {
  const cache = caches.default;
  const key = new Request('https://cache.kiezcheck/auto-stories-v1');
  const hit = await cache.match(key);
  if (hit) return hit.json();
  const out = [];
  // 1) Feiertage in Berlin (heute bis in 3 Tagen)
  out.push(...holidayStories());
  // 2) Polizei Berlin (offizielle Meldungen, nur Titel + Link)
  try {
    const r = await fetch('https://www.berlin.de/polizei/polizeimeldungen/index.php/rss', { headers: { 'user-agent': 'Berliner-Kiez-Check/1.0' }, cf: { cacheTtl: 900 } });
    if (r.ok) {
      const xml = await r.text();
      const items = xml.split('<item>').slice(1, 9);
      for (const it of items) {
        const g = tag => { const m = it.match(new RegExp('<' + tag + '>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</' + tag + '>')); return m ? m[1].replace(/<[^>]+>/g, '').trim() : ''; };
        const title = g('title'), link = g('link'), desc = g('description'), date = Date.parse(g('pubDate')) || now();
        if (!title || !/^https:\/\/www\.berlin\.de\//.test(link) || now() - date > 2 * D) continue;
        out.push({ id: 'pol-' + (await sha(link)).slice(0, 10), kind: 'warn', auto: 'polizei', kiez: bezirkToKiez(title + ' ' + desc, KIEZE), headline: title.slice(0, 90), sub: '', bg: 'weiss', link_url: link, source: 'Polizei Berlin', created_at: date, i18n: {} });
      }
    }
  } catch { }
  // 3) tagesschau Berlin (nur Überschrift + Link)
  try {
    const r = await fetch('https://www.tagesschau.de/api2u/news/?regions=3', { headers: { 'user-agent': 'Berliner-Kiez-Check/1.0' } });
    if (r.ok) {
      const j = await r.json();
      for (const n of (j.news || []).slice(0, 5)) {
        if (!n.title || !/^https:\/\//.test(n.shareURL || '')) continue;
        out.push({ id: 'ts-' + (await sha(n.shareURL)).slice(0, 10), kind: 'news', auto: 'tagesschau', kiez: '', headline: String(n.title).slice(0, 90), sub: String(n.topline || '').slice(0, 120), bg: 'blau', link_url: n.shareURL, source: 'tagesschau.de', created_at: Date.parse(n.date) || now(), i18n: {} });
      }
    }
  } catch { }
  await cache.put(key, new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=1800' } }));
  return out;
}

const BEZIRKE = [
  ['Friedrichshain-Kreuzberg', 'kreuzberg'], ['Charlottenburg-Wilmersdorf', 'charlottenburg'], ['Tempelhof-Schöneberg', 'tempelhof'],
  ['Treptow-Köpenick', 'treptow'], ['Marzahn-Hellersdorf', 'marzahn'], ['Steglitz-Zehlendorf', 'steglitz'],
  ['Neukölln', 'neukoelln'], ['Kreuzberg', 'kreuzberg'], ['Friedrichshain', 'friedrichshain'], ['Wedding', 'wedding'], ['Gesundbrunnen', 'gesundbrunnen'],
  ['Moabit', 'moabit'], ['Tiergarten', 'tiergarten'], ['Mitte', 'mitte'], ['Prenzlauer Berg', 'prenzlauer-berg'], ['Schöneberg', 'schoeneberg'],
  ['Tempelhof', 'tempelhof'], ['Charlottenburg', 'charlottenburg'], ['Spandau', 'spandau'], ['Reinickendorf', 'reinickendorf'], ['Steglitz', 'steglitz'],
  ['Lichtenberg', 'lichtenberg'], ['Pankow', 'pankow'], ['Treptow', 'treptow'], ['Britz', 'britz'], ['Köpenick', 'koepenick'], ['Marzahn', 'marzahn']
];
function bezirkToKiez(txt, KIEZE) {
  for (const [n, k] of BEZIRKE) if (txt.includes(n) && KIEZE[k]) return k;
  return '';
}

function easter(y) { // Gauß'sche Osterformel
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(y, mo - 1, da);
}
function holidayStories() {
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const t0 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const out = [];
  for (const y of [today.getFullYear(), today.getFullYear() + 1]) {
    const e = easter(y), d = n => e + n * D, f = (m, dd) => Date.UTC(y, m - 1, dd);
    const L = [
      [f(1, 1), 'Neujahr', 'Yılbaşı', 'New Year\'s Day'], [f(3, 8), 'Internationaler Frauentag', 'Dünya Kadınlar Günü', 'International Women\'s Day'],
      [d(-2), 'Karfreitag', 'Kutsal Cuma', 'Good Friday'], [d(1), 'Ostermontag', 'Paskalya Pazartesisi', 'Easter Monday'],
      [f(5, 1), 'Tag der Arbeit', 'İşçi Bayramı', 'Labour Day'], [d(39), 'Christi Himmelfahrt', 'Göğe Yükseliş Günü', 'Ascension Day'],
      [d(50), 'Pfingstmontag', 'Pentekost Pazartesisi', 'Whit Monday'], [f(10, 3), 'Tag der Deutschen Einheit', 'Alman Birliği Günü', 'German Unity Day'],
      [f(12, 25), '1. Weihnachtstag', 'Noel 1. gün', 'Christmas Day'], [f(12, 26), '2. Weihnachtstag', 'Noel 2. gün', 'Boxing Day']
    ];
    for (const [ts, de, tr, en] of L) {
      const diff = Math.round((ts - t0) / D);
      if (diff < 0 || diff > 3) continue;
      const ds = new Date(ts);
      const dd = String(ds.getUTCDate()).padStart(2, '0') + '.' + String(ds.getUTCMonth() + 1).padStart(2, '0') + '.';
      const when = { de: diff === 0 ? 'Heute' : diff === 1 ? 'Morgen' : 'Am ' + dd, tr: diff === 0 ? 'Bugün' : diff === 1 ? 'Yarın' : dd, en: diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : 'On ' + dd };
      out.push({
        id: 'hol-' + ts, kind: 'info', auto: 'feiertag', kiez: '', bg: 'gelb', link_url: '', source: 'Kiez-Check', created_at: now(),
        headline: when.de + ': ' + de, sub: 'Gesetzlicher Feiertag in Berlin – die meisten Geschäfte und Supermärkte sind geschlossen.',
        i18n: {
          de: { h: when.de + ': ' + de, s: 'Gesetzlicher Feiertag in Berlin – die meisten Geschäfte und Supermärkte sind geschlossen.' },
          tr: { h: when.tr + ': ' + tr + ' (resmî tatil)', s: 'Berlin\'de resmî tatil – mağaza ve marketlerin çoğu kapalı.' },
          en: { h: when.en + ': ' + en, s: 'Public holiday in Berlin – most shops and supermarkets are closed.' }
        }
      });
    }
  }
  return out;
}
