/**
 * ADMIN-STORIES.JS - Story Management für Admin Panel
 */

(function() {
  'use strict';
  
  const $ = (sel) => document.querySelector(sel);
  const el = (id) => document.getElementById(id);
  
  let ST = 'pending'; // Story Status
  
  // ===== LOAD STORIES =====
  function loadStories() {
    const call = window.call || function(p, body) {
      return fetch(p, { 
        method: body ? 'POST' : 'GET', 
        headers: Object.assign({ 
          'authorization': 'Bearer ' + (window.TOKEN || '') 
        }, body ? { 'content-type': 'application/json' } : {}), 
        body: body ? JSON.stringify(body) : undefined 
      }).then(r => r.json());
    };
    
    call('/api/admin/stories?status=' + ST).then(function(j) {
      const counts = {};
      (j.counts || []).forEach(c => { counts[c.status] = c.n; });
      
      const tabs = ['pending', 'approved', 'rejected'].map(s => 
        '<button data-ss="' + s + '" aria-pressed="' + (s === ST) + '">' + 
        {pending: 'Zu prüfen', approved: 'Online', rejected: 'Abgelehnt'}[s] + 
        ' (' + (counts[s] || 0) + ')</button>'
      ).join('');
      
      let html = '<div class="row" style="margin-bottom:10px">' + tabs + '</div>';
      
      if (j.items && j.items.length) {
        html += j.items.map(story => {
          const photos = [];
          try { JSON.parse(story.photos || '[]').forEach(k => photos.push(k)); } catch(e) {}
          
          return '<div class="it" style="grid-template-columns:1fr"><div>' +
            '<h3>' + esc(story.title) + '</h3>' +
            '<p class="m">' + esc(story.kiez) + ' · ' + new Date(story.created_at).toLocaleString('de') + ' · ' + esc(story.author || '(ohne Namen)') + '</p>' +
            '<p class="m">' + esc(story.email) + '</p>' +
            (photos.length ? '<div class="row">' + photos.map(k => 
              '<a href="/img/' + esc(k) + '" target="_blank"><img src="/img/' + esc(k) + '" alt="" style="width:140px;height:100px;object-fit:cover;border:2px solid #121212;border-radius:8px"></a>'
            ).join('') + '</div>' : '') +
            '<p style="white-space:pre-wrap">' + esc(story.body) + '</p>' +
            (story.video_url ? '<p class="m">Video: <a href="' + esc(story.video_url) + '" target="_blank">' + esc(story.video_url) + '</a></p>' : '') +
            '<div class="row">' +
            (ST !== 'approved' ? '<button class="ok" data-ss_a="approved" data-id="' + esc(story.id) + '">Freigeben</button>' : '') +
            (ST !== 'rejected' ? '<button class="no" data-ss_a="rejected" data-id="' + esc(story.id) + '">Ablehnen</button>' : '') +
            '<button class="del" data-ss_a="delete" data-id="' + esc(story.id) + '">Löschen</button>' +
            '</div></div></div>';
        }).join('');
      } else {
        html += '<p>Keine Stories in dieser Ansicht.</p>';
      }
      
      el('sec').innerHTML = html;
    });
  }
  
  // ===== ESC FUNCTION =====
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  
  // ===== EVENT LISTENERS =====
  document.addEventListener('click', function(e) {
    const b = e.target.closest('button');
    if (!b) return;
    
    // Tab switching
    if (b.dataset.ss) {
      ST = b.dataset.ss;
      loadStories();
      return;
    }
    
    // Story actions
    if (b.dataset.ss_a) {
      const call = window.call || function(p, body) {
        return fetch(p, { 
          method: 'POST', 
          headers: { 
            'authorization': 'Bearer ' + (window.TOKEN || ''),
            'content-type': 'application/json'
          }, 
          body: JSON.stringify(body) 
        }).then(r => r.json());
      };
      
      if (b.dataset.ss_a === 'delete' && !confirm('Story und Fotos löschen?')) return;
      
      call('/api/admin/story/set', { 
        id: b.dataset.id, 
        status: b.dataset.ss_a 
      }).then(loadStories);
    }
  });
  
  console.log('✅ Admin-Stories.js loaded');
})();
