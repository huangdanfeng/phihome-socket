<template>
  <div>
    <div class="header ofh" ref="header">
      <div class="left" @click="goback">
        <img src="../../assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title" v-text="header_title"></div>
      <div class="set_icon">
        <div class="icon_container">
          <img @click="toSetSocketName" src="~@/assets/img/settings/edit_icon.png" alt="shezi.png">
        </div>
      </div>
    </div>
    <div class="page-content" ref="timingContent">
      <div class="time_top">
        <div class="setting_icon " v-bind:class="isOpen?'open':'close'" @click="changeImg"></div>
        <div class="latest-timing">
          <div><span v-text="nextActionHint"></span></div>
        </div>
      </div>
      <div class="time_bottom">
        <div class="set_time">
          <router-link to="section" @click.native="changeColor">
            <svg viewBox="0 0 120 120">
              <path class="svgImg cls-1"
                    d="M60,0A60,60,0,1,1,0,60,60,60,0,0,1,60,0Zm0,1A59,59,0,1,1,1,60,59,59,0,0,1,60,1ZM79,83a5,5,0,1,0-4.9-6H40v2H74.1A5,5,0,0,0,79,83Zm-3-5a3,3,0,1,1,3,3A3,3,0,0,1,76,78ZM45.9,43H80V41H45.9A5,5,0,1,0,45.9,43ZM38,42a3,3,0,1,1,3,3A3,3,0,0,1,38,42ZM64.9,61H80V59H64.9a5,5,0,0,0-9.8,0H40v2H55.1A5,5,0,0,0,64.9,61ZM57,60a3,3,0,1,1,3,3A3,3,0,0,1,57,60Z"/>
            </svg>
            <span class="svgTitle">区间定时</span>
          </router-link>
        </div>
        <div class="set_time">
          <router-link to="fixedTime" @click.native="changeColor">
            <svg viewBox="0 0 120 120">
              <path class="svgImg cls-2"
                    d="M60,0A60,60,0,1,1,0,60,60,60,0,0,1,60,0Zm0,1A59,59,0,1,1,1,60,59,59,0,0,1,60,1ZM59.985,41A21.993,21.993,0,0,0,43.372,77.414l-5.147,6.309,1.549,1.264,4.987-6.111a21.98,21.98,0,0,0,30.477-.029l4.984,6.148,1.554-1.26-5.15-6.354A21.992,21.992,0,0,0,59.985,41Zm0,42a20,20,0,1,1,20-20A20.021,20.021,0,0,1,59.985,83ZM50.941,35H45A10,10,0,0,0,35,45v6.017h2.844l13.1-13.172V35Zm-2,2.021-11.93,12H37V45a8.01,8.01,0,0,1,8-8h3.941v0.022ZM75,35H69.055v2.846l13.1,13.172H85V45A10,10,0,0,0,75,35Zm8,14.017H82.986l-11.932-12V37H75a8.01,8.01,0,0,1,8,8v4.017ZM59,63H47.975v2H61V47H59V63Z"/>
            </svg>
            <span class="svgTitle">定时</span>
          </router-link>
        </div>
        <div class="set_time">
          <router-link to="countDown" @click.native="changeColor">
            <svg viewBox="0 0 120 120">
              <path class="svgImg cls-3"
                    d="M60,0A60,60,0,1,1,0,60,60,60,0,0,1,60,0Zm0,1A59,59,0,1,1,1,60,59,59,0,0,1,60,1ZM76.954,46.459l1.692-1.691,1.715,1.715,2.121-2.121-4.844-4.844-2.121,2.121,1.715,1.715L75.54,45.045A22.919,22.919,0,0,0,61.5,39.053V35h-3v4.053A23,23,0,1,0,76.954,46.459ZM60,83A21,21,0,1,1,81,62,21.025,21.025,0,0,1,60,83Zm1-23.816V46H59V59.184a2.983,2.983,0,0,0,0,5.633V69h2V64.817A2.983,2.983,0,0,0,61,59.184Z"/>
            </svg>
            <span class="svgTitle">倒计时</span>
          </router-link>
        </div>
      </div>
      <!--设备被解绑toast-->
      <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
    </div>
  </div>
</template>

<script>
  import {ON_PAGE_BEGIN, ON_PAGE_END, PAGE_OUTLET_S1, PAGE_OUTLET_S2, PAGE_OUTLET_S3, PAGE_OUTLET_S4, PAGE_OUTLET_S5, PAGE_OUTLET_S6} from '@/assets/js/uman-events.js';
  import {handlePushDataReceiveData, checkDeviceBindStatus} from '@/assets/js/common/formateData.js';
  import {AnalysisMixin} from '@/assets/js/common/AnalysisPushDataReceiveData.js';
  import { DEFAULT_TIME_STAMP } from '@/assets/js/constants/BaseData.js';
  import { TimeUtils } from '@/assets/js/common/utils.js';
  export default {
    name: 'index',
    mixins: [AnalysisMixin],
    data () {
      return {
        nextActionHint: '',
        isOpen: 0,
        isActive: false,
        header_title: '',
        socket_initName: '',
        currSocketInitName: sessionStorage.getItem('socket_initName').substring(2).toLowerCase(), // s1,s2
        device_id: window.sessionStorage.getItem('device_id'),
        device_name: '',
        toast_show: false,
        switchName: '',
        allTimingData: '',
        countDownTimer: [],
        countDownTimeout: []
      };
    },
    methods: {
      goback () {
        this.$router.goBack();
      },
      _countUmanPageEvent (switchName, eventName) { // 友盟统计S1-S6页面的进入和 退出
        let _this = this;
        switch (switchName) {
          case 's1':
            _this._onStatisEvent({eventName: eventName, pageTitle: PAGE_OUTLET_S1});
            break;
          case 's2':
            _this._onStatisEvent({eventName: eventName, pageTitle: PAGE_OUTLET_S2});
            break;
          case 's3':
            _this._onStatisEvent({eventName: eventName, pageTitle: PAGE_OUTLET_S3});
            break;
          case 's4':
            _this._onStatisEvent({eventName: eventName, pageTitle: PAGE_OUTLET_S4});
            break;
          case 's5':
            _this._onStatisEvent({eventName: eventName, pageTitle: PAGE_OUTLET_S5});
            break;
          case 's6':
            _this._onStatisEvent({eventName: eventName, pageTitle: PAGE_OUTLET_S6});
            break;
          default:
            break;
        }
      },
      toSetSocketName () {
        this.$router.push({name: 'SetSocketName'});
      },
      changeImg (event) {
        let _this = this;
        let target = event.currentTarget;
        let switchName = _this.currSocketInitName; // s1,s2
        let switchStatus;
        if (target.className === 'setting_icon  close') { // 建议用classList的contains方法判断是否存在某个类名  weihaitao 2017.9.30
          switchStatus = 1;
        } else if (target.className === 'setting_icon  open') {
          switchStatus = 0;
        }
        let obj = {
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
      _clearThisInterval () {
        this.countDownTimer.forEach(function (item) {
          if (item) {
            clearInterval(item);
          }
        });
      },
      changeColor (event) {
        let target = event.currentTarget;
        target.className = 'routerActive';
        setTimeout(function () { // 激活样式移除，防止SettingTime.vue页面未跳转时，多个路由被激活  yuzhihao
          target.className = '';
        }, 200);
      },
      _handlePushDataReceiveResponse (event) {
        let _this = this;
        let data = JSON.parse(event.data);
        if (data.topic.indexOf('authfailed') !== -1) {
          _this.toast_show = true;
          return;
        }
        if (data.topic.indexOf('disconnected') !== -1) {
          window.phihome.app.toast('设备不在线', function (response) {
          });
          return;
        }
        if (data.topic.indexOf('OutletStatus') !== -1) {
          let newPushData = handlePushDataReceiveData(data.pushData, window.sessionStorage.getItem('outletStatusData'));
          let newAllData = handlePushDataReceiveData(data.pushData, window.sessionStorage.getItem('allData'));
          window.sessionStorage.setItem('allData', newAllData);
          this.initTimerControlPage(newAllData);
          window.sessionStorage.setItem('outletStatusData', newPushData);
          _this._initPage(newPushData);
          return;
        }
        if (data.topic.indexOf('TimerControl') !== -1) {
          let newAllData = handlePushDataReceiveData(data.pushData, window.sessionStorage.getItem('allData'));
          window.sessionStorage.setItem('allData', newAllData);
          this.initTimerControlPage(newAllData);
        }
      },
      _initPage (pushData) {
        let pushDataJson = JSON.parse(pushData);
        if (pushDataJson && pushDataJson.state) {
          let switchsSta = pushDataJson.state.reported.switch;
          for (let switchKey in switchsSta) {
            if (this.currSocketInitName == switchKey) {
              this.isOpen = switchsSta[switchKey];
            }
          }
        }
      },
      _visibilitychange () {
        var _this = this;
        let allData = window.sessionStorage.getItem('allData');
        setTimeout(function () {
          _this.initTimerControlPage(allData);
        }, 600);
      },
      initTimerControlPage (timerControlData) {
        const _this = this;
        this._getServerTimeStamp(function (serverTime) {
          const sectionTimerData = _this._getSectionTimerData(timerControlData, _this.currSocketInitName, serverTime);
          const fixedTimerData = _this._getFixedTimerData(timerControlData, _this.currSocketInitName, serverTime);
          const countDownDate = _this._getCountdownData(timerControlData, _this.currSocketInitName, serverTime);
          let allTimerData = [].concat(sectionTimerData, fixedTimerData, countDownDate);
          let newArr = allTimerData.filter(function (item) {
            return item.nextActionTime !== DEFAULT_TIME_STAMP;
          });
          let newObj = newArr.sort(function (a, b) {
            return a.nextActionTime - b.nextActionTime;
          })[0] || DEFAULT_TIME_STAMP;
          _this.showSectionTimer(newObj);
        });
      },
      _calculateTime (currTime, startTime, action) {
        let _this = this;
        let newCurrentTime = currTime;
        let newStartTime = parseInt(startTime); // 倒计时触发时间
        let timeDifference = (newStartTime - currTime) > 0 ? (newStartTime - currTime) : 0; // 单位 秒 如果倒计时时间过期，则设为0
        _this.nextActionHint = _this.formatTime(timeDifference) + '后' + action;
        _this._clearThisInterval(); // 添加新的轮询之前先清掉之前的轮询
        if (timeDifference == 0) {
          return;
        }
        _this.countDownTimer.push(setInterval(function () {
          newCurrentTime++; // 当前时间+1，实现倒计时效果
          _this.nextActionHint = _this.formatTime(newStartTime - newCurrentTime) + '后' + action;
          if (newStartTime - newCurrentTime <= 0) {
            _this.nextActionHint = '';
            _this._clearThisInterval();
          }
        }, 1000));
      },
      formatTime (s) {
        let t;
        if (s > -1) {
          let hour = Math.floor(s / 3600);
          let min = Math.floor(s / 60) % 60;
          let sec = s % 60;
          if (hour < 10) {
            t = '0' + hour + ':';
          } else {
            t = hour + ':';
          }
          if (min < 10) {
            t += '0';
          }
          t += min + ':';
          if (sec < 10) {
            t += '0';
          }
          t += sec;
        }
        return t;
      },
      showSectionTimer (newObj) {
        const _this = this;
        const nextActionTime = new Date(newObj.nextActionTime);
        if (newObj != 0) {
          let action = newObj.action == 1 ? '开启' : '关闭';
          let nextActionTimeFormate = new Date(nextActionTime).setHours(0, 0, 0, 0); // 执行时间今天零点的时间戳
          let todayServerTimeFormate = new Date(newObj.serverTime).setHours(0, 0, 0, 0); // 服务器今天零点的时间戳
          let tomorrowServerTimeFormate = new Date(newObj.serverTime + 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0); // 服务器明天零点的时间戳
          switch (newObj.type) {
            case 'sectionTimer':
              let actionTime = newObj.actionTime.split('-');
              let nextActionTimeHourMinu = TimeUtils._addTimeZero(new Date(nextActionTime).getHours()) + ':' + TimeUtils._addTimeZero(new Date(nextActionTime).getMinutes()); // 格式化为15:30形式
              if (nextActionTimeHourMinu == actionTime[0]) {
                action = '开启';
              } else if (nextActionTimeHourMinu == actionTime[1]) {
                action = '关闭';
              }
              _this._clearThisInterval(); // 非倒计时，需清除倒计时定时器，防止iOS后台中js倒计时跑太慢未执行完
              if (nextActionTimeFormate === todayServerTimeFormate) {
                _this.nextActionHint = '今天' + nextActionTimeHourMinu + action;
                return;
              }
              if (nextActionTimeFormate === tomorrowServerTimeFormate) {
                _this.nextActionHint = '明天' + nextActionTimeHourMinu + action;
              } else {
                _this.nextActionHint = nextActionTime.getMonth() + 1 + '月' + nextActionTime.getDate() + '日' + nextActionTimeHourMinu + action;
              }
              break;
            case 'fixedTimer':
              _this._clearThisInterval();
              if (nextActionTimeFormate === todayServerTimeFormate) {
                _this.nextActionHint = '今天' + newObj.actionTime + action;
                return;
              }
              if (nextActionTimeFormate === tomorrowServerTimeFormate) {
                _this.nextActionHint = '明天' + newObj.actionTime + action;
              } else {
                _this.nextActionHint = nextActionTime.getMonth() + 1 + '月' + nextActionTime.getDate() + '日' + newObj.actionTime + action;
              }
              break;
            case 'coundDown':
              let serverTime = Math.floor(newObj.serverTime / 1000); // 对秒取整
              let startTime = Math.floor(newObj.startTime / 1000); // 对秒取整
              _this._calculateTime(serverTime, startTime, action);
              break;
            default:
              break;
          }
        } else {
          _this._clearThisInterval();
          _this.nextActionHint = '';
        }
      }
    },
    created () {
      let _this = this;
      _this.device_id = sessionStorage.getItem('device_id');
      setTimeout(function () { // 延时，保证sessionStorage获取的最新的title
        _this._countUmanPageEvent(_this.switchName, ON_PAGE_BEGIN);
        _this.header_title = sessionStorage.getItem('socket_nickName');
        _this.socket_initName = sessionStorage.getItem('socket_initName');
      }, 100);
    },
    mounted () {
      let _this = this;
      document.addEventListener('nativeBack', this.goback); // 监听物理返回按键 weihaitao
      document.addEventListener('pushDataReceived', this._handlePushDataReceiveResponse);
      document.addEventListener('visibilitychange', this._visibilitychange);
      window.phihome.iot.subscribe('$events/broker/' + this.device_id + '/disconnected', function () { // 监听设备离线topic
      });
      window.phihome.iot.publish('$phihome/shadow/outlet_tc1/' + _this.device_id + '/OutletStatus/get', '', function () { // get 获取shadow
      });
      this._initPage(window.sessionStorage.getItem('outletStatusData'));
      checkDeviceBindStatus(_this);
    },
    updated () {
      let headerHeight = this.$refs.header.offsetHeight;
      let contentHeight = sessionStorage.getItem('bodyHeight') - headerHeight;
      this.$refs.timingContent.style.height = contentHeight + 'px';
    },
    beforeDestroy () {
      this._countUmanPageEvent(this.switchName, ON_PAGE_END);
      this._clearThisInterval();
      document.removeEventListener('nativeBack', this.goback); // 监听物理返回按键 weihaitao
      document.removeEventListener('pushDataReceived', this._handlePushDataReceiveResponse);
      document.removeEventListener('visibilitychange', this._visibilitychange);
    }
  };
</script>
<style scoped lang="less">
  @r: 75rem;
  .header .set_icon {
    .icon_container {
      padding: .26666667rem;
      display: inline;
      img {
        width: 36/@r;
        margin-right: 2/@r;
      }
    }
  }
  .page-content {
    position: absolute;
    top: 1.3rem;
    right: 0;
    bottom: 0;
    left: 0;
    .toSetSocketName{
      z-index: 9999;
      position: absolute;
      top: 0;
      right: 0;
      width: 2.3rem;
      height: 1.5rem;
      line-height: 1.5rem;
      background: #96d4e6;
    }
    a { //去掉点击链接下划线
      text-decoration: none;
    }
    .time_top {
      width: 100%;
      height: 72.5%;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      .latest-timing {
        position: relative;
        top: -2.32rem;
        font-size: 30/@r;
        height: 38/@r;
        color: #ff9b1a;
      }
      .setting_icon {
        width: 4rem;
        display: block;
        height: 4rem;
        margin: auto;
        background: #fff;
      }
      .open {
        background: url('../../assets/img/settings/kaiqi@3x.png');
        background-size: 100% 100%;
      }
      .close {
        background: url('../../assets/img/settings/guanbi@3x.png');
        background-size: 100% 100%;
      }
    }
    .time_bottom {
      width: 100%;
      height: 27.5%;
      background: #fff;
      .set_time {
        width: 33%;
        float: left;
        height: 100%;
        vertical-align: middle;
        .routerActive {
          .svgTitle {
            color: #ff9b1a;
          }
          .svgImg {
            fill: #ff9b1a;
          }
        }
        .svgTitle {
          color: #494949;
        }
        .cls-1 {
          fill: #494949;
          fill-rule: evenodd;
        }
        .cls-2 {
          fill: #494949;
          fill-rule: evenodd;
        }
        .cls-3 {
          fill: #494949;
          fill-rule: evenodd;
        }
        span {
          font-size: 24/@r;
          color: #494949;
        }

      }
    }
  }

  svg {
    width: 120/@r;
    height: 120/@r;
    display: block;
    margin: 74/@r auto 44/@r;
  }
</style>

