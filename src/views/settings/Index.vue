<template>
  <div id="index-page">
    <div class="header ofh">
      <div class="left" @click="backToApp">
        <img src="~@/assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title" id="title_device_name">{{deviceName}}
      </div>
      <div class="set_icon">
        <div @click="toSettingPage" class="icon_container" onselectstart="return false;">
          <img src="~@/assets/img/settings/shezi@3x.png" alt="shezi.png">
        </div>
      </div>
    </div>
    <div id="setting" class="mui-page" ref="pageContent">
      <!--页面主内容区开始-->
      <div class="page-content">
        <div class="function_btn ofh">
          <div class="socket_control_btn fl">
            <!--开关部分-->
            <div class="switch_sec">
              <p class="title">插座总开关</p>
              <div class="switch-wrap">
                <div class="switch">
                  <input type="checkbox" class="switch_input" :class='{"mint-switch-active":mainSwitchStatus}'
                         name="switch" id="switch"
                         @click="changeTotalSwitchStatus">
                </div>
              </div>
            </div>
          </div>
          <div class="power_analy_btn fl">
            <div @click="toShowEletricityPage" class="show-electricity-sec">
              <p class="title">电量统计</p>
              <img src="~@/assets/img/settings/tongji@3x.png" alt="tongji.png">
            </div>
          </div>
        </div>
        <ul class="setting_content ofh">
          <li class="fl" v-for="(item, index) in socketObject">
            <span class="switch_img" @click="changeSwitchSta" :data-index="index" :name="item.initName" :class="{switch_on:item.initStatus}"
                  :title="item.initStatus">
            </span>
            <p class="ofh">
              <!--通过路由传递参数-->
              <span @click="toSocketDetail" :title="item.initName" :name="item.nickName">{{item.nickName}}
                <span class="icon-arrow_right">
                  <img class="arr_img" src="~@/assets/img/settings/xia@3x.png" alt="arrow_right.png">
                </span>
              </span>
            </p>
          </li>
        </ul>
      </div>
      <!--页面主内容区结束-->
    </div>
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="deviceName"></phiToast>
  </div>
</template>

<script>
  import {handlePushDataReceiveData} from '@/assets/js/common/formateData.js';
  import {ON_EVENT, ALL_SWITCH_ON, ALL_SWITCH_ON_FAIL, ALL_SWITCH_ON_SUCCESS, ALL_SWITCH_OFF, ALL_SWITCH_OFF_FAIL, ALL_SWITCH_OFF_SUCCESS, POWER_ANALYSIS, S1_CLICK, S1_CLICK_FAIL, S1_CLICK_SUCCESS, S2_CLICK, S2_CLICK_FAIL, S2_CLICK_SUCCESS, S3_CLICK, S3_CLICK_FAIL, S3_CLICK_SUCCESS, S4_CLICK, S4_CLICK_FAIL, S4_CLICK_SUCCESS, S5_CLICK, S5_CLICK_FAIL, S5_CLICK_SUCCESS, S6_CLICK, S6_CLICK_FAIL, S6_CLICK_SUCCESS} from '@/assets/js/uman-events.js';

  export default {
    name: 'index',
    data () {
      return {
        isClick: true,
        deviceName: '',
        toast_show: false, // 解绑toast
        device_id: '',
        powerData: '',
        toShowEletricityClickFlag: false,
        socketObject: [
          {
            'initName': '插口S1',
            'nickName': '插口S1',
            'initStatus': 1
          },
          {
            'initName': '插口S2',
            'nickName': '插口S2',
            'initStatus': 1
          },
          {
            'initName': '插口S3',
            'nickName': '插口S3',
            'initStatus': 1
          },
          {
            'initName': '插口S4',
            'nickName': '插口S4',
            'initStatus': 1
          },
          {
            'initName': '插口S5',
            'nickName': '插口S5',
            'initStatus': 1
          },
          {
            'initName': '插口S6',
            'nickName': '插口S6',
            'initStatus': 1
          }
        ],
        mainSwitchStatus: true,
        clickTimeTimeOutArray: []
      };
    },
    created () {
      let outletStatusData = window.sessionStorage.getItem('outletStatusData');
      if (outletStatusData != null) {
        this._setSwitchStatus(outletStatusData);
      }
      window.getPowerInterval = null;
      document.addEventListener('contextmenu', function (e) { // 阻止安卓手机长按呼出打开浏览器弹窗
        e.preventDefault();
      });
    },
    mounted () { // DOM挂载后，数据实例都可访问，数据已插入DOM
      document.addEventListener('nativeBack', this.backToApp); // 监听物理返回按键 weihaitao
      let _this = this;
      let familyId;
      let url = location.href;
      function parseQueryString (url) { // 解析app通过url传入的参数
        let obj = {};
        let keyValue = [];
        let key = '';
        let value = '';
        let paraString;
        if (url.substring(url.length - 2, url.length) === '#/') { // 部分安卓手机 H5首页url末尾不带 #/
          url = url.substring(0, url.length - 2);
        }
        paraString = url.substring(url.indexOf('?') + 1, url.length).split('&');
        for (let i in paraString) {
          keyValue = paraString[i].split('=');
          key = keyValue[0];
          value = keyValue[1];
          obj[key] = value;
        }
        return obj;
      }

      function getDeviceName () {
        window.phihome.util.netRequest('get', _this.hostname + '/v1/user/device/' + _this.device_id, '', '', function (response) {
          let errorMessage;
          response = JSON.parse(response);
          if (response.errorCode === 0) {
            let netResponse = JSON.parse(response.netResponse);
            if (netResponse.status === 200) {
              let responseResult = netResponse.result;
              familyId = responseResult.fid;
              sessionStorage.setItem('family_id', familyId);
              if (responseResult.device_nickname) {
                _this.deviceName = responseResult.device_nickname;
                sessionStorage.setItem('deviceName', _this.deviceName);
              } else {
                _this.deviceName = '智能排插TC1';
              }
            } else {
              if (netResponse.status === 11001) { // 解绑，账号下没有该设备，返回设备首页
                _this.toast_show = true;
              } else {
                window.phihome.app.toast(netResponse.message, function (response) {
                });
              }
              _this.deviceName = '智能排插TC1';
            }
          } else {
            errorMessage = response.errorMsg;
            window.phihome.app.toast(errorMessage, function (response) {
            });
          }
        });
      }
      _this.device_id = parseQueryString(url).deviceId;
      sessionStorage.setItem('device_id', _this.device_id);
      document.addEventListener('pushDataReceived', _this._handlePushDataReceivedResponse);
      // 初始化 设备名
      if (!window.initConfigSucc) {
        var initConfigInterval = setInterval(function () {
          // 通过mqtt获取shadow数据,第一次进入设置页需要initconfig
          if (window.initConfigFlag) {
            window.phihome.iot.initConfig('{"shadows":["OutletStatus","TimerControl"]}', function (response) {
              window.initConfigSucc = true;
              window.phihome.iot.publish('$phihome/shadow/outlet_tc1/' + _this.device_id + '/TimerControl/get', '', function () { // get 获取shadow
              });
              window.phihome.iot.publish('$phihome/shadow/outlet_tc1/' + _this.device_id + '/OutletStatus/get', '', function () { // get 获取shadow
              });
            });
            clearInterval(initConfigInterval);
            getDeviceName();
          }
        }, 200);
      } else { // 返回设置页不需init
        window.phihome.iot.publish('$phihome/shadow/outlet_tc1/' + _this.device_id + '/OutletStatus/get', '', function () {
        });
        if (sessionStorage.getItem('deviceName')) {
          _this.deviceName = sessionStorage.getItem('deviceName');
        } else {
          _this.deviceName = '智能排插TC1';
        }
      }
    },
    updated () {
      let bodyHeight = this.$refs.pageContent.offsetHeight;
      sessionStorage.setItem('bodyHeight', bodyHeight);
    },
    methods: {
      toShowEletricity () {
        if (!this.toShowEletricityClickFlag) {
          return;
        }
        this.toShowEletricityClickFlag = false;
        window.phihome.app.hideLoading('', function () {
        });
        this.$router.push({name: 'showEletricity', params: {power: this.powerData}});
      },
      backToApp () {
        window.phihome.app.closePage('', function (response) {
        });
      },
      toSettingPage () {
        this.$router.push({name: 'Socket'});
      },
      toShowEletricityPage () {
        let _this = this;
        _this.toShowEletricityClickFlag = true;
        _this.device_id = sessionStorage.getItem('device_id');
        document.addEventListener('pushDataReceived', this._handlePushDataReceivedResponse);
        window.phihome.iot.subscribe('$phihome/shadow/outlet_tc1/' + _this.device_id + '/PowerConsumption/update/accepted', function () {
          window.phihome.iot.publish('device/' + _this.device_id + '/power/comsumption/request', function () {
          });
        });
        window.phihome.iot.subscribe('$phihome/shadow/outlet_tc1/' + _this.device_id + '/PowerConsumption/update/rejected', function () {
          window.phihome.iot.publish('device/' + _this.device_id + '/power/comsumption/request', function () {
          });
        });
        this._onStatisEvent({eventName: ON_EVENT, eventID: POWER_ANALYSIS});
      },
      _countUmanClickEvent (switchName) { // 友盟统计S1-S6按钮的点击动作
        let _this = this;
        switch (switchName) {
          case 's1':
            _this._onStatisEvent({eventName: ON_EVENT, eventID: S1_CLICK});
            _this.clickEventStart(S1_CLICK_FAIL, S1_CLICK_SUCCESS);
            break;
          case 's2':
            _this._onStatisEvent({eventName: ON_EVENT, eventID: S2_CLICK});
            _this.clickEventStart(S2_CLICK_FAIL, S2_CLICK_SUCCESS);
            break;
          case 's3':
            _this._onStatisEvent({eventName: ON_EVENT, eventID: S3_CLICK});
            _this.clickEventStart(S3_CLICK_FAIL, S3_CLICK_SUCCESS);
            break;
          case 's4':
            _this._onStatisEvent({eventName: ON_EVENT, eventID: S4_CLICK});
            _this.clickEventStart(S4_CLICK_FAIL, S4_CLICK_SUCCESS);
            break;
          case 's5':
            _this._onStatisEvent({eventName: ON_EVENT, eventID: S5_CLICK});
            _this.clickEventStart(S5_CLICK_FAIL, S5_CLICK_SUCCESS);
            break;
          case 's6':
            _this._onStatisEvent({eventName: ON_EVENT, eventID: S6_CLICK});
            _this.clickEventStart(S6_CLICK_FAIL, S6_CLICK_SUCCESS);
            break;
          default:
            break;
        }
      },
      toSocketDetail (event) { // 进入对应的插口主页
        sessionStorage.setItem('socket_header_title', event.currentTarget.title);
        sessionStorage.setItem('socket_nickName', event.currentTarget.getAttribute('name'));
        sessionStorage.setItem('socket_initName', event.currentTarget.title);
        this.$router.push({name: 'settingTime'});
      },
      changeSwitchSta (event) { // 切换单个开关状态
        let _this = this;
        let target = event.currentTarget;
        let switchName = 's' + (parseInt(target.dataset.index) + 1); // 当前插口名称s1,s2
        let switchStatus;
        let obj;
        if (target.className === 'switch_img') {
          switchStatus = 1;
        } else if (target.className === 'switch_img switch_on') {
          switchStatus = 0;
        }
        _this._countUmanClickEvent(switchName);
        obj = {
          'state': {
            'desired': {
              switch: {
                [switchName]: switchStatus
              }
            }
          }
        };
        obj.state.desired.switch[switchName] = switchStatus;
        window.phihome.iot.publish('device/' + _this.device_id + '/OutletStatus', obj, function () {
        });
      },
      changeTotalSwitchStatus (event) { // 切换总开关状态
        let _this = this;
        if (!_this.mainSwitchStatus) {
          _this._onStatisEvent({eventName: ON_EVENT, eventID: ALL_SWITCH_ON});
          _this.clickEventStart(ALL_SWITCH_ON_FAIL, ALL_SWITCH_ON_SUCCESS);
          _this._setTotalSwitch(1);
        } else {
          _this._onStatisEvent({eventName: ON_EVENT, eventID: ALL_SWITCH_OFF});
          _this.clickEventStart(ALL_SWITCH_OFF_FAIL, ALL_SWITCH_OFF_SUCCESS);
          _this._setTotalSwitch(0);
        }
      },
      clickEventStart (eventFailID, eventSuccessID) {
        const _this = this;
        _this.eventSuccessID = eventSuccessID;
        _this.clickTimeTimeOutArray.push(setTimeout(() => {
          _this._onStatisEvent({eventName: ON_EVENT, eventID: eventFailID});  // 友盟埋点统计
          if (_this.clickTimeTimeOutArray.length) {
            _this.clickTimeTimeOutArray.shift();
          }
        }, 10100));
      },
      _setTotalSwitch (status) {
        let switchsObj;
        let switchNameObj = JSON.parse(sessionStorage.getItem('switchNickName'));
        switchsObj = {
          'state': {
            'desired': {
              'switch': {
                's1': status,
                's2': status,
                's3': status,
                's4': status,
                's5': status,
                's6': status
              },
              'switchName': switchNameObj
            }
          }
        };
        window.phihome.iot.publish('device/' + this.device_id + '/OutletStatus', switchsObj, function () {
        });
      },
      _setSwitchStatus (outletStatusData) {
        let pushData = JSON.parse(outletStatusData);
        let switchsSta = pushData.state.reported.switch;
        let switchName;
        if (pushData.state.reported.switchName) {
          switchName = pushData.state.reported.switchName;
        } else {
          switchName = {
            's1': '插口S1',
            's2': '插口S2',
            's3': '插口S3',
            's4': '插口S4',
            's5': '插口S5',
            's6': '插口S6'
          };
        }
        sessionStorage.setItem('switchNickName', JSON.stringify(switchName));
        let mainSwitchStatusFlag = false;
        for (let i = 0; i < this.socketObject.length; i++) {
          let newSocketKey = this.socketObject[i].initName.substring(2).toLowerCase(); // s1-s6
          for (let switchKey in switchName) { // 更新插口昵称
            if (newSocketKey === switchKey) {
              this.socketObject[i].nickName = switchName[switchKey];
            }
          }
          for (let switchKey in switchsSta) {
            if (newSocketKey === switchKey) {
              this.socketObject[i].initStatus = switchsSta[switchKey];
              if (switchsSta[switchKey] === 1) {
                mainSwitchStatusFlag = true;
              }
            }
          }
        }
        this.mainSwitchStatus = mainSwitchStatusFlag;
      },
      _handlePushDataReceivedResponse (event) {
        let _this = this;
        let data = JSON.parse(event.data);
        this.powerData = JSON.parse(data.pushData);
        if (data.topic.indexOf('PowerConsumption') !== -1) {
          this.toShowEletricity();
        }
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
          if (this.clickTimeTimeOutArray.length) {
            clearTimeout(this.clickTimeTimeOutArray[0]);
            this.clickTimeTimeOutArray.shift();
          }
          if (_this.eventSuccessID) {
            _this._onStatisEvent({eventName: ON_EVENT, eventID: _this.eventSuccessID});
          }
          let newPushData = handlePushDataReceiveData(data.pushData, window.sessionStorage.getItem('outletStatusData'));
          window.sessionStorage.setItem('outletStatusData', newPushData);
          _this._setSwitchStatus(newPushData);
        }
      }
    },
    beforeDestroy () {
      document.removeEventListener('nativeBack', this.backToApp); // 监听物理返回按键 weihaitao
      document.removeEventListener('pushDataReceived', this._handlePushDataReceivedResponse);
    }
  };
</script>
<style scoped lang="less">
  @import '~@/assets/less/settings/socket.less';
  #index-page {
    .icon_container {
      display: inline;
    }
    .show-electricity-sec {
      display: inline;
    }
  }
  .switch_sec {
    position: relative;
  }
  #setting .setting_content li{
    .icon-arrow_right {
      margin-left: .1rem;
    }
    p {
      width: auto;
    }
  }
  .switch_sec .switch_btn {
    position: absolute;
    left: 2rem;
  }

</style>

