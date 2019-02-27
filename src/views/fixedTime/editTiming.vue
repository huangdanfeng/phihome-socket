<template>
  <div id="editTiming">
    <div class="header ofh">
      <div class="left" @click="goback">
        <img src="~@/assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">编辑定时</div>
      <div class="save">
        <div class="set_icon">
          <!--<router-link to="fixedTime" >-->
          <span class="save_btn" @click="save">保存</span>
          <!--</router-link>-->
        </div>
      </div>
    </div>
    <div class="page-content editTiming">
      <div class="editPicker">
        <span class="time_fixed">时间</span>
        <picker :data='timeList' v-model='defaultTime' @on-change='change' ref="picker"></picker>
        <span class="time_fixedhide"></span>
      </div>
      <div class="action">
        <span class="action_left">动作</span>
        <div class="switch_sec fr">
          <div class="switch-wrap">
            <div class="switch">
              <phiSwitch v-on:listenToSwitch="switchState" :switchResult="selectedAction"></phiSwitch>
            </div>
          </div>
        </div>
      </div>
      <div class="repeat">
        <span>重复：<span class="repeat_times" v-html="repeatTimes"></span></span>
        <ul>
          <li><span @click="repeatActive">日</span></li>
          <li><span @click="repeatActive">一</span></li>
          <li><span @click="repeatActive">二</span></li>
          <li><span @click="repeatActive">三</span></li>
          <li><span @click="repeatActive">四</span></li>
          <li><span @click="repeatActive">五</span></li>
          <li><span @click="repeatActive">六</span></li>
        </ul>
      </div>
      <div class="delete_device">
        <a class="delete_btn" @click="deleteTiming">
          <img src="~@/assets/img/settings/delete_btn.png" alt="">
        </a>
      </div>
    </div>
    <!--删除confirm-->
    <div class="confirm_toast_wrap" v-show="deleteState" style="display: block">
      <div class="confirm_toast">
        <div class="confirm_content">
          删除后将清除所有定时任务及绑定信息，确定要删除吗？
        </div>
        <div class="confirm_footer">
          <a class="cancel" @click="cancelDelete">取消</a>
          <a class="sure" @click="sureDelete">确定</a>
        </div>
      </div>
    </div>
    <!--设备被解绑toast-->
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
  </div>
</template>
<script>
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
        timeList: timeList,
        defaultTime: DEFAULTTIME,
        isOpen: false,
        show1: false,
        repeatTimes: '单次',
        formatDemoValue: ['01', '12'],
        format: function (value, name) {
          return `${value[0]}:${value[1]}`;
        },
        selectTime: ['00', '00'], // 已选择的时间
        device_id: window.sessionStorage.getItem('device_id'),
        device_name: '',
        toast_show: false,
        socket_name: window.sessionStorage.getItem('socket_header_title').slice(2, 4).toLowerCase(),
        selectIndex: window.sessionStorage.getItem('selectIndex'),
        selectedData: '',
        selectedAction: 1,
        deleteState: false,
        editTimeData: JSON.parse(window.sessionStorage.getItem('allData')),
        routePath: this.$route.path,
        back: 1
      };
    },
    created () {
      this.editTimeData = JSON.parse(window.sessionStorage.getItem('allData'));
    },
    mounted: function () {
      let _this = this;
      document.addEventListener('nativeBack', this.goback); // 监听物理返回按键 weihaitao
      // 检测设备是否解绑
      checkDeviceBindStatus(_this);
      // 当前插口
      this.selectedData = this.editTimeData.state.reported.all_timers[this.socket_name].timer[this.selectIndex];
      //          上一页选择的时间
      let selectedTimeStamp = this.selectedData.split(' ')[0] * 60 * 1000;
      let selectedHours = new Date(selectedTimeStamp).getHours();
      let selectedMinutes = new Date(selectedTimeStamp).getMinutes();
      this.defaultTime = [this.addZero(selectedHours).toString() + DEFAULHOURSINDEX, this.addZero(selectedMinutes).toString() + DEFAULMINUTESINDEX];
      this.selectTime = getDateValue(this.defaultTime);
      this.selectedAction = parseInt(this.selectedData.split(' ')[2]);
      let type = parseInt(this.selectedData.split(' ')[1], 16).toString(2);
      let typeData = ['六', '五', '四', '三', '二', '一', '日'].reverse();
      let typeLength = 7 - type.length;
      let typeStr = '';
      for (let i = 0; i < typeLength; i++) {
        typeStr += '0';
      }
      let Str = (typeStr + type).split('').reverse();
      let strData = '';
      let times = 0;
      for (let j = 0; j < Str.length; j++) {
        if (Str[j] == 1) {
          times++;
          document.querySelectorAll('.repeat li span')[j].className = 'active';
          strData += '周' + typeData[j] + '、';
        }
      }
      if (times == 0) {
        this.repeatTimes = '单次';
      } else if (times == 7) {
        this.repeatTimes = '每天';
      } else {
        this.repeatTimes = strData.substring(0, strData.length - 1);
      }
    },
    beforeDestroy () {
      document.removeEventListener('nativeBack', this.goback);
    },
    methods: {
      goback () {
        this.$router.goBack(true);
      },
      change (value) {
        this.selectTime = getDateValue(value);
      },
      switchState: function (data) { // 获取switch开关状态
        this.selectedAction = data;
      },
      save () {
        let _this = this;
        window.phihome.util.netRequest('get', this.hostname + '/v1/server/timestamp', '', '', function (response) {
          response = JSON.parse(response).netResponse;
          response = JSON.parse(response).result;
          response = response.timestamp;
          //                获取服务器当前时间
          let currentTime = response;
          let responseTime = currentTime;
          let countDownTime = new Date(new Date(currentTime).setHours(_this.defaultTime[0].substring(0, 2))).setMinutes(_this.defaultTime[1].substring(0, 2));
          // 定时生效时间
          let span = document.querySelectorAll('.repeat li span');
          let week = '';
          for (let i = span.length - 1; i >= 0; i--) {
            if (span[i].className == 'active') {
              week += '1';
            } else {
              week += '0';
            }
          }
          if (countDownTime < responseTime && week.indexOf('1') == -1) {
            countDownTime = countDownTime + 24 * 60 * 60 * 1000;
          }
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
          let compareSection = _this.editTimeData.state.reported.all_timers[_this.socket_name].section_timer;
          let compareTiming = _this.editTimeData.state.reported.all_timers[_this.socket_name].timer;
          let compareCountDown = _this.editTimeData.state.reported.all_timers[_this.socket_name].countdown;
          let oneTime = '';
          let oneCurrentTime = new Date(countDownTime).getDay();
          let hoursData = '';
          let minuteDate = '';
          for (let i = 0; i < compareSection.length; i++) {
            selectedStartTimeHours = compareSection[i].split(' ')[3].split('-')[0];
            selectedEndTimeHours = compareSection[i].split(' ')[3].split('-')[1];
            timeDay = day(compareSection[i], 'section');
            if (_this.repeatTimes == '单次') {
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedEndTimeHours && _this.selectedAction == 1) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (timeDay[j] == 1 && (6 - oneCurrentTime) == j) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    // 多天和已有的单次相比
                    oneTime = new Date(compareSection[i].split(' ')[1] * 60 * 1000).getDay();
                    if (oneCurrentTime == oneTime) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
                      return;
                    }
                  }
                }
              }
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedStartTimeHours && _this.selectedAction == 0) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (timeDay[j] == 1 && (6 - oneCurrentTime) == j) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    // 多天和已有的单次相比
                    oneTime = new Date(compareSection[i].split(' ')[1] * 60 * 1000).getDay();
                    if (oneCurrentTime == oneTime) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
                      return;
                    }
                  }
                }
              }
            } else {
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedEndTimeHours && _this.selectedAction == 1) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (week.split('')[j] == 1 && week.split('')[j] == timeDay[j]) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    // 多天和已有的单次相比
                    oneTime = new Date(compareSection[i].split(' ')[1] * 60 * 1000).getDay();
                    if ((6 - oneTime) == j && week.split('')[j] == 1) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
                      return;
                    }
                  }
                }
              }
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedStartTimeHours && _this.selectedAction == 0) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (week.split('')[j] == 1 && week.split('')[j] == timeDay[j]) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    // 多天和已有的单次相比
                    oneTime = new Date(compareSection[i].split(' ')[1] * 60 * 1000).getDay();
                    if ((6 - oneTime) == j && week.split('')[j] == 1) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
                      return;
                    }
                  }
                }
              }
            }
          }

          // 跟定时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
          for (let i = 0; i < compareTiming.length; i++) {
            if (_this.selectIndex == i) {
              continue;
            }
            hoursData = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours();
            minuteDate = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes();
            selectedTimeHours = hoursData + ':' + minuteDate;
            timeAction = compareTiming[i].split(' ')[2];
            timeDay = day(compareTiming[i], 'time');
            if (_this.repeatTimes == '单次') {
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && timeAction == 0) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (j == (6 - oneCurrentTime) && timeDay[j] == 1) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    oneTime = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getDay();
                    if (oneCurrentTime == oneTime) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
                      return;
                    }
                  }
                }
              }
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && timeAction == 1) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (j == (6 - oneCurrentTime) && timeDay[j] == 1) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    oneTime = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getDay();
                    if (oneCurrentTime == oneTime) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
                      return;
                    }
                  }
                }
              }
            } else {
              // 选的是多天，不是单次
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && timeAction == 0) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (week.split('')[j] == 1 && timeDay[j] == week.split('')[j]) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    oneTime = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getDay();
                    if ((6 - oneTime) == j && week.split('')[j] == 1) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
                      return;
                    }
                  }
                }
              }
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && timeAction == 1) {
                for (let j = 0; j < timeDay.length; j++) {
                  if (week.split('')[j] == 1 && timeDay[j] == week.split('')[j]) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
                    oneTime = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getDay();
                    if ((6 - oneTime) == j && week.split('')[j] == 1) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
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
            // timeDay = day(compareCountDown[i],'time');
            if (_this.repeatTimes == '单次') {
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && _this.selectedAction == 1 && timeAction == 0 && compareCountDown[i].split(' ')[3] == 1) {
                if (oneCurrentTime == new Date(compareCountDown[i].split(' ')[0] * 1000).getDay()) {
                  window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                  });
                  return;
                }
              }
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && _this.selectedAction == 0 && timeAction == 1 && compareCountDown[i].split(' ')[3] == 1) {
                if (oneCurrentTime == new Date(compareCountDown[i].split(' ')[0] * 1000).getDay()) {
                  window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                  });
                  return;
                }
              }
            } else {
              // 选的是多天，不是单次
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && _this.selectedAction == 1 && timeAction == 0 && compareCountDown[i].split(' ')[3] == 1) {
                for (let j = 0; j < week.split('').length; j++) {
                  if (week.split('')[j] == 1 && j == (6 - new Date(compareCountDown[i].split(' ')[0] * 1000).getDay())) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  }
                }
              }
              if ((_this.selectTime[0] + ':' + _this.selectTime[1]) == selectedTimeHours && _this.selectedAction == 0 && timeAction == 1 && compareCountDown[i].split(' ')[3] == 1) {
                for (let j = 0; j < week.split('').length; j++) {
                  if (week.split('')[j] == 1 && j == (6 - new Date(compareCountDown[i].split(' ')[0] * 1000).getDay())) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  }
                }
              }
            }
          }

          let saveStr = parseInt(countDownTime / 1000 / 60) + ' ' + parseInt(week, 2).toString(16) + ' ' + _this.selectedAction + ' 1';
          _this.editTimeData.state.reported.all_timers[_this.socket_name].timer.splice(_this.selectIndex, 1, saveStr);
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
          pushCountData.state.desired.all_timers[_this.socket_name] = _this.editTimeData.state.reported.all_timers[_this.socket_name];
          pushCountData = JSON.stringify(pushCountData);
          let This = _this;
          window.phihome.iot.publish('device/' + This.device_id + '/TimerControl', pushCountData, function () {});
          document.addEventListener('pushDataReceived', This._handlePushDataReceivedResponse);
        });
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
        } else if (selectedDaysLength == 7) {
          _this.repeatTimes = '每天';
        } else {
          _this.repeatTimes = '';
          for (let i = 0; i < selectedDaysLength; i++) {
            _this.repeatTimes += '周' + selectedDays[i].innerHTML + '、';
          }
          _this.repeatTimes = _this.repeatTimes.substring(0, _this.repeatTimes.length - 1);
        }
      },
      deleteTiming () {
        this.deleteState = true;
      },
      cancelDelete () {
        this.deleteState = false;
      },
      sureDelete () {
        this.deleteState = false;
        this.editTimeData.state.reported.all_timers[this.socket_name].timer.splice(this.selectIndex, 1);
        let pushCountData = {
          'state': {
            'desired': {
              'all_timers': {
                [this.socket_name]: {
                  'section_timer': [],
                  'timer': [],
                  'countdown': []
                }
              }
            }
          }
        };
        pushCountData.state.desired.all_timers[this.socket_name] = this.editTimeData.state.reported.all_timers[this.socket_name];
        pushCountData = JSON.stringify(pushCountData);
        let This = this;
        window.phihome.iot.publish('device/' + This.device_id + '/TimerControl', pushCountData, function () {
        });
        document.addEventListener('pushDataReceived', This._handlePushDataReceivedResponse);
      },
      _handlePushDataReceivedResponse (event) {
        if (location.hash.split('?')[0] !== '#/editTiming' || JSON.parse(event.data).topic.indexOf('TimerControl') === -1) {
          return;
        }
        if (this.locationHash !== '/fixedTime') {
          let allData = JSON.parse(event.data);
          if (allData.topic.indexOf('TimerControl') !== -1) {
            let newAllData = handlePushDataReceiveData(allData.pushData, window.sessionStorage.getItem('allData'));
            window.sessionStorage.setItem('allData', newAllData);
            this.$router.goBack();
            this.locationHash = '/fixedTime';
          }
        }
      },
      addZero (num) {
        return num < 10 ? '0' + num : num;
      },
      formatDate (now) { // 输出为2017-08-05 14：00的格式，主要为调试用
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        let date = now.getDate();
        let hour = now.getHours();
        let minute = now.getMinutes();
        let second = now.getSeconds();
        return year + '-' + month + '-' + date + '   ' + hour + ':' + minute + ':' + second;
      }
    }
  };
</script>
<style lang="less">
  @r: 75rem;
  .header {
    z-index: 9999;
  }

 #editTiming .header .save .set_icon {
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

  .editTiming {
    min-height: 100%;
    background: #f5f5f5;
  }

  .editTiming ul {
    text-align: left;
    margin-top: 20/@r;

  }

  .editTiming ul li {
    height: 104/@r;
    line-height: 104/@r;
    background: #fff;
    padding-left: 20/@r;

  }

  .editTiming {
    font-size: 31/@r;
    .editPicker {
      top: 1.6rem;
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
    //删除定时
    .delete_device {
      margin-top: 1.83rem;
    }
  }

  input::-webkit-input-placeholder {
    text-align: right;
    color: #eee
  }


</style>
<style lang="less">
  @r: 75rem;
  .editTiming {
    .repeat .repeat_times {
      display: inline-block;
      font-size: 29/@r;
      padding-top: 0 !important;
      padding-left: 0 !important;
      .day {
        padding-left: 20/@r;
        padding-top: 0;
        display: inline-block;
      }
    }
    .repeat_times > span:first-child {
      padding-left: 0 !important;
    }
  }
</style>
