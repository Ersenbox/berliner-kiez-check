// KiezCheck – Werbung, Sponsoren, Abos, Jobs, Werbeanfragen, News
// © 2026 DeindigitalerhelferCenter

/* Pakete: 3 Monate Einführungspreis 19 €/Monat, danach nach Betriebsgröße */
export const SUBS = {
  s: { amount: 4900, label: 'KiezCheck Paket S (kleiner Betrieb)' },
  m: { amount: 6900, label: 'KiezCheck Paket M (mittlerer Betrieb)' },
  l: { amount: 8900, label: 'KiezCheck Paket L (großer Betrieb)' }
};
export const INTRO = { amount: 1900, months: 3 };
export const JOB_URGENT = { amount: 2900, days: 30, label: 'KiezCheck Job-Anzeige „Dringend" 30 Tage' };

const JOBTYPES = ['vollzeit', 'teilzeit', 'minijob', 'ausbildung'];
const now = () => Date.now();
const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);
const tok = () => crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
const clean = (s, n = 500) => (s == null ? '' : String(s)).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const cleanMulti = (s, n = 1500) => (s == null ? '' : String(s)).replace(/[<>]/g, '').trim().slice(0, n);
const J = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', ...h } });
const day = () => new Date().toISOString().slice(0, 10);
const phoneClean = s => clean(s, 40).replace(/[^\d+ ()/-]/g, '');
const listHas = (csv, v) => !csv || String(csv).split(',').map(x => x.trim()).filter(Boolean).includes(v);

/* ---------- Sponsoren öffentlich ---------- */
export async function sponsorsPublic(url, env) {
  const place = clean(url.searchParams.get('place'), 20) || 'slider';
  const kiez = clean(url.searchParams.get('kiez'), 40);
  const cat = clean(url.searchParams.get('cat'), 40);
  const t = now();
  const rows = (await env.DB.prepare(
    `SELECT id,name,image,headline_de,headline_tr,headline_en,cta_de,cta_tr,cta_en,link_web,link_wa,link_tel,link_ig,places,kieze,cats,priority
     FROM sponsors WHERE active=1 AND (start_at=0 OR start_at<=?) AND (end_at=0 OR end_at>?)`).bind(t, t).all()).results || [];

  let items = rows.filter(r => listHas(r.places, place)).map(r => {
    // Relevanz: passender Kiez/Kategorie zuerst, dann Priorität, dann Zufall (faire Rotation)
    let score = r.priority;
    if (kiez && r.kieze && listHas(r.kieze, kiez)) score += 20;
    if (cat && r.cats && listHas(r.cats, cat)) score += 15;
    if ((r.kieze && kiez && !listHas(r.kieze, kiez)) || (r.cats && cat && !listHas(r.cats, cat))) score -= 5;
    return { ...r, kind: 'sponsor', score: score + Math.random() * 3 };
  });

  // Paket L: hervorgehobene Betriebe erscheinen zusätzlich als Sponsor-Karte
  if (place === 'slider' || place === 'native') {
    const ls = (await env.DB.prepare(
      `SELECT id,name,kiez,category,photo_key,desc_de,desc_tr,desc_en,updated_at FROM listings
       WHERE status='approved' AND plan='l' AND featured_until>? LIMIT 20`).bind(t).all()).results || [];
    for (const l of ls) {
      let score = 4 + Math.random() * 3;
      if (kiez === l.kiez) score += 20;
      if (cat === l.category) score += 15;
      items.push({
        id: 'l_' + l.id, kind: 'listing', listing_id: l.id, name: l.name, kiez: l.kiez, category: l.category,
        image: l.photo_key ? `/img/${l.photo_key}?v=${l.updated_at}` : '',
        headline_de: l.desc_de, headline_tr: l.desc_tr, headline_en: l.desc_en,
        cta_de: 'Ansehen', cta_tr: 'Gör', cta_en: 'View', score
      });
    }
  }
  items.sort((a, b) => b.score - a.score);
  items = items.slice(0, 12).map(({ score, places, priority, ...x }) => x);
  return J({ items }, 200, { 'cache-control': 'no-store' });
}

/* Impressionen und Klicks (anonym, nur Tageszähler) */
export async function sponsorTrack(req, env, kind) {
  let body = {};
  try { body = await req.json(); } catch (e) { }
  const ids = (Array.isArray(body.ids) ? body.ids : [body.id]).map(x => clean(x, 40)).filter(x => /^[a-z0-9_-]{2,40}$/.test(x)).slice(0, 20);
  if (!ids.length) return J({ ok: true });
  const d = day();
  const col = kind === 'click' ? 'clk' : 'imp';
  await env.DB.batch(ids.map(id => env.DB.prepare(
    `INSERT INTO sponsor_stats (sponsor_id, day, imp, clk) VALUES (?, ?, ?, ?)
     ON CONFLICT(sponsor_id, day) DO UPDATE SET ${col} = ${col} + 1`).bind(id, d, kind === 'click' ? 0 : 1, kind === 'click' ? 1 : 0)));
  return J({ ok: true });
}

/* ---------- Werbeanfrage (Formular werben.html) ---------- */
export async function adRequest(req, env) {
  const b = await req.json().catch(() => ({}));
  if (b.hp) return J({ ok: true });
  const r = {
    company: clean(b.company, 120), person: clean(b.person, 80), email: clean(b.email, 120).toLowerCase(),
    phone: phoneClean(b.phone), size: ['s', 'm', 'l', 'banner'].includes(b.size) ? b.size : 's', message: cleanMulti(b.message, 1000)
  };
  if (r.company.length < 2) return J({ error: 'field', field: 'company' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) return J({ error: 'field', field: 'email' }, 400);
  const cnt = await env.DB.prepare('SELECT COUNT(*) AS n FROM ad_requests WHERE email=? AND created_at>?').bind(r.email, now() - 86400e3).first();
  if (cnt && cnt.n >= 3) return J({ error: 'rate' }, 429);
  await env.DB.prepare('INSERT INTO ad_requests (id,company,person,email,phone,size,message,done,created_at) VALUES (?,?,?,?,?,?,?,0,?)')
    .bind(uid(), r.company, r.person, r.email, r.phone, r.size, r.message, now()).run();
  return J({ ok: true });
}

/* ---------- Jobs ---------- */
export async function jobsPublic(url, env) {
  const k = clean(url.searchParams.get('kiez'), 40);
  const t = now();
  let q = `SELECT id,title,company,kiez,jobtype,salary,languages,description,whatsapp,phone,urgent_until,created_at
           FROM jobs WHERE status='approved' AND expires_at>?`;
  const b = [t];
  if (k) { q += ' AND kiez=?'; b.push(k); }
  q += ' ORDER BY (urgent_until>?) DESC, created_at DESC LIMIT 100';
  b.push(t);
  return J({ items: (await env.DB.prepare(q).bind(...b).all()).results || [] }, 200, { 'cache-control': 'public, max-age=60' });
}

export async function jobSubmit(req, env, KIEZE, ipLimit) {
  const b = await req.json().catch(() => ({}));
  if (b.hp) return J({ ok: true, id: 'x', token: 'x', status: 'pending' });
  const limited = await ipLimit(req, env);
  if (limited) return limited;
  if (b.consent !== true || b.agg !== true) return J({ error: 'consent' }, 400);
  const d = {
    title: clean(b.title, 100), company: clean(b.company, 100), kiez: clean(b.kiez, 40),
    jobtype: JOBTYPES.includes(b.jobtype) ? b.jobtype : '', salary: clean(b.salary, 60), languages: clean(b.languages, 100),
    description: cleanMulti(b.description, 1500), whatsapp: phoneClean(b.whatsapp), phone: phoneClean(b.phone), email: clean(b.email, 120).toLowerCase()
  };
  if (d.title.length < 3) return J({ error: 'field', field: 'title' }, 400);
  if (d.company.length < 2) return J({ error: 'field', field: 'company' }, 400);
  if (!KIEZE[d.kiez]) return J({ error: 'field', field: 'kiez' }, 400);
  if (!d.jobtype) return J({ error: 'field', field: 'jobtype' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return J({ error: 'field', field: 'email' }, 400);
  if (!d.whatsapp && !d.phone) return J({ error: 'field', field: 'whatsapp' }, 400);

  const ai = await jobCheck(d, env);
  const status = (env.AUTO_APPROVE === '1' && ai && ai.ok === true) ? 'approved' : 'pending';
  const id = uid(), t = tok(), t0 = now();
  await env.DB.prepare(`INSERT INTO jobs (id,title,company,kiez,jobtype,salary,languages,description,whatsapp,phone,email,status,mod_note,urgent_until,edit_token,created_at,expires_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?)`)
    .bind(id, d.title, d.company, d.kiez, d.jobtype, d.salary, d.languages, d.description, d.whatsapp, d.phone, d.email,
      status, ai ? clean(ai.reason, 300) : 'Keine KI-Prüfung – manuell prüfen (AGG!)', t, t0, t0 + 30 * 86400e3).run();
  return J({ ok: true, id, token: t, status });
}

export async function jobOwn(id, url, env) {
  const row = await env.DB.prepare('SELECT * FROM jobs WHERE id=?').bind(id).first();
  if (!row || row.edit_token !== url.searchParams.get('token')) return J({ error: 'auth' }, 403);
  delete row.edit_token;
  return J({ item: row });
}

async function jobCheck(d, env) {
  if (!env.ANTHROPIC_API_KEY) return null;
  const prompt = `Prüfe eine Stellenanzeige für ein Berliner Kiez-Portal nach deutschem Recht (insb. AGG).
Titel: ${d.title}
Firma: ${d.company}
Art: ${d.jobtype} | Gehalt: ${d.salary || '-'} | Sprachen: ${d.languages || '-'}
Beschreibung: ${d.description || '-'}

ok=false bei: Diskriminierung nach AGG (Alter, Geschlecht ohne (m/w/d), Herkunft, Religion, Behinderung, sexuelle Identität), Schwarzarbeit, Pyramiden-/Schneeballsystemen, "Geld vorab", Erotik, illegalen Tätigkeiten, Spam oder Unsinn. Sprachanforderungen, die für die Tätigkeit nötig sind (z. B. "Türkisch und Deutsch"), sind erlaubt. Sonst ok=true.
Antworte NUR mit JSON: {"ok":true,"reason":"kurze Begründung auf Deutsch"}`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 200, messages: [{ role: 'user', content: prompt }] })
    });
    if (!r.ok) return null;
    const j = await r.json();
    const text = (j.content || []).filter(x => x.type === 'text').map(x => x.text).join('');
    const o = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return { ok: o.ok === true, reason: o.reason || '' };
  } catch (e) { return null; }
}

/* ---------- Stripe: Abo-Checkout für Betriebe ---------- */
async function stripe(env, path, params) {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params)
  });
  return r.json();
}

async function ensureIntroCoupon(env, plan) {
  const id = 'kc_intro_' + plan;
  const off = SUBS[plan].amount - INTRO.amount;
  const c = await stripe(env, 'coupons', {
    id, amount_off: String(off), currency: 'eur', duration: 'repeating',
    duration_in_months: String(INTRO.months), name: `Einführungspreis ${INTRO.months} Monate 19 €`
  });
  return c.id || (c.error && c.error.code === 'resource_already_exists' ? id : null);
}

export async function subscriptionCheckout(row, token, plan, env, origin) {
  const P = SUBS[plan];
  const coupon = await ensureIntroCoupon(env, plan);
  const back = `${origin}/?edit=${row.id}&token=${encodeURIComponent(token)}`;
  const p = {
    'mode': 'subscription',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'eur',
    'line_items[0][price_data][unit_amount]': String(P.amount),
    'line_items[0][price_data][recurring][interval]': 'month',
    'line_items[0][price_data][product_data][name]': `${P.label}: ${row.name}`,
    'metadata[listing_id]': row.id, 'metadata[plan]': plan, 'metadata[kind]': 'sub',
    'subscription_data[metadata][listing_id]': row.id, 'subscription_data[metadata][plan]': plan,
    'customer_email': row.email,
    'success_url': back + '&paid=1', 'cancel_url': back
  };
  if (coupon) p['discounts[0][coupon]'] = coupon;
  const j = await stripe(env, 'checkout/sessions', p);
  return j.url ? { url: j.url } : { error: 'stripe', detail: j.error && j.error.message };
}

export async function jobCheckout(job, token, env, origin) {
  const back = `${origin}/?view=jobs&job=${job.id}&token=${encodeURIComponent(token)}`;
  const j = await stripe(env, 'checkout/sessions', {
    'mode': 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'eur',
    'line_items[0][price_data][unit_amount]': String(JOB_URGENT.amount),
    'line_items[0][price_data][product_data][name]': `${JOB_URGENT.label}: ${job.title}`,
    'metadata[job_id]': job.id, 'metadata[kind]': 'job',
    'customer_email': job.email, 'invoice_creation[enabled]': 'true', 'allow_promotion_codes': 'true',
    'success_url': back + '&paid=1', 'cancel_url': back
  });
  return j.url ? { url: j.url } : { error: 'stripe', detail: j.error && j.error.message };
}

/* Webhook-Ereignisse für Abos und Jobs. Gibt true zurück, wenn behandelt. */
export async function handleStripeEvent(ev, env) {
  const o = ev.data && ev.data.object || {};
  if (ev.type === 'checkout.session.completed' && o.metadata && o.metadata.kind === 'sub' && o.metadata.listing_id) {
    const dup = await env.DB.prepare('SELECT id FROM payments WHERE id=?').bind(o.id).first();
    if (!dup) {
      const plan = SUBS[o.metadata.plan] ? o.metadata.plan : 's';
      const until = now() + 33 * 86400e3;
      await env.DB.batch([
        env.DB.prepare('UPDATE listings SET featured_until=MAX(featured_until, ?), plan=?, stripe_sub=? WHERE id=?').bind(until, plan, o.subscription || null, o.metadata.listing_id),
        env.DB.prepare('INSERT INTO payments (id,listing_id,plan,amount,created_at) VALUES (?,?,?,?,?)').bind(o.id, o.metadata.listing_id, 'sub_' + plan, o.amount_total || 0, now())
      ]);
    }
    return true;
  }
  if (ev.type === 'invoice.paid') {
    const sub = o.subscription || (o.parent && o.parent.subscription_details && o.parent.subscription_details.subscription) || null;
    if (!sub) return true;
    const row = await env.DB.prepare('SELECT id, featured_until FROM listings WHERE stripe_sub=?').bind(sub).first();
    const dup = await env.DB.prepare('SELECT id FROM payments WHERE id=?').bind(o.id).first();
    if (row && !dup) {
      const line = o.lines && o.lines.data && o.lines.data[0];
      const end = line && line.period && line.period.end ? line.period.end * 1000 + 2 * 86400e3 : now() + 33 * 86400e3;
      await env.DB.batch([
        env.DB.prepare('UPDATE listings SET featured_until=MAX(featured_until, ?) WHERE id=?').bind(end, row.id),
        env.DB.prepare('INSERT INTO payments (id,listing_id,plan,amount,created_at) VALUES (?,?,?,?,?)').bind(o.id, row.id, 'invoice', o.amount_paid || 0, now())
      ]);
    }
    return true;
  }
  if (ev.type === 'customer.subscription.deleted') {
    // Hervorhebung läuft bis zum Ende des bezahlten Zeitraums weiter, danach automatisch aus
    await env.DB.prepare('UPDATE listings SET stripe_sub=NULL WHERE stripe_sub=?').bind(o.id).run();
    return true;
  }
  if (ev.type === 'checkout.session.completed' && o.metadata && o.metadata.kind === 'job' && o.payment_status === 'paid') {
    const dup = await env.DB.prepare('SELECT id FROM payments WHERE id=?').bind(o.id).first();
    if (!dup) {
      const row = await env.DB.prepare('SELECT urgent_until FROM jobs WHERE id=?').bind(o.metadata.job_id).first();
      if (row) {
        const until = Math.max(now(), row.urgent_until || 0) + JOB_URGENT.days * 86400e3;
        await env.DB.batch([
          env.DB.prepare('UPDATE jobs SET urgent_until=?, expires_at=MAX(expires_at, ?) WHERE id=?').bind(until, until, o.metadata.job_id),
          env.DB.prepare('INSERT INTO payments (id,listing_id,plan,amount,created_at) VALUES (?,?,?,?,?)').bind(o.id, 'job:' + o.metadata.job_id, 'job_urgent', o.amount_total || 0, now())
        ]);
      }
    }
    return true;
  }
  return false;
}

/* ---------- Admin: Sponsoren, Jobs, Anfragen ---------- */
const SP_FIELDS = ['name', 'image', 'headline_de', 'headline_tr', 'headline_en', 'cta_de', 'cta_tr', 'cta_en',
  'link_web', 'link_wa', 'link_tel', 'link_ig', 'places', 'kieze', 'cats', 'plan', 'contact'];

export async function adminWerbung(req, env, p, url) {
  if (p === '/api/admin/sponsors') {
    const rows = (await env.DB.prepare('SELECT * FROM sponsors ORDER BY active DESC, priority DESC, name').all()).results || [];
    const from = new Date(now() - 30 * 86400e3).toISOString().slice(0, 10);
    const st = (await env.DB.prepare('SELECT sponsor_id, SUM(imp) AS imp, SUM(clk) AS clk FROM sponsor_stats WHERE day>=? GROUP BY sponsor_id').bind(from).all()).results || [];
    const m = {}; st.forEach(x => { m[x.sponsor_id] = x; });
    return J({ items: rows.map(r => ({ ...r, imp30: (m[r.id] || {}).imp || 0, clk30: (m[r.id] || {}).clk || 0 })) });
  }
  if (p === '/api/admin/sponsor/save' && req.method === 'POST') {
    const fd = await req.formData();
    let id = clean(fd.get('id'), 40).toLowerCase().replace(/[^a-z0-9-]/g, '');
    const isNew = !id;
    if (isNew) id = clean(fd.get('name'), 40).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || uid();
    const v = {};
    SP_FIELDS.forEach(k => { v[k] = clean(fd.get(k), k.startsWith('headline') ? 200 : 300); });
    if (v.name.length < 2) return J({ error: 'field', field: 'name' }, 400);
    for (const k of ['link_web', 'link_ig']) if (v[k] && !/^https:\/\//.test(v[k])) return J({ error: 'field', field: k }, 400);
    if (v.link_wa && !/^https:\/\/wa\.me\/\d+/.test(v.link_wa)) return J({ error: 'field', field: 'link_wa' }, 400);
    if (v.link_tel && !/^tel:\+?\d+$/.test(v.link_tel)) return J({ error: 'field', field: 'link_tel' }, 400);
    const f = fd.get('image_file');
    if (f && typeof f === 'object' && f.size) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 3e6) return J({ error: 'photo' }, 400);
      const ext = f.type.split('/')[1].replace('jpeg', 'jpg');
      await env.BUCKET.put(`s/${id}.${ext}`, await f.arrayBuffer(), { httpMetadata: { contentType: f.type } });
      v.image = `/img/s/${id}.${ext}?v=${now()}`;
    }
    const num = k => Number(fd.get(k)) || 0;
    const date = k => { const s = clean(fd.get(k), 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? Date.parse(s + (k === 'end' ? 'T23:59:59' : 'T00:00:00')) : 0; };
    await env.DB.prepare(`INSERT INTO sponsors (id,${SP_FIELDS.join(',')},priority,own,start_at,end_at,active,created_at,updated_at)
      VALUES (?,${SP_FIELDS.map(() => '?').join(',')},?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET ${SP_FIELDS.map(k => `${k}=excluded.${k}`).join(',')},priority=excluded.priority,own=excluded.own,
      start_at=excluded.start_at,end_at=excluded.end_at,active=excluded.active,updated_at=excluded.updated_at`)
      .bind(id, ...SP_FIELDS.map(k => v[k]), num('priority'), fd.get('own') === '1' ? 1 : 0, date('start'), date('end'),
        fd.get('active') === '1' ? 1 : 0, now(), now()).run();
    return J({ ok: true, id });
  }
  if (p === '/api/admin/sponsor/delete' && req.method === 'POST') {
    const { id } = await req.json();
    await env.DB.prepare('DELETE FROM sponsors WHERE id=?').bind(id).run();
    return J({ ok: true });
  }
  if (p === '/api/admin/jobs') {
    const st = ['pending', 'approved', 'rejected'].includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'pending';
    const rows = (await env.DB.prepare('SELECT * FROM jobs WHERE status=? ORDER BY created_at DESC LIMIT 300').bind(st).all()).results || [];
    rows.forEach(r => delete r.edit_token);
    return J({ items: rows });
  }
  if (p === '/api/admin/job/set' && req.method === 'POST') {
    const { id, status } = await req.json();
    if (status === 'delete') await env.DB.prepare('DELETE FROM jobs WHERE id=?').bind(id).run();
    else if (['pending', 'approved', 'rejected'].includes(status)) await env.DB.prepare('UPDATE jobs SET status=? WHERE id=?').bind(status, id).run();
    return J({ ok: true });
  }
  if (p === '/api/admin/requests') {
    return J({ items: (await env.DB.prepare('SELECT * FROM ad_requests ORDER BY done, created_at DESC LIMIT 200').all()).results || [] });
  }
  if (p === '/api/admin/request/done' && req.method === 'POST') {
    const { id } = await req.json();
    await env.DB.prepare('UPDATE ad_requests SET done=1 WHERE id=?').bind(id).run();
    return J({ ok: true });
  }
  return null;
}

/* ---------- Berlin-News (für das Quiz), 15 Min. Cache ---------- */
export async function news(req) {
  const cache = caches.default;
  const key = new Request(new URL('/api/news', req.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    const r = await fetch('https://www.tagesschau.de/api2u/news/?regions=3', { headers: { 'user-agent': 'KiezCheck/1.0' } });
    const j = await r.json();
    const out = J({
      news: (j.news || []).slice(0, 10).map(n => ({
        title: n.title, firstSentence: n.firstSentence || '', topline: n.topline || '', date: n.date || '',
        shareURL: /^https:\/\//.test(n.shareURL || '') ? n.shareURL : ''
      }))
    }, 200, { 'cache-control': 'public, max-age=900' });
    await cache.put(key, out.clone());
    return out;
  } catch (e) {
    return J({ news: [] });
  }
}
