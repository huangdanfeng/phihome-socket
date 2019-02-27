<template>
  <div>
    <div class="header ofh">
      <div class="left" @click="goback">
        <img src="~@/assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">插口名称</div>
      <div class="save_btn" @click="saveSocketName">保存</div>
    </div>
    <div id="setting-socket-name" class="mui-page">
      <!--页面主内容区开始-->
      <div class="set_device_name set-socket-name">
        <input type="text" @blur="inputBlur" @focus="inputFocus" maxlength="20" v-model="sectionName" class="device_name_input" id="device_name_input"
               placeholder="请输入名称">
        <img src="~@/assets/img/settings/delete.png" @click="deleteSocketName" v-if="deleteIconShow" class="delete-icon"
             alt="delete.png">
      </div>
      <!--页面主内容区结束-->
    </div>
    <!--设备被解绑toast-->
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
  </div>
</template>
<script>
  import {handlePushDataReceiveData, checkDeviceBindStatus} from '@/assets/js/common/formateData.js';
  export default {
    name: 'index',
    data () {
      return {
        device_name: '',
        socketNickName: '',
        toast_show: false,
        deleteIconShow: false,
        sectionName: '',
        name: this.sectionName,
        device_id: sessionStorage.getItem('device_id')
      };
    },
    mounted: function () {
      let _this = this;
      let deviceName = document.getElementById('device_name_input');
      document.addEventListener('nativeBack', _this.goback); // 监听物理返回按键
      // 进入设置名称页，光标移到最后一个字后面
      if (sessionStorage.getItem('deviceName')) {
        _this.sectionName = '';
        _this.sectionName = sessionStorage.getItem('socket_nickName');
        setTimeout(function () {
          if (!/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) { // 安卓手机才拉起键盘
            deviceName.focus();
            _this.deleteIconShow = true;
          }
        }, 290);
      }
      checkDeviceBindStatus(_this);

      function chkstrlen (str) {
        let strlen = 0;
        for (let i = 0; i < str.length; i++) {
          if (str.charCodeAt(i) > 255) { // 如果是汉字，则字符串长度加2
            strlen += 2;
          } else {
            strlen++;
          }
        }
        return strlen;
      }

      this.name = this.sectionName;

      function getCursortPosition (ctrl) { // 获取光标位置函数
        let CaretPos = 0; // IE Support
        if (document.selection) {
          ctrl.focus();
          let Sel = document.selection.createRange();
          Sel.moveStart('character', -ctrl.value.length);
          CaretPos = Sel.text.length;
        } else if (ctrl.selectionStart || ctrl.selectionStart == '0') { // Firefox support
          CaretPos = ctrl.selectionStart;
        }
        return (CaretPos);
      }

      function setTextValuePosition (obj, spos) {
        let tobj = document.getElementById(obj);
        if (spos < 0) {
          spos = tobj.value.length;
        }
        if (tobj.setSelectionRange) { // 兼容火狐,谷歌
          setTimeout(function () {
            tobj.setSelectionRange(spos, spos);
            tobj.focus();
          }, 0);
        } else if (tobj.createTextRange) { // 兼容IE
          let rng = tobj.createTextRange();
          rng.move('character', spos);
          rng.select();
        }
      }

      function inputstr (str, length) {
        let strLength = '';
        for (let i = 0; i < str.length; i++) {
          if (str.charCodeAt(i) > 255 && length >= 2) { // 如果是汉字，则字符串长度加2
            strLength += str.charAt(i);
            length -= 2;
          } else if (str.charCodeAt(i) <= 255) {
            if (length >= 1) {
              strLength += str.charAt(i);
              length--;
            }
          }
        }
        return strLength;
      }

      deviceName.addEventListener('input', function (event) {
        let len = chkstrlen(_this.name);
        let names = _this.sectionName;
        let position = getCursortPosition(deviceName);
        let name = _this.name;
        _this.deleteIconShow = true;
        if (names.length === 0) {
          _this.deleteIconShow = false; // 插口名字为空，则删除图标消失
        }
        if (chkstrlen(names) > 10) {
          let length = 10 - len;
          if (names.length == position) { // 光标在最后
            let str = names.slice(name.length, names.length);
            let strLength = inputstr(str, length);
            _this.sectionName = names.slice(0, name.length + strLength.length);
          } else if (names.slice(position, names.length).length == name.length) { // 光标在最前
            let str = names.slice(0, position);
            let strLength = inputstr(str, length);
            _this.sectionName = strLength + name;
            setTextValuePosition('device_name_input', strLength.length);
          } else {
            let str = names.slice(name.length - names.slice(position, names.length).length, position);
            let strLength = inputstr(str, length);
            _this.sectionName = name.slice(0, name.length - names.slice(position, names.length).length) + strLength +
              name.slice(name.length - names.slice(position, names.length).length, name.length);
            setTextValuePosition('device_name_input', (name.length - names.slice(position, names.length).length) + strLength.length);
          }
        }
        _this.name = _this.sectionName;
      });
    },
    beforeDestroy () {
      document.removeEventListener('pushDataReceived', this._handlePushDataReceivedResponse);
      document.removeEventListener('nativeBack', this.goback);
    },
    methods: {
      goback () {
        this.$router.goBack();
      },
      inputBlur () {
        let _this = this;
        setTimeout(function () {
          _this.deleteIconShow = false;
        }, 50);
      },
      inputFocus (event) {
        if (event.target.value.length !== 0) {
          this.deleteIconShow = true;
        }
      },
      _handlePushDataReceivedResponse (event) {
        let _this = this;
        let data = JSON.parse(event.data);
        if (data.topic.indexOf('authfailed') !== -1) {
          _this.toast_show = true;
          return;
        }
        if (data.topic.indexOf('TimerControl') !== -1) {
          let newAllData = handlePushDataReceiveData(data.pushData, window.sessionStorage.getItem('allData'));
          window.sessionStorage.setItem('allData', newAllData);
          return;
        }
        if (data.topic.indexOf('OutletStatus') !== -1) {
          let newPushData = handlePushDataReceiveData(data.pushData, window.sessionStorage.getItem('outletStatusData'));
          window.sessionStorage.setItem('outletStatusData', newPushData);
          if (data.topic.indexOf('rejected') !== -1) { // 设备不在线时
            window.phihome.app.toast('设备不在线', function (response) {
            });
          } else {
            sessionStorage.setItem('socket_nickName', _this.name);
            _this.$router.goBack();
          }
        }
      },
      checkSpecialCharacter(str) { // 检测是否包含asii < 33 或 > 126 的特殊字符
        /* eslint-disable */
        let strAscii = []; // 用于接收ASCII码
        let isSpecial = false;
        for (let i = 0; i < str.length; i++) {
          strAscii[i] = str.charCodeAt(i); // 字符一个个的解码全部保存，便于重新比较
        }
        for (let j = 0; j < strAscii.length; j++) {
          let strAsciiJ = strAscii[j];
//          window.phihome.app.toast(strAsciiJ, function (response) {});
          if (strAsciiJ < 33 || (strAsciiJ > 126 && strAsciiJ < 9999) || strAsciiJ > 56000) {
            window.phihome.app.toast('名称不能包含特殊字符', function (response) {
            });
            isSpecial = true;
          }
        }
        return isSpecial;
        /* eslint-disable */
      },
      deleteSocketName () {
        this.sectionName = '';
        this.deleteIconShow = false;
        document.getElementById('device_name_input').focus();
      },
      saveSocketName () {
        let switchNameObj;
        let initName = sessionStorage.getItem('socket_initName').substring(2).toLowerCase().trim();
        ;
        let socketNameInput = document.getElementById('device_name_input');
        let deviceName = socketNameInput.value;
        let _this = this;
        let hasSpecialCharacter = _this.checkSpecialCharacter(deviceName);
        document.addEventListener('pushDataReceived', _this._handlePushDataReceivedResponse);
        if (deviceName == '') {
          socketNameInput.focus();
          window.phihome.app.toast('请输入名称', function (response) {
          });
        } else if (hasSpecialCharacter) {
          window.phihome.app.toast('名称不能包含特殊字符', function (response) {
            socketNameInput.focus();
          });
        } else {
          if (deviceName == sessionStorage.getItem('socket_nickName')) { // 如果设备名未修改，直接返回
            _this.$router.goBack();
          } else {
            switchNameObj = {
              'state': {
                'reported': {
                  switchName: {
                    [initName]: deviceName
                  }
                }
              }
            };
            window.phihome.iot.publish('$phihome/shadow/outlet_tc1/' + _this.device_id + '/OutletStatus/update', switchNameObj, function () {
            });
          }
        }
      }
    }
  };
</script>
<style scoped lang="less">
  @base-size: 75rem;
  .page-content .time_top .setting_icon {
    width: 4rem;
    display: block;
    height: 4rem;
    margin: auto;
    background: red;
  }
  #setting-socket-name {
    background:#f9f9f9;
    height:100%;
    padding-top: 120/@base-size;
    .set-socket-name {
      background:#fff;
      vertical-align: middle;
      position: relative;
      width: 92%;
      margin: 0 auto;
      height: 1.2rem;
      line-height: 1.2rem;
      text-align: left;
      border-radius: .10666667rem;
      border: 1px solid #ccc;
      .device_name_input {
        width: 90%;
        border: none;
        height: 1.12rem;
        position: relative;
        margin-top: -3/@base-size;
        vertical-align: middle;
      }
      .delete-icon {
        margin-top: -5/@base-size;
        width: 34/@base-size;
        vertical-align: middle;
      }
    }
    input::-webkit-input-placeholder {
      text-align: left;
    }
  }

  .switch_sec {
    position: relative;
  }

  .switch_sec .switch_btn {
    position: absolute;
    left: 2rem;
  }

  .save_btn {
    position: absolute;
    right: .3rem;
    top: 0rem;
    height: 1.3rem;
    vertical-align: middle;
    color: #ff9b1a;
    font-weight: normal;
  }

  //改变安卓 input光标颜色
  #device_name_input {
    color: #ff9b1a; /* change [input cursor color] by this*/
    text-shadow: 0px 0px 0px #313131; /* change [input font] by this*/
    -webkit-text-fill-color: transparent;
    caret-color: #ff9b1a;
  }

  #device_name_input::-webkit-input-placeholder {
    color: #bfbfbf; /* change [placeholder color] by this*/
    text-shadow: none;
    text-align: left;
    -webkit-text-fill-color: initial;
  }

  #device_name_input::-webkit-input-placeholder { /* WebKit browsers */
    color: #bfbfbf;
  }

  #device_name_input:-moz-placeholder { /* Mozilla Firefox 4 to 18 */
    color: #bfbfbf;
  }

  #device_name_input::-moz-placeholder { /* Mozilla Firefox 19+ */
    color: #bfbfbf;
  }

  #device_name_input:-ms-input-placeholder { /* Internet Explorer 10+ */
    color: #bfbfbf;
  }
</style>

