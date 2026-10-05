/* Berliner Kiez-Check – Kiez-Stories (Ringe oben, Vollbild-Ansicht, Story erstellen)
   Wird von index.html geladen: <script src="/stories.js" defer></script>
   Nutzt die globalen Werte aus index.html: S, KIEZE, api, esc, toast, $, applyLang
   © 2026 DeindigitalerhelferCenter */
(function () {
  'use strict';
  if (!document.getElementById('stories')) return;

  /* ---------- Texte ---------- */
  var TX = {
    de: {
      b_blau: 'Blau', b_weiss: 'Weiß', b_rot: 'Rot', b_gelb: 'Gelb', add: 'Deine Story', berlin: 'Berlin', ad: 'Anzeige', close: 'Schließen', prev: 'Zurück', next: 'Weiter',
      k_news: 'Neuigkeit', k_traffic: 'Verkehr', k_event: 'Veranstaltung', k_warn: 'Warnung', k_info: 'Info', k_politics: 'Politik',
      more: 'Mehr lesen', source: 'Quelle', video: 'Video ansehen', wa: 'WhatsApp', share: 'Teilen', report: 'Melden',
      ago_m: 'vor {n} Min.', ago_h: 'vor {n} Std.', ago_d: 'vor {n} Tg.',
      f_title: 'Story erstellen', f_hint: 'Wie ein WhatsApp-Status: Foto oder kurzes Video, eine Überschrift – fertig. Jede Story wird vor der Veröffentlichung geprüft.',
      f_media: 'Foto oder Video (optional, Video max. 30 Sek. / 15 MB)', f_kind: 'Worum geht es?', f_head: 'Überschrift', f_sub: 'Kurzer Zusatztext (optional)',
      f_bg: 'Farbe der Überschrift', f_kiez: 'Kiez', f_date: 'Datum der Veranstaltung', f_link: 'Link zur Quelle oder zum Video (optional)',
      f_src: 'Quelle (z. B. „eigene Aufnahme“, „Polizei Berlin“)', f_author: 'Dein Name oder Spitzname (wird angezeigt)', f_email: 'E-Mail (wird nicht veröffentlicht)',
      f_rights: 'Ich habe das Foto/Video selbst gemacht (nicht am Steuer), es zeigt keine fremden Logos oder Screenshots anderer Seiten und keine erkennbaren Privatpersonen oder Kennzeichen.',
      f_rules: 'Story-Regeln', f_send: 'Story senden', f_cancel: 'Abbrechen', f_quota: 'Höchstens 3 Stories pro Tag.',
      f_pol: 'Politische Stories werden besonders gründlich geprüft.', f_prev: 'Vorschau',
      done_t: 'Danke!', done: 'Deine Story wird geprüft und erscheint danach für einige Zeit oben auf der Startseite.',
      e_head: 'Bitte eine Überschrift eingeben (mind. 4 Zeichen).', e_kiez: 'Bitte einen Kiez wählen.', e_email: 'Bitte eine gültige E-Mail angeben.',
      e_date: 'Bitte das Datum der Veranstaltung angeben.', e_link: 'Der Link ist ungültig.', e_consent: 'Bitte beide Häkchen setzen.',
      e_vsize: 'Das Video ist zu groß (max. 15 MB).', e_vlen: 'Das Video ist zu lang (max. 30 Sekunden).', e_file: 'Dieses Dateiformat geht leider nicht.',
      e_quota: 'Du hast heute schon 3 Stories gesendet. Morgen wieder!', e_full: 'Heute sind schon sehr viele Stories in Prüfung. Bitte morgen erneut versuchen.',
      e_net: 'Fehler – bitte später erneut versuchen.', empty: 'Noch keine Stories – mach die erste!'
    },
    tr: {
      b_blau: 'Mavi', b_weiss: 'Beyaz', b_rot: 'Kırmızı', b_gelb: 'Sarı', add: 'Senin hikâyen', berlin: 'Berlin', ad: 'Reklam', close: 'Kapat', prev: 'Geri', next: 'İleri',
      k_news: 'Haber', k_traffic: 'Trafik', k_event: 'Etkinlik', k_warn: 'Uyarı', k_info: 'Bilgi', k_politics: 'Politika',
      more: 'Devamını oku', source: 'Kaynak', video: 'Videoyu izle', wa: 'WhatsApp', share: 'Paylaş', report: 'Bildir',
      ago_m: '{n} dk önce', ago_h: '{n} sa önce', ago_d: '{n} gün önce',
      f_title: 'Hikâye oluştur', f_hint: 'WhatsApp durumu gibi: fotoğraf veya kısa video, bir başlık – bu kadar. Her hikâye yayından önce kontrol edilir.',
      f_media: 'Fotoğraf veya video (isteğe bağlı, video en fazla 30 sn / 15 MB)', f_kind: 'Konu ne?', f_head: 'Başlık', f_sub: 'Kısa ek metin (isteğe bağlı)',
      f_bg: 'Başlık rengi', f_kiez: 'Kiez', f_date: 'Etkinlik tarihi', f_link: 'Kaynak veya video linki (isteğe bağlı)',
      f_src: 'Kaynak (örn. „kendi çekimim“, „Polizei Berlin“)', f_author: 'Adın veya takma adın (görünür)', f_email: 'E-posta (yayınlanmaz)',
      f_rights: 'Fotoğrafı/videoyu kendim çektim (araç kullanırken değil); başka sayfaların logosu veya ekran görüntüsü, tanınabilir kişiler veya plakalar içermiyor.',
      f_rules: 'Hikâye kuralları', f_send: 'Hikâyeyi gönder', f_cancel: 'Vazgeç', f_quota: 'Günde en fazla 3 hikâye.',
      f_pol: 'Politik hikâyeler özellikle dikkatli kontrol edilir.', f_prev: 'Önizleme',
      done_t: 'Teşekkürler!', done: 'Hikâyen kontrol ediliyor, sonra bir süre ana sayfanın üstünde görünecek.',
      e_head: 'Lütfen bir başlık yaz (en az 4 karakter).', e_kiez: 'Lütfen bir Kiez seç.', e_email: 'Lütfen geçerli bir e-posta yaz.',
      e_date: 'Lütfen etkinlik tarihini gir.', e_link: 'Link geçersiz.', e_consent: 'Lütfen iki kutucuğu da işaretle.',
      e_vsize: 'Video çok büyük (en fazla 15 MB).', e_vlen: 'Video çok uzun (en fazla 30 saniye).', e_file: 'Bu dosya formatı desteklenmiyor.',
      e_quota: 'Bugün zaten 3 hikâye gönderdin. Yarın tekrar!', e_full: 'Bugün çok fazla hikâye kontrolde. Lütfen yarın tekrar dene.',
      e_net: 'Hata – lütfen sonra tekrar dene.', empty: 'Henüz hikâye yok – ilkini sen paylaş!'
    },
    en: {
      b_blau: 'Blue', b_weiss: 'White', b_rot: 'Red', b_gelb: 'Yellow', add: 'Your story', berlin: 'Berlin', ad: 'Ad', close: 'Close', prev: 'Back', next: 'Next',
      k_news: 'News', k_traffic: 'Traffic', k_event: 'Event', k_warn: 'Warning', k_info: 'Info', k_politics: 'Politics',
      more: 'Read more', source: 'Source', video: 'Watch video', wa: 'WhatsApp', share: 'Share', report: 'Report',
      ago_m: '{n} min ago', ago_h: '{n} h ago', ago_d: '{n} d ago',
      f_title: 'Create a story', f_hint: 'Like a WhatsApp status: a photo or short video and a headline – done. Every story is checked before it goes live.',
      f_media: 'Photo or video (optional, video max. 30 s / 15 MB)', f_kind: 'What is it about?', f_head: 'Headline', f_sub: 'Short extra text (optional)',
      f_bg: 'Headline colour', f_kiez: 'Kiez', f_date: 'Date of the event', f_link: 'Link to source or video (optional)',
      f_src: 'Source (e.g. "my own photo", "Polizei Berlin")', f_author: 'Your name or nickname (shown)', f_email: 'Email (not published)',
      f_rights: 'I took the photo/video myself (not while driving); it shows no logos or screenshots of other pages and no recognisable private persons or number plates.',
      f_rules: 'Story rules', f_send: 'Send story', f_cancel: 'Cancel', f_quota: 'Max. 3 stories per day.',
      f_pol: 'Political stories are checked with extra care.', f_prev: 'Preview',
      done_t: 'Thank you!', done: 'Your story is being checked and will then appear at the top of the start page for a while.',
      e_head: 'Please enter a headline (min. 4 characters).', e_kiez: 'Please choose a Kiez.', e_email: 'Please enter a valid email.',
      e_date: 'Please enter the date of the event.', e_link: 'The link is not valid.', e_consent: 'Please tick both boxes.',
      e_vsize: 'The video is too large (max. 15 MB).', e_vlen: 'The video is too long (max. 30 seconds).', e_file: 'This file format is not supported.',
      e_quota: 'You already sent 3 stories today. Try again tomorrow!', e_full: 'Too many stories are being checked today. Please try again tomorrow.',
      e_net: 'Error – please try again later.', empty: 'No stories yet – be the first!'
    }
  };
  var KINDS = ['news', 'traffic', 'event', 'warn', 'info', 'politics'];
  var KICON = { news: '📰', traffic: '🚦', event: '🎉', warn: '⚠️', info: 'ℹ️', politics: '🏛️' };
  var BGS = ['blau', 'weiss', 'rot', 'gelb'];
  function L() { return TX[(window.S && TX[S.lang]) ? S.lang : 'de']; }
  function tt(k, n) { var s = L()[k] || TX.de[k] || k; return n == null ? s : s.replace('{n}', n); }
  function kiezName(k) { return (window.KIEZE && KIEZE[k]) ? KIEZE[k][0] : ''; }
  function mediaUrl(k) { return api('/media/' + k); }

  /* ---------- Stil ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.stories{max-width:1200px;margin:0 auto;padding:10px 16px 4px}',
    '.st-row{display:flex;gap:14px;overflow-x:auto;padding:4px 2px 10px;scrollbar-width:none}',
    '.st-row::-webkit-scrollbar{display:none}',
    '.st-ring{flex:0 0 auto;width:76px;border:0;background:none;padding:0;cursor:pointer;color:var(--ink);text-align:center;font:inherit}',
    '.st-ring .c{display:block;width:70px;height:70px;margin:0 auto;border-radius:50%;padding:3px;background:var(--pink)}',
    '.st-ring.seen .c{background:var(--soft)}',
    '.st-ring.ad .c{background:var(--yellow)}',
    '.st-ring .i{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;border:3px solid var(--paper);background:var(--sv) center/cover no-repeat;font-size:26px;overflow:hidden}',
    '.st-ring .n{display:block;font-size:12px;font-weight:700;line-height:1.2;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.st-ring .tag{display:inline-block;background:var(--yellow);color:#000;border:1.5px solid var(--line);border-radius:4px;font-size:10px;font-weight:800;padding:0 4px;margin-top:2px}',
    '.st-ring.plus .c{background:none;border:2px dashed var(--line)}',
    '.st-ring.plus .i{background:var(--card);border:0;font-size:30px;font-weight:800;color:var(--pink)}',
    /* Vollbild */
    '.stv{position:fixed;inset:0;z-index:9999;background:#000;display:grid;place-items:center;touch-action:none}',
    '.stv-stage{position:relative;width:min(100vw,calc(100dvh * 9 / 16));height:min(100dvh,calc(100vw * 16 / 9));background:#111;overflow:hidden;user-select:none;-webkit-user-select:none}',
    '@media (min-width:700px){.stv-stage{height:min(92dvh,calc(100vw * 16 / 9));width:min(100vw,calc(92dvh * 9 / 16));border-radius:14px}}',
    '.stv-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#111}',
    '.stv-plain{position:absolute;inset:0;background:#18191A}',
    '.stv-plain::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0 14px,transparent 14px 28px)}',
    '.stv-shade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.55),transparent 22%,transparent 50%,rgba(0,0,0,.72))}',
    '.stv-bars{position:absolute;top:calc(8px + env(safe-area-inset-top,0px));left:8px;right:8px;display:flex;gap:4px;z-index:3}',
    '.stv-bars span{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35);overflow:hidden}',
    '.stv-bars i{display:block;height:100%;width:0;background:#fff}',
    '.stv-head{position:absolute;top:calc(18px + env(safe-area-inset-top,0px));left:10px;right:10px;display:flex;align-items:center;gap:8px;z-index:3;color:#fff;font-size:13px;text-shadow:0 1px 2px rgba(0,0,0,.6)}',
    '.stv-head b{font-weight:800;font-size:14px}',
    '.stv-head .sp{flex:1}',
    '.stv-head button{border:0;background:rgba(0,0,0,.35);color:#fff;width:38px;height:38px;border-radius:50%;font-size:22px;line-height:1;cursor:pointer}',
    '.stv-adtag{background:var(--yellow);color:#000;border:1.5px solid #000;border-radius:4px;font-size:11px;font-weight:800;padding:0 6px;text-shadow:none}',
    '.stv-txt{position:absolute;left:16px;right:16px;top:50%;transform:translateY(-50%);z-index:2;text-align:center;pointer-events:none}',
    '.stv-txt.media{top:auto;transform:none;bottom:calc(84px + env(safe-area-inset-bottom,0px))}',
    '.stv-kind{display:inline-block;background:rgba(0,0,0,.55);color:#fff;border-radius:20px;padding:2px 10px;font-size:12.5px;font-weight:700;margin-bottom:10px}',
    '.stv-h{display:inline;font-weight:800;font-size:clamp(22px,6.4vw,30px);line-height:1.28;padding:3px 10px;-webkit-box-decoration-break:clone;box-decoration-break:clone;border-radius:6px}',
    '.bg-blau .stv-h{background:#0288D1;color:#fff}.bg-weiss .stv-h{background:#fff;color:#111}.bg-rot .stv-h{background:#E30613;color:#fff}.bg-gelb .stv-h{background:#F0D722;color:#000}',
    '.stv-s{margin:14px 0 0;color:#fff;font-weight:700;font-size:clamp(16px,4.6vw,20px);line-height:1.35;text-shadow:0 1px 3px rgba(0,0,0,.8)}',
    '.stv-src{margin:8px 0 0;color:rgba(255,255,255,.85);font-size:12.5px;text-shadow:0 1px 2px rgba(0,0,0,.8)}',
    '.stv-logo{position:absolute;right:12px;top:calc(64px + env(safe-area-inset-top,0px));z-index:2;width:46px;height:46px;border-radius:50%;background:#fff url(/icon.svg) center/70% no-repeat;border:2px solid #000;box-shadow:0 2px 6px rgba(0,0,0,.4)}',
    '.stv-acts{position:absolute;left:10px;right:10px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:3;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}',
    '.stv-acts a,.stv-acts button{border:2px solid #000;border-radius:22px;background:#fff;color:#000;padding:8px 14px;font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer}',
    '.stv-acts .wa{background:#25D366}',
    '.stv-acts .ghost{background:rgba(0,0,0,.4);color:#fff;border-color:rgba(255,255,255,.6);font-weight:600}',
    '.stv-tap{position:absolute;top:70px;bottom:80px;z-index:1;width:35%;border:0;background:none;cursor:pointer}',
    '.stv-tap.l{left:0}.stv-tap.r{right:0;width:65%}',
    /* Formular */
    '#storyDlg .st-pv{position:sticky;top:0;width:170px}',
    '#storyDlg .st-grid{display:grid;grid-template-columns:170px minmax(0,1fr);gap:16px;align-items:start}',
    '@media (max-width:560px){#storyDlg .st-grid{grid-template-columns:1fr}#storyDlg .st-pv{position:static;width:150px;margin:0 auto}}',
    
    '#storyDlg .st-pv .stv-stage{width:100%;height:auto;aspect-ratio:9/16;border-radius:10px;border:2px solid var(--line)}',
    '#storyDlg .st-pv .stv-h{font-size:14px;padding:2px 6px}#storyDlg .st-pv .stv-s{font-size:11px;margin-top:6px}',
    '#storyDlg .st-pv .stv-txt{left:8px;right:8px}#storyDlg .st-pv .stv-txt.media{bottom:14px}#storyDlg .st-pv .stv-kind{font-size:10px;margin-bottom:6px}',
    '#storyDlg .st-pv .stv-logo{width:26px;height:26px;top:8px;right:8px}',
    '#storyDlg .st-pv small{display:block;text-align:center;color:var(--muted);margin-top:4px}',
    '.st-kinds{display:flex;flex-wrap:wrap;gap:6px}',
    '.st-kinds label,.st-bgs label{display:inline-flex!important;align-items:center;gap:6px;border:2px solid var(--soft);border-radius:20px;padding:5px 11px;font-size:14px;cursor:pointer;background:var(--card)}',
    '.st-kinds input,.st-bgs input{position:absolute;opacity:0;width:1px;height:1px}',
    '.st-kinds label:has(input:checked),.st-bgs label:has(input:checked){border-color:var(--line);background:var(--yellow);color:#000;box-shadow:1px 1px 0 var(--line)}',
    '.st-kinds label:has(input:focus-visible),.st-bgs label:has(input:focus-visible){outline:3px solid var(--yellow);outline-offset:2px}',
    '.st-bgs{display:flex;gap:8px;flex-wrap:wrap}',
    '.st-bgs i{display:inline-block;width:18px;height:18px;border-radius:4px;border:1.5px solid var(--line)}',
    '.st-cnt{font-weight:400;color:var(--muted);font-size:12px}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- Daten ---------- */
  var ITEMS = [], GROUPS = [], SEEN = {}, VIEWED = {};
  try { (JSON.parse(localStorage.getItem('kc_seen') || '[]') || []).forEach(function (id) { SEEN[id] = 1; }); } catch (e) { }
  function saveSeen() {
    try { var a = Object.keys(SEEN); localStorage.setItem('kc_seen', JSON.stringify(a.slice(-400))); } catch (e) { }
  }
  function txt(it) {
    var o = it.i18n && it.i18n[S.lang];
    return { h: (o && o.h) || it.headline, s: (o && o.s) || it.sub || '' };
  }
  function ago(ts) {
    var m = Math.max(1, Math.round((Date.now() - ts) / 60000));
    if (m < 60) return tt('ago_m', m);
    var h = Math.round(m / 60); if (h < 24) return tt('ago_h', h);
    return tt('ago_d', Math.round(h / 24));
  }

  function load() {
    fetch(api('/api/stories'), { headers: { accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        var db = (j.items || []).map(function (x) { x.src = 'db'; return x; });
        var au = (j.auto || []).map(function (x) { x.src = 'auto'; x.approved_at = x.created_at; return x; });
        ITEMS = db.concat(au);
        build();
        openFromUrl();
      })
      .catch(function () { ITEMS = []; build(); openFromUrl(); });
  }

  function build() {
    var map = {}, list = [];
    ITEMS.forEach(function (it) {
      var key = it.ad ? 'ad:' + it.id : (it.kiez && it.kiez !== 'umgebung' ? 'k:' + it.kiez : 'berlin');
      if (!map[key]) { map[key] = { key: key, ad: !!it.ad, kiez: it.ad ? '' : (key.indexOf('k:') === 0 ? it.kiez : ''), items: [] }; list.push(map[key]); }
      map[key].items.push(it);
    });
    list.forEach(function (g) {
      g.items.sort(function (a, b) { return (a.approved_at || a.created_at) - (b.approved_at || b.created_at); });
      g.name = g.ad ? (g.items[0].sponsor || tt('ad')) : g.kiez ? kiezName(g.kiez) : tt('berlin');
      g.seen = g.items.every(function (x) { return SEEN[x.id]; });
      var th = g.items.filter(function (x) { return x.media_type === 'image' || x.poster_key; })[0];
      g.thumb = th ? mediaUrl(th.media_type === 'image' ? th.media_key : th.poster_key) : '';
      g.icon = KICON[g.items[g.items.length - 1].kind] || '📍';
      g.last = Math.max.apply(null, g.items.map(function (x) { return x.approved_at || x.created_at; }));
    });
    var ads = list.filter(function (g) { return g.ad; });
    var rest = list.filter(function (g) { return !g.ad; }).sort(function (a, b) {
      var sa = (S.kiez && a.kiez === S.kiez) ? 1 : 0, sb = (S.kiez && b.kiez === S.kiez) ? 1 : 0;
      return (sb - sa) || (a.seen - b.seen) || (b.last - a.last);
    });
    // Anzeigen an 2. und 5. Stelle einstreuen (höchstens 2 sichtbar vorne)
    GROUPS = rest.slice();
    ads.forEach(function (g, i) { GROUPS.splice(Math.min(i === 0 ? 1 : 4 + i, GROUPS.length), 0, g); });
    render();
  }

  function render() {
    var box = document.getElementById('stories');
    var h = '<div class="st-row" role="list"><button class="st-ring plus" type="button" data-st-new role="listitem"><span class="c"><span class="i">+</span></span><span class="n">' + esc(tt('add')) + '</span></button>';
    GROUPS.forEach(function (g, i) {
      h += '<button class="st-ring' + (g.seen ? ' seen' : '') + (g.ad ? ' ad' : '') + '" type="button" data-st-g="' + i + '" role="listitem" aria-label="' + esc(g.name) + '">' +
        '<span class="c"><span class="i"' + (g.thumb ? ' style="background-image:url(\'' + esc(g.thumb) + '\')"' : '') + '>' + (g.thumb ? '' : g.icon) + '</span></span>' +
        '<span class="n">' + esc(g.name) + '</span>' + (g.ad ? '<span class="tag">' + esc(tt('ad')) + '</span>' : '') + '</button>';
    });
    box.innerHTML = h + '</div>';
    box.hidden = false;
  }

  /* ---------- Vollbild-Ansicht ---------- */
  var V = null; // { g, i, el, timer, start, dur, paused }
  function slideHtml(it, preview) {
    var tx = txt(it), hasM = !!it.media_key;
    var m = '';
    if (it.media_type === 'image') m = '<img class="stv-media" src="' + esc(preview && it._blob ? it._blob : mediaUrl(it.media_key)) + '" alt="">';
    else if (it.media_type === 'video') m = '<video class="stv-media" src="' + esc(preview && it._blob ? it._blob : mediaUrl(it.media_key)) + '"' + (it.poster_key ? ' poster="' + esc(mediaUrl(it.poster_key)) + '"' : '') + ' playsinline ' + (preview ? 'muted loop autoplay' : '') + ' preload="auto"></video>';
    else m = '<div class="stv-plain"></div>';
    return m + (hasM ? '<div class="stv-shade"></div>' : '') +
      '<div class="stv-logo" aria-hidden="true"></div>' +
      '<div class="stv-txt bg-' + esc(BGS.indexOf(it.bg) >= 0 ? it.bg : 'blau') + (hasM ? ' media' : '') + '">' +
      '<div><span class="stv-kind">' + (KICON[it.kind] || '') + ' ' + esc(tt('k_' + it.kind)) + (it.kiez && kiezName(it.kiez) ? ' · ' + esc(kiezName(it.kiez)) : '') + '</span></div>' +
      '<span class="stv-h">' + esc(tx.h) + '</span>' +
      (tx.s ? '<p class="stv-s">' + esc(tx.s) + '</p>' : '') +
      (it.source ? '<p class="stv-src">' + esc(tt('source')) + ': ' + esc(it.source) + '</p>' : '') + '</div>';
  }

  function openGroup(gi, si) {
    if (!GROUPS[gi]) return;
    closeViewer(true);
    var el = document.createElement('div');
    el.className = 'stv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.tabIndex = -1;
    document.body.appendChild(el);
    document.documentElement.style.overflow = 'hidden';
    V = { g: gi, i: si || 0, el: el, paused: false };
    show();
    el.focus();
  }
  function show() {
    var g = GROUPS[V.g], it = g.items[V.i];
    clearInterval(V.timer);
    var bars = g.items.map(function (x, k) { return '<span><i style="width:' + (k < V.i ? 100 : 0) + '%"></i></span>'; }).join('');
    var acts = '';
    if (it.link_url) acts += '<a href="' + esc(it.link_url) + '" target="_blank" rel="noopener' + (it.src === 'db' && !it.ad ? ' nofollow ugc' : it.ad ? ' sponsored' : '') + '">' + esc(/youtu|tiktok|instagram|vimeo|fb\.watch|facebook/.test(it.link_url) ? tt('video') : it.src === 'auto' ? tt('source') : tt('more')) + '</a>';
    if (it.wa) acts += '<a class="wa" href="https://wa.me/' + esc(String(it.wa).replace(/^\+/, '').replace(/^0/, '49')) + '" target="_blank" rel="noopener sponsored">' + esc(tt('wa')) + '</a>';
    acts += '<button type="button" class="ghost" data-stv-share>' + esc(tt('share')) + '</button>';
    if (it.src === 'db') acts += '<a class="ghost" href="mailto:info@deindigitalerhelfer.com?subject=' + encodeURIComponent('Meldung Kiez-Story ' + it.id) + '">' + esc(tt('report')) + '</a>';
    V.el.innerHTML = '<div class="stv-stage">' + slideHtml(it) +
      '<div class="stv-bars">' + bars + '</div>' +
      '<div class="stv-head"><b>' + esc(g.name) + '</b>' + (it.ad ? '<span class="stv-adtag">' + esc(tt('ad')) + '</span>' : '') +
      '<span>' + esc(ago(it.approved_at || it.created_at)) + '</span><span class="sp"></span>' +
      '<button type="button" data-stv-close aria-label="' + esc(tt('close')) + '">×</button></div>' +
      '<button class="stv-tap l" type="button" data-stv-prev aria-label="' + esc(tt('prev')) + '"></button>' +
      '<button class="stv-tap r" type="button" data-stv-next aria-label="' + esc(tt('next')) + '"></button>' +
      '<div class="stv-acts">' + acts + '</div></div>';
    SEEN[it.id] = 1; saveSeen();
    if (it.src === 'db' && !VIEWED[it.id]) {
      VIEWED[it.id] = 1;
      try { fetch(api('/api/story/view'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: it.id }), keepalive: true }); } catch (e) { }
    }
    var bar = V.el.querySelectorAll('.stv-bars i')[V.i];
    var vid = V.el.querySelector('video');
    V.dur = 7000; V.pos = 0; V.paused = false;
    if (vid) {
      V.dur = 0;
      vid.addEventListener('loadedmetadata', function () { V.dur = Math.min(30, vid.duration || 15) * 1000; });
      vid.addEventListener('ended', next);
      var pl = vid.play(); if (pl && pl.catch) pl.catch(function () { vid.muted = true; vid.play().catch(function () { }); });
    }
    var last = Date.now();
    V.timer = setInterval(function () {
      var n = Date.now(), dt = n - last; last = n;
      if (V.paused || document.hidden) return;
      if (vid) { if (vid.duration) { bar.style.width = Math.min(100, vid.currentTime / Math.min(30, vid.duration) * 100) + '%'; if (vid.currentTime >= 30) next(); } return; }
      V.pos += dt; bar.style.width = Math.min(100, V.pos / V.dur * 100) + '%';
      if (V.pos >= V.dur) next();
    }, 50);
  }
  function next() {
    if (!V) return;
    var g = GROUPS[V.g];
    if (V.i < g.items.length - 1) { V.i++; show(); return; }
    g.seen = true;
    if (V.g < GROUPS.length - 1) { V.g++; V.i = 0; show(); return; }
    closeViewer();
  }
  function prev() {
    if (!V) return;
    if (V.i > 0) { V.i--; show(); return; }
    if (V.g > 0) { V.g--; V.i = GROUPS[V.g].items.length - 1; show(); return; }
    V.pos = 0; show();
  }
  function setPaused(p) {
    if (!V) return;
    V.paused = p;
    var vid = V.el.querySelector('video');
    if (vid) { if (p) vid.pause(); else vid.play().catch(function () { }); }
  }
  function closeViewer(silent) {
    if (!V) return;
    clearInterval(V.timer);
    V.el.remove(); V = null;
    document.documentElement.style.overflow = '';
    if (!silent) build();
    if (/[?&]story=/.test(location.search)) { try { var u = new URL(location.href); u.searchParams.delete('story'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) { } }
  }
  function shareIt() {
    if (!V) return;
    var it = GROUPS[V.g].items[V.i], tx = txt(it);
    var link = location.origin + '/?story=' + encodeURIComponent(it.id);
    setPaused(true);
    if (navigator.share) { navigator.share({ title: tx.h, text: tx.h, url: link }).catch(function () { }).then(function () { setPaused(false); }); return; }
    window.open('https://wa.me/?text=' + encodeURIComponent(tx.h + '\n' + link), '_blank', 'noopener');
    setPaused(false);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-st-g],[data-st-new],[data-stv-close],[data-stv-next],[data-stv-prev],[data-stv-share]');
    if (!b) return;
    if (b.hasAttribute('data-st-new')) { openForm(); return; }
    if (b.dataset.stG != null) { openGroup(+b.dataset.stG, 0); return; }
    if (b.hasAttribute('data-stv-close')) { closeViewer(); return; }
    if (b.hasAttribute('data-stv-next')) { next(); return; }
    if (b.hasAttribute('data-stv-prev')) { prev(); return; }
    if (b.hasAttribute('data-stv-share')) shareIt();
  });
  document.addEventListener('keydown', function (e) {
    if (!V) return;
    if (e.key === 'Escape') closeViewer();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === ' ') { e.preventDefault(); setPaused(!V.paused); }
  });
  // Gedrückt halten = Pause, nach unten wischen = schließen
  var tY = null, holdT = null;
  document.addEventListener('pointerdown', function (e) {
    if (!V || !e.target.closest('.stv-stage') || e.target.closest('.stv-acts,.stv-head button')) return;
    tY = e.clientY; holdT = setTimeout(function () { setPaused(true); }, 250);
  });
  document.addEventListener('pointerup', function (e) {
    if (!V || tY == null) return;
    clearTimeout(holdT);
    var dy = e.clientY - tY; tY = null;
    if (V.paused) { setPaused(false); e.preventDefault(); return; }
    if (dy > 90) closeViewer();
  });

  /* ---------- Story erstellen ---------- */
  var dlg = null, FILE = null, FILEURL = '';
  function formHtml() {
    return '<div class="dlg"><div id="stFormView"><h2>' + esc(tt('f_title')) + '</h2><p class="hint">' + esc(tt('f_hint')) + ' ' + esc(tt('f_quota')) + '</p>' +
      '<div class="st-grid"><div class="st-pv"><div class="stv-stage" id="stPv"></div><small>' + esc(tt('f_prev')) + '</small></div>' +
      '<form class="f" id="stForm" novalidate>' +
      '<label><span>' + esc(tt('f_media')) + '</span><input name="media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"></label>' +
      '<fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:700;font-size:14px;margin-bottom:4px">' + esc(tt('f_kind')) + '</legend><div class="st-kinds">' +
      KINDS.map(function (k, i) { return '<label><input type="radio" name="kind" value="' + k + '"' + (i === 0 ? ' checked' : '') + '>' + KICON[k] + ' ' + esc(tt('k_' + k)) + '</label>'; }).join('') + '</div></fieldset>' +
      '<p class="hint" id="stPol" hidden style="margin:0">' + esc(tt('f_pol')) + '</p>' +
      '<label><span>' + esc(tt('f_head')) + ' <span class="st-cnt" id="stCntH">0/90</span></span><input name="headline" maxlength="90" required></label>' +
      '<label><span>' + esc(tt('f_sub')) + ' <span class="st-cnt" id="stCntS">0/180</span></span><textarea name="sub" maxlength="180" rows="2"></textarea></label>' +
      '<fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:700;font-size:14px;margin-bottom:4px">' + esc(tt('f_bg')) + '</legend><div class="st-bgs">' +
      BGS.map(function (b, i) { var c = { blau: '#0288D1', weiss: '#fff', rot: '#E30613', gelb: '#F0D722' }[b]; return '<label><input type="radio" name="bg" value="' + b + '"' + (i === 0 ? ' checked' : '') + '><i style="background:' + c + '"></i>' + esc(tt('b_' + b)) + '</label>'; }).join('') + '</div></fieldset>' +
      '<div class="two"><label><span>' + esc(tt('f_kiez')) + '</span><select name="kiez" required></select></label>' +
      '<label id="stDateL" hidden><span>' + esc(tt('f_date')) + '</span><input name="event_date" type="date"></label></div>' +
      '<label><span>' + esc(tt('f_link')) + '</span><input name="link_url" type="url" maxlength="300" placeholder="https://…"></label>' +
      '<label><span>' + esc(tt('f_src')) + '</span><input name="source" maxlength="80"></label>' +
      '<div class="two"><label><span>' + esc(tt('f_author')) + '</span><input name="author" maxlength="40" autocomplete="nickname"></label>' +
      '<label><span>' + esc(tt('f_email')) + '</span><input name="email" type="email" maxlength="120" required autocomplete="email"></label></div>' +
      '<div class="hp" aria-hidden="true"><input name="hp" tabindex="-1" autocomplete="off"></div>' +
      '<label class="chk"><input type="checkbox" name="rights"><span>' + esc(tt('f_rights')) + ' <a href="/story-regeln.html" target="_blank" rel="noopener">' + esc(tt('f_rules')) + '</a></span></label>' +
      '<label class="chk"><input type="checkbox" name="consent"><span id="stConsentTxt"></span></label>' +
      '<div class="row"><button class="btn" type="submit">' + esc(tt('f_send')) + '</button><button class="btn ghost" type="button" data-st-cancel>' + esc(tt('f_cancel')) + '</button></div>' +
      '</form></div></div><div id="stDoneView" hidden></div></div>';
  }
  function openForm(shared) {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'storyDlg';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', function (e) { if (e.target.closest('[data-st-cancel]')) dlg.close(); });
      dlg.addEventListener('close', function () { if (FILEURL) URL.revokeObjectURL(FILEURL); FILE = null; FILEURL = ''; });
    }
    dlg.innerHTML = formHtml();
    var f = dlg.querySelector('#stForm');
    var ks = Object.keys(KIEZE).sort(function (a, b) { return (a === 'umgebung') - (b === 'umgebung') || KIEZE[a][0].localeCompare(KIEZE[b][0], 'de'); });
    f.elements.kiez.innerHTML = '<option value="">–</option>' + ks.map(function (k) { return '<option value="' + k + '">' + esc(KIEZE[k][0]) + '</option>'; }).join('');
    if (S.kiez) f.elements.kiez.value = S.kiez;
    var ct = document.getElementById('consentTxt');
    dlg.querySelector('#stConsentTxt').innerHTML = ct ? ct.innerHTML : '';
    f.addEventListener('input', onInput);
    f.addEventListener('change', onChange);
    f.addEventListener('submit', onSubmit);
    preview();
    if (!dlg.open) dlg.showModal();
    if (shared) loadShared(f);
  }
  function formItem(f) {
    var g = function (n) { return f.elements[n]; };
    var kind = (f.querySelector('input[name=kind]:checked') || {}).value || 'news';
    var bg = (f.querySelector('input[name=bg]:checked') || {}).value || 'blau';
    return {
      id: 'preview', kind: kind, bg: bg, kiez: g('kiez').value, headline: g('headline').value || tt('f_head'), sub: g('sub').value, source: g('source').value,
      media_key: FILE ? 'x' : '', media_type: FILE ? (/^video\//.test(FILE.type) ? 'video' : 'image') : '', _blob: FILEURL, i18n: {}
    };
  }
  function preview() {
    var f = dlg.querySelector('#stForm');
    dlg.querySelector('#stPv').innerHTML = slideHtml(formItem(f), true);
    dlg.querySelector('#stCntH').textContent = f.elements.headline.value.length + '/90';
    dlg.querySelector('#stCntS').textContent = f.elements.sub.value.length + '/180';
  }
  function onInput(e) { if (e.target.name !== 'media') preview(); }
  function onChange(e) {
    var f = e.currentTarget;
    if (e.target.name === 'kind') {
      dlg.querySelector('#stDateL').hidden = e.target.value !== 'event';
      dlg.querySelector('#stPol').hidden = e.target.value !== 'politics';
    }
    if (e.target.name === 'media') setFile(e.target.files && e.target.files[0], f);
    preview();
  }
  function setFile(file, f) {
    if (FILEURL) URL.revokeObjectURL(FILEURL);
    FILE = null; FILEURL = '';
    if (file) {
      if (!/^(image\/(jpeg|png|webp)|video\/(mp4|webm|quicktime))$/.test(file.type)) { toast(tt('e_file')); if (f) f.elements.media.value = ''; }
      else if (/^video\//.test(file.type) && file.size > 15e6) { toast(tt('e_vsize')); if (f) f.elements.media.value = ''; }
      else { FILE = file; FILEURL = URL.createObjectURL(file); }
    }
    preview();
  }
  function loadShared(f) {
    if (!('caches' in window)) return;
    caches.open('kc-share').then(function (c) {
      return Promise.all([c.match('/__share/media'), c.match('/__share/text')]).then(function (r) {
        var p = [];
        if (r[0]) p.push(r[0].blob().then(function (b) { setFile(new File([b], decodeURIComponent(r[0].headers.get('x-name') || 'datei'), { type: b.type }), f); }));
        if (r[1]) p.push(r[1].text().then(function (t) {
          var url = (t.match(/https?:\/\/\S+/) || [''])[0];
          if (url) f.elements.link_url.value = url;
          var rest = t.replace(url, '').trim(); if (rest) f.elements.headline.value = rest.slice(0, 90);
          preview();
        }));
        return Promise.all(p).then(function () { c.delete('/__share/media'); c.delete('/__share/text'); });
      });
    }).catch(function () { });
  }
  function shrinkImage(file) { // max. 1600 px lange Seite, JPEG
    return new Promise(function (res) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, 1600 / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(u);
        c.toBlob(function (b) { res(b); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); res(null); };
      img.src = u;
    });
  }
  function videoInfo(file) { // Dauer prüfen + Titelbild erzeugen
    return new Promise(function (res) {
      var v = document.createElement('video'), u = URL.createObjectURL(file), done = false;
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      function fin(o) { if (done) return; done = true; URL.revokeObjectURL(u); res(o); }
      v.onloadedmetadata = function () { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
      v.onseeked = function () {
        var c = document.createElement('canvas'), s = Math.min(1, 900 / Math.max(v.videoWidth || 1, v.videoHeight || 1));
        c.width = Math.round((v.videoWidth || 540) * s); c.height = Math.round((v.videoHeight || 960) * s);
        try { c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); c.toBlob(function (b) { fin({ dur: v.duration, poster: b }); }, 'image/jpeg', 0.8); }
        catch (e) { fin({ dur: v.duration, poster: null }); }
      };
      v.onerror = function () { fin({ dur: 0, poster: null }); };
      setTimeout(function () { fin({ dur: v.duration || 0, poster: null }); }, 8000);
      v.src = u;
    });
  }
  function onSubmit(e) {
    e.preventDefault();
    var f = e.target, g = function (n) { return f.elements[n]; };
    var kind = (f.querySelector('input[name=kind]:checked') || {}).value;
    if (g('headline').value.trim().length < 4) return toast(tt('e_head'));
    if (!g('kiez').value) return toast(tt('e_kiez'));
    if (kind === 'event' && !g('event_date').value) return toast(tt('e_date'));
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g('email').value.trim())) return toast(tt('e_email'));
    if (!g('rights').checked || !g('consent').checked) return toast(tt('e_consent'));
    var btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    var fd = new FormData();
    ['headline', 'sub', 'kiez', 'event_date', 'link_url', 'source', 'author', 'email', 'hp'].forEach(function (n) { fd.append(n, g(n).value); });
    fd.append('kind', kind); fd.append('bg', (f.querySelector('input[name=bg]:checked') || {}).value || 'blau');
    fd.append('lang', S.lang); fd.append('rights', '1'); fd.append('consent', '1');
    var prep = Promise.resolve(true);
    if (FILE && /^image\//.test(FILE.type)) prep = shrinkImage(FILE).then(function (b) { if (b) fd.append('media', b, 'story.jpg'); return true; });
    else if (FILE) prep = videoInfo(FILE).then(function (i) {
      if (i.dur && i.dur > 30.5) { toast(tt('e_vlen')); return false; }
      fd.append('media', FILE, FILE.name || 'story.mp4');
      if (i.poster) fd.append('poster', i.poster, 'poster.jpg');
      return true;
    });
    prep.then(function (ok) {
      if (!ok) { btn.disabled = false; return; }
      return fetch(api('/api/stories/submit'), { method: 'POST', body: fd }).then(function (r) { return r.json(); }).then(function (j) {
        btn.disabled = false;
        if (j && j.ok) {
          dlg.querySelector('#stFormView').hidden = true;
          var dv = dlg.querySelector('#stDoneView'); dv.hidden = false;
          dv.innerHTML = '<h2>' + esc(tt('done_t')) + '</h2><p>' + esc(tt('done')) + '</p><div class="row"><button class="btn" type="button" data-st-cancel>OK</button></div>';
          return;
        }
        var m = { quota: 'e_quota', full: 'e_full', consent: 'e_consent', photo: 'e_file', video: 'e_vsize', rate: 'e_quota' }[j && j.error];
        if (j && j.error === 'field') m = { headline: 'e_head', kiez: 'e_kiez', email: 'e_email', event_date: 'e_date', link_url: 'e_link' }[j.field];
        toast(tt(m || 'e_net'));
      });
    }).catch(function () { btn.disabled = false; toast(tt('e_net')); });
  }

  /* ---------- Links: ?story=new / ?story=<id> ---------- */
  var urlDone = false;
  function openFromUrl() {
    if (urlDone) return; urlDone = true;
    var q = new URLSearchParams(location.search), s = q.get('story');
    if (!s) return;
    if (s === 'new') { openForm(q.get('shared') === '1'); return; }
    for (var gi = 0; gi < GROUPS.length; gi++) for (var si = 0; si < GROUPS[gi].items.length; si++) if (GROUPS[gi].items[si].id === s) { openGroup(gi, si); return; }
  }

  /* ---------- Sprache / Kiez-Wechsel ---------- */
  if (typeof window.applyLang === 'function') {
    var _al = window.applyLang;
    window.applyLang = function () { _al.apply(this, arguments); if (!V) build(); };
  }
  var ksel = document.getElementById('kiez');
  if (ksel) ksel.addEventListener('change', function () { setTimeout(function () { if (!V) build(); }, 0); });

  load();
})();
