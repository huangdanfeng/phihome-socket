<template>
  <div id="addCountDown">
    <div class="header ofh">
      <div class="left" @click="goback">
        <img src="../../assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">倒计时</div>
      <div class="save">
        <div class="set_icon">
          <!--<router-link to="countdown" >-->
          <span @click="save">保存</span>
          <!--</router-link>-->
        </div>
      </div>
    </div>
    <div class="addCountDown">
      <div class="section">
        <span class="time_fixed"></span>
        <picker :data='timeList' v-model='defaultTime' @on-change='change'></picker>
        <span class="time_fixedhide"></span>
        <span class="hourLabel">小时</span>
        <span class="minuteLabel">分钟</span>
        <div class="new-scroller-indicator"></div>
      </div>
      <div>
        <div class="action">
          <span>动作</span>
          <div style="position:absolute;right:140px;top:50px;">
            <div class="switch" onclick="">
              <phiSwitch v-on:listenToSwitch="switchState"></phiSwitch>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!--设备被解绑toast-->
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
  </div>
</template>
<script>
  import {ON_EVENT, COUNT_DOWN_ADD_SUCCESS, COUNT_DOWN_ADD_FAIL} from '@/assets/js/uman-events.js';
  import {handlePushDataReceiveData, HOURSTIMES, MINUTESTIMES, timeList, getDateValue, checkDeviceBindStatus} from '@/assets/js/common/formateData.js';
  import {Picker} from 'vux';
  const DEFAULHOURSINDEX = parseInt(HOURSTIMES / 2);
  const DEFAULMINUTESINDEX = parseInt(MINUTESTIMES / 2);
  export default {
    components: {
      Picker
    },
    data () {
      return {
        saveTimeTimeOutArray: [], // 每次点击产生一个计时器Id
        timeList: timeList, // 时间初始化
        defaultTime: ['00' + DEFAULHOURSINDEX, '01' + DEFAULMINUTESINDEX], // 默认时间
        selectTime: ['00', '01'], // 已选择的时间
        device_id: window.sessionStorage.getItem('device_id'),
        device_name: '',
        toast_show: false,
        socket_name: window.sessionStorage.getItem('socket_header_title').slice(2, 4).toLowerCase(),
        switchAction: 1, // 开关状态
        selectData: '',
        firstSave: true,
        countDownData: JSON.parse(window.sessionStorage.getItem('allData'))
      };
    },
    mounted () {
      let _this = this;
      document.addEventListener('nativeBack', this.goback); // 监听物理返回按键 weihaitao
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
        if (this.defaultTime[0].substring(0, 2) === '00' && this.defaultTime[1].substring(0, 2) === '00') {
          this.defaultTime = ['00' + DEFAULHOURSINDEX, '01' + DEFAULMINUTESINDEX];
          this.selectTime = getDateValue(['00' + DEFAULHOURSINDEX, '01' + DEFAULMINUTESINDEX]);
        }
      },
      save () {
        let _this = this;
        window.phihome.util.netRequest('get', _this.hostname + '/v1/server/timestamp', '', '', function (response) {
          response = JSON.parse(response).netResponse;
          response = JSON.parse(response).result;
          response = response.timestamp;
          // 获取服务器当前时间
          let currentTime = response;
          let totalMinutes = parseInt(_this.selectTime[0]) * 60 + parseInt(_this.selectTime[1]); // 定时生效时间
          let countDownTime = parseInt((currentTime + (totalMinutes * 60 * 1000)));
          let selectedTimeHours = '';
          let selectedStartTimeHours = '';
          let selectedEndTimeHours = '';
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

          // 时间不能一样,跟区间定时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
          if (!_this.countDownData) {
            return;
          }
          let compareSection = _this.countDownData.state.reported.all_timers[_this.socket_name].section_timer;
          let compareTiming = _this.countDownData.state.reported.all_timers[_this.socket_name].timer;
          let compareCountDown = _this.countDownData.state.reported.all_timers[_this.socket_name].countdown;
          let oneTime = '';
          let oneCurrentTime = new Date(countDownTime).getDay();
          let hoursData = '';
          let minuteDate = '';
          for (let i = 0; i < compareSection.length; i++) {
            selectedStartTimeHours = compareSection[i].split(' ')[3].split('-')[0];
            selectedEndTimeHours = compareSection[i].split(' ')[3].split('-')[1];
            timeDay = day(compareSection[i], 'section');
            hoursData = new Date(countDownTime).getHours() < 10 ? ('0' + new Date(countDownTime).getHours()) : new Date(countDownTime).getHours();
            minuteDate = new Date(countDownTime).getMinutes() < 10 ? ('0' + new Date(countDownTime).getMinutes()) : new Date(countDownTime).getMinutes();
            if ((hoursData + ':' + minuteDate) == selectedEndTimeHours && _this.switchAction == 1) {
              for (let j = 0; j < timeDay.length; j++) {
                if (timeDay[j] == 1 && j == new Date(countDownTime).getDay()) {
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
            if ((hoursData + ':' + minuteDate) == selectedStartTimeHours && _this.switchAction == 0) {
              for (let j = 0; j < timeDay.length; j++) {
                if (timeDay[j] == 1 && j == new Date(countDownTime).getDay()) {
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
          // 跟定时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
          for (let i = 0; i < compareTiming.length; i++) {
            hoursData = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours();
            minuteDate = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes();
            selectedTimeHours = hoursData + ':' + minuteDate;
            timeAction = compareTiming[i].split(' ')[2];
            timeDay = day(compareTiming[i], 'time');
            let currentHour = new Date(countDownTime).getHours() < 10 ? ('0' + new Date(countDownTime).getHours()) : new Date(countDownTime).getHours();
            let currentMinute = new Date(countDownTime).getMinutes() < 10 ? ('0' + new Date(countDownTime).getMinutes()) : new Date(countDownTime).getMinutes();
            if ((currentHour + ':' + currentMinute) == selectedTimeHours && timeAction == 0) {
              for (let j = 0; j < timeDay.length; j++) {
                if (timeDay[j] == 1 && j == new Date(countDownTime).getDay()) {
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
            if ((currentHour + ':' + currentMinute) == selectedTimeHours && timeAction == 1) {
              for (let j = 0; j < timeDay.length; j++) {
                if (timeDay[j] == 1 && j == new Date(countDownTime).getDay()) {
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
          // 跟倒计时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
          for (let i = 0; i < compareCountDown.length; i++) {
            hoursData = new Date(compareCountDown[i].split(' ')[0] * 1000).getHours() < 10 ? ('0' + new Date(compareCountDown[i].split(' ')[0] * 1000).getHours()) : new Date(compareCountDown[i].split(' ')[0] * 1000).getHours();
            minuteDate = new Date(compareCountDown[i].split(' ')[0] * 1000).getMinutes() < 10 ? ('0' + new Date(compareCountDown[i].split(' ')[0] * 1000).getMinutes()) : new Date(compareCountDown[i].split(' ')[0] * 1000).getMinutes();
            selectedTimeHours = hoursData + ':' + minuteDate;
            timeAction = compareCountDown[i].split(' ')[2];
            let count = countDownTime + parseInt(_this.defaultTime[0]) * 60 * 60 * 1000 + parseInt(_this.defaultTime[1]) * 60 * 1000;
            let currentHour = new Date(count).getHours() < 10 ? ('0' + new Date(count).getHours()) : new Date(count).getHours();
            let currentMinute = new Date(count).getMinutes() < 10 ? ('0' + new Date(count).getMinutes()) : new Date(count).getMinutes();

            // timeDay = day(compareCountDown[i],"time");
            if ((currentHour + ':' + currentMinute) == selectedTimeHours && _this.switchAction == 1 && timeAction == 0) {
              if (new Date(count).getDay() == new Date(compareCountDown[i].split(' ')[0] * 1000).getDay()) {
                _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                return;
              }
            }
            if ((currentHour + ':' + currentMinute) == selectedTimeHours && _this.switchAction == 0 && timeAction == 1) {
              if (new Date(count).getDay() == new Date(compareCountDown[i].split(' ')[0] * 1000).getDay() && compareCountDown[i].split(' ')[3] == 1) {
                _this._countUmanAddTimeFailed('定时任务已存在,请重新设置');
                return;
              }
            }
          }

          let str = parseInt(countDownTime / 1000) + ' ' + totalMinutes + ' ' + _this.switchAction + ' ' + '1';

          if (_this.firstSave) { // 第一次保存直接push到数组，第二次保存需删除上一次push的数据再写入，避免多次保存失败，产生重复数据
            _this.countDownData.state.reported.all_timers[_this.socket_name].countdown.push(str);
            _this.firstSave = false;
          } else {
            _this.countDownData.state.reported.all_timers[_this.socket_name].countdown.splice(-1, 1, str);
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
          pushCountData.state.desired.all_timers[_this.socket_name] = _this.countDownData.state.reported.all_timers[_this.socket_name];
          pushCountData = JSON.stringify(pushCountData);
          let This = _this;
          window.phihome.iot.publish('device/' + This.device_id + '/TimerControl', pushCountData, function () {
          });
           /* Add 友盟统计倒计时添加失败 author:weihaitao 2018/2/28  start */
          _this.saveTimeTimeOutArray.push(setTimeout(() => {
            _this._onStatisEvent({eventName: ON_EVENT, eventID: COUNT_DOWN_ADD_FAIL});  // 友盟埋点统计
            if (_this.saveTimeTimeOutArray.length) {
              _this.saveTimeTimeOutArray.shift();
            }
          }, 11000));
          /* Add 友盟统计倒计时添加失败 author:weihaitao  2018/2/28 end */
          document.addEventListener('pushDataReceived', _this._handlePushDataReceivedResponse);
        });
      },
      switchState: function (data) { // 获取switch开关状态
        this.switchAction = data;
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
        this._onStatisEvent({eventName: ON_EVENT, eventID: COUNT_DOWN_ADD_FAIL});  // 友盟埋点统计
      },
      _handlePushDataReceivedResponse (event) {
        /* Add 友盟统计倒计时添加失败 author:weihaitao  2018/2/28 start */
        if (this.saveTimeTimeOutArray.length) {
          clearTimeout(this.saveTimeTimeOutArray[0]);
          this.saveTimeTimeOutArray.shift();
        }
        /* Add 友盟统计倒计时添加失败 author:weihaitao  2018/2/28 end */
        if (location.hash.split('?')[0] !== '#/addCountDown' || JSON.parse(event.data).topic.indexOf('TimerControl') === -1) {
          return;
        }
        if (this.locationHash !== '/countdown') {
          // 判断是否保存成功并且赋值保存到本地     彭玉婷
          let allData = JSON.parse(event.data);
          if (allData.topic.indexOf('TimerControl') !== -1) {
            let newAllData = handlePushDataReceiveData(allData.pushData, window.sessionStorage.getItem('allData'));
            window.sessionStorage.setItem('allData', newAllData);
            this._onStatisEvent({eventName: ON_EVENT, eventID: COUNT_DOWN_ADD_SUCCESS});  // 友盟埋点统计
            this.$router.goBack();
            this.locationHash = '/countdown';
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
  /*倒计时样式*/
  #addCountDown .header .save .set_icon {
    position: absolute;
    right: .3rem;
    top: 0;
    height: 1.3rem;
    vertical-align: middle;
    color: #ff9b1a;
    font-weight: 400;
    span {
      color: #ff9b1a;
      font-weight: normal;
    }
  }
  .addCountDown {
    min-height: 100%;
    background: #f5f5f5;
    .section {
      top: 1.6rem;
      height: 375px;
      background: #fff;
      position: relative;
      .time_fixed {
        position: absolute;
        left: 0;
        top: 0;
        height: 75px;
        z-index: 10;
        width: 90%;
        text-align: left;
        background-color: #fff;
      }
      .hourLabel {
        font-size: 30/@r;
        height: 55/@r;
        position: absolute;
        right: 49%;
        bottom: 41.5%;
      }
      .minuteLabel {
        font-size: 30/@r;
        height: 55/@r;
        position: absolute;
        right: 24%;
        bottom: 41.5%;
      }
      .vux-flexbox {
        width: 100%;
      }
      .time_fixedhide {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 75px;
        z-index: 10;
        width: 100%;
        background-color: #fff;
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

    .action {
      height: 104px;
      background: #fff;
      position: relative;
      margin-top: 1.85rem;
      span {
        float: left;
        dispaly: block;
        margin-top: 32px;
        margin-left: 20px;
        font-size: 30px;
        color: #313131;
      }
    }
  }
</style>
