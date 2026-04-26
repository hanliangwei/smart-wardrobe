const { getImageUrl } = require('../../services/api')

Page({
  data: {
    results: [],
    query: '',
    mode: 'text',
    loaded: false
  },

  onLoad() {
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('searchResults', (data) => {
      const mode = data.mode || 'text'
      const results = data.results.map(r => ({
        ...r,
        imageUrl: getImageUrl(r.image_path),
        scorePercent: mode === 'text' ? Math.round(r.score * 100) : 0
      }))
      this.setData({ results, query: data.query, mode, loaded: true })
    })
  },

  onResultTap(e) {
    const { cabinetId, cabinetPath } = e.currentTarget.dataset
    wx.showModal({
      title: '衣物位置',
      content: `📍 ${cabinetPath}`,
      confirmText: '前往柜子',
      success: (res) => {
        if (res.confirm) {
          const name = cabinetPath.split(' > ').pop()
          wx.navigateTo({ url: `/pages/cabinet/cabinet?id=${cabinetId}&name=${encodeURIComponent(name)}` })
        }
      }
    })
  },

  onImagePreview(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({ current: url, urls: this.data.results.map(r => r.imageUrl) })
  },

  onImageError(e) {
    console.error('搜索结果图片加载失败:', e.detail.errMsg)
  }
})
