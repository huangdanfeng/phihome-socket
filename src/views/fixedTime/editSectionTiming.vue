<template>
  <!--ontouchstart解决ios不支持:active属性-->
  <div class="editSectionAll" ontouchstart="">
    <div class="header ofh">
      <div class="left" @click="goBackTo">
        <img src="~@/assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">编辑区间定时</div>
      <div class="save">
        <div class="set_icon">
          <!--<router-link to="section" >-->
          <span class="save_btn" @click="save">保存</span>
          <!--</router-link>-->
        </div>
      </div>
    </div>
    <div class="page-content addSectionTiming">
      <div class="inputName">
          <span>名称
              <input type="text" maxlength="20" placeholder="请输入名称" id="section_time_name" v-model="sectionName" class="typeInput">
          </span>
      </div>
      <div class="operation-time">
        <ul>
          <li class="router">
            <a class="mui-navigate-right select_room_ver" @click="selectStartTime">
              <span>开启时间</span>
              <span class="room_ver_wrap fr">
                    <span class="" id="openTime" v-text="startTime"></span>
                    <img class="arrow" src="~@/assets/img/settings/xia@3x.png"
                         style="position: static" alt="arrow.png">
              </span>
            </a>
          </li>
          <li class="router">
            <a class="mui-navigate-right select_room_ver" @click="selectCloseTime">
              <span>关闭时间</span>
              <span class="room_ver_wrap fr">
                    <span class="" id="closeTime" v-text="closeTime"></span>
                    <img class="arrow" src="~@/assets/img/settings/xia@3x.png" style="position: static" alt="arrow.png">
              </span>
            </a>
          </li>
        </ul>
      </div>
      <div class="repeat">
        <span>重复: <span class="repeat_times" v-html="repeatTimes"></span></span>
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
    <!--选择时间picker弹窗-->
    <transition name="fade">
      <div class="picker_wrap" v-show="startPickerSelect" @click="">
        <div class="picker_alert picker_room" @click.stop>
          <div class="picker_header ofh">
            <span class="fl" @click="cancelStartSelect">取消</span>
            <span class="select_room">选择开启时间</span>
            <span class="fr" @click="confirmStartSelect">确定</span>
          </div>
          <div class="editSectionPicker">
            <picker :data='years1' v-model='startCurrentTime' @on-change='change' ref="picker"></picker>
          </div>
        </div>
      </div>
    </transition>
    <!--关闭时间弹窗-->
    <transition name="fade">
      <div class="picker_wrap" v-show="closePickerSelect" @click="">
        <div class="picker_alert picker_room" @click.stop>
          <div class="picker_header ofh">
            <span class="fl" @click="cancelCloseSelect">取消</span>
            <span class="select_room">选择关闭时间</span>
            <span class="fr" @click="confirmCloseSelect">确定</span>
          </div>
          <div class="editSectionPicker">
            <picker :data='years1' v-model='closeCurrentTime' @on-change='change' ref="picker"></picker>
          </div>
        </div>
      </div>
    </transition>
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
  import { Picker, PopupPicker, Group } from 'vux';
  import './../../assets/less/settings/socket.less';
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
        device_name: '',
        toast_show: false,
        years1: timeList,
        isOpen: false,
        show1: false,
        startTime: '14:20',
        closeTime: '11:10',
        startCurrentTime: DEFAULTTIME,
        closeCurrentTime: DEFAULTTIME,
        startPickerSelect: false,
        closePickerSelect: false,
        repeatTimes: '单次',
        formatDemoValue: ['01', '12'],
        device_id: window.sessionStorage.getItem('device_id'),
        socket_name: window.sessionStorage.getItem('socket_header_title').slice(2, 4).toLowerCase(),
        selectIndex: window.sessionStorage.getItem('selectIndex'), // 选择的数据
        sectionName: '',
        name: this.sectionName,
        sectionData: '',
        deleteState: false,
        format: function (value, name) {
          return `${value[0]}:${value[1]}`;
        },
        editSectionTimeData: JSON.parse(window.sessionStorage.getItem('allData'))
      };
    },
    mounted: function () {
      document.addEventListener('nativeBack', this.goBackTo); // 监听物理返回按键 weihaitao
      this.sectionData = this.editSectionTimeData.state.reported.all_timers[this.socket_name].section_timer[this.selectIndex];
      this.sectionName = decodeURI(this.sectionData.split(' ')[0]);
      let sectionTimeName = document.getElementById('section_time_name');
      // 获取当前时间为默认开启时间
      this.startTime = this.sectionData.split(' ')[3].split('-')[0];
      // 关闭时间为当前时间推迟2小时
      this.closeTime = this.sectionData.split(' ')[3].split('-')[1];
      let type = parseInt(this.sectionData.split(' ')[2], 16).toString(2);
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
      // 检测设备是否解绑
      let _this = this;
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
        let CaretPos = 0;
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

      sectionTimeName.addEventListener('input', function (event) {
        let len = chkstrlen(_this.name);
        let names = _this.sectionName;
        let position = getCursortPosition(sectionTimeName);
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
            setTextValuePosition('section_time_name', strLength.length);
          } else {
            let str = names.slice(name.length - names.slice(position, names.length).length, position);
            let strLength = inputstr(str, length);
            _this.sectionName = name.slice(0, name.length - names.slice(position, names.length).length) + strLength +
              name.slice(name.length - names.slice(position, names.length).length, name.length);
            setTextValuePosition('section_time_name', (name.length - names.slice(position, names.length).length) + strLength.length);
          }
        }
        _this.name = _this.sectionName;
      });
    },
    beforeDestroy () {
      document.removeEventListener('nativeBack', this.goBackTo); // 监听物理返回按键 weihaitao
      document.removeEventListener('pushDataReceived', this._handlePushDataReceivedResponse);
    },
    methods: {
      change (value) {
      },
      goBackTo () {
        this.$router.goBack(true);
      },
      selectStartTime () {
        let _this = this;
        this.startCurrentTime = [this.startTime.split(':')[0] + DEFAULHOURSINDEX, this.startTime.split(':')[1] + DEFAULMINUTESINDEX]; // 默认选中当前时间
        this.startPickerSelect = true;
        document.getElementsByClassName('picker_alert')[1].style.height = 0;
        setTimeout(function () {
          _this.closePickerSelect = false;
        }, 100);
        setTimeout(function () {
          document.getElementsByClassName('picker_alert')[0].style.height = 568 + 'px';
        }, 100);
      },
      selectCloseTime () {
        let _this = this;
        this.closeCurrentTime = [this.closeTime.split(':')[0] + DEFAULHOURSINDEX, this.closeTime.split(':')[1] + DEFAULMINUTESINDEX]; // 默认选中当前时间
        this.closePickerSelect = true;
        document.getElementsByClassName('picker_alert')[0].style.height = 0;
        setTimeout(function () {
          _this.startPickerSelect = false;
        }, 100);
        setTimeout(function () {
          document.getElementsByClassName('picker_alert')[1].style.height = 568 + 'px';
        }, 100);
      },
      cancelStartSelect () {
        let _this = this;
        event.cancelBubble = true;
        event.preventDefault();
        setTimeout(function () {
          document.getElementsByClassName('picker_alert')[0].style.height = 0;
          _this.startPickerSelect = false;
        }, 150);
      },
      cancelCloseSelect () {
        let _this = this;
        event.cancelBubble = true;
        event.preventDefault();
        setTimeout(function () {
          document.getElementsByClassName('picker_alert')[1].style.height = 0;
          _this.closePickerSelect = false;
        }, 150);
      },
      confirmStartSelect () {
        let _this = this;
        let start = getDateValue(_this.startCurrentTime).join(':');
        if (start == _this.closeTime) {
          window.phihome.app.toast('开启时间与关闭时间相同，请重新设置', function (response) {
          });
        } else {
          setTimeout(function () {
            document.getElementsByClassName('picker_alert')[0].style.height = 0;
            _this.startTime = start;
            _this.startPickerSelect = false;
          }, 150);
        }
      },
      confirmCloseSelect () {
        let _this = this;
        let close = getDateValue(_this.closeCurrentTime).join(':');
        if (close == _this.startTime) {
          window.phihome.app.toast('开启时间与关闭时间相同，请重新设置', function (response) {
          });
        } else {
          setTimeout(function () {
            document.getElementsByClassName('picker_alert')[1].style.height = 0;
            _this.closeTime = close;
            _this.closePickerSelect = false;
          }, 150);
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
        this.editSectionTimeData.state.reported.all_timers[this.socket_name].section_timer.splice(this.selectIndex, 1);
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
        pushCountData.state.desired.all_timers[this.socket_name] = this.editSectionTimeData.state.reported.all_timers[this.socket_name];
        pushCountData = JSON.stringify(pushCountData);
        let This = this;
        window.phihome.iot.publish('device/' + This.device_id + '/TimerControl', pushCountData, function () {
        });
        document.addEventListener('pushDataReceived', This._handlePushDataReceivedResponse);
      },
      changeImg () {
        this.isOpen = !this.isOpen;
      },
      repeatActive (event) {
        let target = event.currentTarget;
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
          this.repeatTimes = '单次';
        } else if (selectedDaysLength == 7) {
          this.repeatTimes = '每天';
        } else {
          this.repeatTimes = '';
          for (let i = 0; i < selectedDaysLength; i++) {
            this.repeatTimes += '周' + selectedDays[i].innerHTML + '、';
          }
          this.repeatTimes = this.repeatTimes.substring(0, this.repeatTimes.length - 1);
        }
      },
      save () {
        let isCorrect = this.checkInput(this.sectionName);
        if (!isCorrect) {
          return false;
        } else {
          let _this = this;
          window.phihome.util.netRequest('get', this.hostname + '/v1/server/timestamp', '', '', function (response) {
            response = JSON.parse(response);
            response = JSON.parse(response.netResponse);
            //    获取服务器当前时间
            let currentTime = response.result.timestamp;
            let responseTime = currentTime;
            let countDownTime = new Date(new Date(currentTime).setHours(_this.startTime.split(':')[0])).setMinutes(_this.startTime.split(':')[1]);
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
            if (countDownTime < responseTime) {
              countDownTime = countDownTime + 24 * 60 * 60 * 1000;
            }
            let selectTimes = _this.startTime + '-' + _this.closeTime;

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

            // 时间有交集
            let compareSection = _this.editSectionTimeData.state.reported.all_timers[_this.socket_name].section_timer;
            let compareTiming = _this.editSectionTimeData.state.reported.all_timers[_this.socket_name].timer;
            let compareCountDown = _this.editSectionTimeData.state.reported.all_timers[_this.socket_name].countdown;
            let oneTime = '';
            let oneCurrentTime = new Date(countDownTime).getDay();
            let hoursData = '';
            let minuteDate = '';

            for (let i = 0; i < compareSection.length; i++) {
              if (_this.selectIndex == i) {
                continue;
              }
              timeDay = day(compareSection[i], 'section');
              let sectionStart = compareSection[i].split(' ')[3].split('-')[0];
              let sectionEnd = compareSection[i].split(' ')[3].split('-')[1];
              if (_this.repeatTimes == '单次') {
                if ((_this.startTime <= sectionEnd && _this.closeTime >= sectionStart) ||
                  (sectionStart > sectionEnd && (_this.startTime <= sectionEnd || _this.closeTime >= sectionStart)) ||
                  (_this.startTime > _this.closeTime && (_this.startTime <= sectionEnd || _this.closeTime >= sectionStart)) ||
                  (_this.startTime > _this.closeTime && sectionStart > sectionEnd)) {
                  // 正常时间VS正常时间 || 正常时间VS跨天时间 || 跨天时间VS正常时间 || 跨天时间VS跨天时间
                  for (let j = 0; j < timeDay.length; j++) {
                    if ((6 - oneCurrentTime) == j && timeDay[j] == 1) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
                      return;
                    } else if (parseInt(timeDay.join(''), 2).toString(10) == 0) {
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
                // 选的是多天，不是单次
                if ((_this.startTime <= sectionEnd && _this.closeTime >= sectionStart) ||
                  (sectionStart > sectionEnd && (_this.startTime <= sectionEnd || _this.closeTime >= sectionStart)) ||
                  (_this.startTime > _this.closeTime && (_this.startTime <= sectionEnd || _this.closeTime >= sectionStart)) ||
                  (_this.startTime > _this.closeTime && sectionStart > sectionEnd)) {
                  // 正常时间VS正常时间 或者 正常时间VS跨天时间 或者 跨天时间VS正常时间 或者 跨天时间VS跨天时间
                  for (let j = 0; j < timeDay.length; j++) {
                    if (timeDay[j] == week.split('')[j] && timeDay[j] == 1) {
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
            // 和定时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
            for (let i = 0; i < compareTiming.length; i++) {
              hoursData = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getHours();
              minuteDate = new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes() < 10 ? ('0' + new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes()) : new Date(compareTiming[i].split(' ')[0] * 60 * 1000).getMinutes();
              selectedTimeHours = hoursData + ':' + minuteDate;
              timeAction = compareTiming[i].split(' ')[2];
              timeDay = day(compareTiming[i], 'time');
              if (_this.repeatTimes == '单次') {
                if (_this.startTime == selectedTimeHours && timeAction == 0) {
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
                if (_this.closeTime == selectedTimeHours && timeAction == 1) {
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
                if (_this.startTime == selectedTimeHours && timeAction == 0) {
                  for (let j = 0; j < timeDay.length; j++) {
                    if (timeDay[j] == week.split('')[j] && timeDay[j] == 1) {
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
                if (_this.closeTime == selectedTimeHours && timeAction == 1) {
                  for (let j = 0; j < timeDay.length; j++) {
                    if (timeDay[j] == week.split('')[j] && timeDay[j] == 1) {
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
            // 和倒计时比有没有同一时间两个不同操作，比如星期一6:00插头开和关同时进行视为重复
            for (let i = 0; i < compareCountDown.length; i++) {
              hoursData = new Date((compareCountDown[i].split(' ')[0] * 1000) + (compareCountDown[i].split(' ')[1] * 60 * 1000)).getHours() < 10 ? ('0' + new Date((compareCountDown[i].split(' ')[0] * 1000) + (compareCountDown[i].split(' ')[1] * 60 * 1000)).getHours()) : new Date((compareCountDown[i].split(' ')[0] * 1000) + (compareCountDown[i].split(' ')[1] * 60 * 1000)).getHours();
              minuteDate = new Date((compareCountDown[i].split(' ')[0] * 1000) + (compareCountDown[i].split(' ')[1] * 60 * 1000)).getMinutes() < 10 ? ('0' + new Date((compareCountDown[i].split(' ')[0] * 1000) + (compareCountDown[i].split(' ')[1] * 60 * 1000)).getMinutes()) : new Date((compareCountDown[i].split(' ')[0] * 1000) + (compareCountDown[i].split(' ')[1] * 60 * 1000)).getMinutes();
              selectedTimeHours = hoursData + ':' + minuteDate;
              timeAction = compareCountDown[i].split(' ')[2];
              if (_this.repeatTimes == '单次') {
                if (_this.startTime == selectedTimeHours && timeAction == 0) {
                  if (oneCurrentTime == new Date((compareCountDown[i].split(' ')[0] * 1000) + (compareCountDown[i].split(' ')[1] * 60 * 1000)).getDay()) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  }
                }
                if (_this.closeTime == selectedTimeHours && timeAction == 1) {
                  if (oneCurrentTime == new Date((compareCountDown[i].split(' ')[0] * 1000) + (compareCountDown[i].split(' ')[1] * 60 * 1000)).getDay()) {
                    window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                    });
                    return;
                  }
                }
              } else {
                // 选的是多天，不是单次
                if (_this.startTime == selectedTimeHours && timeAction == 0) {
                  for (let j = 0; j < week.split('').length; j++) {
                    if (week.split('')[j] == 1 && j == new Date((compareCountDown[i].split(' ')[0] * 1000) + (compareCountDown[i].split(' ')[1] * 60 * 1000)).getDay()) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
                      return;
                    }
                  }
                }
                if (_this.closeTime == selectedTimeHours && timeAction == 1) {
                  for (let j = 0; j < week.split('').length; j++) {
                    if (week.split('')[j] == 1 && j == new Date((compareCountDown[i].split(' ')[0] * 1000) + (compareCountDown[i].split(' ')[1] * 60 * 1000)).getDay()) {
                      window.phihome.app.toast('定时任务已存在,请重新设置', function (response) {
                      });
                      return;
                    }
                  }
                }
              }
            }

            let saveStr = encodeURI(_this.sectionName) + ' ' + parseInt(countDownTime / 1000 / 60) + ' ' + parseInt(week, 2).toString(16) + ' ' + selectTimes + ' 1';
            _this.editSectionTimeData.state.reported.all_timers[_this.socket_name].section_timer.splice(_this.selectIndex, 1, saveStr);

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
            pushCountData.state.desired.all_timers[_this.socket_name] = _this.editSectionTimeData.state.reported.all_timers[_this.socket_name];
            pushCountData = JSON.stringify(pushCountData);
            let This = _this;
            window.phihome.iot.publish('device/' + This.device_id + '/TimerControl', pushCountData, function () {
            });
            document.addEventListener('pushDataReceived', This._handlePushDataReceivedResponse);
          });
        }
      },
      _handlePushDataReceivedResponse (event) {
        if (location.hash.split('?')[0] !== '#/editSectionTiming' || JSON.parse(event.data).topic.indexOf('TimerControl') === -1) {
          return;
        }
        if (this.locationHash !== '/section') {
          let allData = JSON.parse(event.data);
          if (allData.topic.indexOf('TimerControl') !== -1) {
            let newAllData = handlePushDataReceiveData(allData.pushData, window.sessionStorage.getItem('allData'));
            window.sessionStorage.setItem('allData', newAllData);
            this.$router.goBack();
            this.locationHash = '/section';
          }
        }
      },
      checkInput(value) {
        let isCorrect = true;
        if (value.length == 0) {
          window.phihome.app.toast('请输入名称', function (response) {});
          isCorrect = false;
        } else {
          let strAscii = []; // 用于接收ASCII码
          for (let i = 0; i < value.length; i++) {
            strAscii[i] = value.charCodeAt(i); // 只能把字符串中的字符一个一个的解码
          }
          for (let j = 0; j < strAscii.length; j++) {
            if (strAscii[j] < 33 || (strAscii[j] > 126 && strAscii[j] < 9999)) {
              window.phihome.app.toast('名称不能包含特殊字符', function (response) {});
              isCorrect = false;
            }
          }
        }
        return isCorrect;
      }
    }
  };
</script>
<style lang="less">
  @r: 75rem;
  .editSectionAll .picker_wrap {
    .select_room {
      font-size: 32/@r;
    }
  }

 .editSectionAll .header .save .set_icon {
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

  .addSectionTiming {
    position: absolute;
    top: 1.3rem;
    right: 0;
    bottom: 0;
    left: 0;
    background: #f5f5f5;
  }

  .addSectionTiming ul {
    text-align: left;
    margin-top: 20/@r;

  }

  .addSectionTiming ul li {
    height: 104/@r;
    line-height: 104/@r;
    background: #fff;
    padding-left: 20/@r;
    padding-right: 20/@r;
  }

  .addSectionTiming {
    font-size: 30/@r;
    color: #313131;
    .inputName {
      margin-top: 20/@r;
      height: 104/@r;
      line-height: 104/@r;
      background: #fff;
      text-align: left;
      padding-right: 20/@r;
      input {
        width: 620/@r;
        border: 0;
        position: absolute;
        right: 20px;
        top: 0;
        bottom: 0;
        text-align: right;
      }
      //改变安卓 input光标颜色
      .typeInput {
        color: #ff9b1a; /* change [input cursor color] by this*/
        text-shadow: 0px 0px 0px #313131; /* change [input font] by this*/
        -webkit-text-fill-color: transparent;
        caret-color: #ff9b1a;
      }
      .typeInput::-webkit-input-placeholder {
        color: #bfbfbf; /* change [placeholder color] by this*/
        text-shadow: none;
        -webkit-text-fill-color: initial;
      }
      .typeInput::-webkit-input-placeholder { /* WebKit browsers */
        color: #bfbfbf;
      }
      .typeInput:-moz-placeholder { /* Mozilla Firefox 4 to 18 */
        color: #bfbfbf;
      }
      .typeInput::-moz-placeholder { /* Mozilla Firefox 19+ */
        color: #bfbfbf;
      }
      .typeInput:-ms-input-placeholder { /* Internet Explorer 10+ */
        color: #bfbfbf;
      }
      span {
        text-align: left;
        display: inline-block;
        padding-left: 20/@r;
        position: relative;
        width: 100%;
      }
    }
    .mui-navigate-right {
      width: 100%;
      display: inline-block;
      position: relative;
      .room_ver_wrap {
        vertical-align: middle;
        #openTime, #closeTime {
          margin-right: 0.20rem;
          vertical-align: middle;
        }
        .arrow {
          width: .13333333rem;
          vertical-align: middle;
        }
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
        padding-right: 0;
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
    .delete_device {
      margin-top: 2.75rem;
    }
  }

  .editSectionPicker {
    margin-top: 50px;
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

  input::-webkit-input-placeholder {
    text-align: right;
    color: #bfbfbf
  }
</style>
<style lang="less">//去掉scoped，动态添加样式才能生效
@r: 75rem;
//点击链接，激活状态样式
.router:active {
  background: #000;
  opacity: 0.2;
  color: #fff;
}
.addSectionTiming {
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
