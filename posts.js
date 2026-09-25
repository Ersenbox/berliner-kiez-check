// Berliner Kiez-Check – Kiez-Reporter: Beiträge von Nutzern (Fotos + Video-Link), erst nach Admin-Freigabe sichtbar
// © 2026 DeindigitalerhelferCenter

const now = () => Date.now();
const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);
const clean = (s, n = 500) => (s == null ? '' : String(s)).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const cleanMulti = (s, n = 1500) => (s == null ? '' : String(s)).replace(/[<>]/g, '').replace(/\r\n/g, '\n').trim().slice(0, n);
const J = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', ...h } });

const MAX_PHOTOS = 3;
const VIDEO_HOSTS = /(^|\.)(youtube\.com|youtu\.be|instagram\.com|tiktok\.com|facebook\.com|fb\.watch|vimeo\.com)$/i;
const PUBF = 'id,title,body,kiez,video_url,photos,author,created_at';

function videoUrl(u) {
  u = clean(u, 300);
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    const x = new URL(u);
    return (x.protocol === 'https:' || x.protocol === 'http:') && VIDEO_HOSTS.test(x.hostname) ? x.href : null;
  } catch { return null; }
}

/* Öffentlich: freigegebene Beiträge */
export async function postsPublic(url, env) {
  const k = url.searchParams.get('kiez');
  let q = `SELECT ${PUBF} FROM posts WHERE status='approved'`;
  const b = [];
  if (k) { q += ' AND kiez=?'; b.push(k); }
  q += ' ORDER BY created_at DESC LIMIT 60';
  const r = await env.DB.prepare(q).bind(...b).all();
  return J({ items: r.results || [] }, 200, { 'cache-control': 'public, max-age=60' });
}

/* Öffentlich: neuen Beitrag einsenden (Status "pending") */
export async function postSubmit(req, env, KIEZE, ipLimit) {
  const fd = await req.formData();
  if (fd.get('hp')) return J({ ok: true });
  const lim = await ipLimit(req, env);
  if (lim) return lim;
  if (fd.get('consent') !== '1' || fd.get('rights') !== '1') return J({ error: 'consent' }, 400);

  const d = {
    title: clean(fd.get('title'), 100),
    body: cleanMulti(fd.get('body'), 1500),
    kiez: clean(fd.get('kiez'), 40),
    author: clean(fd.get('author'), 40),
    email: clean(fd.get('email'), 120).toLowerCase()
  };
  const v = videoUrl(fd.get('video_url'));
  if (d.title.length < 4) return J({ error: 'field', field: 'p_title' }, 400);
  if (d.body.length < 10) return J({ error: 'field', field: 'p_body' }, 400);
  if (!KIEZE[d.kiez]) return J({ error: 'field', field: 'kiez' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return J({ error: 'field', field: 'email' }, 400);
  if (v === null) return J({ error: 'field', field: 'p_video' }, 400);

  const files = fd.getAll('photo').filter(f => f && typeof f === 'object' && f.size).slice(0, MAX_PHOTOS);
  for (const f of files) if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 2.5e6) return J({ error: 'photo' }, 400);

  const id = uid(), keys = [];
  for (let i = 0; i < files.length; i++) {
    const key = `r/${id}-${i}.jpg`;
    await env.BUCKET.put(key, await files[i].arrayBuffer(), { httpMetadata: { contentType: files[i].type } });
    keys.push(key);
  }
  const t = now();
  await env.DB.prepare(`INSERT INTO posts (id,title,body,kiez,video_url,photos,author,email,status,mod_note,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,'pending','',?,?)`)
    .bind(id, d.title, d.body, d.kiez, v || '', JSON.stringify(keys), d.author, d.email, t, t).run();
  return J({ ok: true, id });
}

/* Admin: Liste, Freigeben/Ablehnen, Löschen (inkl. Fotos) */
export async function adminPosts(req, env, p, url) {
  if (p === '/api/admin/posts') {
    const st = ['pending', 'approved', 'rejected'].includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'pending';
    const r = await env.DB.prepare(`SELECT ${PUBF},email,status FROM posts WHERE status=? ORDER BY created_at DESC LIMIT 200`).bind(st).all();
    const c = await env.DB.prepare("SELECT status, COUNT(*) AS n FROM posts GROUP BY status").all();
    return J({ items: r.results || [], counts: c.results || [] });
  }
  if (p === '/api/admin/post/set' && req.method === 'POST') {
    const { id, status } = await req.json();
    if (status === 'delete') {
      const row = await env.DB.prepare('SELECT photos FROM posts WHERE id=?').bind(id).first();
      let keys = [];
      try { keys = JSON.parse((row && row.photos) || '[]'); } catch { }
      for (const k of keys) if (/^r\/[a-z0-9]{12}-\d\.jpg$/.test(k)) await env.BUCKET.delete(k);
      await env.DB.prepare('DELETE FROM posts WHERE id=?').bind(id).run();
      return J({ ok: true });
    }
    if (!['pending', 'approved', 'rejected'].includes(status)) return J({ error: 'status' }, 400);
    await env.DB.prepare('UPDATE posts SET status=?, updated_at=? WHERE id=?').bind(status, now(), id).run();
    return J({ ok: true });
  }
  return null;
}
