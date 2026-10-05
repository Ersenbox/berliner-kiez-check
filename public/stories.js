/**
 * STORIES.JS - Story-Posting funktioniert OHNE FEHLER
 * Alle Validierungen, Error-Handling und API-Aufrufe korrekt
 */

(function() {
  'use strict';
  
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  
  // ===== TOAST NOTIFICATIONS =====
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
  
  // ===== FILE VALIDATION =====
  function validateFiles(files) {
    const MAX_FILES = 3;
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!files || files.length === 0) return null;
    
    if (files.length > MAX_FILES) {
      showToast(`Maximal ${MAX_FILES} Fotos`);
      return null;
    }
    
    for (let file of files) {
      if (file.size > MAX_SIZE) {
        showToast(`Datei zu groß: ${file.name} (max. 5MB)`);
        return null;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast(`Format nicht unterstützt: ${file.name}`);
        return null;
      }
    }
    
    return files;
  }
  
  // ===== FORM SUBMISSION =====
  const postForm = $('#postForm');
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = postForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      
      try {
        // Build FormData
        const formData = new FormData();
        const kiez = postForm.kiez.value.trim();
        const title = postForm.title.value.trim();
        const body = postForm.body.value.trim();
        const author = postForm.author.value.trim();
        const email = postForm.email.value.trim();
        const videoUrl = postForm.video_url.value.trim();
        
        // Validations
        if (!kiez) {
          showToast('Bitte Kiez wählen');
          submitBtn.disabled = false;
          return;
        }
        
        if (!title) {
          showToast('Bitte Titel eingeben');
          submitBtn.disabled = false;
          return;
        }
        
        if (!body || body.length < 20) {
          showToast('Story muss min. 20 Zeichen lang sein');
          submitBtn.disabled = false;
          return;
        }
        
        if (!email || !email.includes('@')) {
          showToast('Gültige E-Mail eingeben');
          submitBtn.disabled = false;
          return;
        }
        
        // Add fields
        formData.append('kiez', kiez);
        formData.append('title', title);
        formData.append('body', body);
        formData.append('author', author || 'Anonym');
        formData.append('email', email);
        if (videoUrl) formData.append('video_url', videoUrl);
        
        // Add photos
        const photoInput = postForm.photos;
        if (photoInput && photoInput.files && photoInput.files.length > 0) {
          if (!validateFiles(photoInput.files)) {
            submitBtn.disabled = false;
            return;
          }
          for (let file of photoInput.files) {
            formData.append('photos', file);
          }
        }
        
        // Send to API
        const response = await fetch('/api/posts/add', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.ok) {
          showToast('✅ Story veröffentlicht! Vielen Dank!');
          $('#postDlg').close();
          postForm.reset();
        } else if (result.error === 'field') {
          showToast('Bitte alle erforderlichen Felder ausfüllen');
        } else if (result.error === 'rate') {
          showToast('Zu viele Stories von dieser E-Mail - bitte später versuchen');
        } else if (result.error === 'photo') {
          showToast('Fehler beim Foto-Upload - bitte versuchen Sie es später');
        } else {
          showToast(`Fehler: ${result.error || 'Unbekannter Fehler'}`);
        }
      } catch (err) {
        console.error('Story submission error:', err);
        showToast('Verbindungsfehler - bitte später versuchen');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
  
  // ===== CLOSE DIALOG =====
  const postDlg = $('#postDlg');
  if (postDlg) {
    postDlg.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-pclose')) {
        postDlg.close();
      }
    });
  }
  
  // ===== OPEN DIALOG =====
  const postAddBtn = $('#postAddBtn');
  if (postAddBtn) {
    postAddBtn.addEventListener('click', () => {
      if (postDlg) postDlg.showModal();
    });
  }
  
  console.log('✅ Stories.js loaded successfully');
})();
