/* eslint-disable */
// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';
import router from './router';
import './assets/js/flexible_css.debug';
import './assets/js/flexible.debug';

// 自定义导航条
import phiHeader from './components/header.vue';
// switch开关组件
import phiSwitch from './components/switch.vue';
// toast组件
import phiToast from './components/toast.vue';
// 基础功能组件
import { BaseMixin } from '@/assets/js/common/BaseFunction.js'

Vue.component('phiHeader', phiHeader);
Vue.component('phiSwitch', phiSwitch);
Vue.component('phiToast', phiToast);
Vue.mixin(BaseMixin);
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: {App}
});


var host;
switch (process.env.NODE_ENV) {
  case 'localhost':
    // host = 'https://home.phicomm.com'; // 开发环境
    host = 'https://sithome.phicomm.com'; // 开发环境
    break;
  case 'develop':
    // host='http://sit.home.phicomm.com';//测试环境
    host = 'http://dev.home.phiwifi.com';
    break;
  case 'test':
    host = 'https://sithome.phicomm.com';
    break;
  case 'prod':
    host = 'https://home.phicomm.com';
    break;
}

// var getHost="http://"+window.location.host;
Vue.prototype.hostname = host;
console.log(process.env.NODE_ENV);
