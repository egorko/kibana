module.exports = function(header, footer, callback){
  let Actor = require('./actor');
  let actors = [];
  let _ = require('lodash');
  this.padding = 20;
  this.addActor = function(text) {
    let actor = getActor(text);
    if (actor == undefined) {
      let index = actors.length;
      actor = new Actor(text, index, this.font, header, callback);
      actors.push(actor);
    }
    return actor;
  }
  
  this.actorCount = function() {
    return actors.length;
  }
  
  this.clear = function() {
    actors = [];
  }
  
  this.setFont = function(font) {
    this.font = font;
  }
  
  this.actorList = function() {
    return actors;
  }
  
  this.swapActors = function(a1, a2) {
    let tmpActor = actors[a1];
    actors[a1] = actors[a2];
    actors[a2] = tmpActor;
    actors[a1].setIndex(a1);
    actors[a2].setIndex(a2);
  }
  
  this.drawLines = function(p) {
    let h = p.height;
    _.forEach(actors, function(actor) {
      actor.drawLine(p);
    })
  }
  
  let getActor = function(text) {
    return _.find(actors, actor => actor.text == text);
  }
}