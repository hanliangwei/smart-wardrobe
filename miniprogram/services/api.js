function getBaseUrl() {
  return getApp().globalData.baseUrl
}

function request(method, path, data = {}, isFile = false) {
  const BASE_URL = getBaseUrl()
  return new Promise((resolve, reject) => {
    if (isFile) {
      wx.uploadFile({
        url: `${BASE_URL}${path}`,
        filePath: data.filePath,
        name: data.name || 'image',
        formData: data.formData || {},
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(res.data))
          } else {
            reject(new Error(res.data || '上传失败'))
          }
        },
        fail: reject
      })
    } else {
      wx.request({
        url: `${BASE_URL}${path}`,
        method,
        data,
        header: { 'content-type': 'application/json' },
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            const msg = res.data?.detail || '请求失败'
            wx.showToast({ title: msg, icon: 'none' })
            reject(new Error(msg))
          }
        },
        fail(err) {
          wx.showToast({ title: '网络异常', icon: 'none' })
          reject(err)
        }
      })
    }
  })
}

// ---- Cabinets ----
function getCabinets(parentId = null) {
  const params = parentId !== null ? `?parent_id=${parentId}` : ''
  return request('GET', `/api/cabinets${params}`)
}
function createCabinet(name, parentId = null, icon = '📦') {
  return request('POST', '/api/cabinets', { name, parent_id: parentId, icon })
}
function updateCabinet(id, name, icon) {
  return request('PUT', `/api/cabinets/${id}`, { name, icon })
}
function deleteCabinet(id) {
  return request('DELETE', `/api/cabinets/${id}`)
}

// ---- Clothes ----
function getClothes(cabinetId) {
  return request('GET', `/api/clothes?cabinet_id=${cabinetId}`)
}
function addClothing(filePath, cabinetId, description = '', season = '四季', gender = '通用') {
  return request('POST', '/api/clothes', {
    filePath,
    name: 'image',
    formData: { cabinet_id: String(cabinetId), description, season, gender }
  }, true)
}
function deleteClothing(id) {
  return request('DELETE', `/api/clothes/${id}`)
}
function moveClothing(id, targetCabinetId) {
  return request('PUT', `/api/clothes/${id}/move`, { target_cabinet_id: targetCabinetId })
}

function searchByText(query, season = null, gender = null, topK = 10) {
  return request('POST', '/api/search/by-text', { query, season, gender, top_k: topK })
}

function listByFilter(season = null, gender = null) {
  return request('POST', '/api/search/by-filter', { season, gender })
}

// ---- Utils ----
function getImageUrl(imagePath) {
  return `${getBaseUrl()}/uploads/${imagePath}`
}

module.exports = {
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
}
