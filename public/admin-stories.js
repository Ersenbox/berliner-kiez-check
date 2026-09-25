/* Berliner Kiez-Check Admin – Kiez-Stories prüfen und selbst veröffentlichen
   Wird von admin.html geladen. Nutzt call(), esc(), el(), showSec(), TOKEN aus admin.html. */
(function () {
  var STS = 'pending', FORM = false;
  var KL = { news: '📰 Neuigkeit', traffic: '🚦 Verkehr', event: '🎉 Veranstaltung', warn: '⚠️ Warnung', info: 'ℹ️ Info', politics: '🏛️ Politik' };
  var KIEZ = ['neukoelln', 'kreuzberg', 'wedding', 'gesundbrunnen', 'moabit', 'tiergarten', 'mitte', 'friedrichshain', 'prenzlauer-berg', 'schoeneberg', 'tempelhof', 'charlottenburg', 'spandau', 'reinickendorf', 'steglitz', 'lichtenberg', 'pankow', 'treptow', 'britz', 'koepenick', 'marzahn', 'umgebung'];

  var css = document.createElement('style');
  css.textContent = '.sti{display:grid;grid-template-columns:120px 1fr;gap:14px;border-top:1.5px solid var(--ink);padding:14px 0}' +
    '.sti .pv{width:120px;aspect-ratio:9/16;border:2px solid var(--ink);background:#18191A center/cover no-repeat;display:grid;place-items:center;color:#fff;font-size:28px;position:relative}' +
    '.sti .pv video{width:100%;height:100%;object-fit:cover}' +
    '.sti h3{margin:0}.sti select{border:2px solid var(--ink);background:var(--card);padding:5px;font:inherit;color:inherit}' +
    '.sti .flag{background:#E30613;color:#fff;padding:2px 8px;font-size:13px;display:inline-block;margin:6px 0}' +
    '.sti .okn{background:#1f9d55;color:#fff;padding:2px 8px;font-size:13px;display:inline-block;margin:6px 0}' +
    '@media (max-width:560px){.sti{grid-template-columns:90px 1fr}.sti .pv{width:90px}}';
  document.head.appendChild(css);

  // showSec aus admin.html erweitern
  if (typeof window.showSec === 'function') {
    var _ss = window.showSec;
    window.showSec = function (name) { _ss(name); if (name === 'stories') loadStories(); };
  }
  function mediaThumb(x) {
    if (x.media_type === 'image') return '<a class="pv" href="/media/' + esc(x.media_key) + '" target="_blank" style="background-image:url(\'/media/' + esc(x.media_key) + '\')"></a>';
    if (x.media_type === 'video') return '<div class="pv"><video src="/media/' + esc(x.media_key) + '"' + (x.poster_key ? ' poster="/media/' + esc(x.poster_key) + '"' : '') + ' controls playsinline preload="none"></video></div>';
    return '<div class="pv">' + (KL[x.kind] || '').split(' ')[0] + '</div>';
  }
  function fmt(ms) { return ms ? new Date(ms).toLocaleString('de', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–'; }

  window.loadStories = function () {
    call('/api/admin/stories?status=' + STS).then(function (j) {
      var c = j.counts || {};
      var tabs = [['pending', 'Zu prüfen'], ['approved', 'Online'], ['old', 'Abgelaufen / abgelehnt']].map(function (s) {
        return '<button data-sts="' + s[0] + '" aria-pressed="' + (s[0] === STS) + '">' + s[1] + ' (' + (c[s[0]] || 0) + ')</button>';
      }).join('');
      var h = '<div class="row" style="margin-bottom:10px">' + tabs + '<button class="ok" data-st-form>+ Neue Story (Admin)</button></div>';
      if (FORM) h += formHtml();
      h += (j.items || []).length ? j.items.map(item).join('') : '<p>Keine Stories in dieser Ansicht. 🎉</p>';
      el('sec').innerHTML = h;
    });
  };
  function item(x) {
    var note = x.mod_note || '';
    var noteH = note ? '<div class="' + (/^OK/.test(note) || note === 'Admin' ? 'okn' : 'flag') + '">KI: ' + esc(note) + '</div>' : '<div class="m">KI-Prüfung aus (kein ANTHROPIC_API_KEY)</div>';
    var i18n = {}; try { i18n = JSON.parse(x.i18n || '{}'); } catch (e) { }
    var acts = '';
    if (STS === 'pending') {
      acts += '<select data-hours><option value="">Standard (' + (x.kind === 'event' ? 'bis Veranstaltung' : '48 Std.') + ')</option><option value="24">24 Std.</option><option value="48">48 Std.</option><option value="168">7 Tage</option></select>' +
        '<button class="ok" data-sta="approved" data-id="' + esc(x.id) + '">Freigeben</button>' +
        '<button class="no" data-sta="rejected" data-id="' + esc(x.id) + '">Ablehnen</button>';
    }
    if (STS === 'approved') acts += '<button data-sta="extend" data-h="24" data-id="' + esc(x.id) + '">+1 Tag</button><button data-sta="extend" data-h="168" data-id="' + esc(x.id) + '">+7 Tage</button>';
    if (STS === 'old') acts += '<button class="ok" data-sta="approved" data-id="' + esc(x.id) + '">Wieder online (48 Std.)</button>';
    acts += '<button class="del" data-sta="delete" data-id="' + esc(x.id) + '">Löschen (inkl. Datei)</button>';
    return '<div class="sti">' + mediaThumb(x) + '<div>' +
      '<h3>' + (x.ad ? '<span class="note">Anzeige: ' + esc(x.sponsor) + '</span> ' : '') + esc(x.headline) + '</h3>' +
      '<p class="m">' + esc(KL[x.kind] || x.kind) + ' · ' + esc(x.kiez) + (x.event_date ? ' · Termin ' + esc(x.event_date) : '') + ' · Farbe ' + esc(x.bg) + '</p>' +
      (x.sub ? '<p>' + esc(x.sub) + '</p>' : '') +
      (i18n.tr && i18n.tr.h ? '<p class="m">TR: ' + esc(i18n.tr.h) + (i18n.tr.s ? ' – ' + esc(i18n.tr.s) : '') + '</p>' : '') +
      '<p class="m">Quelle: ' + esc(x.source || '–') + (x.link_url ? ' · <a href="' + esc(x.link_url) + '" target="_blank" rel="noopener">Link</a>' : '') + (x.wa ? ' · WhatsApp ' + esc(x.wa) : '') + '</p>' +
      '<p class="m">Von ' + esc(x.author || '(ohne Namen)') + (x.email && x.email !== 'admin' ? ' · <a href="mailto:' + esc(x.email) + '">' + esc(x.email) + '</a>' : '') + ' · eingereicht ' + fmt(x.created_at) + '</p>' +
      (STS !== 'pending' ? '<p class="m"><b>Aufrufe: ' + (x.views || 0) + '</b> · online bis ' + fmt(x.expires_at) + '</p>' : '') +
      noteH + '<div class="row">' + acts + '</div></div></div>';
  }
  function formHtml() {
    var ko = KIEZ.map(function (k) { return '<option value="' + k + '">' + k + '</option>'; }).join('');
    var kinds = Object.keys(KL).map(function (k) { return '<option value="' + k + '">' + KL[k] + '</option>'; }).join('');
    return '<form class="ed" id="stAdmForm">' +
      '<div class="chkrow"><label><input type="checkbox" name="ad" value="1" id="stAd"> Sponsor-Story (wird als „Anzeige“ markiert)</label></div>' +
      '<div class="g3"><label>Art<select name="kind">' + kinds + '</select></label><label>Kiez<select name="kiez">' + ko + '</select></label>' +
      '<label>Farbe<select name="bg"><option value="blau">blau</option><option value="weiss">weiss</option><option value="rot">rot</option><option value="gelb">gelb</option></select></label></div>' +
      '<label>Überschrift (max. 90)<input name="headline" maxlength="90" required></label>' +
      '<label>Zusatztext (max. 180)<input name="sub" maxlength="180"></label>' +
      '<label>Foto oder Video (max. 30 Sek. / 15 MB)<input name="media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"></label>' +
      '<div class="g3"><label>Link (Quelle / Website)<input name="link_url" type="url"></label><label>Quelle<input name="source" maxlength="80"></label>' +
      '<label>Veranstaltungsdatum<input name="event_date" type="date"></label></div>' +
      '<div class="g3" id="stAdF"><label>Sponsor-Name<input name="sponsor" maxlength="60"></label><label>WhatsApp-Nummer<input name="wa" maxlength="30" placeholder="0151 …"></label>' +
      '<label>Laufzeit (Tage)<input name="days" type="number" min="1" max="60" value="7"></label></div>' +
      '<label>Laufzeit in Stunden (nur normale Story, leer = Standard 48 Std.)<input name="hours" type="number" min="1" max="1440"></label>' +
      '<div class="row"><button class="ok" type="submit">Sofort veröffentlichen</button><button type="button" data-st-form>Schließen</button></div></form>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.sts) { STS = b.dataset.sts; loadStories(); return; }
    if (b.hasAttribute('data-st-form')) { FORM = !FORM; loadStories(); return; }
    if (b.dataset.sta) {
      var a = b.dataset.sta, body = { id: b.dataset.id, status: a };
      if (a === 'delete' && !confirm('Story und Datei endgültig löschen?')) return;
      if (a === 'approved') { var s = b.parentNode.querySelector('[data-hours]'); body.hours = s && s.value ? +s.value : (STS === 'old' ? 48 : 0); }
      if (a === 'extend') body.hours = +b.dataset.h;
      call('/api/admin/story/set', body).then(loadStories);
    }
  });
  function poster(file) { // Titelbild für Video-Stories (Ring-Vorschau)
    return new Promise(function (res) {
      var v = document.createElement('video'), u = URL.createObjectURL(file), done = false;
      function fin(b) { if (done) return; done = true; URL.revokeObjectURL(u); res(b); }
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      v.onloadedmetadata = function () { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
      v.onseeked = function () {
        var c = document.createElement('canvas'), k = Math.min(1, 900 / Math.max(v.videoWidth || 1, v.videoHeight || 1));
        c.width = Math.round((v.videoWidth || 540) * k); c.height = Math.round((v.videoHeight || 960) * k);
        try { c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); c.toBlob(fin, 'image/jpeg', 0.8); } catch (err) { fin(null); }
      };
      v.onerror = function () { fin(null); };
      setTimeout(function () { fin(null); }, 8000);
      v.src = u;
    });
  }
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'stAdmForm') return;
    e.preventDefault();
    var f = e.target, fd = new FormData(f), file = f.elements.media.files[0];
    if (file && /^video\//.test(file.type) && file.size > 15e6) { alert('Video zu groß (max. 15 MB).'); return; }
    if (!f.elements.ad.checked) fd.delete('ad');
    var btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Wird hochgeladen …';
    (file && /^video\//.test(file.type) ? poster(file) : Promise.resolve(null)).then(function (pb) {
      if (pb) fd.append('poster', pb, 'poster.jpg');
      return fetch('/api/admin/story/save', { method: 'POST', headers: { authorization: 'Bearer ' + TOKEN }, body: fd });
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        btn.disabled = false; btn.textContent = 'Sofort veröffentlichen';
        if (j && j.ok) { FORM = false; STS = 'approved'; loadStories(); return; }
        alert('Fehler: ' + (j && (j.field || j.error) || 'unbekannt'));
      }).catch(function () { btn.disabled = false; btn.textContent = 'Sofort veröffentlichen'; alert('Netzwerkfehler'); });
  });
})();
