<template>
  <div>
    <div class="header ofh">
      <div class="left" @click="goback">
        <img src="~@/assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">倒计时</div>
      <div class="set_icon">
        <div @click="_addCountDown">
          <a class="icon_container">
            <img src="~@/assets/img/add.png" alt="shezi.png">
          </a>
        </div>
      </div>
    </div>

    <div class="page-content countDown">
      <div class="timelist" :class='{timelist_disabled:item.timelistDisabled}' v-for="(item, index) in countDownStatus">
        <div @click="toEditTiming(index)" :name="index">
          <span class="time">
              <span class="seconds countDownTime" ref="demo" v-text="item.countDownText"></span><span class="time_tips">后<span
            v-text="item.switchAction"></span></span>
          </span>
        </div>
        <div class="switch">
          <input type="checkbox" class="switch_input" :class="{mint_switch_active:item.switchSta}" :name="index"
                 @click="changeSwitchSta">
        </div>
      </div>
      <img class="err_img" src="~@/assets/img/settings/countDown.png" alt=''>
    </div>
    <!--设备被解绑toast-->
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
  </div>
</template>

<script>
  import {ON_EVENT, ON_PAGE_BEGIN, ON_PAGE_END, COUNT_DOWN_CLICK, PAGE_COUNTDOWN, COUNT_DOWN_ADD_FAIL} from '@/assets/js/uman-events.js';
  import { TimeUtils } from '@/assets/js/common/utils.js';
  import {handlePushDataReceiveData, checkDeviceBindStatus} from '@/assets/js/common/formateData.js';
  /* Add 增加倒计时最大数量校验  定义常量 author:weihaitao 2017.10.9   start */
  const MAXAMOUNT = 20;
  /* Add 增加倒计时最大数量校验  定义常量  author:weihaitao 2017.10.9   end */
  export default {
    data () {
      return {
        timer: [],
        switchStyle: {
          width: '5rem',
          height: '3rem',
          background: 'red',
          timer0: '2333'
        },
        pushAllTimerData: '', // pushData监听 返回的数据
        publishSucc: false, // 标识是否publish成功
        allTimerData: {
          'state': {
            'desired': {
              'all_timers': {}
            }
          }
        },
        countDownStatus: [],
        device_id: window.sessionStorage.getItem('device_id'),
        device_name: '',
        toast_show: false,
        socket_name: window.sessionStorage.getItem('socket_header_title').slice(2, 4).toLowerCase().trim(),
        countDownData: {
          'state': {
            'desired': {
              'all_timers': {
                's1': {
                  'section_timer': [
                    '25056342 4 13:42-13:41 1'
                  ],
                  'timer': [
                    '25056341 4 1 1'
                  ],
                  'countdown': [
                    '25056341 12 1 0'
                  ]
                }
              }
            }
          }
        },
        currentTime: ''
      };
    },
    created () {
      // 初始化 设备名
      let _this = this;
      _this._onStatisEvent({eventName: ON_PAGE_BEGIN, pageTitle: PAGE_COUNTDOWN});
      // 获取服务器当前时间
      window.phihome.util.netRequest('get', _this.hostname + '/v1/server/timestamp', '', '', function (response) {
        response = JSON.parse(response);
        response = JSON.parse(response.netResponse);
        _this.currentTime = response.result.timestamp;
      });
    },
    mounted () {
      /* eslint-disable */
      let _this = this;
      document.addEventListener('nativeBack', _this.goback); // 监听物理返回按键 weihaitao
      document.addEventListener('pushDataReceived', _this._handlePageData);
      document.addEventListener('visibilitychange', _this._visibilitychange);
      let allData = window.sessionStorage.getItem('allData');
      if (allData) {
        _this._initPage(allData);
      } else {
        _this._publishTimerControl();
      }
      // 检测设备是否解绑
      checkDeviceBindStatus(_this);
    },
    beforeRouteLeave (to, from, next) {
      if (to.path === '/addCountDown' && !this._checkCountDownAmount()) {
        next(false);
        return;
      }
      this._clearThisInterval();
      next();
    },
    beforeDestroy () {
      this._clearThisInterval();
      this._onStatisEvent({eventName: ON_PAGE_END, pageTitle: PAGE_COUNTDOWN});
      document.removeEventListener('pushDataReceived', this._handlePageData);
      document.removeEventListener('visibilitychange', this._visibilitychange);
      document.removeEventListener('nativeBack', this.goback);
    },
    methods: {
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
      _addCountDown () {
        this.$router.push({
          name: 'addCountDown'
        });
        this._onStatisEvent({eventName: ON_EVENT, eventID: COUNT_DOWN_CLICK});
      },
      _countUmanAddTimeFailed (toastMessage) {
        if (toastMessage) {
          window.phihome.app.toast(toastMessage, function (response) {
          });
        }
        this._onStatisEvent({eventName: ON_EVENT, eventID: COUNT_DOWN_ADD_FAIL});  // 友盟埋点统计
      },
      _visibilitychange () {
        let _this = this;
        let allData = window.sessionStorage.getItem('allData');
        setTimeout(function () {
          _this._initPage(allData);
        }, 600);
      },
      _clearThisInterval () {
        this.timer.forEach(function (item) {
          if (item) {
            clearInterval(item);
          }
        });
      },
      toEditTiming (index) {
        sessionStorage.setItem('selectIndex', index);
        this.$router.push({name: 'editCountDown'});
      },
      goback () {
        this.$router.goBack();
      },
      changeSwitchSta (event) {
        let _this = this;
        let switchSta = event.currentTarget;
        let currIndex = switchSta.name; // 当前开关定时器对应位置index
        let currCountdownData; // 当前倒计时 开关时间数据
        event.stopPropagation();
        currCountdownData = _this.allTimerData.state.desired.all_timers[_this.socket_name].countdown[currIndex].split(' '); // 当前倒计时数据字符串转为数组
        if (switchSta.className == 'switch_input') { // 开启倒计时
          window.phihome.util.netRequest('get', _this.hostname + '/v1/server/timestamp', '', '', function (response) {
            if (JSON.parse(response).errorCode == 0) {
              response = JSON.parse(response).netResponse;
              response = JSON.parse(response).result;
              let timestamp = response.timestamp;
              let timeLength; // 倒计时时长
              // 跟倒计时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
              let oneTime = '';
              let oneCurrentTime;
              let countDownData = JSON.parse(window.sessionStorage.getItem('allData'));
              let compareCountDown = countDownData.state.reported.all_timers[_this.socket_name].countdown;
              let currentAction = currCountdownData[2];
              timeLength = parseInt(_this.countDownStatus[currIndex].timeLength) * 60; // 倒计时长转为秒
              currCountdownData[currCountdownData.length - 1] = 1; // 开关状态数值设为1
              currCountdownData[0] = Math.round(timestamp / 1000) + timeLength; // 时间对秒取整,倒计时开始时间点
              oneCurrentTime = new Date(currCountdownData[0]*1000).getDay();
              for (let i = 0; i < compareCountDown.length; i++) {
                TimeUtils._addTimeZero(new Date(compareCountDown[i].split(' ')[0] * 1000).getMinutes())
                let hoursData = TimeUtils._addTimeZero(new Date(compareCountDown[i].split(' ')[0] * 1000).getHours());
                let minuteData = TimeUtils._addTimeZero(new Date(compareCountDown[i].split(' ')[0] * 1000).getMinutes());
                let secondData = TimeUtils._addTimeZero(new Date(compareCountDown[i].split(' ')[0] * 1000).getSeconds());
                let selectedTimeHours = hoursData + ':' + minuteData + ':' + secondData;
                let timeAction = compareCountDown[i].split(' ')[2];
                let count = currCountdownData[0] * 1000;
                let currentTimeSecond = TimeUtils._addTimeZero(new Date(count).getHours()) + ':' + TimeUtils._addTimeZero(new Date(count).getMinutes()) + ':' + TimeUtils._addTimeZero(new Date(count).getSeconds());
                if (currentTimeSecond == selectedTimeHours && currentAction == 0 && timeAction == 1) {
                  if (new Date(count).getDay() == new Date(compareCountDown[i].split(' ')[0] * 1000).getDay()) {
                    _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                    return;
                  }
                }
                if (currentTimeSecond == selectedTimeHours && currentAction == 1 && timeAction == 0) {
                  if (new Date(count).getDay() == new Date(compareCountDown[i].split(' ')[0] * 1000).getDay()) {
                    _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                    return;
                  }
                }
              }
              _this.allTimerData.state.desired.all_timers[_this.socket_name].countdown[currIndex] = currCountdownData.join(' ');
              window.phihome.iot.publish('device/' + _this.device_id + '/TimerControl', _this.allTimerData, function () {
              });
            }
          });
        } else { // 点击关闭倒计时
          currCountdownData[currCountdownData.length - 1] = 0; // 开关状态数值设为1
          _this.allTimerData.state.desired.all_timers[_this.socket_name].countdown[currIndex] = currCountdownData.join(' ');
          window.phihome.iot.publish('device/' + _this.device_id + '/TimerControl', _this.allTimerData, function () {
          });
        }
      },
      /* Add 增加倒计时最大数量校验  定义方法 author:weihaitao 2017.10.9   start */
      _checkCountDownAmount () {
        if (!this.allTimerData.state.desired.all_timers[this.socket_name] || this.allTimerData.state.desired.all_timers[this.socket_name].countdown.length < MAXAMOUNT) {
          return true;
        } else {
          window.phihome.app.toast('倒计时最多支持' + MAXAMOUNT + '个', function (response) {
          });
          return false;
        }
      },
      /* Add 增加倒计时最大数量校验  定义方法 author:weihaitao 2017.10.9   end */
      _handlePageData (event) {
        let allData = JSON.parse(event.data);
        let _this = this;
        if (allData.topic.indexOf('authfailed') !== -1) {
          _this.toast_show = true;
          return;
        }
        if (allData.topic.indexOf('TimerControl') !== -1) {
          let newAllData = handlePushDataReceiveData(allData.pushData, window.sessionStorage.getItem('allData'));
          window.sessionStorage.setItem('allData', newAllData);
          this._initPage(newAllData);
          return;
        }
        if (allData.topic.indexOf('OutletStatus') !== -1) {
          let newPushData = handlePushDataReceiveData(allData.pushData, window.sessionStorage.getItem('outletStatusData'));
          window.sessionStorage.setItem('outletStatusData', newPushData);
        }
      },
      _publishTimerControl () {
        let deviceId = sessionStorage.getItem('device_id');
        window.phihome.iot.initConfig('{"shadows":["TimerControl"]}', function (response) { // 获取定时器数据
          window.phihome.iot.publish('$phihome/shadow/outlet_tc1/' + deviceId + '/TimerControl/get', '', function () { // get 获取shadow
          });
        });
      },
      _initPage (pushData) {
        let _this = this;
        _this._clearThisInterval();
        let initJSON = {
          'state': {
            'reported': {
              'all_timers': {
                's1': {
                  'section_timer': [],
                  'timer': [],
                  'countdown': []
                },
                's2': {
                  'section_timer': [],
                  'timer': [],
                  'countdown': []
                },
                's3': {
                  'section_timer': [],
                  'timer': [],
                  'countdown': []
                },
                's4': {
                  'section_timer': [],
                  'timer': [],
                  'countdown': []
                },
                's5': {
                  'section_timer': [],
                  'timer': [],
                  'countdown': []
                },
                's6': {
                  'section_timer': [],
                  'timer': [],
                  'countdown': []
                }
              }
            }
          }
        };
        let countDownData = [];
        let countDownArr;
        let currSocketName = _this.socket_name.toLowerCase().trim(); // s1-s6
        if (!pushData) {
          window.sessionStorage.setItem('allData', JSON.stringify(initJSON));
          pushData = JSON.stringify(initJSON).replace('reported', 'desired');
          window.phihome.iot.publish('device/' + _this.device_id + '/TimerControl', pushData, function () {
          });
        } else {
          let copyJSON = JSON.parse(pushData);
          /* Add 返回错误信息时不刷新数据，直接toast错误信息    author:weihaitao 2017.10.18 Start */
          if (copyJSON.state == undefined) {
            if (copyJSON.message) {
              window.phihome.app.toast(copyJSON.message, function (response) {
              });
            }
            return;
          }
          /* Add 返回错误信息时不刷新数据，直接toast错误信息    author:weihaitao 2017.10.18 End */
          for (let x in initJSON.state.reported.all_timers) {
            for (let y in copyJSON.state.reported.all_timers) {
              if (x = y) { // eslint-disable-line
                for (let z in initJSON.state.reported.all_timers[x]) {
                  if (z in copyJSON.state.reported.all_timers[y]) {
                    initJSON.state.reported.all_timers[x][z] = copyJSON.state.reported.all_timers[y][z];
                  }
                }
              }
            }
          }
          pushData = initJSON;
          window.sessionStorage.setItem('allData', JSON.stringify(pushData));
          if (pushData.state) { // 如果设备在线，才能获取到pushData内的数据
            let allTimers = pushData.state.reported.all_timers; // 获取所有定时器数据
            let switchSta;
            let currTime;
            window.phihome.util.netRequest('get', _this.hostname + '/v1/server/timestamp', '', '', function (response) {
              response = JSON.parse(response).netResponse;
              response = JSON.parse(response).result;
              currTime = Math.round(response.timestamp / 1000); // 当前时间，对秒取整
              for (let switchKey in allTimers) {
                if (currSocketName == switchKey) {
                  _this.allTimerData.state.desired.all_timers[currSocketName] = allTimers[switchKey];
                  countDownArr = allTimers[switchKey].countdown;
                  _this.timer = new Array(countDownArr.length);
                  for (let i = 0; i < countDownArr.length; i++) {
                    let countDownDataArr = countDownArr[i].split(' ');
                    let newStartTime = parseInt(countDownDataArr[0]); // 倒计时触发时间
                    if (newStartTime < currTime) { // 如果已经过期就关闭
                      switchSta = 0;
                    } else {
                      switchSta = parseInt(countDownDataArr[3]);
                    }
                    countDownData.push({
                      'time': countDownDataArr[0],
                      'timeLength': countDownDataArr[1],
                      'switchAction': countDownDataArr[2] == '0' ? '关闭' : '开启',
                      'switchSta': switchSta,
                      'countDownText': ''
                    });
                    countDown(i, currTime, countDownDataArr[0], countDownDataArr[1], parseInt(countDownDataArr[3]));
                  }
                  // 获取所有开关状态
                  _this.countDownStatus = countDownData;
                  sessionStorage.setItem('countDownData', countDownData);
                  if (_this.countDownStatus.length != 0) { // 有定时任务，正常显示
                    setTimeout(function () {
                      document.getElementsByClassName('countDown')[0].style.background = '#f5f5f5';
                      document.getElementsByClassName('err_img')[0].style.display = 'none';
                    }, 50)
                  } else { // created中需要延时才能获取对应元素
                    setTimeout(function () {
                      document.getElementsByClassName('countDown')[0].style.background = '#fff';
                      document.getElementsByClassName('err_img')[0].style.display = 'block';
                    }, 200);
                  }
                  // 定时器启用 开关关闭时改变背景色
                  setTimeout(function () {
                    let timeList = document.getElementsByClassName('timelist');
                    for (let i = 0; i < timeList.length; i++) {
                      if (timeList[i].getElementsByClassName('switch_input')[0].className === 'switch_input') {
                        timeList[i].className = 'timelist timelist_disabled';
                      } else if (timeList[i].getElementsByClassName('switch_input')[0].className === 'switch_input mint_switch_active') {
                        timeList[i].className = 'timelist';
                      }
                    }
                  }, 60);
                }
              }
            });
          }
        }
        function countDown (timerI, currTime, startTime, timeLength, switchSta) {
          let newCurrentTime = currTime;
          _this._calculateTime(timerI, currTime, startTime, timeLength, switchSta, countDownData);
          _this.timer[timerI] = setInterval(function () {
            newCurrentTime++; // 当前时间+1，实现倒计时效果
            _this._calculateTime(timerI, newCurrentTime, startTime, timeLength, switchSta, countDownData);
          }, 1000);
        }
      },
      _calculateTime (timerI, currTime, startTime, timeLength, switchSta, countDownData) {
        let _this = this;
        let newStartTime = parseInt(startTime); // 倒计时触发时间
        let timeDifference = (newStartTime - currTime) > 0 ? (newStartTime - currTime) : 0; // 单位 秒 如果倒计时时间过期，则设为0
        countDownData[timerI].countDownText = _this.formatTime(timeDifference);
        if (switchSta === 0) {
          clearInterval(_this.timer[timerI]);
          countDownData[timerI].countDownText = _this.formatTime(parseInt(timeLength) * 60);
          return;
        }
        if (timeDifference === 0) { // 倒计时完成
          clearInterval(_this.timer[timerI]);
          countDownData[timerI].switchSta = 0;
          countDownData[timerI].timelistDisabled = true;
          if (switchSta !== 0) { // 倒计时完成，时间恢复到初始时长
            countDownData[timerI].countDownText = _this.formatTime(parseInt(timeLength) * 60);
          }
        }
      }
    }
  };
</script>
<style lang="less">
  @r: 75rem;
  .countDown {
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
    padding-top: 1.3rem;
    background: #f5f5f5;
    min-height: 100vh;
    a {
      color: #313131;
      border: none;
    }
    .err_img { //异常图片
      position: fixed;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      margin: auto;
      display: none;
    }
    .timelist {
      margin: 20/@r 0;
      background: #fff;
      padding: 22/@r;
      height: 104/@r;
      text-align: left;
      vertical-align: middle;
      box-sizing: border-box;
      position: relative;
      .time {
        font-size: 48/@r;
        vertical-align: middle;
        position: relative;
      }
      .time_tips {
        font-size: 30/@r;
        vertical-align: middle;
        padding-left: 10/@r;
        position: absolute;
        width: 100/@r;
        left: 190/@r;
        top: 8/@r;
      }
      .switch {
        position: absolute;
        right: 19%;
        top: 26.8/@r;
      }
      a { //跳转编辑倒计时路由
        width: 100%;
        display: inline-block;
        height: 1.0rem;
        text-decoration: none
      }
    }
    .timelist_disabled a {
      color: #bfbfbf;
    }
    .timelist_disabled {
      color: #bfbfbf;
    }
    .time_top {
      width: 100%;
      height: 72.5%;
      background: #f5f5f5;
      display: flex;
      img {
        width: 300/@r;
        display: block;
        margin: auto;
      }
    }
    .time_bottom {
      width: 100%;
      height: 27.5%;
      background: #fff;
    }
  }

  //插座开关样式
  .countDown .switch {
    position: relative;
  }

  .countDown .switch input {
    position: absolute;
    left: 0;
    top: -34.5/@r !important;
    width: 0;
    border: none;
  }


</style>

