const { getCabinets, createCabinet, deleteCabinet, updateCabinet } = require('../../services/api')

Page({
  data: {
    cabinets: [],
    loading: true,
    showAddModal: false,
    newCabinetName: '',
    newCabinetIcon: '📦',
    iconOptions: ['📦', '🗄️', '👕', '👗', '👖', '🧥', '👔', '🧳', '🎒', '👟']
  },

  onShow() {
    this.loadCabinets()
  },

  async loadCabinets() {
    this.setData({ loading: true })
    try {
      const res = await getCabinets()
      this.setData({ cabinets: res.cabinets, loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onCabinetTap(e) {
    const { id, name, icon } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/cabinet/cabinet?id=${id}&name=${encodeURIComponent(name)}` })
  },

  onCabinetLongPress(e) {
    const { id, name, icon } = e.currentTarget.dataset
    wx.showActionSheet({
      itemList: ['重命名', '删除此柜子'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.renameCabinet(id, name, icon)
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '确认删除',
            content: `删除「${name}」将同时删除内部所有子柜子和衣物`,
            confirmColor: '#e74c3c',
            success: async (mRes) => {
              if (mRes.confirm) {
                await deleteCabinet(id)
                wx.showToast({ title: '已删除', icon: 'success' })
                this.loadCabinets()
              }
            }
          })
        }
      }
    })
  },

  renameCabinet(id, oldName, icon) {
    this.setData({
      showRenameModal: true,
      renameCabinetId: id,
      renameCabinetName: oldName,
      renameCabinetIcon: icon || '📦'
    })
  },

  hideRename() {
    this.setData({ showRenameModal: false })
  },

  onRenameInput(e) {
    this.setData({ renameCabinetName: e.detail.value })
  },

  onRenameIconSelect(e) {
    this.setData({ renameCabinetIcon: e.currentTarget.dataset.icon })
  },

  async onConfirmRename() {
    const { renameCabinetId, renameCabinetName, renameCabinetIcon } = this.data
    if (!renameCabinetName.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    await updateCabinet(renameCabinetId, renameCabinetName.trim(), renameCabinetIcon)
    wx.showToast({ title: '修改成功', icon: 'success' })
    this.setData({ showRenameModal: false })
    this.loadCabinets()
  },

  showAdd() {
    this.setData({ showAddModal: true, newCabinetName: '', newCabinetIcon: '📦' })
  },

  hideAdd() {
    this.setData({ showAddModal: false })
  },

  onNameInput(e) {
    this.setData({ newCabinetName: e.detail.value })
  },

  onIconSelect(e) {
    this.setData({ newCabinetIcon: e.currentTarget.dataset.icon })
  },

  async onConfirmAdd() {
    const { newCabinetName, newCabinetIcon } = this.data
    if (!newCabinetName.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    await createCabinet(newCabinetName.trim(), null, newCabinetIcon)
    wx.showToast({ title: '创建成功', icon: 'success' })
    this.setData({ showAddModal: false })
    this.loadCabinets()
  },

  stopPropagation() {}
})
