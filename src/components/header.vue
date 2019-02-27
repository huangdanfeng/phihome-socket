<template>
  <div>
    <div class="header ofh">
      <div class="left" @click="goback">
        <img src="../assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">{{title}}</div>
      <div class="set_icon">
        <router-link class="icon_container" to="Socket">
          <img src="../assets/img/settings/shezi@3x.png" alt="shezi.png">
        </router-link>
      </div>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'header',
    props: ['title'],
    methods: {
      goback () {
        this.$router.goBack();
      }
    }
  };
</script>

<style scoped lang="less">
  @base-size: 75rem;
  @header-height: 92;
  .header {
    position: fixed;
    height: @header-height/@base-size;
    line-height: @header-height/@base-size;
    background: #fff;
    width: 100%;
    box-shadow: 1px 1px 3px #e6e3e3;
    .left {
      position: absolute;
      left: 20/@base-size;
      top: -0.066rem;
      vertical-align: middle;
      img {
        width: 40/@base-size;
        vertical-align: middle;
      }
    }
    .title {
      font-size: 34/@base-size;
      color: #313131;
      font-weight: bold;

    }
    .set_icon {
      position: absolute;
      padding: 10/@base-size;
      right: 10/@base-size;
      top: 5.25/@base-size;
      height: 1.3rem;
      vertical-align: middle;
      img {
        width: .63rem;
        vertical-align: middle;
      }
    }
  }
</style>
