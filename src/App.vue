<template>
  <div id="app">
    <!--<keep-alive>-->
    <router-view></router-view>
    <!--</keep-alive>-->
  </div>
</template>

<script>
  require('./assets/js/phihome-1.0.0.js?n=1');
  export default {
    name: 'app'
  };
</script>

<style lang="less">
  @import './assets/less/settings/switch.less'; //引入开关样式
  @import './assets/less/settings/socket.less'; //引入总样式
  body {
    margin: 0 auto;
  }
  @base-size: 75rem;
  @header-height: 1.3rem;
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    .scroller-indicator {
      background-image:
        -webkit-linear-gradient(top, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.2) 10%),
        -webkit-linear-gradient(bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.2) 10%) !important;
      background-image:
        linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.2) 10%),
        linear-gradient(to top, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.2) 10%) !important;
      background-size: 100% 2px !important;
    }
  }
  .header {
    position: fixed;
    height: @header-height;
    font-size: 33.5/@base-size;
    line-height: 1.34rem;
    background: #fff;
    color: #313131;
    width: 100vw;
    box-shadow: 1px 1px 3px #e6e3e3;
    z-index: 100;
    font-weight: 700;
    .set_icon {
      position: absolute;
      right: 0;
      top: -5.25/@base-size;
      height: 1.3rem;
      vertical-align: middle;
      img {
        width: .63rem;
        vertical-align: middle;
      }
      .icon_container {
        padding: 20/@base-size;
      }
    }
  }

  .header .left {
    display: table-cell;
    vertical-align: middle;
    position: absolute;
    font-weight: bold;
    height: 1.3rem;
    font-size: 0;
    padding: 20/@base-size;
    left: 0;
    img {
      width: .6rem;
      height: auto;
    }
  }


</style>
