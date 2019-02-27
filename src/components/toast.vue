<template>
  <div class="component_toast_wrap">
    <div class="confirm_toast">
      <div class="confirm_content">
                <span class="content_wrap">
                    您的<span class="device_name">{{deviceName}}</span>已被解绑，若想继续使用，请重新绑定
                </span>
      </div>
      <div class="confirm_footer">
        <a class="sure" @click="backToApp" style="color: #313131;">确定</a>
      </div>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'phiToast',
    props: {
      deviceName: { // 有默认值
        default: '智能排插TC1'
      }
    },
    methods: {
      backToApp () {
        window.phihome.app.closePage('', function (response) {
        });
      }
    }
  };
</script>

<style scoped lang="less">
  //公共部分confirm toast样式
  @r: 75rem;
  .component_toast_wrap {
    position: fixed;
    top: 0;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    width: 100%;
    z-index: 9999;
    .confirm_toast {
      box-sizing: border-box;
      width: 550/@r;
      height: 350/@r;
      background: rgba(255, 255, 255, 1);
      border-radius: 19/@r;
      position: absolute;
      top: -110/@r;
      left: 0;
      right: 0;
      bottom: 0;
      margin: auto;
      font-size: 34px;
      color: #313131;
      .content_wrap {
        padding: 0 75/@r;
        display: table-cell;
        text-align: center;
        vertical-align: middle;
        .device_name {
          word-break: break-all;
        }
      }
      .confirm_content {
        display: table;
        width: 100%;
        position: relative;
        padding: 90/@r 80/@r;
        padding: 0;
        text-align: center;
        height: 258/@r;
        box-sizing: border-box;
      }
      .sure {
        color: red;
      }
      .confirm_footer {
        position: absolute;
        bottom: 0;
        width: 100%;
        border-top: 1px solid #ccc;
        line-height: 86/@r;
        a {
          display: inline-block;
          width: 100%;
        }
        .cancel {
          border-right: 1px solid #ccc;
        }
      }
    }
  }


</style>
