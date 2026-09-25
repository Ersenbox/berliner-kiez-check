// Berliner Kiez-Check – Cloudflare Worker (API + SEO-Seiten + Sitemap)
// © 2026 DeindigitalerhelferCenter
import { SUBS, sponsorsPublic, sponsorTrack, adRequest, jobsPublic, jobSubmit, jobOwn, subscriptionCheckout, jobCheckout, handleStripeEvent, adminWerbung, news } from './werbung.js';
import { postsPublic, postSubmit, adminPosts } from './posts.js';

export const KIEZE = {
  'neukoelln': { name: 'Neukölln', lat: 52.4811, lng: 13.4350 },
  'kreuzberg': { name: 'Kreuzberg', lat: 52.4986, lng: 13.4030 },
  'wedding': { name: 'Wedding', lat: 52.5496, lng: 13.3526 },
  'gesundbrunnen': { name: 'Gesundbrunnen', lat: 52.5507, lng: 13.3905 },
  'moabit': { name: 'Moabit', lat: 52.5302, lng: 13.3420 },
  'tiergarten': { name: 'Tiergarten', lat: 52.5145, lng: 13.3501 },
  'mitte': { name: 'Mitte', lat: 52.5200, lng: 13.4050 },
  'friedrichshain': { name: 'Friedrichshain', lat: 52.5156, lng: 13.4541 },
  'prenzlauer-berg': { name: 'Prenzlauer Berg', lat: 52.5388, lng: 13.4244 },
  'schoeneberg': { name: 'Schöneberg', lat: 52.4830, lng: 13.3530 },
  'tempelhof': { name: 'Tempelhof', lat: 52.4664, lng: 13.3850 },
  'charlottenburg': { name: 'Charlottenburg', lat: 52.5163, lng: 13.3040 },
  'spandau': { name: 'Spandau', lat: 52.5354, lng: 13.1990 },
  'reinickendorf': { name: 'Reinickendorf', lat: 52.5870, lng: 13.3290 },
  'steglitz': { name: 'Steglitz', lat: 52.4560, lng: 13.3220 },
  'lichtenberg': { name: 'Lichtenberg', lat: 52.5130, lng: 13.4990 },
  'pankow': { name: 'Pankow', lat: 52.5690, lng: 13.4020 },
  'treptow': { name: 'Treptow', lat: 52.4900, lng: 13.4700 },
  'britz': { name: 'Britz', lat: 52.4430, lng: 13.4330 },
  'koepenick': { name: 'Köpenick', lat: 52.4450, lng: 13.5760 },
  'marzahn': { name: 'Marzahn', lat: 52.5450, lng: 13.5640 },
  'umgebung': { name: 'Berlin & Umgebung', lat: 52.5200, lng: 13.4050 } // + freier Ortsname (kiez_note)
};

export const CATS = {
  'fruehstueck': { de: 'Frühstück', tr: 'Kahvaltı', en: 'Breakfast' },
  'cafe': { de: 'Café', tr: 'Kafe', en: 'Café' },
  'restaurant': { de: 'Restaurant', tr: 'Restoran', en: 'Restaurant' },
  'imbiss': { de: 'Imbiss & Döner', tr: 'Büfe & Döner', en: 'Takeaway' },
  'baeckerei': { de: 'Bäckerei', tr: 'Fırın & Pastane', en: 'Bakery' },
  'markt': { de: 'Supermarkt & Markt', tr: 'Market', en: 'Grocery' },
  'friseur': { de: 'Friseur & Barber', tr: 'Kuaför & Berber', en: 'Barber & hair' },
  'beauty': { de: 'Kosmetik & Nails', tr: 'Güzellik', en: 'Beauty' },
  'service': { de: 'Dienstleistung', tr: 'Hizmet', en: 'Services' },
  'shop': { de: 'Einkaufen', tr: 'Alışveriş', en: 'Shopping' },
  'handel': { de: 'Einzel- & Großhandel', tr: 'Perakende & Toptan', en: 'Retail & wholesale' },
  'sonstiges': { de: 'Sonstiges', tr: 'Diğer', en: 'Other' } // + freie Kategorie (cat_note)
};

const PLANS = {
  d30: { days: 30, amount: 1900, label: 'Berliner Kiez-Check Hervorhebung 30 Tage' },
  d90: { days: 90, amount: 4900, label: 'Berliner Kiez-Check Hervorhebung 90 Tage' }
};

const PUB = 'id,name,kiez,category,address,lat,lng,desc_de,desc_tr,desc_en,phone,website,instagram,hours,photo_key,featured_until,created_at,updated_at,plan,whatsapp,coupon_code,coupon_text,coupon_until,kiez_note,cat_note';
const BERLIN_BOX = { s: 52.33, n: 52.68, w: 13.08, e: 13.77 };

const J = (d, s = 200, h = {}) => new Response(JSON.stringify(d), {
  status: s, headers: { 'content-type': 'application/json; charset=utf-8', ...h }
});
const now = () => Date.now();
const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);
const tok = () => crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
const clean = (s, n = 500) => (s == null ? '' : String(s)).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const cleanMulti = (s, n = 600) => (s == null ? '' : String(s)).replace(/[<>]/g, '').trim().slice(0, n);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    try {
      let m;
      if (p === '/api/listings' && req.method === 'GET') return listPublic(url, env);
      if (p === '/api/news' && req.method === 'GET') return news(req);
      if (p === '/api/sponsors' && req.method === 'GET') return sponsorsPublic(url, env);
      if (p === '/api/sp/imp' && req.method === 'POST') return sponsorTrack(req, env, 'imp');
      if (p === '/api/sp/click' && req.method === 'POST') return sponsorTrack(req, env, 'click');
      if (p === '/api/werben' && req.method === 'POST') return adRequest(req, env);
      if (p === '/api/jobs' && req.method === 'GET') return jobsPublic(url, env);
      if (p === '/api/jobs/submit' && req.method === 'POST') return jobSubmit(req, env, KIEZE, ipLimit);
      if ((m = p.match(/^\/api\/job\/([a-z0-9]{12})$/)) && req.method === 'GET') return jobOwn(m[1], url, env);
      if (p === '/api/submit' && req.method === 'POST') return submit(req, env);
      if (p === '/api/posts' && req.method === 'GET') return postsPublic(url, env);
      if (p === '/api/posts/submit' && req.method === 'POST') return postSubmit(req, env, KIEZE, ipLimit);
      if ((m = p.match(/^\/api\/listing\/([a-z0-9]{12})$/))) {
        if (req.method === 'GET') return getOwn(m[1], url, env);
        if (req.method === 'POST') return updateOwn(m[1], req, env);
      }
      if (p === '/api/checkout' && req.method === 'POST') return checkout(req, env, url);
      if (p === '/api/stripe-webhook' && req.method === 'POST') return webhook(req, env);
      if (p.startsWith('/api/admin/')) return admin(req, env, p, url);
      if ((m = p.match(/^\/img\/(p\/[a-z0-9]{12}\.jpg)$/))) return img(m[1], env);
      if ((m = p.match(/^\/img\/(s\/[a-z0-9-]{1,40}\.(?:jpg|png|webp))$/))) return img(m[1], env);
      if ((m = p.match(/^\/img\/(r\/[a-z0-9]{12}-[0-2]\.jpg)$/))) return img(m[1], env);
      if (p === '/sitemap.xml') return sitemap(url, env);
      if ((m = p.match(/^\/k\/([a-z-]+)(?:\/([a-z-]+))?\/?$/))) return seoPage(m[1], m[2], url, env);
      if (env.ASSETS) return env.ASSETS.fetch(req);
      return new Response('Not found', { status: 404 });
    } catch (e) {
      return J({ error: 'server', detail: String(e && e.message || e) }, 500);
    }
  }
};

/* ---------- Öffentliche Liste ---------- */
async function listPublic(url, env) {
  const k = url.searchParams.get('kiez'), c = url.searchParams.get('cat');
  let q = `SELECT ${PUB} FROM listings WHERE status='approved'`;
  const b = [];
  if (k && KIEZE[k]) { q += ' AND kiez=?'; b.push(k); }
  if (c && CATS[c]) { q += ' AND category=?'; b.push(c); }
  if (url.searchParams.get('coupon') === '1') { q += " AND featured_until > ? AND coupon_code IS NOT NULL AND coupon_code != '' AND (coupon_until IS NULL OR coupon_until = '' OR coupon_until >= ?)"; b.push(now(), new Date().toISOString().slice(0, 10)); }
  // Paket S: oben im eigenen Kiez. Paket M/L: zusätzlich oben in der Berlin-weiten Liste.
  q += (k && KIEZE[k]) ? ' ORDER BY (featured_until > ?) DESC, created_at DESC LIMIT 200'
    : " ORDER BY (featured_until > ? AND plan IN ('m','l')) DESC, created_at DESC LIMIT 200";
  b.push(now());
  const r = await env.DB.prepare(q).bind(...b).all();
  return J({ items: r.results || [] }, 200, { 'cache-control': 'public, max-age=60' });
}

/* ---------- Eintrag anlegen (Selbstservice) ---------- */
async function submit(req, env) {
  const fd = await req.formData();
  if (fd.get('website_url_hp')) return J({ ok: true, id: 'x', token: 'x', status: 'pending' }); // Honeypot

  const ipHash = await sha((req.headers.get('cf-connecting-ip') || 'x') + (env.ADMIN_TOKEN || 'salt'));
  const t0 = now();
  await env.DB.prepare('DELETE FROM rate WHERE ts < ?').bind(t0 - 86400e3).run();
  const cnt = await env.DB.prepare('SELECT COUNT(*) AS n FROM rate WHERE ip=? AND ts>?').bind(ipHash, t0 - 3600e3).first();
  if (cnt && cnt.n >= 5) return J({ error: 'rate' }, 429);
  await env.DB.prepare('INSERT INTO rate (ip, ts) VALUES (?, ?)').bind(ipHash, t0).run();

  if (fd.get('consent') !== '1' || fd.get('auth') !== '1') return J({ error: 'consent' }, 400);
  const d = readFields(fd);
  const err = validate(d);
  if (err) return J({ error: 'field', field: err }, 400);

  const id = uid(), t = tok();
  const photo_key = await savePhoto(fd, id, env);
  if (photo_key === false) return J({ error: 'photo' }, 400);
  const e = await enrich(d, env);

  await env.DB.prepare(`INSERT INTO listings
    (id,name,kiez,category,address,lat,lng,desc_de,desc_tr,desc_en,phone,website,instagram,hours,email,photo_key,status,mod_note,featured_until,edit_token,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?)`)
    .bind(id, d.name, d.kiez, d.category, d.address, e.lat, e.lng, e.desc_de, e.desc_tr, e.desc_en,
      d.phone, d.website, d.instagram, d.hours, d.email, photo_key, e.status, e.reason, t, t0, t0)
    .run();
  await saveExtras(id, d, env);
  return J({ ok: true, id, token: t, status: e.status });
}

/* ---------- Eigenen Eintrag lesen / bearbeiten ---------- */
async function ownRow(id, token, env) {
  if (!token) return null;
  const row = await env.DB.prepare('SELECT * FROM listings WHERE id=?').bind(id).first();
  if (!row || !safeEq(row.edit_token, token)) return null;
  return row;
}

async function getOwn(id, url, env) {
  const row = await ownRow(id, url.searchParams.get('token'), env);
  if (!row) return J({ error: 'auth' }, 403);
  delete row.edit_token;
  return J({ item: row });
}

async function updateOwn(id, req, env) {
  const fd = await req.formData();
  const row = await ownRow(id, fd.get('token'), env);
  if (!row) return J({ error: 'auth' }, 403);
  const d = readFields(fd);
  const err = validate(d);
  if (err) return J({ error: 'field', field: err }, 400);
  const photo_key = await savePhoto(fd, id, env);
  if (photo_key === false) return J({ error: 'photo' }, 400);
  const e = await enrich(d, env);
  // Freigegebener Eintrag + nur kleine Änderung (Kupon, Telefon, Zeiten, Links, Adresse …) = bleibt online.
  // Name, Beschreibung oder neues Foto geändert = erneute Prüfung.
  const small = row.status === 'approved' && !photo_key && d.name === row.name && clean(d.desc, 600) === clean(row.desc_de, 600);
  if (small) {
    e.status = 'approved';
    e.desc_de = row.desc_de || ''; e.desc_tr = row.desc_tr || ''; e.desc_en = row.desc_en || '';
    e.reason = row.mod_note || '';
  }
  await env.DB.prepare(`UPDATE listings SET name=?,kiez=?,category=?,address=?,lat=?,lng=?,desc_de=?,desc_tr=?,desc_en=?,
    phone=?,website=?,instagram=?,hours=?,email=?,photo_key=COALESCE(?,photo_key),status=?,mod_note=?,updated_at=? WHERE id=?`)
    .bind(d.name, d.kiez, d.category, d.address, e.lat, e.lng, e.desc_de, e.desc_tr, e.desc_en,
      d.phone, d.website, d.instagram, d.hours, d.email, photo_key, e.status, e.reason, now(), id)
    .run();
  await saveExtras(id, d, env);
  return J({ ok: true, id, status: e.status });
}

async function saveExtras(id, d, env) {
  await env.DB.prepare('UPDATE listings SET whatsapp=?, coupon_code=?, coupon_text=?, coupon_until=?, kiez_note=?, cat_note=? WHERE id=?')
    .bind(d.whatsapp, d.coupon_code, d.coupon_text, d.coupon_until,
      d.kiez === 'umgebung' ? d.kiez_note : '', d.category === 'sonstiges' ? d.cat_note : '', id).run();
}

/* Gemeinsame IP-Begrenzung (5 pro Stunde) – auch für Jobs */
async function ipLimit(req, env) {
  const ipHash = await sha((req.headers.get('cf-connecting-ip') || 'x') + (env.ADMIN_TOKEN || 'salt'));
  const t0 = now();
  const cnt = await env.DB.prepare('SELECT COUNT(*) AS n FROM rate WHERE ip=? AND ts>?').bind(ipHash, t0 - 3600e3).first();
  if (cnt && cnt.n >= 5) return J({ error: 'rate' }, 429);
  await env.DB.prepare('INSERT INTO rate (ip, ts) VALUES (?, ?)').bind(ipHash, t0).run();
  return null;
}

function readFields(fd) {
  const g = k => fd.get(k);
  return {
    name: clean(g('name'), 80),
    kiez: clean(g('kiez'), 40),
    category: clean(g('category'), 40),
    address: clean(g('address'), 160),
    desc: cleanMulti(g('desc'), 600),
    phone: clean(g('phone'), 40).replace(/[^\d+ ()/-]/g, ''),
    website: cleanUrl(g('website')),
    instagram: clean(g('instagram'), 60).replace(/^@/, '').replace(/[^A-Za-z0-9._]/g, ''),
    hours: clean(g('hours'), 160),
    email: clean(g('email'), 120).toLowerCase(),
    whatsapp: clean(g('whatsapp'), 40).replace(/[^\d+ ()/-]/g, ''),
    coupon_code: clean(g('coupon_code'), 30).toUpperCase().replace(/[^A-Z0-9-]/g, ''),
    coupon_text: clean(g('coupon_text'), 120),
    coupon_until: /^\d{4}-\d{2}-\d{2}$/.test(clean(g('coupon_until'), 10)) ? clean(g('coupon_until'), 10) : '',
    kiez_note: clean(g('kiez_note'), 40),
    cat_note: clean(g('cat_note'), 40)
  };
}

function cleanUrl(u) {
  u = clean(u, 200);
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; }
}

function validate(d) {
  if (d.name.length < 2) return 'name';
  if (!KIEZE[d.kiez]) return 'kiez';
  if (!CATS[d.category]) return 'category';
  if (d.kiez === 'umgebung' && d.kiez_note.length < 2) return 'kiez_note';
  if (d.category === 'sonstiges' && d.cat_note.length < 2) return 'cat_note';
  if (d.address.length < 5) return 'address';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return 'email';
  return null;
}

async function savePhoto(fd, id, env) {
  const f = fd.get('photo');
  if (!f || typeof f !== 'object' || !f.size) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 2.5e6) return false;
  const key = `p/${id}.jpg`;
  await env.BUCKET.put(key, await f.arrayBuffer(), { httpMetadata: { contentType: f.type } });
  return key;
}

/* ---------- Geocoding + KI-Prüfung ---------- */
async function enrich(d, env) {
  const [geo, ai] = await Promise.all([geocode(d.address, d.kiez === 'umgebung' ? d.kiez_note : null), aiCheck(d, env)]);
  const k = KIEZE[d.kiez];
  const status = (env.AUTO_APPROVE === '1' && ai && ai.ok === true) ? 'approved' : 'pending';
  const base = d.desc || '';
  return {
    lat: geo ? geo.lat : k.lat,
    lng: geo ? geo.lng : k.lng,
    status,
    desc_de: clean(ai && ai.desc_de, 400) || base,
    desc_tr: clean(ai && ai.desc_tr, 400) || base,
    desc_en: clean(ai && ai.desc_en, 400) || base,
    reason: ai ? clean(ai.reason, 300) : 'Keine KI-Prüfung (kein API-Key) – manuell prüfen'
  };
}

async function geocode(addr, ort) {
  // ort gesetzt = "Berlin & Umgebung": ohne Zusatz ", Berlin" suchen und größeren Bereich (Berlin + Brandenburg) erlauben
  const box = ort != null ? { s: 51.3, n: 53.6, w: 11.2, e: 14.8 } : BERLIN_BOX;
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&q=' +
      encodeURIComponent(ort != null ? addr + (ort ? ', ' + ort : '') : addr + ', Berlin'), { headers: { 'user-agent': 'BerlinerBerliner Kiez-Check/1.0 (info@deindigitalerhelfer.com)' } });
    const j = await r.json();
    if (j && j[0]) {
      const lat = +j[0].lat, lng = +j[0].lon;
      if (lat > box.s && lat < box.n && lng > box.w && lng < box.e) return { lat, lng };
    }
  } catch (e) { }
  return null;
}

async function aiCheck(d, env) {
  if (!env.ANTHROPIC_API_KEY) return null;
  const prompt = `Du prüfst einen Eintrag für ein Berliner Kiez-Branchenverzeichnis (lokale Geschäfte).
Eintrag:
Name: ${d.name}
Kiez: ${KIEZE[d.kiez].name}
Kategorie: ${CATS[d.category].de}
Adresse: ${d.address}
Beschreibung des Betriebs: ${d.desc || '(keine)'}
Website: ${d.website || '-'} | Instagram: ${d.instagram || '-'} | Öffnungszeiten: ${d.hours || '-'}

Aufgaben:
1) ok=false bei: Spam, Unsinn/Testeinträgen, Beleidigungen, Erotik, Glücksspiel, Waffen, Drogen, illegalen Angeboten, politischer/religiöser Hetze, Links zu fremden Werbeangeboten, oder wenn Kategorie/Beschreibung offensichtlich nicht zu einem lokalen Betrieb passen. Sonst ok=true.
2) Schreibe eine kurze, sachliche Beschreibung (max. 250 Zeichen) auf Deutsch, Türkisch und Englisch. NUR Fakten aus den Angaben, keine erfundenen Details, keine Superlative ("bester", "Nr. 1"), keine Preise, keine Gesundheitsversprechen.

Antworte AUSSCHLIESSLICH mit JSON ohne Markdown:
{"ok":true,"reason":"kurze Begründung auf Deutsch","desc_de":"...","desc_tr":"...","desc_en":"..."}`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 700, messages: [{ role: 'user', content: prompt }] })
    });
    if (!r.ok) return null;
    const j = await r.json();
    const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').replace(/```json|```/g, '').trim();
    const o = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return { ok: o.ok === true, reason: o.reason || '', desc_de: o.desc_de, desc_tr: o.desc_tr, desc_en: o.desc_en };
  } catch (e) { return null; }
}

/* ---------- Stripe: Hervorhebung kaufen ---------- */
async function checkout(req, env, url) {
  const { id, token, plan, job } = await req.json();
  if (job) {
    const jr = await env.DB.prepare('SELECT * FROM jobs WHERE id=?').bind(String(job)).first();
    if (!jr || !safeEq(jr.edit_token, token)) return J({ error: 'auth' }, 403);
    if (jr.status !== 'approved') return J({ error: 'not_approved' }, 400);
    if (!env.STRIPE_SECRET_KEY) return J({ error: 'stripe_missing' }, 501);
    const r = await jobCheckout(jr, token, env, url.origin);
    return J(r, r.url ? 200 : 502);
  }
  if (SUBS[plan]) {
    const row = await ownRow(String(id || ''), token, env);
    if (!row) return J({ error: 'auth' }, 403);
    if (row.status !== 'approved') return J({ error: 'not_approved' }, 400);
    if (!env.STRIPE_SECRET_KEY) return J({ error: 'stripe_missing' }, 501);
    const r = await subscriptionCheckout(row, token, plan, env, url.origin);
    return J(r, r.url ? 200 : 502);
  }
  const P = PLANS[plan];
  if (!P) return J({ error: 'plan' }, 400);
  const row = await ownRow(String(id || ''), token, env);
  if (!row) return J({ error: 'auth' }, 403);
  if (row.status !== 'approved') return J({ error: 'not_approved' }, 400);
  if (!env.STRIPE_SECRET_KEY) return J({ error: 'stripe_missing' }, 501);
  const back = `${url.origin}/?edit=${row.id}&token=${encodeURIComponent(token)}`;
  const body = new URLSearchParams({
    'mode': 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'eur',
    'line_items[0][price_data][unit_amount]': String(P.amount),
    'line_items[0][price_data][product_data][name]': `${P.label}: ${row.name}`,
    'metadata[listing_id]': row.id,
    'metadata[days]': String(P.days),
    'metadata[plan]': plan,
    'customer_email': row.email,
    'invoice_creation[enabled]': 'true',
    'allow_promotion_codes': 'true',
    'success_url': back + '&paid=1',
    'cancel_url': back
  });
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const j = await r.json();
  if (!j.url) return J({ error: 'stripe', detail: j.error && j.error.message }, 502);
  return J({ url: j.url });
}

async function webhook(req, env) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  const parts = {};
  sig.split(',').forEach(x => { const i = x.indexOf('='); const k = x.slice(0, i); if (!parts[k]) parts[k] = x.slice(i + 1); });
  if (!parts.t || !parts.v1 || !env.STRIPE_WEBHOOK_SECRET) return J({ error: 'sig' }, 400);
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return J({ error: 'old' }, 400);
  const expected = await hmacHex(env.STRIPE_WEBHOOK_SECRET, `${parts.t}.${body}`);
  if (!safeEq(expected, parts.v1)) return J({ error: 'sig' }, 400);

  const ev = JSON.parse(body);
  if (await handleStripeEvent(ev, env)) return J({ received: true });
  if (ev.type === 'checkout.session.completed') {
    const s = ev.data.object;
    if (s.payment_status === 'paid' && s.metadata && s.metadata.listing_id) {
      const dup = await env.DB.prepare('SELECT id FROM payments WHERE id=?').bind(s.id).first();
      if (!dup) {
        const row = await env.DB.prepare('SELECT featured_until FROM listings WHERE id=?').bind(s.metadata.listing_id).first();
        if (row) {
          const days = Number(s.metadata.days) || 30;
          const until = Math.max(now(), row.featured_until || 0) + days * 86400e3;
          await env.DB.batch([
            env.DB.prepare('UPDATE listings SET featured_until=? WHERE id=?').bind(until, s.metadata.listing_id),
            env.DB.prepare('INSERT INTO payments (id,listing_id,plan,amount,created_at) VALUES (?,?,?,?,?)')
              .bind(s.id, s.metadata.listing_id, s.metadata.plan || '', s.amount_total || 0, now())
          ]);
        }
      }
    }
  }
  return J({ received: true });
}

/* ---------- Admin ---------- */
async function admin(req, env, p, url) {
  const auth = req.headers.get('authorization') || '';
  if (!env.ADMIN_TOKEN || !safeEq(auth, 'Bearer ' + env.ADMIN_TOKEN)) return J({ error: 'auth' }, 401);

  if (p === '/api/admin/list') {
    const st = ['pending', 'approved', 'rejected'].includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'pending';
    const r = await env.DB.prepare(`SELECT ${PUB},email,status,mod_note FROM listings WHERE status=? ORDER BY created_at DESC LIMIT 300`).bind(st).all();
    return J({ items: r.results || [] });
  }
  if (p === '/api/admin/stats') {
    const c = await env.DB.prepare("SELECT status, COUNT(*) AS n FROM listings GROUP BY status").all();
    const f = await env.DB.prepare('SELECT COUNT(*) AS n FROM listings WHERE featured_until > ?').bind(now()).first();
    const m = await env.DB.prepare('SELECT COALESCE(SUM(amount),0) AS s FROM payments WHERE created_at > ?').bind(now() - 30 * 86400e3).first();
    return J({ counts: c.results || [], featured: f.n, revenue30: m.s });
  }
  if (p === '/api/admin/set' && req.method === 'POST') {
    const { id, status } = await req.json();
    if (!['pending', 'approved', 'rejected'].includes(status)) return J({ error: 'status' }, 400);
    await env.DB.prepare('UPDATE listings SET status=?, updated_at=? WHERE id=?').bind(status, now(), id).run();
    return J({ ok: true });
  }
  if (p === '/api/admin/delete' && req.method === 'POST') {
    const { id } = await req.json();
    const row = await env.DB.prepare('SELECT photo_key FROM listings WHERE id=?').bind(id).first();
    if (row && row.photo_key) await env.BUCKET.delete(row.photo_key);
    await env.DB.prepare('DELETE FROM listings WHERE id=?').bind(id).run();
    return J({ ok: true });
  }
  const w = await adminWerbung(req, env, p, url);
  if (w) return w;
  const po = await adminPosts(req, env, p, url);
  if (po) return po;
  return J({ error: 'not_found' }, 404);
}

/* ---------- Bilder ---------- */
async function img(key, env) {
  const o = await env.BUCKET.get(key);
  if (!o) return new Response('Not found', { status: 404 });
  return new Response(o.body, {
    headers: { 'content-type': (o.httpMetadata && o.httpMetadata.contentType) || 'image/jpeg', 'cache-control': 'public, max-age=86400' }
  });
}

/* ---------- Sitemap ---------- */
async function sitemap(url, env) {
  const r = await env.DB.prepare("SELECT kiez, category, MAX(updated_at) AS u FROM listings WHERE status='approved' GROUP BY kiez, category").all();
  const o = url.origin;
  const seen = new Set();
  const urls = [`<url><loc>${o}/</loc></url>`, `<url><loc>${o}/quiz/</loc></url>`, `<url><loc>${o}/werben.html</loc></url>`];
  for (const x of (r.results || [])) {
    const d = new Date(x.u).toISOString().slice(0, 10);
    if (!seen.has(x.kiez)) { seen.add(x.kiez); urls.push(`<url><loc>${o}/k/${x.kiez}</loc><lastmod>${d}</lastmod></url>`); }
    urls.push(`<url><loc>${o}/k/${x.kiez}/${x.category}</loc><lastmod>${d}</lastmod></url>`);
    urls.push(`<url><loc>${o}/k/${x.kiez}/${x.category}?lang=tr</loc><lastmod>${d}</lastmod></url>`);
  }
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

/* ---------- SEO-Seiten (serverseitig, für Google) ---------- */
const SEO_T = {
  de: {
    h_cat: (c, k) => `${c} in ${k}`, h_all: k => `${k}: Betriebe im Kiez`,
    intro: (n, k) => `${n} Einträge aus ${k}. Von den Betrieben selbst eingetragen und von uns geprüft.`,
    empty: 'Hier gibt es noch keine Einträge.', add: 'Eigenen Betrieb kostenlos eintragen',
    open: 'In der App ansehen', ad: 'Anzeige', more: 'Mehr in', all: 'Alle Kategorien',
    desc: (c, k) => `${c} in ${k} (Berlin): Adressen, Öffnungszeiten und Kontakt, direkt von den Betrieben.`
  },
  tr: {
    h_cat: (c, k) => `${k} ${c}`, h_all: k => `${k} mahallesindeki işletmeler`,
    intro: (n, k) => `${k} bölgesinden ${n} kayıt. İşletmeler kendileri ekledi, biz kontrol ettik.`,
    empty: 'Burada henüz kayıt yok.', add: 'İşletmeni ücretsiz ekle',
    open: 'Uygulamada aç', ad: 'Reklam', more: 'Daha fazlası:', all: 'Tüm kategoriler',
    desc: (c, k) => `Berlin ${k} ${c}: adresler, çalışma saatleri ve iletişim bilgileri, doğrudan işletmelerden.`
  },
  en: {
    h_cat: (c, k) => `${c} in ${k}`, h_all: k => `${k}: local businesses`,
    intro: (n, k) => `${n} listings from ${k}, added by the businesses themselves and checked by us.`,
    empty: 'No listings here yet.', add: 'Add your business for free',
    open: 'Open in app', ad: 'Ad', more: 'More in', all: 'All categories',
    desc: (c, k) => `${c} in ${k}, Berlin: addresses, opening hours and contact details from the businesses.`
  }
};

async function seoPage(k, c, url, env) {
  if (!KIEZE[k] || (c && !CATS[c])) return new Response('Not found', { status: 404 });
  const lang = ['de', 'tr', 'en'].includes(url.searchParams.get('lang')) ? url.searchParams.get('lang') : 'de';
  const T = SEO_T[lang];
  const K = KIEZE[k];
  let q = `SELECT ${PUB} FROM listings WHERE status='approved' AND kiez=?`;
  const b = [k];
  if (c) { q += ' AND category=?'; b.push(c); }
  q += ' ORDER BY (featured_until > ?) DESC, created_at DESC LIMIT 100';
  b.push(now());
  const items = (await env.DB.prepare(q).bind(...b).all()).results || [];
  const cats = (await env.DB.prepare("SELECT category, COUNT(*) AS n FROM listings WHERE status='approved' AND kiez=? GROUP BY category").bind(k).all()).results || [];

  const cName = c ? CATS[c][lang] : '';
  const title = c ? T.h_cat(cName, K.name) : T.h_all(K.name);
  const path = `/k/${k}${c ? '/' + c : ''}`;
  const o = url.origin;
  const t = now();
  const ads = env.ADSENSE_CLIENT && env.ADSENSE_SLOT;
  const adBlock = ads ? `<div class="ad"><small>${T.ad}</small><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(env.ADSENSE_CLIENT)}" data-ad-slot="${esc(env.ADSENSE_SLOT)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>` : '';

  const rows = items.map((it, i) => {
    const feat = it.featured_until > t;
    const d = it[`desc_${lang}`] || it.desc_de || '';
    return `${i === 3 ? adBlock : ''}<article class="it${feat ? ' feat' : ''}">
${it.photo_key ? `<img src="/img/${esc(it.photo_key)}?v=${it.updated_at}" alt="${esc(it.name)}" loading="lazy" width="96" height="96">` : `<div class="ph">${esc(it.name.charAt(0))}</div>`}
<div><h2>${esc(it.name)}${feat ? ` <span class="tag">${T.ad}</span>` : ''}</h2>
<p class="m">${esc(CATS[it.category][lang])}, ${esc(it.address)}</p>
${d ? `<p>${esc(d)}</p>` : ''}
${it.hours ? `<p class="m">${esc(it.hours)}</p>` : ''}
<p class="a">${it.phone ? `<a href="tel:${esc(it.phone.replace(/\s/g, ''))}">${esc(it.phone)}</a>` : ''}${it.website ? `<a href="${esc(it.website)}" rel="nofollow ugc" target="_blank">Website</a>` : ''}<a href="/?kiez=${k}&amp;cat=${it.category}&amp;id=${it.id}&amp;lang=${lang}">${T.open}</a></p></div></article>`;
  }).join('');

  const catLinks = cats.filter(x => x.category !== c).map(x =>
    `<a href="/k/${k}/${x.category}${lang !== 'de' ? '?lang=' + lang : ''}">${esc(CATS[x.category][lang])} (${x.n})</a>`).join('');

  const ld = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: title,
    itemListElement: items.slice(0, 30).map((it, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: {
        '@type': 'LocalBusiness', name: it.name,
        address: { '@type': 'PostalAddress', streetAddress: it.address, addressLocality: 'Berlin', addressCountry: 'DE' },
        ...(it.phone ? { telephone: it.phone } : {}), ...(it.website ? { url: it.website } : {}),
        ...(it.lat ? { geo: { '@type': 'GeoCoordinates', latitude: it.lat, longitude: it.lng } } : {})
      }
    }))
  };

  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)} – Berliner Kiez-Check</title>
<meta name="description" content="${esc(T.desc(cName || K.name, K.name))}">
${items.length ? '' : '<meta name="robots" content="noindex,follow">'}
<link rel="canonical" href="${o}${path}${lang !== 'de' ? '?lang=' + lang : ''}">
<link rel="alternate" hreflang="de" href="${o}${path}"><link rel="alternate" hreflang="tr" href="${o}${path}?lang=tr"><link rel="alternate" hreflang="en" href="${o}${path}?lang=en">
<link rel="icon" href="/icon.svg" type="image/svg+xml"><meta name="theme-color" content="#0078BF">
<style>@font-face{font-family:Archivo;font-style:normal;font-display:swap;font-weight:100 900;font-stretch:62% 125%;src:url(/vendor/fonts/archivo-latin-ext-wdth-normal.woff2) format('woff2-variations');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}@font-face{font-family:Archivo;font-style:normal;font-display:swap;font-weight:100 900;font-stretch:62% 125%;src:url(/vendor/fonts/archivo-latin-wdth-normal.woff2) format('woff2-variations');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}</style>
${ads ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(env.ADSENSE_CLIENT)}" crossorigin="anonymous"></script>` : ''}
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>
:root{--paper:#EEF0EC;--ink:#1C2B39;--pink:#FF48B0;--blue:#0078BF;--yellow:#FFE800;--muted:#4A5866;--card:#fff}
@media (prefers-color-scheme:dark){:root{--paper:#141B22;--ink:#E9ECE6;--muted:#A9B3BC;--card:#1C252E}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 Archivo,system-ui,sans-serif;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
header{border-bottom:2px solid var(--ink);padding:12px 18px}header a{color:var(--blue);font-weight:900;font-stretch:125%;font-size:22px;text-decoration:none}
main{max-width:760px;margin:0 auto;padding:22px 18px 60px}
h1{font-stretch:125%;font-weight:900;font-size:clamp(30px,6vw,52px);line-height:1;margin:.2em 0 .4em;color:var(--blue);text-shadow:.05em .035em 0 var(--pink)}
.intro{color:var(--muted);max-width:60ch}
.it{display:grid;grid-template-columns:96px 1fr;gap:14px;padding:16px 0;border-top:1.5px solid var(--ink)}
.it.feat{background:linear-gradient(90deg,var(--yellow) 6px,transparent 6px);padding-left:14px}
.it img,.ph{width:96px;height:96px;object-fit:cover;border:2px solid var(--ink)}
.ph{display:grid;place-items:center;background:var(--blue);color:var(--pink);font-weight:900;font-stretch:125%;font-size:44px}
h2{font-size:19px;margin:0 0 2px;font-stretch:112%}p{margin:4px 0}.m{color:var(--muted);font-size:14px}
.a a{margin-right:14px;color:var(--blue);font-weight:600}
.tag{background:var(--yellow);color:#1C2B39;font-size:12px;padding:1px 6px;border:1.5px solid #1C2B39;vertical-align:middle;font-weight:700}
.cats{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0}.cats a{border:1.5px solid var(--ink);padding:5px 10px;color:var(--ink);text-decoration:none;font-size:14px}
.cta{display:inline-block;margin-top:18px;background:var(--pink);color:#1C2B39;padding:12px 18px;font-weight:800;text-decoration:none;border:2px solid #1C2B39}
.ad{padding:14px 0;border-top:1.5px dashed var(--muted)}.ad small{color:var(--muted)}
footer{max-width:760px;margin:0 auto;padding:18px;color:var(--muted);font-size:13px}
</style></head><body>
<header><a href="/?lang=${lang}">Berliner Kiez-Check</a></header>
<main><h1>${esc(title)}</h1>
<p class="intro">${items.length ? T.intro(items.length, K.name) : T.empty}</p>
${rows}
${items.length < 4 ? adBlock : ''}
<nav class="cats"><a href="/k/${k}${lang !== 'de' ? '?lang=' + lang : ''}">${T.more} ${esc(K.name)}: ${T.all}</a>${catLinks}</nav>
<a class="cta" href="/?add=1&amp;kiez=${k}${c ? '&amp;cat=' + c : ''}&amp;lang=${lang}">${T.add}</a>
</main>
<footer>© 2026 DeindigitalerhelferCenter · <a href="/?lang=${lang}">Berliner Kiez-Check</a></footer>
</body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

/* ---------- Krypto-Helfer ---------- */
async function sha(s) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function safeEq(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
