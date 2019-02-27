/*
* @Author: weihaitao
* @Date:   2018-1-16 10:45:26
* @Last Modified by:   weihaitao
* @Last Modified time: 2018-1-16 10:45:26
*
* 工具类组件
* import { myDOM } from '@/common/js/myutils.js'
* 使用本对象中的方法时，使用 this。this.hasClass(el, className)
* 使用本库其他对象中的方法时，直接调用。myNumber.getRandom(0, i)
*/
export const TimeUtils = {
  /**
   * 通过时间获取时间戳
   */
  _getTimeStamp (dateObj, dateLength, hours, minutes, seconds, mimiSeconds) {
    const startTime = dateObj;
    startTime.setDate(startTime.getDate() + dateLength);
    startTime.setHours(hours);
    startTime.setMinutes(minutes);
    startTime.setSeconds(seconds);
    if (mimiSeconds) {
      startTime.setMilliseconds(mimiSeconds);
    }
    return startTime.getTime();
  },
  /**
   * 通过区间定时 和定时 返回的时间戳的变种获得正常时间戳   定时和区间定时独有
   */
  _transformTimerStamp (oldTimeStamp) {
    const secondsInMinute = 60;
    const miniSecondsInSecond = 1000;
    return new Date(oldTimeStamp * secondsInMinute * miniSecondsInSecond).getTime();
  },
  /**
   * 通过倒计时返回的时间戳的变种获得正常时间戳 倒计时独有
   */
  _transformCountDownStamp (countDowntime) {
    const miniSecondsInSecond = 1000;
    return new Date(countDowntime * miniSecondsInSecond).getTime();
  },
  /**
   * 获取循环的下一天的开始执行时间的时间戳
   * @param loopWeek 循环的星期 例：[1,2,4,5]
   * @param today 今天是星期几 例 2
   */
  _getNextDayStartTimeStamp (loopWeek, today, todayStartTime) {
    const behindArray = loopWeek.filter(function (item, index) {
      return item > today;
    });// 获取当前日期之后的重复日期 例 重复日期loopWeek为[1,2,4,5],今天是周二，得到的结果就是[4,5]
    let datelength = null;
    if (behindArray.join('') === '') { // 如果当天后面没有重复日期，则取下一周的重复日期
      datelength = parseInt(loopWeek[0]) + 7 - today;
    } else {
      datelength = parseInt(behindArray[0]) - today;
    }
    return new Date(todayStartTime).setDate(new Date(todayStartTime).getDate() + datelength);
  },
  /**
   * 把16进制的字符串转换成2进制的格式
   * @param week 两个字节长度的字符串，表示每周重复机制,格式为二进制数0B0六五四 三二一日转成16进制字符串后的值。值为0表示不重复,1表示重复
   * @example 0b0001 1001 表示周日、周三、周四都重复。把它转成16进制，为0x19，再转成字符串，”1A”,因此{WEEK}为”19”
   * @result 现在拿到"19"还原成原来的 0001 1001返回
   */
  _analysisWeek (week) {
    const ORIGINAL_RADIX = 16;
    const FINAL_RADIX = 2;
    return parseInt(week, ORIGINAL_RADIX).toString(FINAL_RADIX).split('').reverse();  // 16进制先转十进制再转二进制 然后直接倒序排列
  },
  /**
   * 获取循环的星期数组
   * @param week 两个字节长度的字符串，表示每周重复机制,格式为二进制数0B0六五四 三二一日转成16进制字符串后的值。值为0表示不重复,1表示重复
   * @result 循环星期的数组 例：[0,1,2,5,6]
   */
  _getLoopWeek (week) {
    const loopWeek = [];
    const repeatDays = this._analysisWeek(week);
    repeatDays.forEach(function (item, index) {
      if (item === '1') {
        loopWeek.push(index);
      }
    });
    return loopWeek;
  },
  /**
   * 时间补全 如：1 补全成01
   * @param num 需要补全的数字
   */
  _addTimeZero (num) {
    return num < 10 ? '0' + num : num;
  }
};
export const numberUtils = {
  _formatNumber(value) {
    value = value.toFixed(2);
    return value;
  }
};
