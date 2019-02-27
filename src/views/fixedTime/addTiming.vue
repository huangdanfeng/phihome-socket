<template>
  <div id="addTiming">
    <div class="header ofh">
      <div class="left" @click="goback">
        <img src="~@/assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">添加定时</div>
      <div class="save">
        <div class="set_icon">
          <span class="save_btn" @click="save">保存</span>
        </div>
      </div>
    </div>
    <div class="page_content addTiming">
      <div class="addPicker">
        <span class="time_fixed">时间</span>
        <picker :data='timeList' v-model='defaultTime' @on-change='change'></picker>
        <span class="time_fixedhide"></span>
      </div>
      <div class="action">
        <span class="action_left">动作</span>
        <div class="switch_sec fr">
          <div class="switch-wrap">
            <div class="switch" onclick=''>
              <phiSwitch v-on:listenToSwitch="switchState"></phiSwitch>
            </div>
          </div>
        </div>
      </div>
      <div class="repeat">
        <span>重复: <span class="repeat_times" v-html="repeatTimes"></span></span>
        <ul>
          <li><span @click="repeatActive" :week="0">日</span></li>
          <li><span @click="repeatActive" :week="1">一</span></li>
          <li><span @click="repeatActive" :week="2">二</span></li>
          <li><span @click="repeatActive" :week="3">三</span></li>
          <li><span @click="repeatActive" :week="4">四</span></li>
          <li><span @click="repeatActive" :week="5">五</span></li>
          <li><span @click="repeatActive" :week="6">六</span></li>
        </ul>
      </div>

    </div>
    <!--设备被解绑toast-->
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
  </div>
</template>
<script>
  import {ON_EVENT, TIME_ADD_SUCESS, TIME_ADD_FAIL} from '@/assets/js/uman-events.js';
  import {handlePushDataReceiveData, HOURSTIMES, MINUTESTIMES, timeList, getDateValue, checkDeviceBindStatus} from '@/assets/js/common/formateData.js';
  import {Picker, PopupPicker, Group} from 'vux';
  const DEFAULHOURSINDEX = parseInt(HOURSTIMES / 2);
  const DEFAULMINUTESINDEX = parseInt(MINUTESTIMES / 2);
  const DEFAULTTIME = ['00' + DEFAULHOURSINDEX, '00' + DEFAULMINUTESINDEX];

  export default {
    components: {
      PopupPicker,
      Group,
      Picker
    },
    data () {
      return {
        timeList: timeList, // 时间初始化
        saveTimeTimeOutArray: [], // 每次点击产生一个计时器Id
        defaultTime: DEFAULTTIME, // 默认时间
        selectTime: ['00', '00'], // 已选择的时间
        currentTime: '',
        device_id: window.sessionStorage.getItem('device_id'),
        device_name: '',
        toast_show: false,
        socket_name: window.sessionStorage.getItem('socket_header_title').slice(2, 4).toLowerCase(),
        selectedAction: 1, // 开关状态
        isOpen: false,
        show1: false,
        repeatTimes: '单次',
        repeatWeek: [],
        formatDemoValue: ['01', '12'],
        format: function (value, name) {
          return `${value[0]}:${value[1]}`;
        },
        firstSave: true,
        addTimeData: JSON.parse(window.sessionStorage.getItem('allData'))
      };
    },
    mounted () {
      let _this = this;
      document.addEventListener('nativeBack', _this.goback); // 监听物理返回按键 weihaitao
      window.phihome.util.netRequest('get', this.hostname + '/v1/server/timestamp', '', '', function (response) {
        response = JSON.parse(response).netResponse;
        response = JSON.parse(response).result;
        response = response.timestamp;
        // 获取服务器当前时间
        _this.currentTime = response;
        let hour = new Date(_this.currentTime).getHours() < 10 ? ('0' + new Date(_this.currentTime).getHours()) : (new Date(_this.currentTime).getHours() + '');
        let minute = new Date(_this.currentTime).getMinutes() < 10 ? ('0' + new Date(_this.currentTime).getMinutes()) : (new Date(_this.currentTime).getMinutes() + '');
        _this.defaultTime = [hour + DEFAULHOURSINDEX, minute + DEFAULMINUTESINDEX];
        _this.selectTime = getDateValue(_this.defaultTime);
      });
      // 检测设备是否解绑
      checkDeviceBindStatus(_this);
    },
    beforeDestroy () {
      document.removeEventListener('nativeBack', this.goback);
      document.removeEventListener('pushDataReceived', this._handlePushDataReceivedResponse);
    },
    methods: {
      goback () {
        this.$router.goBack(true);
      },
      change (value) {
        this.selectTime = getDateValue(value);
      },
      repeatActive (event) {
        let target = event.currentTarget;
        let _this = this;
        let selectedDays;
        let selectedDaysLength;
        if (target.className == '') {
          target.className = 'active';
        } else {
          target.className = '';
        }
        selectedDays = document.querySelectorAll('.repeat .active');
        selectedDaysLength = selectedDays.length;
        if (selectedDaysLength == 0) {
          _this.repeatTimes = '单次';
          _this.repeatWeek = [];
        } else if (selectedDaysLength == 7) {
          _this.repeatTimes = '每天';
          _this.repeatWeek = ['0', '1', '2', '3', '4', '5', '6'];
        } else {
          _this.repeatTimes = '';
          _this.repeatWeek = [];
          for (let i = 0; i < selectedDaysLength; i++) {
            _this.repeatTimes += '周' + selectedDays[i].innerHTML + '、';
            _this.repeatWeek.push(selectedDays[i].getAttribute('week'));
          }
          _this.repeatTimes = _this.repeatTimes.substring(0, _this.repeatTimes.length - 1);
        }
      },
      save () {
        let _this = this;
        window.phihome.util.netRequest('get', this.hostname + '/v1/server/timestamp', '', '', function (response) {
          response = JSON.parse(response).netResponse;
          response = JSON.parse(response).result;
          response = response.timestamp;
          // 获取服务器当前时间
          let saveTime = response;
          let responseTime = saveTime;
          saveTime = new Date(saveTime).setHours(parseInt(_this.selectTime[0].substring(0, 2)));
          saveTime = new Date(saveTime).setMinutes(parseInt(_this.selectTime[1].substring(0, 2)));
          saveTime = new Date(saveTime).setSeconds(0);
          let weekDate = [0, 0, 0, 0, 0, 0, 0];
          for (let i = 0; i < _this.repeatWeek.length; i++) {
            weekDate[parseInt(_this.repeatWeek[i])] = 1;
          }
          weekDate = '' + weekDate.reverse().join('');
          if (saveTime < responseTime && weekDate.indexOf('1') == -1) {
            saveTime = saveTime + 24 * 60 * 60 * 1000;
          }
          let selectedTimeHours = '';
          let selectedStartTimeHours = '';
          let selectedEndTimeHours = '';
          let timeAction = '';
          let timeDay = [];
          let hoursData = '';
          let minuteDate = '';

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
          let compareCountDown = _this.addTimeData.state.reported.all_timers[_this.socket_name].countdown;
          let oneTime = '';
          let oneCurrentTime = new Date(saveTime).getDay();
          for (let i = 0; i < compareSection.length; i++) {
            selectedStartTimeHours = compareSection[i].split(' ')[3].split('-')[0];
            selectedEndTimeHours = compareSection[i].split(' ')[3].split('-')[1];
            timeDay = day(compareSection[i], 'section');
            if (_this.repeatTimes == '单次') {
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedEndTimeHours && _this.selectedAction == 1) {
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
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedStartTimeHours && _this.selectedAction == 0) {
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
            } else {
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedEndTimeHours && _this.selectedAction == 1) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (weekDate.split('')[j] == 1 && weekDate.split('')[j] == timeDay[j]) {
                    _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    // 多天和已有的单次相比
                    oneTime = new Date(compareSection[i].split(' ')[1] * 60 * 1000).getDay();
                    if ((6 - oneTime) == j && weekDate.split('')[j] == 1) {
                      _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                      return;
                    }
                  }
                }
              }
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedStartTimeHours && _this.selectedAction == 0) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (weekDate.split('')[j] == 1 && weekDate.split('')[j] == timeDay[j]) {
                    _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    // 多天和已有的单次相比
                    oneTime = new Date(compareSection[i].split(' ')[1] * 60 * 1000).getDay();
                    if ((6 - oneTime) == j && weekDate.split('')[j] == 1) {
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
            hoursData = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours();
            minuteDate = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes();
            selectedTimeHours = hoursData + ':' + minuteDate;
            timeAction = compareTiming[i].split(' ')[2];
            timeDay = day(compareTiming[i], 'time');
            if (_this.repeatTimes == '单次') {
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && timeAction == 0) {
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
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && timeAction == 1) {
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
            } else {
              // 选的是多天，不是单次
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && timeAction == 0) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (weekDate.split('')[j] == 1 && timeDay[j] == weekDate.split('')[j]) {
                    _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    oneTime = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getDay();
                    if ((6 - oneTime) == j && weekDate.split('')[j] == 1) {
                      _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                      return;
                    }
                  }
                }
              }
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && timeAction == 1) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (weekDate.split('')[j] == 1 && timeDay[j] == weekDate.split('')[j]) {
                    _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    oneTime = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getDay();
                    if ((6 - oneTime) == j && weekDate.split('')[j] == 1) {
                      _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                      return;
                    }
                  }
                }
              }
            }
          }
          // 跟倒计时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
          for (let i = 0; i < compareCountDown.length; i++) {
            hoursData = new Date(compareCountDown[i].split(' ')[0] * 1000).getHours() < 10 ? ('0' + new Date(compareCountDown[i].split(' ')[0] * 1000).getHours()) : new Date(compareCountDown[i].split(' ')[0] * 1000).getHours();
            minuteDate = new Date(compareCountDown[i].split(' ')[0] * 1000).getMinutes() < 10 ? ('0' + new Date(compareCountDown[i].split(' ')[0] * 1000).getMinutes()) : new Date(compareCountDown[i].split(' ')[0] * 1000).getMinutes();

            selectedTimeHours = hoursData + ':' + minuteDate;
            timeAction = compareCountDown[i].split(' ')[2];
            if (_this.repeatTimes == '单次') {
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && _this.selectedAction == 1 && timeAction == 0 && compareCountDown[i].split(' ')[3] == 1) {
                if (oneCurrentTime == new Date(compareCountDown[i].split(' ')[0] * 1000).getDay()) {
                  _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                  return;
                }
              }
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && _this.selectedAction == 0 && timeAction == 1 && compareCountDown[i].split(' ')[3] == 1) {
                if (oneCurrentTime == new Date(compareCountDown[i].split(' ')[0] * 1000).getDay()) {
                  _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                  return;
                }
              }
            } else {
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && _this.selectedAction == 1 && timeAction == 0 && compareCountDown[i].split(' ')[3] == 1) {
                for (let j = 0; j < weekDate.split('').length; j++) {
                  if (weekDate.split('')[j] == 1 && j == (6 - new Date(compareCountDown[i].split(' ')[0] * 1000).getDay())) {
                    _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                    return;
                  }
                }
              }
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && _this.selectedAction == 0 && timeAction == 1 && compareCountDown[i].split(' ')[3] == 1) {
                for (let j = 0; j < weekDate.split('').length; j++) {
                  if (weekDate.split('')[j] == 1 && j == (6 - new Date(compareCountDown[i].split(' ')[0] * 1000).getDay())) {
                    _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                    return;
                  }
                }
              }
            }
          }

          weekDate = parseInt(weekDate, 2).toString(16);
          let saveStr = parseInt(saveTime / 60000) + ' ' + weekDate + ' ' + _this.selectedAction + ' ' + '1';
          if (_this.firstSave) { // 第一次保存直接push到数组，第二次保存需删除上一次push的数据再写入，避免多次保存失败，产生重复数据
            _this.addTimeData.state.reported.all_timers[_this.socket_name].timer.push(saveStr);
            _this.firstSave = false;
          } else {
            _this.addTimeData.state.reported.all_timers[_this.socket_name].timer.splice(-1, 1, saveStr);
          }
          let pushCountData = {
            'state': {
              'desired': {
                'all_timers': {
                  [_this.socket_name]: {
                    'section_timer': [],
                    'timer': [],
                    'countdown': []
                  }
                }
              }
            }
          };
          pushCountData.state.desired.all_timers[_this.socket_name] = _this.addTimeData.state.reported.all_timers[_this.socket_name];
          pushCountData = JSON.stringify(pushCountData);
          let This = _this;
          window.phihome.iot.publish('device/' + This.device_id + '/TimerControl', pushCountData, function () {
          });
          /* Add 友盟统计定时添加失败 author:weihaitao  2018/2/28 start */
          _this.saveTimeTimeOutArray.push(setTimeout(() => {
            _this._onStatisEvent({eventName: ON_EVENT, eventID: TIME_ADD_FAIL});  // 友盟埋点统计
            if (_this.saveTimeTimeOutArray.length) {
              _this.saveTimeTimeOutArray.shift();
            }
          }, 11000));
          /* Add 友盟统计定时添加失败 author:weihaitao  2018/2/28 end */
          document.addEventListener('pushDataReceived', This._handlePushDataReceivedResponse);
        });
      },
      switchState: function (data) { // 获取switch开关状态
        this.selectedAction = data;
      },
      formatDate (now) { // 输出为2017-08-05 14：00的格式，主要为调试用
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        let date = now.getDate();
        let hour = now.getHours();
        let minute = now.getMinutes();
        let second = now.getSeconds();
        return year + '-' + month + '-' + date + '   ' + hour + ':' + minute + ':' + second;
      },
      _countUmanAddTimeFailed (toastMessage) {
        if (toastMessage) {
          window.phihome.app.toast(toastMessage, function (response) {
          });
        }
        this._onStatisEvent({eventName: ON_EVENT, eventID: TIME_ADD_FAIL});  // 友盟埋点统计
      },
      _handlePushDataReceivedResponse (event) {
         /* Add 友盟统计定时添加失败 author:weihaitao 2018/2/28 start */
        if (this.saveTimeTimeOutArray.length) {
          clearTimeout(this.saveTimeTimeOutArray[0]);
          this.saveTimeTimeOutArray.shift();
        }
        /* Add 友盟统计定时添加失败 author:weihaitao  2018/2/28 end */
        if (location.hash.split('?')[0] !== '#/addTiming' || JSON.parse(event.data).topic.indexOf('TimerControl') === -1) {
          return;
        }
        if (this.locationHash !== '/fixedTime') {
          let allData = JSON.parse(event.data);
          if (allData.topic.indexOf('TimerControl') !== -1) {
            let newAllData = handlePushDataReceiveData(allData.pushData, window.sessionStorage.getItem('allData'));
            window.sessionStorage.setItem('allData', newAllData);
            this._onStatisEvent({eventName: ON_EVENT, eventID: TIME_ADD_SUCESS});  // 友盟埋点统计
            this.$router.goBack();
            this.locationHash = '/fixedTime';
          }
        }
      }
    }
  };
</script>
<style lang="less">
  @r: 75rem;
  .header {
    z-index: 9999;
  }

  #addTiming .header .save .set_icon {
    position: absolute;
    right: .3rem;
    top: 0;
    height: 1.3rem;
    vertical-align: middle;
    color: #ff9b1a;
    font-weight: 400;
  }

  .set_icon .save_btn {
    color: #ffa42f;
    font-weight: normal;
  }

  .page_content {
    min-height: 100%;
    background: #f5f5f5;
  }

  .page_content ul {
    text-align: left;
    margin-top: 20/@r;

  }

  .page_content ul li {
    height: 104/@r;
    line-height: 104/@r;
    background: #fff;
    padding-left: 20/@r;

  }

  .page_content {
    font-size: 31/@r;
    .addPicker {
      top:1.6rem;
      height: 415px;
      background: #fff;
      position: relative;
      .time_fixed {
        position: absolute;
        left: 0;
        top: 20/@r;
        height: 75px;
        z-index: 10;
        width: 90%;
        padding-left: 20/@r;
        text-align: left;
        background-color: #fff;
      }
      .vux-flexbox {
        width: 100%;
      }
      .time_fixedhide {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 70px;
        z-index: 10;
        width: 100%;
        background-color: #fff;
      }
      .vux-picker {
        padding-top: 31/@r;
      }
      .scroller-mask {
        background-size: 100% 148px;
        right: 0;
        left: auto;
      }
      .scroller-item {
        height: 74px;
        line-height: 74px;
        font-size: 38px;
        transition: font-size 0.2s;
        -webkit-transition: font-size 0.2s;
      }
      .scroller-item-selected {
        color: #333;
        font-size: 44px;
        transition: font-size 0.2s;
        -webkit-transition: font-size 0.2s;
      }
      .scroller-indicator {
        height: 74px;
        top: 147px;
      }
      .scroller-component {
        height: 368px;
      }
      .scroller-content {
        width: 50%;
        right: 0;
        left: auto;
      }
      .vux-flexbox .vux-flexbox-item:last-child .scroller-content, .vux-flexbox .vux-flexbox-item:last-child .scroller-mask {
        left: 0;
        rigth: auto;
      }
    }

    //开关
    .action {
      height: 104/@r;
      background: #fff;
      position: relative;
      margin-top: 1.85rem;
      padding: 0 20/@r;
      z-index: 10;
      .action_left {
        float: left;
        dispaly: block;
        margin-top: 32/@r;
        margin-left: 0;
        font-size: 30/@r;
        color: #313131;
      }
      .switch_sec {
        position: absolute;
        right: 20/@r;
        top: 2/@r;
      }
    }
    //重复次数
    .repeat > span {
      display: block;
    }
    .repeat {
      margin-top: 20/@r;
      height: 208/@r;
      background: #fff;
      overflow: hidden;
      font-size: 30/@r;
      color: #313131;
      ul li {
        float: left;
        width: 14.285714%;
        box-sizing: border-box;
        text-align: center;
        padding-left: 0;
        span {
          color: #494949;
          border: 1px solid #494949;
          background: #fff;
          text-align: center;
          border-radius: 50%;
          display: inline-block;
          width: 80/@r;
          height: 80/@r;
          line-height: 80/@r;
          padding: 0;
        }
        span.active {
          color: #fff;
          background: #ffa42f;
          border: none;
        }
      }
      span {
        text-align: left;
        padding-top: 20/@r;
        padding-left: 20/@r;
      }

    }
  }

  input::-webkit-input-placeholder {
    text-align: right;
    color: #eee
  }

</style>
<style lang="less">
  @r: 75rem;
  .addTiming {
    .repeat .repeat_times {
      display: inline-block;
      font-size: 29/@r;
      padding-top: 0 !important;
      padding-left: 0 !important;
      .day {
        padding-left: 19/@r;
        padding-top: 0;
        display: inline-block;
      }
    }
    .repeat_times > span:first-child {
      padding-left: 0 !important;
    }
  }

</style>
