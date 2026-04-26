const { addClothing, getCabinets } = require('../../services/api')

Page({
  data: {
    cabinetId: null,
    cabinetName: '',
    imagePath: '',
    description: '',
    season: '四季',
    gender: '通用',
    seasonOptions: ['春', '夏', '秋', '冬', '四季'],
    genderOptions: ['男', '女', '童', '通用'],
    uploading: false,
    showCabinetPicker: false,
    pickerCabinets: [],
    pickerBreadcrumbs: [],
    pickerParentId: null
  },

  onLoad(options) {
    const cabinetId = options.cabinetId ? parseInt(options.cabinetId) : null
    const cabinetName = options.cabinetName ? decodeURIComponent(options.cabinetName) : ''
    this.setData({ cabinetId, cabinetName })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
      success: (res) => {
        this.setData({ imagePath: res.tempFiles[0].tempFilePath })
      }
    })
  },

  onDescInput(e) { this.setData({ description: e.detail.value }) },

  onSeasonTap(e) { this.setData({ season: e.currentTarget.dataset.value }) },

  onGenderTap(e) { this.setData({ gender: e.currentTarget.dataset.value }) },

  async openCabinetPicker() {
    this.setData({ showCabinetPicker: true, pickerParentId: null, pickerBreadcrumbs: [] })
    await this.loadPickerCabinets(null)
  },

  async loadPickerCabinets(parentId) {
    const res = await getCabinets(parentId)
    this.setData({
      pickerCabinets: res.cabinets,
      pickerBreadcrumbs: res.breadcrumbs,
      pickerParentId: parentId
    })
  },

  async onPickerCabinetTap(e) {
    await this.loadPickerCabinets(e.currentTarget.dataset.id)
  },

  onPickerSelect(e) {
    const { id, name } = e.currentTarget.dataset
    this.setData({ cabinetId: id, cabinetName: name, showCabinetPicker: false })
  },

  onPickerBack() {
    const crumbs = this.data.pickerBreadcrumbs
    if (crumbs.length <= 1) {
      this.loadPickerCabinets(null)
    } else {
      this.loadPickerCabinets(crumbs[crumbs.length - 2].id)
    }
  },

  closePicker() { this.setData({ showCabinetPicker: false }) },

  async submit() {
    const { imagePath, cabinetId, description, season, gender } = this.data
    if (!imagePath) {
      wx.showToast({ title: '请先拍照', icon: 'none' }); return
    }
    if (!cabinetId) {
      wx.showToast({ title: '请选择柜子', icon: 'none' }); return
    }

    this.setData({ uploading: true })
    try {
      await addClothing(imagePath, cabinetId, description, season, gender)
      wx.showToast({ title: '添加成功！', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1200)
    } catch (e) {
      wx.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      this.setData({ uploading: false })
    }
  }
})
