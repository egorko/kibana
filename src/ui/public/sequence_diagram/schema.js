module.exports = function(header, paper, footer) {
  let _ = require('lodash');
  let action = function(action, parameter) {
    switch (action) {
      case 'move left':
        if (parameter.index > 0) {
          actors.swapActors(parameter.index, parameter.index - 1);
          resetSize();
          thisPointer.drawDiagram();
        } 
        break;
      case 'move right':
        if (parameter.index < actors.actorCount() - 1) {
          actors.swapActors(parameter.index, parameter.index + 1);
          resetSize();
          thisPointer.drawDiagram();
        }
        break;
    }
  }
  
  let Actors = require('./actors');

  let actors = new Actors(header, footer, action);
  let Messages = require('./messages');
  let messages = new Messages(paper);
  
  let thisPointer = this;
  
  this.setSessions = function(sessions) {
    messages.setSessions(sessions);
  }
  
  this.setSelectIdAction = function(callback) {
    messages.setSelectIdAction(callback);
  }
  
  this.setFont = function(font) {
    messages.setFont(font);
    actors.setFont(font);
  }
  
  this.setColors = function(colors) {
    messages.setColors(colors);
  }
  
  this.addMessage = function(message) {
    let sender = actors.addActor(message.srcName);
    let reciever = actors.addActor(message.dstName);
    messages.addMessage(sender, reciever, message);
  }

  this.clear = function() {
    messages.clear();
    actors.clear();
    clear();
    resetSize();
  }
  let clear = function(){
    header.clear();
    paper.clear();
    footer.clear();
  }
  
  let resetSize = function() {
    header.setSize(10, 10);
    paper.setSize(10, 10);
    footer.setSize(10, 10);
  }
  
  this.drawDiagram = function() {
    let actorList = actors.actorList();
    _.forEach(actorList, function(actor, index) {
      let minPosition = actor.width / 2 + actors.padding;
      if (index > 0) {
        minPosition += actorList[index - 1].position + actorList[index - 1].width / 2;
      }
      let messageHolder = []
      _.forEach(messages.getActorMsg(actor), function(message) {
        let partner = message.from == actor ? message.to : message.from;
        if (partner.index < actor.index) {
          messageHolder.push(message);
          let msgPosition = message.width + messages.padding * 2 + partner.position;
          if (msgPosition > minPosition) { 
            minPosition = msgPosition; 
          }
        }
      });
      actor.draw(header, footer, minPosition);
      _.forEach(messageHolder, function(message){
        message.draw(minPosition, paper);
      })
    });
    actors.drawLines(paper);
  }

}