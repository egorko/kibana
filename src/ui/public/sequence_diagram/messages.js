module.exports = function( paper){
  let Message = require('./message');
  let _ = require('lodash');
  let messages = [];
  let sessions = {};
  let selectId = function(id) {console.log('selectId function not defined')}
  
  this.padding = 17;
  this.addMessage = function(from, to, message) {
    let index = messages.length;
    let msg = new Message(from, to, message, index, this.font, this.color, paper);
    msg.addHandler(handler);
    messages.push(msg);
  }
  this.clear = function() {
    messages = [];
  }
  this.setFont = function(font) {
    this.font = font;
  }
  this.setColors = function(color) {
    this.color = color;
  }
  this.setSessions = function(s) {
    this.sessions = sessions = s;
  }
  this.setSelectIdAction = function(callback) {
    this.selectId = selectId = callback;
  }
  this.getActorMsg = function(actor) {
    return _.filter(messages, function(message) {
      return message.from == actor || message.to == actor;
    })
  }
  
  let handler = function(event, params) {
    switch(event) {
      case 'click':
        highlightSessions(params);
        selectId(params);
      break;
    }
  }
  let highlightSessions = function(id) {
    let idArray = _.find(sessions, function(ids){
      return _.contains(ids, id);
    });
    _.forEach(messages, function(message) {
      if (_.contains(idArray, message.id)) {
        message.sessionOn();
      } else {
        message.sessionOff();
      }
      if (message.id == id) {
        message.messageOn();
      } else {
        message.messageOff();
      }
    })
    
  }
}