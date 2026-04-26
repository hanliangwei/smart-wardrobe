const { getCabinets, getClothes, createCabinet, deleteCabinet, deleteClothing, getImageUrl, updateCabinet } = require('../../services/api')

Page({
  data: {
    cabinetId: null,
    cabinetName: '',
    breadcrumbs: [],
    subCabinets: [],
    clothes: [],
    loading: true,
    showAddCabinet: false,
    newCabinetName: '',
    newCabinetIcon: '📦',
    iconOptions: ['📦', '🗄️', '👕', '👗', '👖', '🧥', '👔', '🧳', '🎒', '👟'],
    previewImage: ''
  },

  onLoad(options) {
    this.setData({
      cabinetId: parseInt(options.id),
      cabinetName: decodeURIComponent(options.name || '')
    })
    wx.setNavigationBarTitle({ title: this.data.cabinetName })
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [cabRes, clothesRes] = await Promise.all([
        getCabinets(this.data.cabinetId),
        getClothes(this.data.cabinetId)
      ])
      // 给衣物附加完整图片 URL
      const clothes = clothesRes.clothes.map(c => ({
        ...c,
        imageUrl: getImageUrl(c.image_path)
      }))
      this.setData({
        subCabinets: cabRes.cabinets,
        breadcrumbs: cabRes.breadcrumbs,
        clothes,
        loading: false
      })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onSubCabinetTap(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/cabinet/cabinet?id=${id}&name=${encodeURIComponent(name)}` })
  },

  onSubCabinetLongPress(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showActionSheet({
      itemList: ['重命名', '删除此柜子'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          const sub = this.data.subCabinets.find(c => c.id === id)
          this.setData({
            showRenameCabinet: true,
            renameCabinetId: id,
            renameCabinetName: name,
            renameCabinetIcon: (sub && sub.icon) || '📦'
          })
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '确认删除',
            content: `删除「${name}」及其所有内容？`,
            confirmColor: '#e74c3c',
            success: async (mRes) => {
              if (mRes.confirm) {
                await deleteCabinet(id)
                wx.showToast({ title: '已删除', icon: 'success' })
                this.loadData()
              }
            }
          })
        }
      }
    })
  },

  // 点击衣物预览大图
  onClothingTap(e) {
    const { url } = e.currentTarget.dataset
    const urls = this.data.clothes.map(c => c.imageUrl)
    wx.previewImage({ current: url, urls })
  },

  onClothingLongPress(e) {
    const { id } = e.currentTarget.dataset
    wx.showActionSheet({
      itemList: ['删除此衣物'],
      success: async (res) => {
        if (res.tapIndex === 0) {
          await deleteClothing(id)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.loadData()
        }
      }
    })
  },

  onImageError(e) {
    console.error('图片加载失败:', e.detail.errMsg)
  },

  // 添加衣物 - 跳转到拍照页
  goAddClothing() {
    wx.navigateTo({ url: `/pages/add-clothing/add-clothing?cabinetId=${this.data.cabinetId}&cabinetName=${encodeURIComponent(this.data.cabinetName)}` })
  },

  // 新建子柜子
  showAddCabinetModal() {
    this.setData({ showAddCabinet: true, newCabinetName: '', newCabinetIcon: '📦' })
  },
  hideAddCabinet() {
    this.setData({ showAddCabinet: false })
  },
  onCabinetNameInput(e) {
    this.setData({ newCabinetName: e.detail.value })
  },
  onIconSelect(e) {
    this.setData({ newCabinetIcon: e.currentTarget.dataset.icon })
  },
  async onConfirmAddCabinet() {
    const { newCabinetName, newCabinetIcon, cabinetId } = this.data
    if (!newCabinetName.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    await createCabinet(newCabinetName.trim(), cabinetId, newCabinetIcon)
    wx.showToast({ title: '创建成功', icon: 'success' })
    this.setData({ showAddCabinet: false })
    this.loadData()
  },

  stopPropagation() {},

  hideRenameCabinet() {
    this.setData({ showRenameCabinet: false })
  },
  onRenameCabinetInput(e) {
    this.setData({ renameCabinetName: e.detail.value })
  },
  onRenameCabinetIconSelect(e) {
    this.setData({ renameCabinetIcon: e.currentTarget.dataset.icon })
  },
  async onConfirmRenameCabinet() {
    const { renameCabinetId, renameCabinetName, renameCabinetIcon } = this.data
    if (!renameCabinetName.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    await updateCabinet(renameCabinetId, renameCabinetName.trim(), renameCabinetIcon)
    wx.showToast({ title: '修改成功', icon: 'success' })
    this.setData({ showRenameCabinet: false })
    this.loadData()
  }
})
