const { searchByText, listByFilter } = require('../../services/api')

Page({
  data: {
    query: '',
    season: '全部',
    gender: '全部',
    seasonOptions: ['全部', '春', '夏', '秋', '冬'],
    genderOptions: ['全部', '男', '女', '童'],
    searching: false
  },

  onQueryInput(e) {
    this.setData({ query: e.detail.value })
  },

  onTagTap(e) {
    const query = e.currentTarget.dataset.value
    this.setData({ query })
  },

  onSeasonTap(e) {
    this.setData({ season: e.currentTarget.dataset.value })
  },

  onGenderTap(e) {
    this.setData({ gender: e.currentTarget.dataset.value })
  },

  async onSearch() {
    const { query, season, gender } = this.data
    const hasQuery = query.trim().length > 0
    this.setData({ searching: true })
    try {
      let res
      let mode = 'text'
      if (hasQuery) {
        res = await searchByText(query.trim(), season, gender)
      } else {
        res = await listByFilter(season, gender)
        mode = 'filter'
      }
      wx.navigateTo({
        url: '/pages/search-result/search-result',
        success: (nav) => {
          nav.eventChannel.emit('searchResults', {
            results: res.results,
            query: hasQuery ? query.trim() : (season !== '全部' || gender !== '全部' ? `${season} · ${gender}` : '全部衣物'),
            season,
            gender,
            mode
          })
        }
      })
    } catch (e) {
      wx.showToast({ title: '搜索失败', icon: 'none' })
    } finally {
      this.setData({ searching: false })
    }
  }
})
