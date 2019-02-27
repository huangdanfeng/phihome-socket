<template>
  <div>
    <div class="header ofh">
      <div class="left" @click="goback">
        <img src="~@/assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">设备名称</div>
      <div class="save_btn" @click="saveDeviceName">保存</div>
    </div>
    <div id="setting" class="mui-page">
      <!--页面主内容区开始-->
      <div class="set_device_name">
        <input type="text" maxlength="20" v-model="sectionName" class="device_name_input" id="device_name_input"
               placeholder="请输入设备名称"><br>
      </div>
      <!--页面主内容区结束-->
    </div>
    <!--设备被解绑toast-->
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
  </div>
</template>
<script>
  export default {
    name: 'index',
    data () {
      return {
        device_name: '',
        toast_show: false,
        sectionName: '',
        name: this.sectionName
      };
    },
    mounted: function () {
      let _this = this;
      document.addEventListener('nativeBack', _this.goback); // 监听物理返回按键 weihaitao
      let deviceName = document.getElementById('device_name_input');
      let deviceId = sessionStorage.getItem('device_id');
      // 进入设置名称页，光标移到最后一个字后面
      if (sessionStorage.getItem('deviceName')) {
        deviceName.setAttribute('value', sessionStorage.getItem('deviceName'));
        let val = deviceName.value;
        deviceName.focus();
        deviceName.value = ''; // 将input的值设置为空
        setTimeout(function () {
          deviceName.value = val; // 重新给赋值，这样光标就在最后了
        }, 53);
      }
      window.phihome.util.netRequest('get', _this.hostname + '/v1/user/device/' + deviceId, '', '', function (response) {
        let errorMessage;
        response = JSON.parse(response);
        if (response.errorCode == 0) {
          let netResponse = JSON.parse(response.netResponse);
          if (netResponse.status == 200) {
            _this.device_name = netResponse.result.device_nickname;
            window.phihome.app.hideLoading('', function (response) {
            });
          } else {
            if (netResponse.status == 11001) { // 账号下没有该设备，返回设备首页
              _this.device_name = '智能排插TC1';
              _this.toast_show = true;
            } else {
              window.phihome.app.toast(netResponse.message, function (response) {
              });
              window.phihome.app.hideLoading('', function (response) {
              });
            }
          }
        } else {
          errorMessage = response.errorMsg;
          window.phihome.app.toast(errorMessage, function (response) {
          });
          window.phihome.app.hideLoading('', function (response) {
          });
        }
      });

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

      // let _this = this;
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
        if (chkstrlen(names) > 20) {
          let length = 20 - len;
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
      document.removeEventListener('nativeBack', this.goback); // 监听物理返回按键 weihaitao
    },
    methods: {
      goback () {
        this.$router.goBack();
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
          if (strAsciiJ < 33 || (strAsciiJ > 126 && strAsciiJ < 9999) || strAsciiJ > 56000) {
            window.phihome.app.toast('设备名称不能包含特殊字符', function (response) {});
            isSpecial = true;
          }
        }
        return isSpecial;
        /* eslint-disable */
      },
      saveDeviceName () {
        let deviceId = sessionStorage.getItem('device_id');
        let deviceName = document.getElementById('device_name_input').value;
        let _this = this;
        let hasSpecialCharacter = _this.checkSpecialCharacter(deviceName);
        if (deviceName == '') {
          document.getElementById('device_name_input').focus();
          window.phihome.app.toast('请输入设备名称', function (response) {
          });
        } else if (hasSpecialCharacter){
          window.phihome.app.toast('设备名称不能包含特殊字符', function (response) {
          });
        } else {
          if (deviceName == sessionStorage.getItem('deviceName')) { // 如果设备名未修改，直接返回
            _this.$router.goBack();
          } else {
            window.phihome.util.netRequest('post', _this.hostname + '/v1/user/device/' + deviceId, '', {'device_nickname': deviceName}, function (response) {
              let errorMessage;
              response = JSON.parse(response);
              if (response.errorCode == 0) {
                let netResponse = JSON.parse(response.netResponse);
                if (netResponse.status == 200) {
                  if (deviceName.length > 20) {
                    window.phihome.app.toast('修改失败，设备名称过长', function (response) {
                    });
                  } else {
                    sessionStorage.setItem('deviceName', deviceName);
                    _this.$router.goBack();
                  }
                } else {
                  errorMessage = netResponse.message;
                  window.phihome.app.toast(errorMessage, function (response) {
                  });
                }
              } else {
                errorMessage = response.errorMsg;
                window.phihome.app.toast(errorMessage, function (response) {
                });
              }
            });
          }
        }
      }
    }
  };
</script>
<style scoped lang="less">
  /*@import './../../assets/less/settings/socket.less';*/
  @base-size: 75rem;
  #setting {
    padding-top: 120/@base-size;
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

