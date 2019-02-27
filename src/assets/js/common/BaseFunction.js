/*
* @Author: weihaitao
* @Date:   2018-1-16 10:45:26
* @Last Modified by:   weihaitao
* @Last Modified time: 2018-1-16 10:45:26
*
* import { BaseMixin } from '@/assets/js/common/BaseFunction.js'
* 针对全局的基础功能组件
* 使用本对象中的方法时，使用 this。this._onStatisEvent({})
*/
export const BaseMixin = {
  methods: {
    /**
     * App埋点统计
     */
    _onStatisEvent (data) {
      window.phihome.util.onStatisEvent(data, function (response) {});
    },
    /**
     * 获取服务器时间
     */
    _getServerTimeStamp (callBack) {
      let hostName = this.hostname;
      window.phihome.util.netRequest('get', hostName + '/v1/server/timestamp', '', '', function (response) {
        response = JSON.parse(response);
        response = JSON.parse(response.netResponse);
        callBack(response.result.timestamp);
        // todo 这里只有正常情况 需要补充异常情况 以前的代码都没有定义
      });
    },
    _parseQueryString (url) { // 解析app通过url传入的参数
      let obj = {};
      let keyValue = [];
      let key = '';
      let value = '';
      let paraString;
      if (url.substring(url.length - 2, url.length) === '#/') { // 部分安卓手机 H5首页url末尾不带 #/
        url = url.substring(0, url.length - 2);
      }
      paraString = url.substring(url.indexOf('?') + 1, url.length).split('&');
      for (let i in paraString) {
        keyValue = paraString[i].split('=');
        key = keyValue[0];
        value = keyValue[1];
        obj[key] = value;
      }
      return obj;
    }
  }
};
