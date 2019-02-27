<template>
  <div ontouchstart="">
    <div class="header ofh" id="header">
      <div class="left" @click="goback">
        <img src="../../assets/img/settings/back.png" alt="back.png">
      </div>
      <div class="title">设置</div>
    </div>
    <div class="page-content socket-page-content">
      <div class="setting_device_wrap">
        <ul class="setting_device">
          <li class="mui-table-view-cell ofh device_name_li router">
            <router-link to="/SetDeviceName" class="mui-navigate-right">
              设备名称
              <span class="fr" id="device_name">{{device_name}}</span>
              <img class="arrow" src="../../assets/img/settings/xia@3x.png" alt="arrow.png">
            </router-link>
          </li>
          <li @click="toDeviceIconManagement" class="mui-table-view-cell ofh router">
            <a class="mui-navigate-right device_icons">
              设备图标
          </a>
            <span class="device_icon_wrap">
                <img id="device_img" alt="">
                <img class="arrow" src="../../assets/img/settings/xia@3x.png" alt="arrow.png">
            </span>
          </li>
          <li class="mui-table-view-cell ofh router">
            <a class="mui-navigate-right select_room_ver" @click="selectRoom">
              所属房间
              <span class="room_ver_wrap fr">
                  <span class="" id="room_ver">{{room_name}}</span>
                  <img class="arrow" src="../../assets/img/settings/xia@3x.png" style="position: static"
                       alt="arrow.png">
              </span>
            </a>
          </li>
          <li class="mui-table-view-cell ofh task_remind_sec">
            <a class="task_remind">
              定时任务提醒
              <!--开关部分-->
              <div class="switch_sec fr">
                <div class="switch-wrap">
                  <div class="switch">
                    <input type="checkbox" class="switch_input mint-switch-active" name="switch"
                           @click="changeSwitchStatus" id="task_switch">
                  </div>
                </div>
              </div>
            </a>
          </li>
        </ul>
      </div>
      <div class="device_infor_sec">
        <p>设备信息</p>
        <ul class="device_infor">
          <li class="mui-table-view-cell ofh">
            MAC地址
            <span class="fr detail mac_address">{{device_mac}}</span>
          </li>
          <li class="mui-table-view-cell ofh firmware_version router" id="firmware_version" @click="updateVersion">
              <span class="firmware_version">
                固件版本
              </span>
            <span :class="{ updateShow:updateShow }" class="mi_badge">NEW</span>
            <span class="fr rom_version_wrap">
                <span class="rom_version detail">{{rom_version}}</span>
                <img class="arrow" src="../../assets/img/settings/xia@3x.png" alt="arrow.png">
            </span>
          </li>
        </ul>
        <div class="delete_device">
          <a class="delete_btn" @click="deleteDevice">
            <img src="../../assets/img/settings/delete_btn.png" alt="">
          </a>
        </div>
      </div>
    </div>
    <!--房间picker弹窗-->
    <transition name="fade">
      <div class="picker_wrap" v-show="roomSelectShow" @click="cancelSelect">
        <div class="picker_alert picker_room" @click.stop>
          <div class="picker_header ofh">
            <span class="fl" @click="toRoomManagement">编辑</span>
            <span class="select_room">选择房间</span>
            <span class="fr" @click="confirmRoom">确定</span>
          </div>
          <div class="roompicker">
            <picker :data='room' v-model='roomSelected' @on-change='change' ref="picker"></picker>
          </div>
        </div>
      </div>
    </transition>
    <!--删除confirm-->
    <div class="confirm_toast_wrap delete_confirm_toast_wrap">
      <div class="confirm_toast">
        <div class="confirm_content">
          删除后将清除所有定时任务及绑定信息，确定要删除吗？
        </div>
        <div class="confirm_footer">
          <a class="cancel" @click="cancelDeleteDevice">取消</a>
          <a class="sure" @click="sureDeleteDevice">确定</a>
        </div>
      </div>
    </div>
    <!--固件升级confirm-->
    <div class="romUpdate_confirm_toast_wrap" v-show="updateConfirmToastShow">
      <div class="confirm_toast">
        <div class="confirm_content">
          检测到新的固件版本<span class="romVersion"></span>，升级过程中设备将会断电
        </div>
        <div class="confirm_footer">
          <a class="cancel" @click="cancelRomUpdate">暂不升级</a>
          <a class="sure" @click="sureRomUpdate" style="color: #313131;">立即升级</a>
        </div>
      </div>
    </div>
    <!--升级失败confirm-->
    <div class="confirm_toast_wrap update_fail_confirm">
      <div class="confirm_toast">
        <div class="confirm_content">
          <img src="../../assets/img/settings/info@3x.png" alt="info">
          <p>升级失败</p>
        </div>
        <div class="confirm_footer">
          <a class="sure" @click="sureUpdateFail">确定</a>
        </div>
      </div>
    </div>
    <!--升级成功confirm-->
    <div class="confirm_toast_wrap update_succ_confirm" id="update_succ_confirm">
      <div class="confirm_toast">
        <div class="confirm_content">
          <img src="../../assets/img/settings/check_xiao@3x.png" alt="info">
          <p>升级成功</p>
        </div>
        <div class="confirm_footer">
          <a class="sure" @click="sureUpdateSucc">确定</a>
        </div>
      </div>
    </div>
    <!--升级进度progress-->
    <div class="update_progress_sec confirm_toast_wrap">
      <div class="confirm_toast">
        <div class="confirm_content" style="position: relative">
          <!--loading动画-->
          <div class="loadingDiv" id="loadingDiv">
            <div class="spinner">
              <div class="spinner-container container1">
                <div class="circle1"></div>
                <div class="circle2"></div>
                <div class="circle3"></div>
                <div class="circle4"></div>
              </div>
              <div class="spinner-container container2">
                <div class="circle1"></div>
                <div class="circle2"></div>
                <div class="circle3"></div>
                <div class="circle4"></div>
              </div>
              <div class="spinner-container container3">
                <div class="circle1"></div>
                <div class="circle2"></div>
                <div class="circle3"></div>
                <div class="circle4"></div>
              </div>
            </div>
          </div>
          <p>升级中，升级过程中设备将会断电</p>
        </div>
      </div>
    </div>
    <!--设备被解绑toast-->
    <phiToast id="phi_toast" v-if="toast_show" :deviceName="device_name"></phiToast>
  </div>
</template>

<script scoped>
  import paichaIcon from '../../assets/img/settings/paicha_icon@3x.png';
  import paichaIcon1 from '../../assets/img/settings/paicha_icon@1.png';
  import Picker from 'vux/src/components/picker/index.vue';
  import {ON_PAGE_BEGIN, ON_PAGE_END, PAGE_OUTLET_SETTING} from '@/assets/js/uman-events.js';

  let rooms = []; // 所有房间
  export default {
    name: 'Socket1',
    components: {
      Picker
    },
    data () {
      return {
        timer: [], // ota升级超时定时器
        device_id: '',
        family_id: '',
        room_id: '',
        device_name: '',
        taskRemind: 1,
        toast_show: false,
        room_name: '',
        device_mac: '',
        hardware_version: '',
        rom_version: '',
        device_type: '',
        model: '',
        file_size: '', // 文件大小
        file_md5: '', // 固件文件的MD5值
        fw_bin_url: '', // 固件文件下载地址
        fw_ver: '', // 固件版本号
        ota_timeout_timer: null,
        deviceIcon: paichaIcon,
        value: true,
        roomSelectShow: false,
        updateShow: false,
        roomJsonArr: [],
        room: [rooms],
        roomSelected: [''], // 默认选中房间
        selectedRoomId: '',
        currIndexInRooms: '',
        selectedIconUrl: paichaIcon1,
        deviceIconId: '',
        updateProgressShow: true,
        updateSuccessShow: true, // 固件会返回两次升级成功消息，需要进行标识
        updateConfirmToastShow: false
      };
    },
    methods: {
      change (value) {
        this.selectedRoomId = value;
        sessionStorage.setItem('selectedRoomId', value);
      },
      goback () {
        this.$router.goBack();
      },
      onValuesChange (picker, values) {
      },
      deleteDevice () {
        document.querySelector('.delete_confirm_toast_wrap').style.display = 'block';
      },
      _clearThisTimeout () {
        this.timer.forEach(function (item) {
          if (item) {
            clearTimeout(item);
          }
        });
      },
      toDeviceIconManagement () {
        let _this = this;
        if (!navigator.onLine) {
          window.phihome.app.toast('当前网络不可用，请检查网络设置', function (response) {
          });
          return;
        }
        window.phihome.app.openPage('phihome.device.picture', _this.deviceIconId, function (response) {
          response = JSON.parse(response);
          window.phihome.app.showLoading('', 6000, function (response) {
          });
          if (response.hasChange == 1) {
            // 修改设备图标后，重新获取新的图标
            window.phihome.util.netRequest('get', _this.hostname + '/v1/user/device/' + _this.device_id, '', '', function (response) {
              response = JSON.parse(response);
              if (response.errorCode == 0) {
                let netResponse = JSON.parse(response.netResponse);
                if (netResponse.status == 200) {
                  let responseResult = netResponse.result;
                  let groupPics = responseResult.device_pic_group.group_pics;
                  _this.deviceIconId = responseResult.device_pic_group.pic_group_id;
                  for (let i = 0; i < groupPics.length; i++) {
                    if (groupPics[i].pic_type == 'normal') {
                      document.getElementById('device_img').src = groupPics[i].pic_url;
                      _this.selectedIconUrl = groupPics[i].pic_url;
                    } else {
                      document.getElementById('device_img').src = _this.deviceIcon;
                    }
                  }
                } else {
                  if (netResponse.status == 11001) { // 被解绑，账号下没有该设备，返回设备首页
                    document.querySelector('.confirm_toast_wrap').style.display = 'none';
                    _this.toast_show = true;
                  } else {
                    window.phihome.app.toast(netResponse.message, function (response) {
                    });
                  }
                  _this.device_name = '智能排插TC1';
                }
              } else {
                window.phihome.app.toast(response.errorMsg, function (response) {
                });
              }
            });
          }
          setTimeout(function () {
            window.phihome.app.hideLoading('', function (response) {
            });
          }, 100);
        });
      },
      toRoomManagement () {
        let _this = this;
        window.phihome.app.openPage('phihome.room.manage', '', function (response) {
          response = JSON.parse(response);
          if (response.hasChange == 1) {
            // 添加新的房间后，重新获取家庭房间数据
            window.phihome.util.netRequest('get', _this.hostname + '/v1/user/family/' + _this.family_id + '/rooms', '', '', function (response) {
              _this._handleNetRequestResponse(response, function () {
                let responseResult = JSON.parse(JSON.parse(response).netResponse).result;
                _this.roomJsonArr = [];
                for (let i = 0; i < responseResult.length; i++) {
                  let roomI = responseResult[i];
                  if (i == _this.currIndexInRooms) {
                    _this.roomSelected = [responseResult[i].room_id]; // 选中上次选择的房间
                  }
                  _this.roomJsonArr.push({'name': roomI.room_nickname, 'value': roomI.room_id});
                }
                _this.$data.room = [_this.roomJsonArr];
              });
            });
            // 若删除房间，则更新设备所属房间名
            window.phihome.util.netRequest('get', _this.hostname + '/v1/user/device/' + sessionStorage.getItem('device_id'), '', '', function (response) {
              _this._handleNetRequestResponse(response, function () {
                let responseResult = JSON.parse(JSON.parse(response).netResponse).result;
                if (responseResult.room_name) {
                  _this.room_name = responseResult.room_name;
                } else {
                  _this.room_name = '';
                }
              });
            });
          }
        });
      },
      updateVersion () { // 更新固件版本 弹窗
        let _this = this;
        // 点击重新检查升级
        window.phihome.app.showLoading('', 6000, function (response) {
        });
        let checkupdateReqData = {
          'device_id': _this.device_id,
          'hardware_version': _this.hardware_version,
          'rom_version': _this.rom_version,
          'device_type': _this.device_type,
          'model': _this.model
        };
        window.phihome.util.netRequest('post', _this.hostname + '/v1/ota/checkupdate', '', checkupdateReqData, function (response) {
          _this._handleNetRequestResponse(response, function () {
            let responseResult = JSON.parse(JSON.parse(response).netResponse).result;
            if (responseResult) {
              if (responseResult.ret != 0) {
                window.phihome.app.hideLoading('', function (response) {
                });
                _this.updateShow = false;
                window.phihome.app.toast('当前固件已是最新版本', function (response) {
                });
              } else {
                _this.updateShow = true;
                _this.updateProgressShow = true;
                _this.fw_ver = responseResult.fw_ver;
                _this.fw_bin_url = responseResult.file_url;
                _this.file_size = responseResult.file_size;
                _this.file_md5 = responseResult.file_md5;
                document.querySelector('.romUpdate_confirm_toast_wrap .romVersion').innerHTML = responseResult.fw_ver;
                window.phihome.iot.subscribe('$events/client/' + _this.device_id + '/upgraded', function () {
                });
                document.addEventListener('pushDataReceived', _this._handlePushDataReceivedResponse);
                _this.updateConfirmToastShow = true;
                // 升级时，禁用app 手机返回键
                document.removeEventListener('nativeBack', _this.goback);
              }
            }
          });
        });
      },
      cancelRomUpdate () {
        this.updateConfirmToastShow = false;
        document.addEventListener('nativeBack', this.goback); // 继续监听返回键
      },
      sureRomUpdate () { // 确认升级
        let _this = this;
        /* eslint-enable */
        _this.updateConfirmToastShow = false;
        _this.updateSuccessShow = true;
        window.phihome.app.showLoading('', 10000, function (response) {
        });
        window.phihome.util.netRequest('post', _this.hostname + '/v1/user/device/' + _this.device_id + '/upgrade', '', '', function (response) {
          response = JSON.parse(response);
          if (response.errorCode == 0) {
            let netResponse = JSON.parse(response.netResponse);
            if (netResponse.status == 200) {
              _this.ota_update_timer = setTimeout(function () { // 10秒延时，超时则提示设备不在线
                window.phihome.app.toast('设备不在线', function (response) {
                });
              }, 10000);
              _this.timer.push(_this.ota_update_timer);
            } else {
              if (netResponse.status == 11001) { // 被解绑，账号下没有该设备，返回设备首页
                document.querySelector('.confirm_toast_wrap').style.display = 'none';
                _this.toast_show = true;
              } else {
                window.phihome.app.toast(netResponse.message, function (response) {
                });
              }
              _this.device_name = '智能排插TC1';
            }
          } else {
            window.phihome.app.toast(response.errorMsg, function (response) {
            });
          }
        });
      },
      selectRoom (event) {
        this.roomSelectShow = true;
        document.getElementsByClassName('picker_alert')[0].className = 'picker_alert';
        setTimeout(function () {
          document.getElementsByClassName('picker_alert')[0].style.height = 518 + 'px';
        }, 100);
      },
      confirmRoom () {
        let _this = this;
        let selectedRoom = this.$refs.picker.getNameValues();
        this.room_id = this.selectedRoomId;
        if (_this.room_id) { // 当选择了新的房间
          for (let i = 0; i < _this.roomJsonArr.length; i++) {
            if (_this.room_id == _this.roomJsonArr[i].value) {
              _this.currIndexInRooms = i; // 获取当前选择房间在房间数组的index
            }
          }
          window.phihome.app.showLoading('', 10000, function (response) {
          });
          window.phihome.util.netRequest('post', _this.hostname + '/v1/user/family/' + _this.family_id + '/room/' + _this.room_id + '/device/' + _this.device_id, '', {'room_name': selectedRoom}, function (response) {
            window.phihome.app.hideLoading('', function (response) {
            });
            _this._handleNetRequestResponse(response, function () {
              _this.room_name = selectedRoom;
              _this.roomSelectShow = false;
              document.getElementsByClassName('picker_alert')[0].className = 'picker_alert mint-popdown';
            });
          });
          window.sessionStorage.setItem('selectedRoom', selectedRoom);
          _this.room_name = selectedRoom;
        } else {
          this.roomSelectShow = false;
          document.getElementsByClassName('picker_alert')[0].className = 'picker_alert mint-popdown';
        }
      },
      cancelSelect (event) {
        let _this = this;
        event.cancelBubble = true;
        event.preventDefault();
        setTimeout(function () {
          document.getElementsByClassName('picker_alert')[0].style.height = 0;
          _this.roomSelectShow = false;
        }, 100);
      },
      changeSwitchStatus (event) { // 切换任务提醒开关状态
        let _this = this;
        let Switch = event.currentTarget;
        window.phihome.app.showLoading('', 6000, function (response) {
        });
        if (Switch.className === 'switch_input') {
          window.phihome.util.netRequest('post', _this.hostname + '/v1/user/device/' + _this.device_id, '', {'task_remind': '1'}, function (response) {
            window.phihome.app.hideLoading('', function (response) {
            });
            _this._handleNetRequestResponse(response, function () {
              Switch.className = 'switch_input mint-switch-active';
            });
          });
        } else {
          window.phihome.util.netRequest('post', _this.hostname + '/v1/user/device/' + _this.device_id, '', {'task_remind': '0'}, function (response) {
            window.phihome.app.hideLoading('', function (response) {
            });
            _this._handleNetRequestResponse(response, function () {
              Switch.className = 'switch_input';
            });
          });
        }
      },
      cancelDeleteDevice (event) {
        document.querySelector('.confirm_toast_wrap').style.display = 'none';
      },
      sureUpdateFail (event) {
        document.querySelector('.update_fail_confirm').style.display = 'none';
        document.addEventListener('nativeBack', this.goback); // 继续监听返回键
      },
      sureUpdateSucc () {
        document.querySelector('.update_succ_confirm').style.display = 'none';
        document.addEventListener('nativeBack', this.goback); // 继续监听返回键
      },
      sureDeleteDevice (event) {
        let _this = this;
        if (_this.family_id && _this.room_id) {
          window.phihome.util.netRequest('delete', _this.hostname + '/v1/user/family/' + _this.family_id + '/room/' + _this.room_id + '/device/' + _this.device_id, '', '', function (response) {
            _this._handleNetRequestResponse(response, function () {
              window.phihome.app.toast('删除成功', function (response) {
                document.querySelector('.confirm_toast_wrap').style.display = 'none';
                setTimeout(function () {
                  window.phihome.app.closePage('', function (response) {
                  });
                }, 100);
              });
            });
          });
        } else {
          window.phihome.app.toast('参数错误', function (response) {
            document.querySelector('.confirm_toast_wrap').style.display = 'none';
          });
        }
      },
      _handleNetRequestResponse (response, callBack) { // 处理http请求response --yuzhihao
        let _this = this;
        response = JSON.parse(response);
        if (response.errorCode == 0) {
          let netResponse = JSON.parse(response.netResponse);
          if (netResponse.status == 200) {
            callBack();
          } else {
            if (netResponse.status == 11001) { // 被解绑，账号下没有该设备，返回设备首页
              document.querySelector('.confirm_toast_wrap').style.display = 'none';
              _this.toast_show = true;
            } else {
              window.phihome.app.toast(netResponse.message, function (response) {
              });
            }
            _this.device_name = '智能排插TC1';
          }
        } else {
          window.phihome.app.toast(response.errorMsg, function (response) {
          });
        }
        window.phihome.app.hideLoading('', function (response) {
        });
      },
      _handlePushDataReceivedResponse (event) {
        let _this = this;
        let data = JSON.parse(event.data);
        let pushData = JSON.parse(data.pushData);
        if (location.hash.split('?')[0] !== '#/Socket' || data.topic.indexOf('upgraded') === -1 || pushData.action !== 'check_update') { // 手动升级才显示进度及结果
          return;
        }
        window.phihome.app.hideLoading('', function (response) {
        });
        if (pushData.ret_code == 2 && _this.updateProgressShow) { // 开始升级；若有升级成功弹窗，即使接受到mqtt开始升级的状态码也不显示进度条
          _this._clearThisTimeout();
          _this.updateConfirmToastShow = false;
          document.querySelector('.update_progress_sec').style.display = 'block';
          _this.ota_timeout_timer = setTimeout(function () { // 180秒延时，超时则提示升级失败
            document.querySelector('.update_succ_confirm').style.display = 'none';
            document.querySelector('.update_progress_sec').style.display = 'none';
            document.querySelector('.update_fail_confirm').style.display = 'block';
          }, 180000);
          _this.timer.push(_this.ota_timeout_timer);
        }
        if (pushData.ret_code == 0 && _this.updateSuccessShow) { // ota升级成功 升级成功的第一次消息才弹窗
          _this.rom_version = pushData.cur_fw_ver;
          _this.updateProgressShow = false;
          _this.updateShow = false;
          _this.updateSuccessShow = false;
          _this._clearThisTimeout();
          document.querySelector('.update_progress_sec').style.display = 'none';
          document.querySelector('.update_fail_confirm').style.display = 'none';
          document.querySelector('.update_succ_confirm').style.display = 'block';
        } else if (pushData.ret_code == 1) { // ota升级失败
          window.phihome.app.hideLoading('', function (response) {
          });
          _this.updateProgressShow = false;
          _this._clearThisTimeout();
          document.querySelector('.update_succ_confirm').style.display = 'none';
          document.querySelector('.update_progress_sec').style.display = 'none';
          document.querySelector('.update_fail_confirm').style.display = 'block';
        }
      }
    },
    created: function () {
      this._onStatisEvent({eventName: ON_PAGE_BEGIN, pageTitle: PAGE_OUTLET_SETTING});
    },
    mounted: function (event) {
      let _this = this;
      let taskSwtich = document.getElementById('task_switch');
      document.addEventListener('nativeBack', _this.goback); // 监听物理返回按键 weihaitao
      this.device_id = sessionStorage.getItem('device_id');
      this.device_name = sessionStorage.getItem('deviceName');
      this.taskRemind = sessionStorage.getItem('taskRemind');
      if (this.taskRemind == 0) {
        taskSwtich.className = 'switch_input';
      } else {
        taskSwtich.className = 'switch_input mint-switch-active';
      }
      window.phihome.app.showLoading('', 6000, function (response) {
      });
      function getDeviceInfor() {
        return new Promise(function(resolve, reject) {
          // 初始化 设备名、房间名、mac、固件版本
          window.phihome.util.netRequest('get', _this.hostname + '/v1/user/device/' + _this.device_id, '', '', function (response) {
            _this._handleNetRequestResponse(response, function () {
              resolve(response); // 因为后续请求依赖于resolve结果，故需将请求结果resolve出去
              let responseResult = JSON.parse(JSON.parse(response).netResponse).result;
              _this.family_id = responseResult.fid;
              _this.room_id = responseResult.room_id;
              let taskRemind = responseResult.task_remind;
              sessionStorage.setItem('deviceIconId', responseResult.device_pic_group.pic_group_id);
              _this.deviceIconId = responseResult.device_pic_group.pic_group_id;
              let groupPics = responseResult.device_pic_group.group_pics;
              for (let i = 0; i < groupPics.length; i++) {
                if (groupPics[i].pic_type == 'normal') {
                  document.getElementById('device_img').src = groupPics[i].pic_url;
                  _this.selectedIconUrl = groupPics[i].pic_url;
                } else {
                  document.getElementById('device_img').src = _this.deviceIcon;
                }
              }
              _this.device_name = responseResult.device_nickname;
              _this.room_id = responseResult.room_id;
              sessionStorage.setItem('deviceName', responseResult.device_nickname);
              if (responseResult.room_name) {
                _this.room_name = responseResult.room_name;
              } else {
                _this.room_name = '';
              }
              _this.device_mac = responseResult.device_mac;
              _this.rom_version = responseResult.rom_version;
              _this.hardware_version = responseResult.hardware_version;
              _this.device_type = responseResult.device_type;
              _this.model = responseResult.model;
              sessionStorage.setItem('taskRemind', taskRemind);
              if (taskRemind == 0) {
                taskSwtich.className = 'switch_input';
              } else {
                taskSwtich.className = 'switch_input mint-switch-active';
              }
            });
          });
        });
      }
      function getFamilyRooms () {
        // 获取picker弹窗所有房间
        window.phihome.util.netRequest('get', _this.hostname + '/v1/user/family/' + _this.family_id + '/rooms', '', '', function (response) {
          _this._handleNetRequestResponse(response, function () {
            let responseResult = JSON.parse(JSON.parse(response).netResponse).result;
            _this.roomJsonArr = [];
            for (let i = 0; i < responseResult.length; i++) {
              let roomI = responseResult[i];
              _this.roomJsonArr.push({'name': roomI.room_nickname, 'value': roomI.room_id});
              if (roomI.room_id == _this.room_id) {
                // 当前选中房间在所有房间数组的位置
                _this.currIndexInRooms = i;
              }
            }
            // 更新家庭下的所有房间
            _this.$data.room = [_this.roomJsonArr];
            _this.roomSelected = [_this.room_id]; // 选中上次选择的房间
          });
        });
      }
      function checkUpdateOTA () {
        // 固件升级
        let checkupdateReqData = {
          'device_id': _this.device_id,
          'hardware_version': _this.hardware_version,
          'rom_version': _this.rom_version,
          'device_type': _this.device_type,
          'model': _this.model
        };
        window.phihome.util.netRequest('post', _this.hostname + '/v1/ota/checkupdate', '', checkupdateReqData, function (response) {
          _this._handleNetRequestResponse(response, function () {
            let responseResult = JSON.parse(JSON.parse(response).netResponse).result;
            if (responseResult) {
              _this.updateShow = responseResult.ret == 0; // 显示升级图标
              _this.fw_ver = responseResult.fw_ver;
              _this.fw_bin_url = responseResult.file_url;
              _this.file_size = responseResult.file_size;
              _this.file_md5 = responseResult.file_md5; //  _this.fw_bin_url = 'http://172.31.34.128:8080/file/ota/firmware/T1V1_V1.0.0.2.ota.bin';
              document.querySelector('.romUpdate_confirm_toast_wrap .romVersion').innerHTML = responseResult.fw_ver;
            }
          });
        });
      }
      getDeviceInfor().then(function (data) {
        checkUpdateOTA();
        getFamilyRooms();
      }).then(function (error) {
        console.log(error);
      });
    },
    beforeDestroy () {
      this._onStatisEvent({eventName: ON_PAGE_END, pageTitle: PAGE_OUTLET_SETTING});
      document.removeEventListener('nativeBack', this.goback);
      document.removeEventListener('pushDataReceived', this._handlePushDataReceivedResponse);
    }
  };
</script>
<style lang="less" scoped>
  //点击链接，激活状态样式
  .router:active {
    background: #000;
    opacity: 0.2;
    color: #fff;
  }
  .socket-page-content {
    position: absolute;
    top: 1.3rem;
    right: 0;
    bottom: 0;
    left: 0;
    background: #f5f5f5;
  }

  .child-view {
    height: 100vh;
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity .18s
  }

  .fade-enter, .fade-leave-active {
    opacity: 0
  }

  #update_succ_confirm a {
    color: #313131;
  }

</style>
<style lang="less">
  @import './../../assets/less/settings/socket.less'; //局部引入

  .update_fail_confirm, .update_succ_confirm {
    .confirm_toast {
      img {
        width: 82/@base-size
      }
      p {
        margin-top: 16/@base-size;
      }
      a.sure {
        width: 100%;
      }
    }
    .confirm_toast {
      .confirm_content {
        height: auto;
        padding-top: 67/@base-size;
        padding-bottom: 50/@base-size;
      }
      .confirm_footer {
        position: absolute;
        width: 100%;
        bottom: 0;
        .sure {
          color: #313131;
        }
      }
    }
  }

  //房间picker
  .roompicker {
    width: 100%;
    height: 428px;
    padding: 30px 0;
    .scroller-component {
      height: 368px;
    }
    .scroller-mask {
      background-size: 100% 146px;
    }
    .scroller-indicator {
      height: 70px;
      top: 149px;
    }
    .scroller-item {
      font-size: 38px;
      height: 70px;
      line-height: 70px;
    }
    .scroller-item-selected {
      font-size: 40px;
      color: #333;
    }
    .scroller-content {
      top: 10px;
    }
  }

  .scroller-item {
    font-size: 38px;
    height: 70px;
    line-height: 70px;
  }

  .scroller-item-selected {
    font-size: 40px;
  }

  // 升级进度条
  #app .update_progress_sec {
    display: none;
    .confirm_toast {
      height: 200/@base-size;
    }
    .confirm_toast .confirm_content {
      padding: 0.7rem 30/@base-size;
      text-align: center;
      height: 200/@base-size;
      box-sizing: border-box;
      font-size: 24/@base-size;
      color: #494949;
      /*loading加载动画*/
      .loadingDiv {
        width: 100%;
        height: 100%;
        position: absolute;
        top: -28/@base-size;
        left: 0;
        z-index: 33;
        display: flex;
      }
      .spinner {
        margin: auto;
        width: 42/@base-size;
        height: 42/@base-size;
        position: relative;
      }
      .container1 > div, .container2 > div, .container3 > div {
        width: 13/@base-size;
        height: 13/@base-size;
        background-color: #ff9b1a;
        border-radius: 100%;
        position: absolute;
        -webkit-animation: bouncedelay 1.2s infinite ease-in-out;
        animation: bouncedelay 1.2s infinite ease-in-out;
        -webkit-animation-fill-mode: both;
        animation-fill-mode: both;
      }
      .spinner .spinner-container {
        position: absolute;
        width: 100%;
        height: 100%;
      }
      .container2 {
        -webkit-transform: rotateZ(45deg);
        transform: rotateZ(45deg);
      }
      .container3 {
        -webkit-transform: rotateZ(90deg);
        transform: rotateZ(90deg);
      }
      .circle1 {
        top: 0;
        left: 0;
      }
      .circle2 {
        top: 0;
        right: 0;
      }
      .circle3 {
        right: 0;
        bottom: 0;
      }
      .circle4 {
        left: 0;
        bottom: 0;
      }
      .container2 .circle1 {
        -webkit-animation-delay: -1.1s;
        animation-delay: -1.1s;
      }
      .container3 .circle1 {
        -webkit-animation-delay: -1.0s;
        animation-delay: -1.0s;
      }
      .container1 .circle2 {
        -webkit-animation-delay: -0.9s;
        animation-delay: -0.9s;
      }
      .container2 .circle2 {
        -webkit-animation-delay: -0.8s;
        animation-delay: -0.8s;
      }
      .container3 .circle2 {
        -webkit-animation-delay: -0.7s;
        animation-delay: -0.7s;
      }
      .container1 .circle3 {
        -webkit-animation-delay: -0.6s;
        animation-delay: -0.6s;
      }
      .container2 .circle3 {
        -webkit-animation-delay: -0.5s;
        animation-delay: -0.5s;
      }
      .container3 .circle3 {
        -webkit-animation-delay: -0.4s;
        animation-delay: -0.4s;
      }
      .container1 .circle4 {
        -webkit-animation-delay: -0.3s;
        animation-delay: -0.3s;
      }
      .container2 .circle4 {
        -webkit-animation-delay: -0.2s;
        animation-delay: -0.2s;
      }
      .container3 .circle4 {
        -webkit-animation-delay: -0.1s;
        animation-delay: -0.1s;
      }
      @-webkit-keyframes bouncedelay {
        0%, 80%, 100% {
          -webkit-transform: scale(0.0)
        }
        40% {
          -webkit-transform: scale(1.0)
        }
      }
      @keyframes bouncedelay {
        0%, 80%, 100% {
          transform: scale(0.0);
          -webkit-transform: scale(0.0);
        }
        40% {
          transform: scale(1.0);
          -webkit-transform: scale(1.0);
        }
      }
      p {
        margin-top: 88/@base-size;
      }
    }
  }

  .picker_alert {
    .picker {
      padding: 39px 0;
    }
    .picker-item.picker-selected {
      color: #333;
      font-size: 42px;
    }
    .picker-item {
      font-size: 36px;
      color: #b8b8b8;
    }
    .picker-center-highlight {
      border-top: .5px solid #e2e2e2;
      border-bottom: .5px solid #e2e2e2;
    }
  }

  @-webkit-keyframes progressAnimate {
    0% {
      left: 0;
    }
    100% {
      left: 70%;
    }
  }

  @keyframes progressAnimate {
    0% {
      left: 0;
    }
    100% {
      left: 70%;
    }
  }

</style>

