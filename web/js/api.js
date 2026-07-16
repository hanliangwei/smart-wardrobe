/* ============================================
   Smart Wardrobe - API Request Layer
   Converts miniprogram wx.request to fetch()
   ============================================ */

const API = (() => {
  // Same-origin, no need for baseUrl prefix
  const BASE = '';

  async function request(method, path, data = null) {
    const opts = {
      method,
      headers: {}
    };
    if (data && (method === 'POST' || method === 'PUT')) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(data);
    }
    const res = await fetch(`${BASE}${path}`, opts);
    if (!res.ok) {
      let msg = 'Request failed';
      try {
        const err = await res.json();
        msg = err.detail || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }

  async function uploadFile(path, file, formData = {}) {
    const body = new FormData();
    body.append('image', file);
    for (const [k, v] of Object.entries(formData)) {
      body.append(k, String(v));
    }
    const res = await fetch(`${BASE}${path}`, { method: 'POST', body });
    if (!res.ok) {
      let msg = 'Upload failed';
      try {
        const err = await res.json();
        msg = err.detail || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }

  // ---- Cabinets ----
  function getCabinets(parentId = null) {
    const q = parentId !== null ? `?parent_id=${parentId}` : '';
    return request('GET', `/api/cabinets${q}`);
  }

  function createCabinet(name, parentId = null, icon = '') {
    return request('POST', '/api/cabinets', { name, parent_id: parentId, icon });
  }

  function updateCabinet(id, name, icon) {
    return request('PUT', `/api/cabinets/${id}`, { name, icon });
  }

  function deleteCabinet(id) {
    return request('DELETE', `/api/cabinets/${id}`);
  }

  // ---- Clothes ----
  function getClothes(cabinetId) {
    return request('GET', `/api/clothes?cabinet_id=${cabinetId}`);
  }

  function addClothing(file, cabinetId, description = '', season = '', gender = '') {
    return uploadFile('/api/clothes', file, {
      cabinet_id: cabinetId,
      description,
      season,
      gender
    });
  }

  function deleteClothing(id) {
    return request('DELETE', `/api/clothes/${id}`);
  }

  function moveClothing(id, targetCabinetId) {
    return request('PUT', `/api/clothes/${id}/move`, { target_cabinet_id: targetCabinetId });
  }

  // ---- Search ----
  function searchByText(query, season = null, gender = null, topK = 10) {
    return request('POST', '/api/search/by-text', { query, season, gender, top_k: topK });
  }

  function listByFilter(season = null, gender = null) {
    return request('POST', '/api/search/by-filter', { season, gender });
  }

  // ---- Utils ----
  function getImageUrl(imagePath) {
    return `${BASE}/uploads/${imagePath}`;
  }

  return {
    getCabinets,
    createCabinet,
    updateCabinet,
    deleteCabinet,
    getClothes,
    addClothing,
    deleteClothing,
    moveClothing,
    searchByText,
    listByFilter,
    getImageUrl
  };
})();
