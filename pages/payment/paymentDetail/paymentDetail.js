const app = getApp();

Page({
  data: {
    billId: '',
    bill: {},
    paymentMethod: 'wechat'
  },

  onLoad(options) {
    const { id } = options;
    this.setData({
      billId: id
    });
    this.loadBillDetail();
  },

  loadBillDetail() {
    const bills = app.globalData.bills;
    const bill = bills.find(item => item.id === this.data.billId);
    if (bill) {
      this.setData({
        bill: bill
      });
    } else {
      wx.showToast({
        title: '账单不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 选择支付方式
  selectPayment(e) {
    this.setData({
      paymentMethod: e.detail.value
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 处理支付
  handlePay() {
    wx.showModal({
      title: '支付确认',
      content: `确认支付 ¥${this.data.bill.amount}？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '支付中...'
          });

          // 模拟支付过程
          setTimeout(() => {
            wx.hideLoading();
            
            // 更新账单状态
            const bills = app.globalData.bills;
            const billIndex = bills.findIndex(item => item.id === this.data.billId);
            if (billIndex !== -1) {
              bills[billIndex].status = 'paid';
              bills[billIndex].paidDate = '2026-04-08';
            }

            wx.showToast({
              title: '支付成功',
              icon: 'success',
              duration: 2000,
              success: () => {
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              }
            });
          }, 1500);
        }
      }
    });
  }
});
