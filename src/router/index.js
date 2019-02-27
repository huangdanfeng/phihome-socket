import Vue from 'vue';
import Router from 'vue-router';
import PageTransition from '@/views/settings/PageTransition';
// import Index from '@/views/settings/Index'
const Index = resolve => require(['@/views/settings/Index'], resolve);
const showEletricity = resolve => require(['@/views/electricity/showEletricity'], resolve);
const Socket = resolve => require(['@/views/settings/Socket'], resolve);
const SettingTime = resolve => require(['@/views/settings/SettingTime'], resolve);
const SetDeviceName = resolve => require(['@/views/settings/SetDeviceName'], resolve);
const SetSocketName = resolve => require(['@/views/settings/SetSocketName'], resolve);
const fixedTime = resolve => require(['@/views/fixedTime/fixedTime'], resolve);
const countdown = resolve => require(['@/views/fixedTime/countdown'], resolve);
const section = resolve => require(['@/views/fixedTime/section'], resolve); // 区间定时
const addSectionTiming = resolve => require(['@/views/fixedTime/addSectionTiming'], resolve); // 添加区间定时
const addCountDown = resolve => require(['@/views/fixedTime/addCountDown'], resolve); // 添加倒计时
const addTiming = resolve => require(['@/views/fixedTime/addTiming'], resolve); // 添加定时
const editTiming = resolve => require(['@/views/fixedTime/editTiming'], resolve); // 编辑定时
const editCountDown = resolve => require(['@/views/fixedTime/editCountDown'], resolve); // 编辑倒计时
const editSectionTiming = resolve => require(['@/views/fixedTime/editSectionTiming'], resolve); // 编辑区间定时

/* edit 增加是否重新刷新数据的入参notRefreshFlag,true:不需要重新刷新;false：需要重新刷新; author:weihaitao 2017.10.17 */
Router.prototype.goBack = function (notRefreshFlag) {
  this.isBack = true;
  if (notRefreshFlag) {
    sessionStorage.setItem('notRefreshFlag', 'true'); // 用来在实际页面判断是否需要重新刷新数据 author:weihaitao
  }
  window.history.go(-1);
};

Vue.use(Router);
const router = new Router({
  routes: [
    {
      path: '/',
      name: 'PageTransition',
      component: PageTransition,
      children: [{
        path: '',
        component: Index
      }, {
        path: '/showEletricity',
        name: 'showEletricity',
        component: showEletricity
      }, {
        path: '/Socket',
        name: 'Socket',
        component: Socket
      }, {
        path: '/SettingTime',
        name: 'settingTime',
        component: SettingTime
      }, {
        path: '/SetSocketName',
        name: 'SetSocketName',
        component: SetSocketName
      }, {
        path: '/SetDeviceName',
        component: SetDeviceName
      }, {
        path: '/fixedTime',
        component: fixedTime
      }, {
        path: '/countdown',
        component: countdown
      }, {
        path: '/section',
        component: section
      }, {
        path: '/addSectionTiming',
        name: 'addSectionTiming',
        component: addSectionTiming
      }, {
        path: '/addCountDown',
        name: 'addCountDown',
        component: addCountDown
      }, {
        path: '/addTiming',
        name: 'addTiming',
        component: addTiming
      }, {
        path: '/editTiming',
        name: 'editTiming',
        component: editTiming
      }, {
        path: '/editCountDown',
        name: 'editCountDown',
        component: editCountDown
      }, {
        path: '/editSectionTiming',
        name: 'editSectionTiming',
        component: editSectionTiming
      }]
    }
  ]
});

export default router;
