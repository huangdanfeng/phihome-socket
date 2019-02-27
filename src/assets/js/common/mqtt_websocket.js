/**
 * Created by patty on 2018/1/16.
 */
/* eslint-disable */
const timeout = 10; // 超时时间
const keepAlive = 60;   // 心跳时间秒
const cleanSession = false;  // 会话清理
const ssl = false;
const retain = false; // 保存消息
const userName = 'admin';
const password = 'password';

let getDataFn;

export let websocketClient = {
  'client': null,
  'connected': false,
  'connect': function (host, port, clientId) {
    this.client = new Messaging.Client(host, port, clientId); // 建立客户端实例
    this.client.onConnectionLost = this.onConnectionLost; // 注册连接断开处理事件
    this.client.onMessageArrived = this.onMessageArrived; // 注册消息接收处理事件
    return new Promise((resolve, reject) => {
      let options = {
        invocationContext: {
          host: host,
          port: port,
          path: this.client.path,
          clientId: clientId
        },
        timeout: timeout,
        keepAliveInterval: keepAlive,
        cleanSession: cleanSession,
        useSSL: ssl,
        userName: userName,
        password: password,
        onSuccess: () => {
          this.onConnect();
          resolve();
        },
        onFailure: (message) => {
          this.onFail();
          reject();
        }
      }
      this.client.connect(options); // 连接服务器并注册连接成功、失败处理事件
    });
  },

  'onConnect': function () {
    this.connected = true;
    console.log('connected');
  },

  'onFail': function (message) {
    this.connected = false;
    console.log('error: ' + message.errorMessage);
  },

  'onConnectionLost': function (responseObject) {
    this.connected = false;
    if (responseObject.errorCode !== 0) {
      console.log('onConnectionLost:' + responseObject.errorMessage);
    }
    return responseObject;
  },

  'onMessageArrived': function (message) {
    let messageObj = {
      'topic': message.destinationName,
      'retained': message.retained,
      'qos': message.qos,
      'payload': message.payloadString
    };
    getDataFn = new CustomEvent('getMessages', {'detail': messageObj});
    document.dispatchEvent(getDataFn);
    return messageObj;
  },

  'disconnect': function () {
    this.client.disconnect();
  },

  'subscribe': function (topic, qosNr) { // 订阅主题
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        console.log('Not connected by subscribe');
        reject();
        return false;
      }
      this.client.subscribe(topic, {qos: qosNr});
      resolve();
      return true;
    });
  },

  'publish': function (topic, pubmsg, qos) { // 发送消息
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        console.log('Not connected by publish');
        reject();
        return false;
      }
      let message = new Messaging.Message(pubmsg);
      message.destinationName = topic;
      message.qos = qos;
      message.retained = retain;
      this.client.send(message);
      resolve();
    });
  }
};

// 使用demo ：

// 在文件中引入此对象
// //import {websocketClient} from '@/assets/js/common/mqtt_websocket.js';
// const topic1 = '$phihome/shadow/outlet_tc1/00D0BAE45058AA51BE1CD3EA/OutletStatus/#';
// const topic2 = '$phihome/shadow/outlet_tc1/00D0BAE45058AA51BE1CD3EA/OutletStatus/get';
// const clientid = 'phihome_admin32525321';
// const host = 'dev.home.phiwifi.com';
// const port = 9080;
//
// websocketClient.connect(host, port, clientid).then(() => { // 建立MQTT连接
//   websocketClient.subscribe(topic1, 1).then(() => {  // 订阅一个主题
//     console.log('subscribe!');
//     websocketClient.publish(topic2, '', 1); // 发布信息
//   }).catch(() => {
//     console.log('subscribe fail');
//   });
// }).catch(() => {
//   console.log('connect fail');
// });
//
// document.addEventListener('getMessages', function (event) { // 监听MQTT返回值
//   console.log(event.detail);
// }, false);
