<template>
  <div>
    <div class="header ofh">
      <div class="left" @click="goback">
        <img src="~@/assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">区间定时</div>
      <div class="set_icon">
        <div @click="_addSectionTiming">
          <a class="icon_container">
            <img src="~@/assets/img/add.png" alt="shezi.png">
          </a>
        </div>
      </div>
    </div>
    <div class="section page-content">
      <div class="timelist" v-for="(item, index) in sectionTimingStatus">
        <div @click="toEditTiming(index)" :name="index">
                  <span class="item_name" v-text="item.itemName">
                  </span>
          <div class="switch">
            <input type="checkbox" class="switch_input" :class="{mint_switch_active:item.switchSta}" :name="index"
                   @click="changeSwitchSta">
          </div>
          <div class="repeat_times">
            <p class="work_time">工作时间：<span v-text="item.time"></span></p>
            重复：<span class="repeat" v-text="item.repeat"></span>
          </div>
        </div>
      </div>
      <img class="err_img" src="~@/assets/img/settings/section.png">
    </div>
    <!--设备被解绑toast-->
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
  </div>
</template>
<script>
  import {ON_EVENT, ON_PAGE_BEGIN, ON_PAGE_END, TIMESLOT_ADD_CLICK, PAGE_SECTION_TIMING, TIMESLOT_ADD_FAIL} from '@/assets/js/uman-events.js';
  import {handlePushDataReceiveData, checkDeviceBindStatus} from '@/assets/js/common/formateData.js';
  /* Add 增加区间定时最大数量校验  定义常量 author:weihaitao 2017.10.9   start */
  const MAXAMOUNT = 10;
  /* Add 增加区间定时最大数量校验  定义常量  author:weihaitao 2017.10.9   end */
  export default {
    data () {
      return {
        device_name: '',
        toast_show: false,
        currentTime: '',
        timer: [],
        singleFixedTimeTimeOutArr: [],
        showTaskTimeout: '', // 显示定时任务的Timeout
        device_id: window.sessionStorage.getItem('device_id'),
        socket_name: window.sessionStorage.getItem('socket_header_title').slice(2, 4).toLowerCase().trim(),
        sectionTimingStatus: [],
        pushAllTimerData: '',
        addSectionTimeData: JSON.parse(window.sessionStorage.getItem('allData')),
        allTimerData: {
          'state': {
            'desired': {
              'all_timers': {}
            }
          }
        }
      };
    },
    methods: {
      goback () {
        this.$router.goBack();
      },
      _addSectionTiming () {
        this.$router.push({
          name: 'addSectionTiming'
        });
        this._onStatisEvent({eventName: ON_EVENT, eventID: TIMESLOT_ADD_CLICK});
      },
      toEditTiming (index) {
        sessionStorage.setItem('selectIndex', index);
        this.$router.push({name: 'editSectionTiming'});
      },
      _countUmanAddTimeFailed (toastMessage) {
        if (toastMessage) {
          window.phihome.app.toast(toastMessage, function (response) {
          });
        }
        this._onStatisEvent({eventName: ON_EVENT, eventID: TIMESLOT_ADD_FAIL});
      },
      changeSwitchSta (event) { // 点击开关
        let _this = this;
        let switchSta = event.currentTarget;
        let currIndex = switchSta.name; // 当前开关定时器对应位置index
        let timerData; // 当前倒计时 开关时间数据
        let repeatTimes = switchSta.parentElement.parentElement.getElementsByClassName('repeat')[0].innerHTML;
        event.stopPropagation();
        timerData = _this.allTimerData.state.desired.all_timers[_this.socket_name].section_timer[currIndex].split(' '); // 当前倒计时数据字符串转为数组
        if (switchSta.className === 'switch_input') { // 开启倒计时
          timerData[timerData.length - 1] = 1; // 开关状态数值设为1
          if (repeatTimes === '单次') { // 单次定时且已经过期，重新开启时，时间设为第二天
            window.phihome.util.netRequest('get', _this.hostname + '/v1/server/timestamp', '', '', function (response) {
              response = JSON.parse(response);
              response = JSON.parse(response.netResponse);
              _this.currentTime = response.result.timestamp;
              if (_this.currentTime / 1000 > timerData[1] * 60) { // 定时已经过期,设为明天的这个时间点
                let timeStamp = timerData[1] * 60 * 1000;
                let actionHour = new Date(timeStamp).getHours();
                let actionMinute = new Date(timeStamp).getMinutes();
                let todayTimeStamp = new Date(_this.currentTime).setHours(0, 0, 0, 0); // 设为今天的0时0分0秒
                let oneDayLength = 24 * 60 * 60 * 1000;
                let tomorrowTimeStamp = todayTimeStamp + oneDayLength; // 设为明天的0时0分0秒
                tomorrowTimeStamp = new Date(tomorrowTimeStamp).setHours(actionHour, actionMinute, 0, 0);
                timerData[1] = tomorrowTimeStamp / 60 / 1000;
              }
              _this.startTime = timerData[3].split('-')[0];
              _this.closeTime = timerData[3].split('-')[1];
              let saveTime = timerData[1] * 60 * 1000;
              let selectedTimeHours = '';
              let timeAction = '';
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
              if (!_this.addSectionTimeData) {
                return;
              }
              // 时间有交集
              _this.addSectionTimeData = JSON.parse(window.sessionStorage.getItem('allData'));
              let compareTiming = _this.addSectionTimeData.state.reported.all_timers[_this.socket_name].timer;
              let compareSection = _this.addSectionTimeData.state.reported.all_timers[_this.socket_name].section_timer;
              let oneTime = '';
              let oneCurrentTime = new Date(saveTime).getDay();
              let hoursData = '';
              let minuteDate = '';
              // 与区间定时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
              for (let i = 0; i < compareSection.length; i++) {
                timeDay = day(compareSection[i], 'section');
                let sectionStart = compareSection[i].split(' ')[3].split('-')[0];
                let timeAction = compareSection[i].split(' ')[4];
                let sectionEnd = compareSection[i].split(' ')[3].split('-')[1];
                let endTime;
                let timeLength;
                let timingSectionStartHour = parseInt(_this.startTime.split(':')[0]); // 工作时间起始点 小时
                let timingSectionStartMinute = parseInt(_this.startTime.split(':')[1]); // 工作时间起始点 分钟
                let timingSectionEndHour = parseInt(_this.closeTime.split(':')[0]); // 工作时间结束点 小时
                let timingSectionEndMinute = parseInt(_this.closeTime.split(':')[1]); // 工作时间结束点 分钟
                timeLength = (parseInt(timingSectionEndHour * 60) + parseInt(timingSectionEndMinute)) - (parseInt(timingSectionStartHour * 60) + parseInt(timingSectionStartMinute)); // 区间定时时长
                if (timeLength < 0) { // 设定时间跨区 开启时间为当天，关闭时间为后一天
                  timingSectionEndHour += 24; // 结束时间加24H
                  timeLength = (parseInt(timingSectionEndHour * 60) + parseInt(timingSectionEndMinute)) - (parseInt(timingSectionStartHour * 60) + parseInt(timingSectionStartMinute));
                }
                endTime = parseInt(compareSection[i].split(' ')[1]) + timeLength; // unix结束时间,单位为分钟
                if (new Date(endTime * 60 * 1000).getTime() < _this.currentTime) { // 结束时间如果已经过期，switchStatus设为0
                  timeAction = 0;
                } else {
                  timeAction = parseInt(compareSection[i].split(' ')[4]);
                }
                if ((_this.startTime <= sectionEnd && _this.closeTime >= sectionStart) ||
                  (sectionStart > sectionEnd && (_this.startTime <= sectionEnd || _this.closeTime >= sectionStart)) ||
                  (_this.startTime > _this.closeTime && (_this.startTime <= sectionEnd || _this.closeTime >= sectionStart)) ||
                  (_this.startTime > _this.closeTime && sectionStart > sectionEnd)) {
                  // 检测时间区间是否有交集 正常时间VS正常时间 || 正常时间VS跨天时间 || 跨天时间VS正常时间 || 跨天时间VS跨天时间
                  if (timeAction === '1') {
                    for (let j = 0; j < timeDay.length; j++) {
                      if ((6 - oneCurrentTime) == j && timeDay[j] == 1) {
                        _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                        return;
                      } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
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
              // 开启时检测时间是否冲突： 和定时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
              for (let i = 0; i < compareTiming.length; i++) {
                let switchStatus = compareTiming[i].split(' ')[3]; //  开关状态是否激活
                hoursData = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours();
                minuteDate = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes();
                selectedTimeHours = hoursData + ':' + minuteDate;
                timeAction = compareTiming[i].split(' ')[2];
                timeDay = day(compareTiming[i], 'time');
                if (_this.closeTime == selectedTimeHours && timeAction == 1 && switchStatus == 1) {
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
                if (_this.startTime == selectedTimeHours && timeAction == 0 && switchStatus == 1) {
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
              }
              _this.allTimerData.state.desired.all_timers[_this.socket_name].section_timer[currIndex] = timerData.join(' ');
              window.phihome.iot.publish('device/' + _this.device_id + '/TimerControl', _this.allTimerData, function () {
              });
            });
          } else {
            _this.allTimerData.state.desired.all_timers[_this.socket_name].section_timer[currIndex] = timerData.join(' ');
            window.phihome.iot.publish('device/' + _this.device_id + '/TimerControl', _this.allTimerData, function () {
            });
          }
        } else { // 点击关闭倒计时
          timerData[timerData.length - 1] = 0; // 开关状态数值设为0
          _this.allTimerData.state.desired.all_timers[_this.socket_name].section_timer[currIndex] = timerData.join(' ');
          window.phihome.iot.publish('device/' + _this.device_id + '/TimerControl', _this.allTimerData, function () {
          });
        }
      },
      _clearThisTimeout () {
        this.timer.forEach(function (item) {
          if (item) {
            clearTimeout(item);
          }
        });
      },
      _clearFixedTimeTimeout () {
        this.singleFixedTimeTimeOutArr.forEach(function (item) {
          clearTimeout(item);
        });
        this.singleFixedTimeTimeOutArr = [];
      },
      /* Add 增加区间定时最大数量校验  定义方法 author:weihaitao 2017.10.9   start */
      _checkSectionAmount () {
        if (!this.allTimerData.state.desired.all_timers[this.socket_name] || this.allTimerData.state.desired.all_timers[this.socket_name].section_timer.length < MAXAMOUNT) {
          return true;
        } else {
          window.phihome.app.toast('区间定时最多支持' + MAXAMOUNT + '个', function (response) {
          });
          return false;
        }
      },
      /* Add 增加区间定时最大数量校验  定义方法 author:weihaitao 2017.10.9   end */
      _handlePushDataReceived (event) {
        let _this = this;
        let allData = JSON.parse(event.data);
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
          let timeLength = endTime * 1000 * 60 - new Date().getTime();
          if (switchSta === 1 && timeLength > 0) {
            _this.singleFixedTimeTimeOutArr.push(setTimeout(function () {
              _this.sectionTimingStatus[timingStatusArrIndex].switchSta = 0;
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
            }, timeLength));
          }
        }

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
            if (currSocketName === switchKey) {
              _this.allTimerData.state.desired.all_timers[currSocketName] = allTimers[switchKey];
              timingArr = allTimers[switchKey].section_timer; // 获取的定时数据数组
              for (let i = 0; i < timingArr.length; i++) {
                let switchSta;
                let repeatDays = parseInt(timingArr[i].split(' ')[2], 16).toString(2); // 16进制先转十进制再转二进制
                let weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                let repeatDaysName = []; // 周几重复
                let repeatTimes = 0; // 重复次数
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
                let timingArrSplit = timingArr[i].split(' ');
                if (repeatTimes == 0) { // 单次
                  let timeLength;
                  let endTime;
                  let timingSectionStartHour = parseInt(timingArrSplit[3].split('-')[0].split(':')[0]); // 工作时间起始点 小时
                  let timingSectionStartMinute = parseInt(timingArrSplit[3].split('-')[0].split(':')[1]); // 工作时间起始点 分钟
                  let timingSectionEndHour = parseInt(timingArrSplit[3].split('-')[1].split(':')[0]); // 工作时间结束点 小时
                  let timingSectionEndMinute = parseInt(timingArrSplit[3].split('-')[1].split(':')[1]); // 工作时间结束点 分钟
                  timeLength = (parseInt(timingSectionEndHour * 60) + parseInt(timingSectionEndMinute)) - (parseInt(timingSectionStartHour * 60) + parseInt(timingSectionStartMinute)); // 区间定时时长
                  if (timeLength < 0) { // 设定时间跨区 开启时间为当天，关闭时间为后一天
                    timingSectionEndHour += 24; // 结束时间加24H
                    timeLength = (parseInt(timingSectionEndHour * 60) + parseInt(timingSectionEndMinute)) - (parseInt(timingSectionStartHour * 60) + parseInt(timingSectionStartMinute));
                  }
                  endTime = parseInt(timingArrSplit[1]) + timeLength; // unix结束时间,单位为分钟
                  if (new Date(endTime * 60 * 1000).getTime() < new Date().getTime()) { // 如果已经过期就关闭
                    switchSta = 0;
                  } else {
                    switchSta = parseInt(timingArrSplit[4]);
                  }
                  repeatDaysName = ['单次'];
                  _setFixedTimeTimeOut(i, switchSta, endTime);
                } else {
                  switchSta = parseInt(timingArrSplit[4]);
                }
                timingData.push({
                  'time': timingArr[i].split(' ')[3],
                  'repeat': repeatDaysName.join('、'),
                  'itemName': decodeURI(timingArr[i].split(' ')[0]),
                  'switchSta': switchSta
                });
              }
              // 获取所有开关状态
              _this.sectionTimingStatus = timingData;
              if (_this.sectionTimingStatus.length != 0) { // 有定时任务，正常显示
                _this._clearThisTimeout();
                if (document.getElementsByClassName('section')[0]) {
                  document.getElementsByClassName('section')[0].style.background = '#f5f5f5';
                  document.getElementsByClassName('err_img')[0].style.display = 'none';
                }
              } else {
                _this.showTaskTimeout = setTimeout(function () {
                  document.getElementsByClassName('section')[0].style.background = '#fff';
                  document.getElementsByClassName('err_img')[0].style.display = 'block';
                }, 200);
                _this.timer.push(_this.showTaskTimeout);
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
    },
    created: function () {
      let _this = this;
      _this._onStatisEvent({eventName: ON_PAGE_BEGIN, pageTitle: PAGE_SECTION_TIMING});
      // 获取服务器当前时间
      window.phihome.util.netRequest('get', _this.hostname + '/v1/server/timestamp', '', '', function (response) {
        response = JSON.parse(response);
        response = JSON.parse(response.netResponse);
        _this.currentTime = response.result.timestamp;
      });
    },
    mounted: function () {
      let _this = this;
      document.addEventListener('nativeBack', _this.goback); // 监听物理返回按键 weihaitao
      document.addEventListener('pushDataReceived', _this._handlePushDataReceived);
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
      if (to.path === '/addSectionTiming' && !this._checkSectionAmount()) {
        next(false);
        return;
      }
      next();
    },
    beforeDestroy () {
      this._onStatisEvent({eventName: ON_PAGE_END, pageTitle: PAGE_SECTION_TIMING});
      this._clearFixedTimeTimeout();
      document.removeEventListener('nativeBack', this.goback); // 监听物理返回按键 weihaitao
      document.removeEventListener('pushDataReceived', this._handlePushDataReceived);
    }
  };
</script>
<style scoped lang="less">
  @r: 75rem;
  .section {
    overflow-y: auto;
    padding-top: 1.566rem;
    min-height: 100vh;
  }

  .page-content {
    background: #f5f5f5;
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
      height: 240/@r;
      text-align: left;
      vertical-align: middle;
      a { //跳转编辑定时路由
        width: 100%;
        display: inline-block;
        text-decoration: none
      }
      .item_name {
        font-size: 48/@r;
        margin-top: 34/@r;
        display: inline-block;
        width: 75%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .time_tips {
        font-size: 46/@r;
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
        font-size: 29/@r;
        margin-bottom: 40/@r;
        margin-top: 25/@r;
        .work_time {
          margin-bottom: 10/@r;
        }
      }
    }
    .timelist_disabled {
      color: #bfbfbf;
    }
  }
</style>
