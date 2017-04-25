module.exports = function(from, to, message, index, font, colors, paper){
  let getBBox = function(text) {
    let p = paper.text(0, 0, text);
    p.attr(font);
    var bb = p.getBBox();
    p.remove();
    return bb;
  }
  let animate = 'linear';
  let animateSpeed = 200;
  let bb = getBBox(message.message);
  let padding = bb.height + 10;
  let width = this.width = bb.width;
  let id = this.id = message.id;
  let graphics = {};
  let handler = function(one, two) {console.log(id)}
  
  this.from = from;
  this.to = to;
  
  this.addHandler = function(hndlr) {
    handler = hndlr;
  }
  this.draw = function(position, p) {
    let h = p.height;
    let w = p.width;
    let fromPosition = from.position == 0 ? position : from.position;
    let toPosition = to.position == 0 ? position : to.position;
    let y = (index + 1) * padding;

    if (this.line == undefined) {
      this.line = drawLine(p, fromPosition, toPosition, y);
    } else {
      moveLine(this.line, fromPosition, toPosition, y);
    }
    if (this.textBox == undefined) {
      this.textBox = drawTextBox(p, (fromPosition + toPosition) / 2 - width / 2, y - bb.height - 3, width, bb.height);
    } else {
      moveTextBox(this.textBox, (fromPosition + toPosition) / 2 - width / 2, y - bb.height - 3);
    }
    if (this.text == undefined) {
      this.text = drawText(p, (fromPosition + toPosition) / 2, y - bb.height / 2 - 2, message.message, _.get(colors, message.protocol, '#000'), font);
    } else {
      moveText(this.text, (fromPosition + toPosition) / 2, y - bb.height / 2 - 2);
    }

    this.line.click(onClick);
    this.textBox.click(onClick);
    this.text.click(onClick);
    if (y + 10 > h) {
      h = y + 10;
      p.setSize(w, h);
    }
    let newW = fromPosition > toPosition ? fromPosition : toPosition;
    if (newW > w) {
      w = newW;
      p.setSize(w, h);
    }
  }
  
  let drawLine = function(p, xFrom, xTo, y) {
    let slide = xFrom < xTo ? -10 : 10;
    let line = p.path(
      'M' + xFrom + ',' + y + 
      'L' + xTo + ',' + y +
      'L' + (xTo + slide) + ',' + (y - 3) +
      'M' + (xTo + slide) + ',' + (y + 3) + 
      'L' + xTo + ',' + y);
    line.attr('stroke', _.get(colors, message.protocol, '#000'));
    line.attr('cursor', 'pointer');
    return line;
  }
  let moveLine = function(line, xFrom, xTo, y) {
    let slide = xFrom < xTo ? -10 : 10;
    let path = 'M' + xFrom + ',' + y + 
      'L' + xTo + ',' + y +
      'L' + (xTo + slide) + ',' + (y - 3) +
      'M' + (xTo + slide) + ',' + (y + 3) + 
      'L' + xTo + ',' + y;
    line.animate({
      path: path
    }, animateSpeed, animate);
  }
  
  let drawText = function(p, x, y, text, color, font) {
    let txt = p.text(x, y, text);
    txt.attr('fill', colors);
    txt.attr(font);
    txt.attr('cursor', 'pointer');
    return txt;
  }
  
  let moveText = function(text, x, y) {
    
    text.animate({
      x: x,
      y, y
    }, animateSpeed, animate);
  }
  
  let drawTextBox = function(p, x, y, w, h) {
    let textBox = p.rect(x, y, w, h);
    textBox.attr('fill', '#fff');
    textBox.attr('cursor', 'pointer');
    return textBox;
  }
  
  let moveTextBox = function(textBox, x, y) {
    textBox.animate({
      x: x,
      y: y
    }, animateSpeed, animate)
  }
  
  this.sessionOn = function() {
    this.line.attr('stroke', 'red');
    this.text.attr('fill', 'red');
  }
  this.sessionOff = function() {
    this.line.attr('stroke', _.get(colors, message.protocol, '#000'));
    this.text.attr('fill', _.get(colors, message.protocol, '#000'));
  }
  this.messageOn = function() {
    this.text.attr('stroke', 'red');
  }
  this.messageOff = function() {
    this.text.attr('stroke', 'none');
  }
  let onClick = function() {
    handler('click', id);
  }
}