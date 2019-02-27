import { TIMER_CONTROL_BASE_DATA, DEFAULT_TIME_STAMP } from '@/assets/js/constants/BaseData.js';
import { TimeUtils } from '@/assets/js/common/utils.js';
/**
 * 解析mqtt请求 pushDataReceived 返回的数据
 * @method analysisOutletStatusData  初步解析返回的 outletStatus 开关数据，包括正常情况和异常情况，如果正常情况返回 switch
 * @method analysisTimerControlData  初步解析返回的 timerControl 定时器数据，包括正常情况和异常情况 allTimers
 * @method getSectionTimerData       返回某个插口的区间定时数据
 * @method getTimerData              返回某个插口的定时数据
 * @method getCountdownData          返回某个插口的倒计时数据
 */
export const AnalysisMixin = {
  methods: {
    /**
     * 初步解析返回的 outletStatus 开关数据，包括正常情况和异常情况，如果正常情况则返回 switch字段
     * @param pushData topic是outletStatus 的pushDataReceive返回的数据
     */
    _analysisOutletStatusData (pushData) {
      // todo
    },
    /**
     * 初步解析返回的 timercontrol 定时数据，包括正常情况和异常情况，如果正常情况则返回 switch字段
     * @param pushData topic是outletStatus 的pushDataReceive返回的数据
     */
    _analysisTimerControlData (pushData) {
      const initJSON = TIMER_CONTROL_BASE_DATA;
      if (!pushData) {
        window.sessionStorage.setItem('allData', JSON.stringify(initJSON));
        pushData = JSON.stringify(initJSON).replace('reported', 'desired');
        window.phihome.iot.publish('device/' + this.device_id + '/TimerControl', pushData, function () {
        });
      } else {
        const copyJSON = JSON.parse(pushData);
        if (!copyJSON.state) {
          if (copyJSON.message) { // todo 这种错误判断不标准 需要与后台确认错误情况详细类别
            window.phihome.app.toast(copyJSON.message, function (response) {});
          }
        } else {
          return copyJSON.state.reported.all_timers;
        }
      }
    },
    /**
     * 获取某个插口的区间定时数据
     * @param pushData topic是timerControl 的pushDataReceive返回的数据
     * @param currentSocketName 当前插口
     * @param serverTime 服务器时间戳
     */
    _getSectionTimerData (pushData, currentSocketName, serverTime) {
      const _this = this;
      /* section_timer字段的结构 */
      const INDEX_SECTION_TIMER_NAME = 0;
      const INDEX_SECTION_TIMER_START_TIME = 1;
      const INDEX_SECTION_TIMER_WEEK = 2;
      const INDEX_SECTION_TIMER_SECTION = 3;
      const INDEX_SECTION_TIMER_SWITCH = 4;
      const allTimers = _this._analysisTimerControlData(pushData);
      const currentSocketSectionTimerData = allTimers[currentSocketName].section_timer;
      return currentSocketSectionTimerData.map(function (item) {
        const itemArray = item.split(' ');                                  // 数据以空格分割
        const startTime = itemArray[INDEX_SECTION_TIMER_START_TIME];
        const week = itemArray[INDEX_SECTION_TIMER_WEEK];
        const actionTime = itemArray[INDEX_SECTION_TIMER_SECTION];
        const switchSta = itemArray[INDEX_SECTION_TIMER_SWITCH];
        return {
          type: 'sectionTimer',                                           // 定时器类型
          serverTime, // 服务器标准时间戳
          name: itemArray[INDEX_SECTION_TIMER_NAME],                      // 区间定时的名字
          startTime,           // 区间定时的起始时间 unix时间戳的变种，乘以60 再乘以1000的值
          week: _this._getTimerWeek(week),                     // 两个字节长度的字符串，表示每周重复机制
          actionTime,                // 区间定时的区间 例：18:00-24:00
          switch: switchSta,                   // 0表示定时器/倒计时/区间定时 关，1表示开
          nextActionTime: _this._getNextSectionTimer(startTime, week, actionTime, switchSta, serverTime) // 获取最近执行开关动作的时间戳
        };
      });
    },
    /**
     * 获取某个插口的定时数据
     * @param pushData topic是timerControl 的pushDataReceive返回的数据
     * @param currentSocketName 当前插口
     */
    _getFixedTimerData (pushData, currentSocketName, serverTime) {
      const _this = this;
      /* timer字段的结构 */
      const INDEX_TIMER_START_TIME = 0;
      const INDEX_TIMER_WEEK = 1;
      const INDEX_TIMER_ACTION = 2;
      const INDEX_TIMER_SWITCH = 3;
      const allTimers = _this._analysisTimerControlData(pushData);
      const currentSocketTimerData = allTimers[currentSocketName].timer;
      return currentSocketTimerData.map(function (item) {
        const itemArray = item.split(' ');                                  // 数据以空格分割
        const startTime = TimeUtils._transformTimerStamp(itemArray[INDEX_TIMER_START_TIME]); // 对返回的时间戳数据转换成正常时间戳
        const week = itemArray[INDEX_TIMER_WEEK];
        const action = itemArray[INDEX_TIMER_ACTION];
        const switchSta = itemArray[INDEX_TIMER_SWITCH];
        const startTimeObj = new Date(startTime);
        const actionTime = TimeUtils._addTimeZero(startTimeObj.getHours()) + ':' + TimeUtils._addTimeZero(startTimeObj.getMinutes());
        return {
          type: 'fixedTimer',                                           // 定时器类型
          serverTime,
          startTime,           // 定时的执行标准时间戳
          actionTime,           // 定时执行的时间 例：19:00
          week: _this._getTimerWeek(week), // 两个字节长度的字符串，表示每周重复机制
          action,                             // 表明动作，值为1或0，是开还是关
          switch: switchSta,                   // 0表示定时器/倒计时/区间定时 关，1表示开
          nextActionTime: _this._getNextFixedTimer(startTime, week, switchSta, serverTime) // 获取最近执行开关动作的时间戳
        };
      });
    },
    /**
     * 获取某个插口的倒计时数据
     * @param pushData topic是timerControl 的pushDataReceive返回的数据
     * @param currentSocketName 当前插口
     */
    _getCountdownData (pushData, currentSocketName, serverTime) {
      const _this = this;
      /* countdown字段的结构 */
      const INDEX_COUNT_DOWN_START_TIME = 0;
      const INDEX_COUNT_DOWN_MINUTES = 1;
      const INDEX_COUNT_DOWN_ACTION = 2;
      const INDEX_COUNT_DOWN_SWITCH = 3;
      const allTimers = _this._analysisTimerControlData(pushData);
      const currentSocketCountDownData = allTimers[currentSocketName].countdown;
      return currentSocketCountDownData.map(function (item) {
        const itemArray = item.split(' ');                                  // 数据以空格分割
        const startTime = TimeUtils._transformCountDownStamp(itemArray[INDEX_COUNT_DOWN_START_TIME]);
        const minutes = itemArray[INDEX_COUNT_DOWN_MINUTES];
        const action = itemArray[INDEX_COUNT_DOWN_ACTION];
        const switchSta = itemArray[INDEX_COUNT_DOWN_SWITCH];
        return {
          type: 'coundDown',                                           // 定时器类型
          serverTime,
          startTime, // 定时的执行的时间戳
          actionTime: minutes,
          minutes,      // 倒计时的初始时长，以分钟为单位。如10表示10分钟。
          action,        // 表明动作，值为1或0，是开还是关
          switch: switchSta,       // 0表示定时器/倒计时/区间定时 关，1表示开
          nextActionTime: _this._getCountDownTimer(startTime, switchSta, serverTime) // 获取最近执行开关动作的时间戳
        };
      });
    },
    /**
     * 根据原始数据解析 星期 的重复设置（中文数组）
     * @param week 两个字节长度的字符串，表示每周重复机制,格式为二进制数0B0六五四 三二一日转成16进制字符串后的值。值为0表示不重复,1表示重复
     * @example 0b0000 0001 表示周日重复，0b0000 0010表示周一重复
     * @example 0b0001 1001 表示周日、周三、周四都重复。把它转成16进制，为0x1A，再转成字符串，”19”,因此{WEEK}为”19”
     * @result 现在拿到"19" 返回['周日','周三','周四']
     */
    _getTimerWeek (week) {
      const MAX_LENGTH = 7;
      const MIN_LENGTH = 0;
      const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const repeatDaysName = [];
      const repeatDays = TimeUtils._analysisWeek(week);
      repeatDays.forEach(function (item, index) {
        if (item === '1') {
          repeatDaysName.push(weekDay[index]);
        }
      });
      if (repeatDaysName.length === MIN_LENGTH) { // 没有元素 代表单次
        return ['单次'];
      }
      if (repeatDaysName.length === MAX_LENGTH) { // 7个元素 代表每天
        return ['每天'];
      }
      return repeatDaysName;
    },
    /**
     * 根据区间定时的区间解析出具体的开始时间和结束时间
     * @param section 原始的section部分
     * @example 原始结构 xx:xx-xx:xx
     */
    _analysisSectionTimerDetail (section) {
      const startTime = section.split('-')[0]; // 获取开始时间 结构 xx:xx
      const endTime = section.split('-')[1]; // 获取开始时间 结构 xx:xx
      const startHour = parseInt(startTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      let endHour = parseInt(endTime.split(':')[0]);
      const endMinute = parseInt(endTime.split(':')[1]);
      if (endHour < startHour) {
        endHour += 24; // 如果定时跨天 结束时间加24小时
      }
      return {
        startHour, // 工作时间起始点 小时
        startMinute, // 工作时间起始点 分钟
        endHour, // 工作时间结束点 小时 @important 如果结束时间是第二天这个数值会大于24
        endMinute, // 工作时间结束点 分钟
        timeLength: endHour * 60 + endMinute - startHour * 60 - startMinute // 区间定时时长
      };
    },
    /**
     * 获取此定时器的下次执行动作的时间戳
     * @param startTime shadow返回的startTime的时间戳（此时间戳不能作为开始执行的唯一标准）
     * @param week 重复的周次
     * @param section xx:xx-xx:xx定时区间
     * @param switchSta 开关状态
     * @param serverTime 服务器时间戳
     */
    _getNextSectionTimer (startTime, week, section, switchSta, serverTime) {
      if (switchSta === '0') {  // 开关处于关闭状态 直接返回默认时间戳
        return DEFAULT_TIME_STAMP;
      }
      const sectionTime = this._analysisSectionTimerDetail(section);
      const serverTimeObj = new Date(serverTime); // 服务器时间的Date对象格式
      const todayStartTime = TimeUtils._getTimeStamp(serverTimeObj, 0, sectionTime.startHour, sectionTime.startMinute, 0); // 获取今天对应的开始时间
      const todayEndTime = TimeUtils._getTimeStamp(serverTimeObj, 0, sectionTime.endHour, sectionTime.endMinute, 0); // 获取今天对应的结束时间
      const startTimeStamp = TimeUtils._transformTimerStamp(startTime);
      const actionEndStamp = TimeUtils._transformTimerStamp(parseInt(startTime) + parseInt(sectionTime.timeLength));
      if (week === '0') { // 判断单次执行
        if (actionEndStamp <= serverTime) { // 如果已经过期就返回默认时间戳
          return DEFAULT_TIME_STAMP;
        } else { // 如果还没开始则返回开始时间，如果当前时间在开始与结束中间则返回结束时间
          return serverTime < startTimeStamp ? startTimeStamp : actionEndStamp;
        }
      } else { // 有重复
        const loopWeek = TimeUtils._getLoopWeek(week); // 重复的周数
        const today = new Date(serverTime).getDay(); // 今天是周几
        /**
         * 1.今天不重复
         * 2.今天不重复，但是当前时间早于默认开始的时间戳（即设置定时的时候开启时间已过）
         * 3.今天重复，而且结束时间小于当前时间（即今天的定时已经执行完）
         * 则获取第二天的区间开始时间
         */
        if (loopWeek.indexOf(today) === -1 || startTimeStamp > todayStartTime || serverTime >= todayEndTime) {
          return TimeUtils._getNextDayStartTimeStamp(loopWeek, today, todayStartTime);
        } else { // 当前时间早于开始时间则返回开始时间，否则返回结束时间
          return serverTime < todayStartTime ? todayStartTime : todayEndTime;
        }
      }
    },
    /**
     * 获取此定时器的下次执行动作的时间戳
     * @param startTime shadow返回的startTime的时间戳
     * @param week 重复的周次
     * @param switchSta 开关状态
     * @param serverTime 服务器时间戳
     */
    _getNextFixedTimer (startTime, week, switchSta, serverTime) {
      if (switchSta === '0') {  // 开关处于关闭状态 直接返回默认时间戳
        return DEFAULT_TIME_STAMP;
      }
      const startTimeObj = new Date(startTime); // 定时器时间的date对象格式
      const serverTimeObj = new Date(serverTime); // 服务器时间的Date对象格式
      const todayStartTime = TimeUtils._getTimeStamp(serverTimeObj, 0, startTimeObj.getHours(), startTimeObj.getMinutes(), 0, 0); // 获取今天对应的开始时间
      const loopWeek = TimeUtils._getLoopWeek(week); // 重复的周数
      const today = new Date(serverTime).getDay(); // 今天是周几
      if (week === '0') { // 判断单次执行
        return serverTime < startTime ? startTime : DEFAULT_TIME_STAMP;
      } else if (loopWeek.indexOf(today) > -1 && serverTime < todayStartTime) { // 重复执行 并且今天也重复，而且还没执行
        return todayStartTime;
      } else {
        return TimeUtils._getNextDayStartTimeStamp(loopWeek, today, todayStartTime);
      }
    },
    /**
     * 获取此定时器的下次执行动作的时间戳
     * @param startTime shadow返回的startTime的时间戳
     * @param switchSta 开关状态
     * @param serverTime 服务器时间戳
     */
    _getCountDownTimer (startTime, switchSta, serverTime) {
      if (switchSta === '0') {  // 开关处于关闭状态 直接返回默认时间戳
        return DEFAULT_TIME_STAMP;
      }
      return serverTime < startTime ? startTime : DEFAULT_TIME_STAMP;
    }
  }
};
