<template>
  <div id="fixed-time-page">
    <div class="header ofh">
      <div class="left" @click="goback">
        <img src="~@/assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">定时</div>
      <div class="set_icon">
        <div @click="_addTiming">
          <a class="icon_container">
            <img src="~@/assets/img/add.png" alt="shezi.png">
          </a>
        </div>
      </div>
    </div>
    <div class="page-content fixedTime" id="page-content">
      <div class="timelist" v-for="(item, index) in timingStatus">
        <div @click="toEditTiming(index)" :name="index">
                  <span class="time">
                      <span class="hours" v-text="item.time.split(':')[0]"></span>:<span class="minutes"
                                                                                         v-text="item.time.split(':')[1]"></span>
                  </span>
          <span class="time_tips" v-text="item.switchAction"></span>
          <div class="switch">
            <input type="checkbox" class="switch_input" :class="{mint_switch_active:item.switchSta}" :name="index"
                   @click="changeSwitchSta">
          </div>
          <div class="repeat_times">
            重复：<span class="repeat" v-text="item.repeat"></span>
          </div>
        </div>
      </div>
      <img class="err_img" src="~@/assets/img/settings/noTiming.png" alt="">
    </div>
    <!--设备被解绑toast-->
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
  </div>
</template>

<script>
  import { TimeUtils } from '@/assets/js/common/utils.js';
  import {ON_EVENT, ON_PAGE_BEGIN, ON_PAGE_END, TIME_ADD_CLICK, PAGE_FIXED_TIMEING, TIMESLOT_ADD_FAIL} from '@/assets/js/uman-events.js';
  import {handlePushDataReceiveData, checkDeviceBindStatus} from '@/assets/js/common/formateData.js';
  /* Add 增加定时最大数量校验  定义常量 author:weihaitao 2017.10.9   start */
  const MAXAMOUNT = 20;
  /* Add 增加定时最大数量校验  定义常量  author:weihaitao 2017.10.9   end */
  export default {
    name: 'index',
    data () {
      return {
        timingStatus: [
        ],
        pushAllTimerData: '',
        allTimerData: {
          'state': {
            'desired': {
              'all_timers': {}
            }
          }
        },
        device_id: window.sessionStorage.getItem('device_id'),
        device_name: '',
        toast_show: false,
        socket_name: window.sessionStorage.getItem('socket_header_title').slice(2, 4).toLowerCase().trim(),
        addTimeData: JSON.parse(window.sessionStorage.getItem('allData')),
        currentTime: '',
        singleFixedTimeTimeOutArr: []
      };
    },
    mounted: function () {
      let _this = this;
      _this._onStatisEvent({eventName: ON_PAGE_BEGIN, pageTitle: PAGE_FIXED_TIMEING});
      document.addEventListener('nativeBack', _this.goback); // 监听物理返回按键 weihaitao
      document.addEventListener('pushDataReceived', _this._handlePageData);
      let allData = window.sessionStorage.getItem('allData');
      if (allData) {
        _this._initPage(allData);
      } else {
        _this._publishTimerControl();
      }
      // 检测设备是否解绑
      checkDeviceBindStatus(_this);
    },
    updated () {
      this._refreshCurrentPage();
    },
    beforeRouteLeave (to, from, next) {
      if (to.path === '/addTiming' && !this._checkFixedTimeAmount()) {
        next(false);
        return;
      }
      next();
    },
    beforeDestroy () {
      this._onStatisEvent({eventName: ON_PAGE_END, pageTitle: PAGE_FIXED_TIMEING});
      this._clearFixedTimeTimeout();
      document.removeEventListener('pushDataReceived', this._handlePageData);
      document.removeEventListener('nativeBack', this.goback);
    },
    methods: {
      _addTiming () {
        this.$router.push({
          name: 'addTiming'
        });
        this._onStatisEvent({eventName: ON_EVENT, eventID: TIME_ADD_CLICK});
      },
      _refreshCurrentPage () {
        if (this.timingStatus.length == 0) { // 如果没有定时任务，显示异常图片
          document.getElementById('page-content').style.background = '#fff';
          document.getElementsByClassName('err_img')[0].style.display = 'block';
        } else {
          // 定时器启用 开关关闭时改变背景色
          setTimeout(function () {
            let timeList = document.getElementsByClassName('timelist');
            for (let i = 0; i < timeList.length; i++) {
              if (timeList[i].getElementsByClassName('switch_input')[0].className === 'switch_input') {
                timeList[i].className = 'timelist timelist_disabled';
              }
            }
          }, 60);
        }
      },
      _clearFixedTimeTimeout () {
        this.singleFixedTimeTimeOutArr.forEach(function (item) {
          clearTimeout(item);
        });
        this.singleFixedTimeTimeOutArr = [];
      },
      goback () {
        this.$router.goBack();
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
      addZero (num) {
        return num < 10 ? '0' + num : num;
      },
      _countUmanAddTimeFailed (toastMessage) {
        if (toastMessage) {
          window.phihome.app.toast(toastMessage, function (response) {
          });
        }
        this._onStatisEvent({eventName: ON_EVENT, eventID: TIMESLOT_ADD_FAIL});
      },
      changeSwitchSta (event) {
        let _this = this;
        let switchSta = event.currentTarget;
        let currIndex = switchSta.name; // 当前开关定时器对应位置index
        let timerData; // 当前倒计时 开关时间数据
        let repeatTimes = switchSta.parentElement.parentElement.getElementsByClassName('repeat')[0].innerHTML;
        event.stopPropagation();
        timerData = _this.allTimerData.state.desired.all_timers[_this.socket_name].timer[currIndex].split(' '); // 当前倒计时数据字符串转为数组
        if (switchSta.className === 'switch_input') { // 开启倒计时
          timerData[timerData.length - 1] = 1; // 开关状态数值设为1
          window.phihome.util.netRequest('get', _this.hostname + '/v1/server/timestamp', '', '', function (response) {
            response = JSON.parse(response);
            response = JSON.parse(response.netResponse);
            _this.currentTime = response.result.timestamp;
            if (repeatTimes === '单次' && _this.currentTime / 1000 > timerData[0] * 60) { // 单次定时且已经过期，重新开启时，时间设为第二天
              let timeStamp = timerData[0] * 60 * 1000;
              let actionHour = new Date(timeStamp).getHours();
              let actionMinute = new Date(timeStamp).getMinutes();
              let todayTimeStamp = new Date(_this.currentTime).setHours(0, 0, 0, 0);
              let oneDayLength = 24 * 60 * 60 * 1000;
              let tomorrowTimeStamp = todayTimeStamp + oneDayLength;
              tomorrowTimeStamp = new Date(tomorrowTimeStamp).setHours(actionHour, actionMinute, 0, 0);
              timerData[0] = tomorrowTimeStamp / 60 / 1000;
            }
            let saveTime = timerData[0] * 60 * 1000;
            let currFixedTime = TimeUtils._addTimeZero(new Date(saveTime).getHours()) + ':' + TimeUtils._addTimeZero(new Date(saveTime).getMinutes());
            let timeDay = [];
            // 获取16进制的二进制
            function day (str, types) {
              let index = 0;
              if (types == 'section') {
                index = 2;
              } else if (types == 'time') {
                index = 1;
              }
              let type = parseInt(str.split(' ')[index], 16).toString(2);
              let typeLength = 7 - type.length;
              let typeStr = '';
              for (let i = 0; i < typeLength; i++) {
                typeStr += '0';
              }
              let Str = (typeStr + type).split('');
              return Str;
            }
            // 设备不在线，直接返回
            if (!_this.addTimeData) {
              return;
            }
            // 时间不能一样,跟区间定时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
            let compareSection = _this.addTimeData.state.reported.all_timers[_this.socket_name].section_timer;
            let compareTiming = _this.addTimeData.state.reported.all_timers[_this.socket_name].timer;
            let weekDate = day(compareTiming[currIndex], 'time'); // 当前定时的周几重复数组
            let oneTime = '';
            let oneCurrentTime = new Date(saveTime).getDay();
            let selectedStartTimeHours;
            let selectedEndTimeHours;
            console.log(selectedStartTimeHours);
            for (let i = 0; i < compareSection.length; i++) {
              let switchStatus = compareSection[i].split(' ')[4]; //  开关状态是否激活
              selectedStartTimeHours = compareSection[i].split(' ')[3].split('-')[0];
              selectedEndTimeHours = compareSection[i].split(' ')[3].split('-')[1];
              timeDay = day(compareSection[i], 'section');
              if (repeatTimes === '单次') {
                let endTime;
                let timeLength;
                let timingSectionStartHour = parseInt(selectedStartTimeHours.split(':')[0]); // 工作时间起始点 小时
                let timingSectionStartMinute = parseInt(selectedStartTimeHours.split(':')[1]); // 工作时间起始点 分钟
                let timingSectionEndHour = parseInt(selectedEndTimeHours.split(':')[0]); // 工作时间结束点 小时
                let timingSectionEndMinute = parseInt(selectedEndTimeHours.split(':')[1]); // 工作时间结束点 分钟
                timeLength = (parseInt(timingSectionEndHour * 60) + parseInt(timingSectionEndMinute)) - (parseInt(timingSectionStartHour * 60) + parseInt(timingSectionStartMinute)); // 区间定时时长
                if (timeLength < 0) { // 设定时间跨区 开启时间为当天，关闭时间为后一天
                  timingSectionEndHour += 24; // 结束时间加24H
                  timeLength = (parseInt(timingSectionEndHour * 60) + parseInt(timingSectionEndMinute)) - (parseInt(timingSectionStartHour * 60) + parseInt(timingSectionStartMinute));
                }
                endTime = parseInt(compareSection[i].split(' ')[1]) + timeLength; // unix结束时间,单位为分钟
                if (new Date(endTime * 60 * 1000).getTime() < _this.currentTime) { // 结束时间如果已经过期，switchStatus设为0
                  switchStatus = 0;
                } else {
                  switchStatus = parseInt(compareSection[i].split(' ')[4]);
                }
                if (currFixedTime == selectedEndTimeHours && timerData[2] == 1 && switchStatus == 1) {
                  for (let j = 0; j < timeDay.length; j++) {
                    if (timeDay[j] == 1 && (6 - oneCurrentTime) == j) {
                      _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                      return;
                    } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                      // 多天和已有的单次相比
                      oneTime = new Date(compareSection[i].split(' ')[1] * 60 * 1000).getDay();
                      if (oneCurrentTime == oneTime) {
                        _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                        return;
                      }
                    }
                  }
                }
                if (currFixedTime == selectedStartTimeHours && timerData[2] == 0 && switchStatus == 1) {
                  for (let j = 0; j < timeDay.length; j++) {
                    if (timeDay[j] == 1 && (6 - oneCurrentTime) == j) {
                      _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                      return;
                    } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                      // 多天和已有的单次相比
                      oneTime = new Date(compareSection[i].split(' ')[1] * 60 * 1000).getDay();
                      if (oneCurrentTime == oneTime) {
                        _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                        return;
                      }
                    }
                  }
                }
              }
            }
            // 跟定时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
            for (let i = 0; i < compareTiming.length; i++) {
              let hoursData = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours();
              let minuteDate = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes();
              let selectedTimeHours = hoursData + ':' + minuteDate;
              let timeAction = compareTiming[i].split(' ')[2];
              let switchStatus = compareTiming[i].split(' ')[3]; //  开关状态是否激活
              timeDay = day(compareTiming[i], 'time');
              if (repeatTimes === '单次') {
                if (currFixedTime == selectedTimeHours && timerData[2] == 0 && timeAction == 1 && switchStatus == 1) {
                  for (let j = 0; j < timeDay.length; j++) {
                    if (j == (6 - oneCurrentTime) && timeDay[j] == 1) {
                      _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                      return;
                    } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                      oneTime = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getDay();
                      if (oneCurrentTime == oneTime) {
                        _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                        return;
                      }
                    }
                  }
                }
                if (currFixedTime == selectedTimeHours && timerData[2] == 1 && timeAction == 0 && switchStatus == 1) {
                  for (let j = 0; j < timeDay.length; j++) {
                    if (j == (6 - oneCurrentTime) && timeDay[j] == 1) {
                      _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                      return;
                    } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                      oneTime = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getDay();
                      if (oneCurrentTime == oneTime) {
                        _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                        return;
                      }
                    }
                  }
                }
              } else { // 选的是多天，不是单次
                if (currFixedTime == selectedTimeHours && timerData[2] == 1 && timeAction == 0 && switchStatus == 1) {
                  for (let j = 0; j < timeDay.length; j++) {
                    if (weekDate[j] == 1 && timeDay[j] == weekDate[j]) {
                      _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                      return;
                    } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                      oneTime = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getDay();
                      if ((6 - oneTime) == j && weekDate[j] == 1) {
                        _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                        return;
                      }
                    }
                  }
                }
                if (currFixedTime == selectedTimeHours && timerData[2] == 0 && timeAction == 1 && switchStatus == 1) {
                  for (let j = 0; j < timeDay.length; j++) {
                    if (weekDate[j] == 1 && timeDay[j] == weekDate[j]) {
                      _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                      return;
                    } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                      oneTime = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getDay();
                      if ((6 - oneTime) == j && weekDate[j] == 1) {
                        _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                        return;
                      }
                    }
                  }
                }
              }
            }
            _this.allTimerData.state.desired.all_timers[_this.socket_name].timer[currIndex] = timerData.join(' ');
            window.phihome.iot.publish('device/' + _this.device_id + '/TimerControl', _this.allTimerData, function () {
            });
          });
        } else { // 点击关闭倒计时
          timerData[timerData.length - 1] = 0; // 开关状态数值设为0
          _this.allTimerData.state.desired.all_timers[_this.socket_name].timer[currIndex] = timerData.join(' ');
          window.phihome.iot.publish('device/' + _this.device_id + '/TimerControl', _this.allTimerData, function () {
          });
        }
      },
      toEditTiming (index) {
        sessionStorage.setItem('selectIndex', index);
        this.$router.push({name: 'editTiming'});
      },
      /* Add 增加定时器最大数量校验  定义方法 author:weihaitao 2017.10.9   start */
      _checkFixedTimeAmount () {
        if (!this.allTimerData.state.desired.all_timers[this.socket_name] || this.allTimerData.state.desired.all_timers[this.socket_name].timer.length < MAXAMOUNT) {
          return true;
        } else {
          window.phihome.app.toast('定时最多支持' + MAXAMOUNT + '个', function (response) {
          });
          return false;
        }
      },
      /* Add 增加定时器最大数量校验  定义方法 author:weihaitao 2017.10.9   end */
      _handlePageData (event) { /* Edit 把pushDataReceive的回调封装成一个函数，用来组件销毁时清除监听 author:weihaitao 2017.10.17 */
        let allData = JSON.parse(event.data);
        let _this = this;
        if (allData.topic.indexOf('authfailed') !== -1) {
          _this.toast_show = true;
          return;
        }
        if (allData.topic.indexOf('TimerControl') !== -1) {
          let newAllData = handlePushDataReceiveData(allData.pushData, window.sessionStorage.getItem('allData'));
          window.sessionStorage.setItem('allData', newAllData);
          this.addTimeData = JSON.parse(window.sessionStorage.getItem('allData'));
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
      _initPage (pushData) { /* Edit 把渲染页面过程封装成一个函数，用来根据情况加载页面 author:weihaitao 2017.10.17 */
        let _this = this;
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
        let timingData = [];
        let timingArr = [];
        /* Add           单次定时到期关闭功能          author:weihaitao 2017.10.11       Start */
        function _setFixedTimeTimeOut (timingStatusArrIndex, switchSta, endTime) {
          let timeLength = endTime - new Date().getTime();
          if (switchSta === 1 && timeLength > 0) {
            _this.singleFixedTimeTimeOutArr.push(setTimeout(function () {
              _this.timingStatus[timingStatusArrIndex].switchSta = 0;
            }, timeLength));
          }
        }
        /* Add           单次定时到期关闭功能          author:weihaitao 2017.10.11       end */
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
          let allTimers = pushData.state.reported.all_timers; // 获取所有定时器数据
          _this.pushAllTimerData = allTimers;
          let currSocketName = _this.socket_name.toLowerCase().trim(); // s1-s6
          for (let switchKey in allTimers) {
            if (currSocketName == switchKey) {
              _this.allTimerData.state.desired.all_timers[currSocketName] = allTimers[switchKey];
              timingArr = allTimers[switchKey].timer; // 获取的定时数据数组
              for (let i = 0; i < timingArr.length; i++) {
                let date = new Date(timingArr[i].split(' ')[0] * 60 * 1000); // 转为毫秒，将时间转为 小时：分钟
                let startTime = _this.addZero(date.getHours()) + ':' + _this.addZero(date.getMinutes());
                let repeatDays = parseInt(timingArr[i].split(' ')[1], 16).toString(2); // 16进制先转十进制再转二进制
                let weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                let repeatDaysName = []; // 周几重复
                let repeatTimes = 0; // 重复次数
                let switchSta;
                repeatDays = repeatDays.split('').reverse();
                for (let j = 0; j < repeatDays.length; j++) {
                  if (repeatDays[j] == 1) {
                    repeatTimes++;
                    repeatDaysName.push(weekDay[j]);
                    if (repeatTimes == 7) {
                      repeatDaysName = ['每天'];
                    }
                  }
                }
                if (repeatTimes == 0) { // 单次定时
                  let endTime = new Date(timingArr[i].split(' ')[0] * 60 * 1000).getTime();
                  if (endTime < new Date().getTime()) { // 如果已经过期就关闭
                    switchSta = 0;
                  } else {
                    switchSta = parseInt(timingArr[i].split(' ')[3]);
                  }
                  repeatDaysName = ['单次'];
                  _setFixedTimeTimeOut(i, switchSta, endTime);
                } else {
                  switchSta = parseInt(timingArr[i].split(' ')[3]);
                }
                timingData.push({
                  'time': startTime,
                  'repeat': repeatDaysName.join('、'),
                  'switchAction': timingArr[i].split(' ')[2] == '0' ? '关闭' : '开启',
                  'switchSta': switchSta
                });
              }
              // 获取所有开关状态
              _this.timingStatus = timingData;
              if (_this.timingStatus.length != 0) { // 有定时任务，正常显示
                if (document.getElementsByClassName('fixedTime')[0]) {
                  document.getElementsByClassName('fixedTime')[0].style.background = '#f5f5f5';
                }
                document.getElementsByClassName('err_img')[0].style.display = 'none';
              } else { // created中需要延时才能获取对应元素
                setTimeout(function () {
                  document.getElementsByClassName('fixedTime')[0].style.background = '#fff';
                  document.getElementsByClassName('err_img')[0].style.display = 'block';
                }, 200);
              }
              // 定时器启用 开关关闭时改变背景色
              setTimeout(function () {
                let timeList = document.getElementsByClassName('timelist');
                for (let i = 0; i < timeList.length; i++) {
                  if (timeList[i].getElementsByClassName('switch_input')[0].className === 'switch_input') {
                    timeList[i].className = 'timelist timelist_disabled';
                  } else {
                    timeList[i].className = 'timelist';
                  }
                }
              }, 60);
            }
          }
        }
      }
    }
  };
</script>
<style scoped lang="less">
  @r: 75rem;
  #page-content {
    overflow-y: auto;
    padding-top: 1.566rem;
    background: #f5f5f5;
    min-height: 100vh;
    a {
      color: #313131;
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
      color: #313131;
      box-sizing: border-box;
      margin-bottom: 20/@r;
      background: #fff;
      padding: 0 20/@r;
      height: 190/@r;
      text-align: left;
      vertical-align: middle;
      a { //跳转编辑定时路由
        width: 100%;
        display: inline-block;
        text-decoration: none
      }
      .time {
        font-size: 50/@r;
        margin-top: 38/@r;
        display: inline-block;
        width: 102/@r;
      }
      .time_tips {
        font-size: 48/@r;
        padding-left: 40/@r;
      }
      .switch {
        position: absolute;
        right: 19%;
        z-index: 99;
        input:after {
          top: 0.1rem;
        }
        input:before {
          margin-top: 0rem;
        }
      }
      .repeat_times {
        font-size: 30/@r;
        margin-bottom: 40/@r;
        margin-top: 18/@r;
      }
    }
    .timelist_disabled {
      color: #bfbfbf;
    }
  }

  // .set_icon {
  //   position: absolute;
  //   right: 20/@r;
  //   top: 0rem;
  //   height: 1.3rem;
  //   vertical-align: middle;
  //   img {
  //     width: .6rem;
  //     vertical-align: middle;
  //   }
  // }

</style>

