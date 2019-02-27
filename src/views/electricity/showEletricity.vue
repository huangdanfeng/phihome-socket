<template>
  <div>
    <div class="header ofh">
      <div class="left" @click="goback">
        <img src="../../assets/img/settings/back.png" alt="">
      </div>
      <div class="title">电量统计</div>
    </div>
    <ul id="select">
      <li class="active"><span>日</span></li>
      <li><span>周</span></li>
      <li><span>月</span></li>
    </ul>
    <div v-show="isShow" style="margin-top:30%;">
      <img src="~@/assets/img/settings/power@2x.png" @click="initElectricityEchart" alt="">
    </div>
    <div>
      <div class="selected" style="display:block">
        <div id="dayChart" :style="{width: deveiceWidth + 'px'}"></div>
        <ul class="eletricity" id="dayCount" style="display:none">
          <li><span class="realPower">实时功率</span></li>
          <li><span class="totalTime">总时长</span></li>
          <li><span class="powerUsed">用电量</span></li>
          <li class="e_vlaue"><span id="currentPower">{{currentPower}}</span><span>w</span></li>
          <li class="e_vlaue"><span id="totalTime"></span><span>h</span></li>
          <li class="e_vlaue"><span id="powerUsed" ></span><span>度</span></li>
        </ul>
      </div>
      <div class="selected" style="display:none;">
        <div id="weekChart" :style='{width: deveiceWidth + "px"}'></div>
        <ul class="eletricity1" id="weekCount" style="display:none">
          <li><span class="totalTime">总时长</span></li>
          <li><span class="powerUsed">用电量</span></li>
          <li class="e_vlaue1"><span id="totalTime1"></span><span>h</span></li>
          <li class="e_vlaue1"><span id="powerUsed1"></span><span>度</span></li>
        </ul>
      </div>
      <div class="selected" style="display:none">
        <div class="w" id="monthChart"  :style='{width: deveiceWidth + "px"}'></div>
        <ul class="eletricity1" id="monthCount" style="display:none">
          <li><span class="totalTime">总时长</span></li>
          <li><span class="powerUsed">用电量</span></li>
          <li class="e_vlaue1"><span id="totalTime2"></span><span>h</span></li>
          <li class="e_vlaue1"><span id="powerUsed2"></span><span>度</span></li>
        </ul>
      </div>
    </div>
    <!--设备被解绑toast-->
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
  </div>
</template>
<script>
  /*eslint-disable*/
   import {numberUtils} from '@/assets/js/common/utils.js';
   const POWER_INTERVAL = 0;
   export default {
     name: 'hello',
     data () {
       return {
        isToast: true,
        errorText: '',
        deveiceWidth: document.documentElement.clientWidth,
        device_name: '',
        toast_show: false,
        Max1: 0,
        Max2: 0,
        Max3: 0,
        device_id: window.sessionStorage.getItem('device_id'),
        FontSize: 0,
        serverTime: 0,
        currentTime: 0,
        dailyData: [],
        dailyConsump: [], // 日用电量
        dailyDura: [], // 日用电时长
        dailyDate: [], // 日x轴日期
        weeklyData: [], // 周日期
        weeklyConsump: [], // 周用电量
        weeklyDura: [], // 周用电时长
        weeklyDate: [], // 周x轴日期
        monthlyData: [],
        monthlyConsump: [], // 月用电量
        monthlyDura: [], // 月用电时长
        monthlyDate: [], // 周x轴日期
        currentPower: numberUtils._formatNumber(POWER_INTERVAL),
        isShow: false
       };
    },
    created () {
      let _this = this;
      _this.device_id = sessionStorage.getItem('device_id');
      document.addEventListener('pushDataReceived', this._handlePushDataReceivedResponse);
    },
    mounted () {
      let _this = this;
      _this.initElectricityEchart();
      document.addEventListener('nativeBack', this.goback); // 监听物理返回按键 weihaitao
      // 检测设备是否解绑
      window.phihome.util.netRequest('get', _this.hostname + '/v1/user/device/' + _this.device_id, '', '', function (response) {
        let errorMessage;
        response = JSON.parse(response);
        if (response.errorCode === 0) {
          let netResponse = JSON.parse(response.netResponse);
          if (netResponse.status === 200) {
          } else {
            if (netResponse.status === 11001) { // 账号下没有该设备，返回设备首页
              _this.device_name = '智能排插TC1';
              _this.toast_show = true;
            }
            errorMessage = netResponse.message;
            window.phihome.app.toast(errorMessage, function (response) {
            });
          }
        } else {
          errorMessage = response.errorMsg;
          window.phihome.app.toast(errorMessage, function (response) {
          });
        }
      });
      // this._handleData();
    },
    beforeDestroy () {
      let _this = this;
      document.removeEventListener('nativeBack', _this.goback);
      document.removeEventListener('pushDataReceived', this._handlePushDataReceivedResponse);
    },
    methods: {
      refresh () {
        window.location.reload();
      },
      // 计算y轴保留两位小数
      computeDigits (value) {
        if (value % 1 === 0) {
          return value;
        } else {
          return value.toFixed(2);
        }
      },
      // 判断手机屏幕
      judgeScreen () {
        let _this = this;
        let screen = window.screen;
        if (screen.width <= 320) {
          _this.FontSize = 19;
        } else if (screen.width <= 360 && screen.width > 320) {
          _this.FontSize = 18;
        } else if (screen.width <= 375 && screen.width > 360) {
          _this.FontSize = 22;
        } else if (screen.width <= 414 && screen.width > 375) {
          _this.FontSize = 24;
        }
      },
      select () {
        let _this = this;
        let lis = document.getElementById('select').getElementsByTagName('li');
        let divs = document.getElementsByClassName('selected');
        for (let i = 0; i < lis.length; i++) {
          lis[i].id = i;
          lis[i].addEventListener('click', function () {
            for (let j = 0; j < lis.length; j++) {
              lis[j].className = '';
              divs[j].style.display = 'none';
            }
            this.className = 'active';
            divs[i].style.display = 'block';
            _this.refreshEcharts();
            document.getElementById('totalTime').innerHTML = _this.dailyDura[6]; // 按日用电时长
            document.getElementById('powerUsed').innerHTML = _this.dailyConsump[6]; // 按日用电量
            document.getElementById('totalTime1').innerHTML = _this.weeklyDura[3]; // 按周用电时长
            document.getElementById('powerUsed1').innerHTML = _this.weeklyConsump[3]; // 按周用电量
            document.getElementById('totalTime2').innerHTML = _this.monthlyDura[3]; // 按月用电时长
            document.getElementById('powerUsed2').innerHTML = _this.monthlyConsump[3]; // 按月用电量
          });
        }
      },
      goback () {
        this.$router.goBack();
        clearInterval(this.getPowerInterval);
        window.phihome.iot.passthrough('device/' + this.device_id + '/power/instant/request', 'device/' + this.device_id + '/power/instant/response', '1', 0, function (response) {
        });
      },
      refreshEcharts() {
        const _this = this;
        // &&只有第一个为真才往后执行，即要保证第一个不为空或者undefined才执行后面，&两边都要执行
        _this.dayChart && _this.dayChart.setOption(_this._getDayChartOption(6));
        _this.weekChart && _this.weekChart.setOption(_this._getWeekChartOption(3));
        _this.monthChart && _this.monthChart.setOption(_this._getMonthChartOption(3));
      },
      // 基于准备好的dom，初始化echarts实例
      drawLine () {
        let _this = this;
        let dayChart = echarts.init(document.getElementById('dayChart')); // eslint-disable-line no-undef
        let weekChart = echarts.init(document.getElementById('weekChart')); // eslint-disable-line no-undef
        let monthChart = echarts.init(document.getElementById('monthChart')); // eslint-disable-line no-undef
        this.dayChart = dayChart;
        this.weekChart = weekChart;
        this.monthChart = monthChart;
        // 绘制图表
        // 添加点击事件
        dayChart.on('click', function (params) {
          document.getElementById('powerUsed').innerHTML = params.value;
          document.getElementById('totalTime').innerHTML = _this.dailyDura[params.dataIndex];
          dayChart.setOption(_this._getDayChartOption(params.dataIndex));
        });
        weekChart.on('click', function (params) {
          document.getElementById('powerUsed1').innerHTML = params.value;
          document.getElementById('totalTime1').innerHTML = _this.weeklyDura[params.dataIndex];
          weekChart.setOption(_this._getWeekChartOption(params.dataIndex));
        });
        monthChart.on('click', function (params) {
          document.getElementById('powerUsed2').innerHTML = params.value;
          document.getElementById('totalTime2').innerHTML = _this.monthlyDura[params.dataIndex];
          monthChart.setOption(_this._getMonthChartOption(params.dataIndex));
        });
        _this.refreshEcharts();
      },
      _handleData () {
        window.phihome.util.netRequest('get', this.hostname + '/v1/server/timestamp', '', '', this._receiveServerTimeCallBack);
      },
      _getDayChartOption (index) {
        let _this = this;
        let Max1 = _this.Max1;
        /* _this.dailyDate数据处理 */
        // _this.dailyConsump = [12.1, 12.4, 12.5, 11.8, 11.9, 12.1, 12.4];
        let dailyDate = _this.dailyDate.map(function (item) {
          return {
            value: item,
            textStyle: {
              fontSize: _this.FontSize,
              color: '#ff9b1a'
            }
          };
        });
        let dayChartOptions = {
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: [
            {
              type: 'category',
              data: dailyDate,
              axisLine: {show: false},
              axisTick: {
                show: false
              },
              axisLabel: {
                margin: 15,
                textStyle: {
                  fontSize: _this.FontSize,
                  color: '#ff9b1a'
                }
              }
            }
          ],
          yAxis: [
            {
              axisLine: {show: false}, // 隐藏y轴
              axisTick: { // 去除y轴上的刻度线
                show: false
              },
              max: Max1,
              splitNumber: 5,
              interval: Max1 / 5,
              type: 'value',
              splitLine: {
                show: true,
                lineStyle: {
                  color: '#e2e2e2',
                  width: 0.5
                }
              },
              axisLabel: {
                margin: 15,
                formatter: this.computeDigits,
                textStyle: {
                  fontSize: _this.FontSize,
                  color: '#898989'
                }
              }
            }
          ],
          series: [
            {
              type: 'bar',
              barWidth: 60,
              data: [
                {
                  value: _this.dailyConsump[0],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.dailyConsump[1],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.dailyConsump[2],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.dailyConsump[3],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.dailyConsump[4],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.dailyConsump[5],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.dailyConsump[6],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                }
              ]
            }]
        };
        Object.assign(dayChartOptions.xAxis[0].data[index].textStyle, {fontSize: 27});
        dayChartOptions.series[0].data[index].itemStyle.normal = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
            offset: 0,
            color: '#FF843D'
          }, {
            offset: 1,
            color: '#FF8B9B'
          }])
        };
        return dayChartOptions;
      },
      _getWeekChartOption (index) {
        let _this = this;
        let Max2 = _this.Max2;
        /* _this.weeklyDate数据处理 */
        // _this.weeklyConsump = [2.1, 2.4, 2.5, 1.8];
        let weeklyDate = _this.weeklyDate.map(function (item) {
          return {
            value: item,
            textStyle: {
              fontSize: _this.FontSize,
              color: '#ff9b1a'
            }
          };
        });
        let weekChartOptions = {
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: [
            {
              axisTick: { // 去除x轴上的刻度线
                show: false
              },
              axisLine: {show: false},
              data: weeklyDate,
              type: 'category',
              axisLabel: {
                margin: 15,
                textStyle: {
                  fontSize: _this.FontSize,
                  color: '#ff9b1a'
                }
              }
            }
          ],
          yAxis: [
            {
              axisLine: {show: false}, // 隐藏y轴
              axisTick: { // 去除y轴上的刻度线
                show: false
              },
              max: Max2,
              splitNumber: 5,
              splitLine: {
                show: true,
                lineStyle: {
                  color: '#e2e2e2',
                  width: 0.5
                }
              },
              interval: Max2 / 5,
              type: 'value',
              axisLabel: {
                margin: 15,
                formatter: this.computeDigits,
                textStyle: {
                  fontSize: _this.FontSize,
                  color: '#898989'
                }
              }

            }
          ],
          series: [
            {
              type: 'bar',
              barWidth: 120,
              data: [
                {
                  value: _this.weeklyConsump[0],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.weeklyConsump[1],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.weeklyConsump[2],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.weeklyConsump[3],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                }
              ]
            }]
        };
        Object.assign(weekChartOptions.xAxis[0].data[index].textStyle, {fontSize: 27});
        weekChartOptions.series[0].data[index].itemStyle.normal = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
            offset: 0,
            color: '#FF843D'
          }, {
            offset: 1,
            color: '#FF8B9B'
          }])
        };
        return weekChartOptions;
      },
      /* _this.weeklyDate数据处理 */
      _getMonthChartOption (index) {
        let _this = this;
        // _this.monthlyConsump = [2.10, 2.40, 2.80, 1.80];
        let Max3 = _this.Max3;
        let monthlyDate = _this.monthlyDate.map(function (item) {
          return {
            value: item,
            textStyle: {
              fontSize: _this.FontSize,
              color: '#ff9b1a'
            }
          };
        });
        let monthChartOptions = {
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: [
            {
              axisTick: { // 去除x轴上的刻度线
                show: false
              },
              axisLine: {show: false},
              data: monthlyDate,
              type: 'category',
              axisLabel: {
                margin: 15,
                textStyle: {
                  fontSize: _this.FontSize,
                  color: '#ff9b1a'
                }
              }
            }
          ],
          yAxis: [
            {
              axisLine: {show: false}, // 隐藏y轴
              axisTick: { // 去除y轴上的刻度线
                show: false
              },
              max: Max3,
              splitNumber: 5,
              splitLine: {
                show: true,
                lineStyle: {
                  color: '#e2e2e2',
                  width: 0.5
                }
              },
              interval: Max3 / 5,
              type: 'value',
              axisLabel: {
                margin: 15,
                formatter: this.computeDigits,
                textStyle: {
                  fontSize: _this.FontSize,
                  color: '#898989'
                }
              }

            }
          ],
          series: [
            {
              type: 'bar',
              barWidth: 120,
              data: [
                {
                  value: _this.monthlyConsump[0],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.monthlyConsump[1],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.monthlyConsump[2],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                },
                {
                  value: _this.monthlyConsump[3],
                  itemStyle: {
                    normal: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
                        offset: 0,
                        color: '#FEDA7A'
                      }, {
                        offset: 1,
                        color: '#FFC8CA'
                      }])
                    }
                  }
                }
              ]
            }]
        };
        Object.assign(monthChartOptions.xAxis[0].data[index].textStyle, {fontSize: 27});
        monthChartOptions.series[0].data[index].itemStyle.normal = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ // eslint-disable-line no-undef
            offset: 0,
            color: '#FF843D'
          }, {
            offset: 1,
            color: '#FF8B9B'
          }])
        };
        return monthChartOptions;
      },
      _receiveServerTimeCallBack (response) {
        let _this = this;
        response = JSON.parse(response);
        response = JSON.parse(response.netResponse);
        _this.currentTime = response.result.timestamp;
        _this.serverTime = _this.currentTime;
        let len = _this.dailyData.length;
        let weekLen = _this.weeklyData.length;
        let monthLen = _this.monthlyData.length;
        // 判断日的长度，缺失则补全
        for (let n = 0; n < 7 - len; n++) {
          let insertDate = new Date(_this.serverTime - 24 * 60 * 60 * 1000 * _this.dailyData.length);
          let y = insertDate.getFullYear().toString();
          let m = insertDate.getMonth() + 1;
          m = (m < 10 ? '0' + m : m).toString();
          let d = insertDate.getDate();
          d = (d < 10 ? '0' + d : d).toString();
          _this.dailyData.unshift({'daily': +y + m + d, 'duration': '0', 'consumption': '0'});
        }
        // 判断周的数据长度，缺失则补全
        let z = new Date(_this.serverTime).getDay();
        for (let e = 0; e < 4 - weekLen; e++) {
          let startTime = new Date();
          startTime.setDate(new Date(_this.serverTime).getDate() - z + 1 - weekLen * 7 - e * 7);
          let endTime = new Date();
          endTime.setDate(new Date(_this.serverTime).getDate() + 7 - z - weekLen * 7 - e * 7);
          let startMonth = (startTime.getMonth() + 1) < 10 ? '0' + (startTime.getMonth() + 1) : (startTime.getMonth() + 1);
          let startDate = (startTime.getDate()) < 10 ? '0' + (startTime.getDate()) : (startTime.getDate());
          let endMonth = (endTime.getMonth() + 1) < 10 ? '0' + (endTime.getMonth() + 1) : (endTime.getMonth() + 1);
          let endDate = (endTime.getDate()) < 10 ? '0' + (endTime.getDate()) : (endTime.getDate());
          let prevWeek = startMonth + '/' + startDate + '-' + endMonth + '/' + endDate;
          _this.weeklyData.unshift({'weekly': prevWeek, 'duration': '0', 'consumption': '0'});
        }
        // 判断月的长度，缺失则补全
        let month = new Date(_this.serverTime).getMonth() + 1 - monthLen;
        for (let j = 0; j < 4 - monthLen; j++) {
          if (month > 0) {
            _this.monthlyData.unshift({'monthly': month.toString(), 'duration': '0', 'consumption': '0'});
            month--;
          } else {
            month += 12;
            _this.monthlyData.unshift({'monthly': month.toString(), 'duration': '0', 'consumption': '0'});
            month--;
          }
        }
        _this.dailyDate = [];
        _this.dailyDura = [];
        _this.dailyConsump = [];
        _this.weeklyDate = [];
        _this.weeklyDura = [];
        _this.weeklyConsump = [];
        _this.monthlyDate = [];
        _this.monthlyDura = [];
        _this.monthlyConsump = [];
        for (let i = 0; i < _this.dailyData.length; i++) {
          let date = _this.dailyData[i].daily.substr(4, 4);
          let dayDate = date.substr(0, 2) + '/' + date.substr(2, 2);
          let dayDura = numberUtils._formatNumber(_this.dailyData[i].duration);
          let dayConsump = numberUtils._formatNumber(_this.dailyData[i].consumption) ;
          _this.dailyDate.push(dayDate);
          _this.dailyDura.push(dayDura);
          _this.dailyConsump.push(dayConsump);
        }
        _this.dailyDate[6] = '今天';

        for (let l = 0; l < _this.weeklyData.length; l++) {
          let weekDura = numberUtils._formatNumber(_this.weeklyData[l].duration);
          let weekDate = _this.weeklyData[l].weekly;
          let weekConsump = numberUtils._formatNumber(_this.weeklyData[l].consumption);
          _this.weeklyDate.push(weekDate);
          _this.weeklyDura.push(weekDura);
          _this.weeklyConsump.push(weekConsump);
        }
        _this.weeklyDate[3] = '本周';
        for (let k = 0; k < _this.monthlyData.length; k++) {
          let monthDate = _this.monthlyData[k].monthly + '月';
          let monthDura = numberUtils._formatNumber(_this.monthlyData[k].duration);
          let monthConsump = numberUtils._formatNumber(_this.monthlyData[k].consumption);
          _this.monthlyDate.push(monthDate);
          _this.monthlyDura.push(monthDura);
          _this.monthlyConsump.push(monthConsump);
        }

        _this.monthlyDate[3] = '本月';
        // 按日坐标轴y轴设置
        let u1 = Math.max(_this.dailyConsump[0], _this.dailyConsump[1], _this.dailyConsump[2], _this.dailyConsump[3], _this.dailyConsump[4], _this.dailyConsump[5], _this.dailyConsump[6]);
        if (u1 <= 2.5) {
          _this.Max1 = 2.5;
        } else {
          _this.Max1 = Math.ceil(u1 * 2) / 2;
        }
        // 按周坐标轴y轴设置
        let u2 = Math.max(_this.weeklyConsump[0], _this.weeklyConsump[1], _this.weeklyConsump[2], _this.weeklyConsump[3]);
        if (u2 <= 2.5) {
          _this.Max2 = 2.5;
        } else {
          _this.Max2 = Math.ceil(u2 * 2) / 2;
        }
        // 按月坐标轴y轴设置
        let u3 = Math.max(_this.monthlyConsump[0], _this.monthlyConsump[1], _this.monthlyConsump[2], _this.monthlyConsump[3]);
        if (u3 <= 2.5) {
          _this.Max3 = 2.5;
        } else {
          _this.Max3 = Math.ceil(u3 * 2) / 2;
        }
        _this.judgeScreen();
        _this.device_id = sessionStorage.getItem('device_id');
        document.getElementById('totalTime').innerHTML = _this.dailyDura[6]; // 按日用电时长
        document.getElementById('powerUsed').innerHTML = _this.dailyConsump[6]; // 按日用电量
        _this.select();
        clearInterval(this.getPowerInterval);
        this.getPowerInterval = setInterval(function () {
          _this.device_id = sessionStorage.getItem('device_id');
          window.phihome.iot.passthrough('device/' + _this.device_id + '/power/instant/request', 'device/' + _this.device_id + '/power/instant/response', '1', 0, function (response) {
            response = JSON.parse(response);
            _this.currentPower =  numberUtils._formatNumber(JSON.parse(response.mqttData).power);
          });
        }, 1000);
        setTimeout(function () { // 解决跳转卡顿问题 author:weihaitao
          _this.drawLine();
        }, 200);
        
        document.getElementById('dayCount').style.display = 'block';
        document.getElementById('weekCount').style.display = 'block';
        document.getElementById('monthCount').style.display = 'block';
      },
      initElectricityEchart() {
        let _this = this;
        _this.powerData = _this.$route.params.power;
        _this.errorText = _this.powerData.message;
        if (_this.powerData.hasOwnProperty("status")) {
          if(_this.isToast) {
            window.phihome.app.toast(_this.errorText, function (response) {
            });
            _this.isShow = true;
            _this.isToast = false;
          }
        } else {
          window.phihome.app.hideLoading('', function (response) {
          });
          _this.dailyData = _this.powerData.state.reported.power_consumption.daily;
          _this.weeklyData = _this.powerData.state.reported.power_consumption.weekly;
          _this.monthlyData = _this.powerData.state.reported.power_consumption.monthly;
          _this._handleData();
        }
      },
      _handlePushDataReceivedResponse (response) {
        if (response) {
          let responseData = JSON.parse(response.data);
          let pushData = null;
          if (responseData && responseData.pushData) {
            pushData = JSON.parse(responseData.pushData);
          }
          if (pushData.power) {
            this.currentPower =  numberUtils._formatNumber(pushData.power);
          }
        }
      }
    }
  };
</script>
<style scoped lang="less">
  @color: #ff9b1a;
  @r: 75rem;
  #select li {
    float: left;
    width: 33.3%;
    height: 1rem;
    margin-top:40/@r;
    font-size: 34/@r;
    color: #898989;
  }
  #dayChart, #weekChart, #monthChart {
    height: 630/@r;
    margin: 40/@r auto;
  }
  .active {
    display: inline-block;
    width: 1.4rem;
    height: 1rem;
    font-size: 34/@r;
    span{
      color: @color;
      font-weight: bold;
      border-bottom: 2px solid @color;
      box-shadow: 0 5px 0 #fff6ea;
      display: inline-block;
      width: 1.3rem;
      height: 0.9rem;
      margin-bottom: 30/@r;

    }
  }

  .eletricity {
    margin-top: 60/@r;
    li {
      float: left;
      width: 33.3%;
      margin-top: 35/@r;
      .realPower, .totalTime, .powerUsed {
        color: #898989;
        font-size:28/@r;
      }
    }
  }

  .eletricity1 {
    margin-top: 60/@r;
    li {
      float: left;
      width: 50%;
      margin-top: 35/@r;
      .totalTime, .powerUsed {
        color: #898989;
        font-size:28/@r;
      }

    }
  }

  .eletricity1 {
    li.e_vlaue1 {
      color: #ff9b1a;
      font-size: 56/@r;
      font-weight: 500;
      span {
        font-size: 24/@r;
      }
    }
    #powerUsed1, #totalTime1, #powerUsed2, #totalTime2 {
      font-size: 0.74rem;
    }
  }

  .eletricity {
    li.e_vlaue {
      color: #ff9b1a;
      font-size: 56/@r;
      font-weight: 500;
      span {
        font-size: 24/@r;
      }
    }
    #currentPower, #powerUsed, #totalTime{
      font-size: 0.74rem;
    }
  }

  #select {
    margin-top: 1.3rem;
    overflow: hidden;
  }
</style>
