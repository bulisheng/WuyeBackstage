const app = getApp();

Page({
  data: {
    cartCount: 0,
    cartTotal: 0,
    discountItems: [
      { id: 1, name: '新鲜西红柿', price: 2.5, originalPrice: 4.0 },
      { id: 2, name: '有机菠菜', price: 3.0, originalPrice: 5.0 },
      { id: 3, name: '本地黄瓜', price: 1.8, originalPrice: 3.0 }
    ],
    categories: [
      { id: 1, name: '叶菜类', icon: 'icon-leaf', color: 'bg-green' },
      { id: 2, name: '根茎类', icon: 'icon-root', color: 'bg-orange' },
      { id: 3, name: '瓜果类', icon: 'icon-fruit', color: 'bg-yellow' },
      { id: 4, name: '豆制品', icon: 'icon-bean', color: 'bg-brown' }
    ],
    products: [
      { id: 1, name: '新鲜小白菜', spec: '约500g/份', price: 3.5 },
      { id: 2, name: '有机胡萝卜', spec: '约400g/份', price: 4.0 },
      { id: 3, name: '新鲜土豆', spec: '约500g/份', price: 2.8 },
      { id: 4, name: '嫩豆腐', spec: '约300g/盒', price: 3.0 },
      { id: 5, name: '新鲜青椒', spec: '约300g/份', price: 4.5 },
      { id: 6, name: '土鸡蛋', spec: '10枚/盒', price: 15.0 }
    ]
  },

  onLoad() {
    this.loadCart();
  },

  // 加载购物车
  loadCart() {
    const cart = wx.getStorageSync('vegetableCart') || [];
    let total = 0;
    cart.forEach(item => {
      total += item.price * item.count;
    });
    this.setData({
      cartCount: cart.length,
      cartTotal: total.toFixed(1)
    });
  },

  // 选择分类
  selectCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: '分类筛选',
      icon: 'none'
    });
  },

  // 查看更多
  viewMore() {
    wx.showToast({
      title: '查看更多商品',
      icon: 'none'
    });
  },

  // 加入购物车
  addToCart(e) {
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === id);
    
    if (product) {
      let cart = wx.getStorageSync('vegetableCart') || [];
      const existIndex = cart.findIndex(item => item.id === id);
      
      if (existIndex > -1) {
        cart[existIndex].count += 1;
      } else {
        cart.push({ ...product, count: 1 });
      }
      
      wx.setStorageSync('vegetableCart', cart);
      this.loadCart();
      
      wx.showToast({
        title: '已加入购物车',
        icon: 'success'
      });
    }
  },

  // 打开购物车
  openCart() {
    wx.showToast({
      title: '查看购物车',
      icon: 'none'
    });
  },

  // 提交订单
  submitOrder() {
    if (this.data.cartCount === 0) {
      wx.showToast({
        title: '请先选择商品',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认下单',
      content: `共${this.data.cartCount}件商品，合计¥${this.data.cartTotal}`,
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '下单成功',
            icon: 'success'
          });
          // 清空购物车
          wx.removeStorageSync('vegetableCart');
          this.loadCart();
        }
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
