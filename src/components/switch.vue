<template>
  <div class="switch">
    <input type="checkbox" class="switch_input" :class="{'mint-switch-active':Boolean(switchResult)}" name="switch"
           @click="changeSwitchSta">
  </div>
</template>
<script>
  export default {
    name: 'switch',
    props: {
      switchResult: { // 有默认值
        default: 1
      }
    },
    methods: {
      changeSwitchSta () {
        var Switch = event.currentTarget;
        let switchState = 1;
        if (Switch.className === 'switch_input') {
          Switch.className = 'switch_input mint-switch-active';
          switchState = 1;
        } else if (Switch.className === 'switch_input mint-switch-active') {
          Switch.className = 'switch_input';
          switchState = 0;
        }
        this.sendMessage(switchState);
      },
      sendMessage (data) {
        this.$emit('listenToSwitch', data);
      }
    }
  };
</script>

<style scoped lang="less">
  //插座开关样式
  @base-size: 75rem;
  .switch {
    position: relative;
  }

  .switch input {
    position: absolute;
    left: 0;
    top: -60/@base-size;
    width: 0;
    border: none
  }

  .switch input:before {
    content: '';
    display: inline-block;
    position: relative;
    border: 1px solid #898989;
    box-shadow: 0 0 1px 1px #ececf3;
    cursor: pointer;
    border-radius: 0.4rem;
    box-sizing: border-box;
    background: #fff;
    margin-top: 0.4rem;
    width: 1.6rem;
    height: 0.8rem;
  }

  .switch input:after {
    content: '';
    position: absolute;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background-color: #898989;
    top: 0.5rem;
    left: 0.15rem;
    -webkit-transition: -webkit-transform .3s;
    transition: -webkit-transform .3s;
    transition: transform .3s;
    transition: transform .3s, -webkit-transform .3s;
  }

  .switch .mint-switch-active::after {
    width: 0.6rem;
    height: 0.6rem;
    background-color: #ff9b1a;
    border-radius: 50%;
    transform: translateX(0.7rem);
    -webkit-transition: -webkit-transform .3s;
    transition: -webkit-transform .3s;
    transition: transform .3s;
    transition: transform .3s, -webkit-transform .3s;
  }

  .switch .mint-switch-active:before {
    border: 1px solid #ff9b1a;
  }
</style>
