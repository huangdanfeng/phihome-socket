<template>
  <div>
    <div class="header"></div>
    <v-touch v-on:swiperight="_swiper">
      <div class="iosBack"></div>
    </v-touch>
    <!--<v-touch v-on:swiperight="_swiper">-->
    <transition :name="transitionName">
        <router-view class="child-view"></router-view>
    </transition>
    <phiToast id="phi_toast" v-if="toastShow" :deviceName="deviceName"></phiToast>
    <!--</v-touch>-->
  </div>
</template>

<script>
  import Vue from 'vue';
  var VueTouch = require('vue-touch');
  Vue.use(VueTouch, {name: 'v-touch'});
  const DEFAULTTIMEOUT = 10000;
  export default {
    data () {
      return {
        toastShow: false,
        deviceName: '',
        transitionName: 'slide-left'
      };
    },
    computed: {
      currentRoute () {
        return this.$route.path;
      }
    },
    watch: {
      currentRoute (newRouter, oldRouter) {
        if (newRouter === this.toRouterPath) {
          window.phihome.app.hideLoading('', function (response) {
          });
          clearTimeout(this.routerChangeTimeout);
          this.toRouterPath = undefined;
          this.routerChangeTimeout = undefined;
        }
      }
    },
    mounted () {
      let pageUrl = location.href;
      let _this = this;
      _this.device_id = _this._parseQueryString(pageUrl).deviceId;
      document.addEventListener('pushDataReceived', _this._handlePushDataReceivedResponse);
      console.log(window.phihome.iot.subscribe);
      if (!window.initConfigSucc) {
        var initConfigInterval = setInterval(function () {
          // 若第一次初始化失败，则重新subscribe
          if (window.initConfigFlag) {
            console.log('initConfigSucc');
            window.phihome.iot.subscribe('$events/broker/' + _this.device_id + '/unbinded/+', function () { // 订阅解绑的topic
              window.initConfigSucc = true;
              console.log('unbinded success');
              clearInterval(initConfigInterval);
            });
          }
        }, 200);
      }
    },
    beforeRouteUpdate (to, from, next) {
      // 检查网络状态控制页面跳转 author:weihaitao
      let isBack = this.$router.isBack;
      if (!isBack) {
        if (!navigator.onLine) {
          window.phihome.app.toast('当前网络不可用，请检查网络设置', function (response) {
          });
          next(false);
          return;
        }
      } else {
        window.phihome.app.showLoading('', DEFAULTTIMEOUT, function (response) {
        });
        this.toRouterPath = to.path;
        this.routerChangeTimeout = setTimeout(() => {
          window.phihome.app.toast('网络异常，请稍后再试', function (response) {
          });
        }, DEFAULTTIMEOUT);
      }
      if (isBack) {
        this.transitionName = 'slide-right';
      } else {
        this.transitionName = 'slide-left';
      }
      this.$router.isBack = false;
      next();
    },
    methods: {
      _swiper () {
        let event = new Event('nativeBack');
        document.dispatchEvent(event);
      },
      _handlePushDataReceivedResponse (event) {
        const _this = this;
        const data = JSON.parse(event.data);
        const pushData = JSON.parse(data.pushData);
        if (data.topic.indexOf('unbinded') !== -1 && pushData.status === 200) {
          _this.deviceName = sessionStorage.getItem('deviceName');
        }
      }
    }
  };
</script>

<style scoped>
  .iosBack{
    width: 40px;
    height:100%;
    background: transparent;
    position: absolute;
    left:0;
    top:0;
    z-index: 80;
  }
  .child-view {
    position: absolute;
    transition: .3s all ease;
    background: #fff;
    width: 100%;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin-top: constant(safe-area-inset-top); /* 兼 容 iOS < 11.2 */
    margin-top: env(safe-area-inset-top); /* 兼容 iOS >= 11.2 */
  }
  .version {
    position: fixed;
    bottom: 0;
    right: 0;
    color: #fff;
    z-index: 5;
    background: #ff9c1c;
    padding: 0 3px;
    display: block;
  }

  .header {
    position: fixed;
    height: 1.3rem;
    width: 100%;
    background: #fff;
    z-index: 0;
  }

  .slide-left-enter {
    opacity: 1;
    -webkit-transform: translate(100%, 0);
    transform: translate(100%, 0);
  }

  .slide-right-leave-active {
    opacity: 1;
    -webkit-transform: translate(100%, 0);
    transform: translate(100%, 0);
  }

  .slide-left-leave-active {
    opacity: 1;
    -webkit-transform: translate(-30%, 0);
    transform: translate(-30%, 0);
  }

  .slide-right-enter {
    opacity: 1;
    -webkit-transform: translate(-100%, 0);
    transform: translate(-100%, 0);
  }
</style>
