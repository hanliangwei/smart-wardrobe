/* ============================================
   Smart Wardrobe - Shared Utilities
   Toast, Modal, Preview, Icons, Confirm
   ============================================ */

const App = (() => {
  // --- SVG Icon Library ---
  const ICONS = {
    folder: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
    folderOpen: '<svg viewBox="0 0 24 24"><path d="M5 19a2 2 0 01-2-2V5a2 2 0 012-2h4l2 3h9a2 2 0 012 2v1M5 19h14a2 2 0 002-2l1-7H7.5"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>',
    x: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    mapPin: '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    shirt: '<svg viewBox="0 0 24 24"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>',
    check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  };

  function icon(name, className = '') {
    const cls = `icon ${className}`.trim();
    return `<span class="${cls}">${ICONS[name] || ''}</span>`;
  }

  // --- Toast ---
  let toastTimer = null;
  function toast(message, type = 'info', duration = 2500) {
    let el = document.getElementById('app-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'app-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    clearTimeout(toastTimer);
    el.className = `toast toast-${type}`;
    el.textContent = message;
    requestAnimationFrame(() => {
      el.classList.add('active');
    });
    toastTimer = setTimeout(() => {
      el.classList.remove('active');
    }, duration);
  }

  // --- Confirm Dialog ---
  function confirm(title, message, options = {}) {
    return new Promise((resolve) => {
      const confirmText = options.confirmText || 'Confirm';
      const cancelText = options.cancelText || 'Cancel';
      const danger = options.danger || false;

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      overlay.innerHTML = `
        <div class="modal-content" style="max-width: 360px; border-radius: var(--radius-xl);">
          <div class="modal-handle"></div>
          <div class="modal-title">${title}</div>
          <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin-bottom: 4px;">${message}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="confirm-cancel">${cancelText}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmText}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const cleanup = (result) => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        resolve(result);
      };

      overlay.querySelector('#confirm-cancel').onclick = () => cleanup(false);
      overlay.querySelector('#confirm-ok').onclick = () => cleanup(true);
      overlay.onclick = (e) => {
        if (e.target === overlay) cleanup(false);
      };
    });
  }

  // --- Image Preview ---
  function previewImage(src) {
    let overlay = document.getElementById('preview-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'preview-overlay';
      overlay.className = 'preview-overlay';
      overlay.innerHTML = '<img src="" alt="Preview">';
      overlay.addEventListener('click', () => {
        overlay.classList.remove('active');
      });
      document.body.appendChild(overlay);
    }
    overlay.querySelector('img').src = src;
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }

  // --- Modal helpers ---
  function showModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('active');
      // Auto-focus input
      const input = el.querySelector('input[type="text"]');
      if (input) setTimeout(() => input.focus(), 300);
    }
  }

  function hideModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }

  // --- Loading overlay ---
  function showLoading(text = 'Loading...') {
    let el = document.getElementById('loading-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'loading-overlay';
      el.className = 'loading-overlay';
      el.innerHTML = `
        <div class="spinner spinner-lg"></div>
        <div class="loading-text">${text}</div>
      `;
      document.body.appendChild(el);
    } else {
      el.querySelector('.loading-text').textContent = text;
    }
    requestAnimationFrame(() => el.classList.add('active'));
  }

  function hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) {
      el.classList.remove('active');
    }
  }

  // --- URL params ---
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  // --- Escape HTML ---
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    icon,
    ICONS,
    toast,
    confirm,
    previewImage,
    showModal,
    hideModal,
    showLoading,
    hideLoading,
    getParam,
    escapeHtml
  };
})();
