module.exports = function(text, index, font, paper, callback){
  let getBBox = function(text) {
    let p = paper.text(0, 0, text);
    p.attr(font);
    var bb = p.getBBox();
    p.remove();
    return bb;
  }
  let animate = 'linear';
  let animateSpeed = 200;
  let thisContext = this;
  let textPadding = 10;
  let bb = getBBox(text);
  this.text = text;
  this.index = index;
  this.width = bb.width + textPadding * 2;
  this.height = bb.height + textPadding * 2;
  this.position = 0;
  this.box = {};
  this.message = {};
  this.ears = {};
  
  this.setIndex = function(indx) {
    this.index = indx;
  }
  this.draw = function(top, bottom, position) {
    let w = top.width;
    let h = top.height;
    this.position = position;
    let pBox = {
      left: position - this.width / 2,
      right: position + this.width / 2,
      vCenter: this.height / 2
    }

    if (this.box.top == undefined) {
      this.box.top = drawBox(top, pBox.left, 0, this.width, this.height);
      this.box.top.hover(showEars, hideEars, this, this);
    } else {
      moveBox(this.box.top, pBox.left, 0);
    }
    
    if (this.box.bottom == undefined) {
      this.box.bottom = drawBox(bottom, pBox.left, 0, this.width, this.height);
    } else {
      moveBox(this.box.bottom, pBox.left, 0);
    }

    if (this.message.top == undefined) {
      this.message.top = drawText(top, position, this.height / 2, this.text);
      this.message.top.hover(showEars, hideEars, this, this);
    } else {
      moveText(this.message.top, position, this.height / 2);
    }
      
    
    if (this.message.bottom == undefined) {
      this.message.bottom = drawText(bottom, position, this.height / 2, this.text);
    } else {
      moveText(this.message.bottom, position, this.height / 2);
    }
    
    if (this.ears.left == undefined) {
      this.ears.left = drawDirection(top, pBox.left + 2, this.height / 2, 1);
      this.ears.left.hover(showEars, hideEars, this, this);
      this.ears.left.click(clickLeft);
    } else {
      moveDirection(this.ears.left, pBox.left + 2, this.height / 2, 1);
    }
      
    if (this.ears.right == undefined) {
      this.ears.right = drawDirection(top, pBox.right - 2, this.height / 2, -1);
      this.ears.right.hover(showEars, hideEars, this, this);
      this.ears.right.click(clickRight);
    } else {
      moveDirection(this.ears.right, pBox.right - 2, this.height / 2, -1);
    }

    hideEars.call(this);

    if (this.height > h) {
      h = this.height;
      top.setSize(w, h);
      bottom.setSize(w, h);
    }
    if (position + this.width / 2 > w) {
      w = position + this.width;
      top.setSize(w, h);
      bottom.setSize(w, h);
    }
  }
  
  let clickLeft = function() {
    callback('move left', {'index': thisContext.index} );
  }
  
  let clickRight = function() {
    callback('move right', {'index': thisContext.index} );
  }
  
  let getDirectionPath = function(x, y, direction) {
    let d = direction;
    let pathString = 'M' + x + ',' + y;
    x += 10 * d;
    y -= 10;
    pathString += 'L' + x + ',' + y;
    y += 5;
    pathString += 'V' + y;
    x += 5 * d;
    pathString += 'H' + x;
    y += 10;
    pathString += 'V' + y;
    x -= 5 * d;
    pathString += 'H' + x;
    y += 5;
    pathString += 'V' + y;
    pathString += 'Z';
    return pathString;
  }
    
  let drawDirection = function(p, x, y, direction) {
    let path = p.path(getDirectionPath(x, y, direction));
    path.attr('cursor', 'pointer');
    path.attr('fill', '#fff');
    return path;
  }
  
  let moveDirection = function(path, x, y, direction) {
    path.animate({
      path: getDirectionPath(x, y, direction)
    }, animateSpeed, animate)
  }
  
  let drawBox = function(p, x, y, w, h) {
    let box = p.rect( x, y, w, h);
    box.attr({
      class: 'diagram-actor-box',
      fill: '#fff'
    });
    return box;
  }
  
  let moveBox = function(box, x, y) {
    box.animate({
      x: x,
      y: y
    }, animateSpeed, animate)
  }
  
  let drawText = function(p, x, y, text) {
    let msg = p.text(x, y, text);
    let attrs = _.merge(font, {cursor: 'default'});
    msg.attr(attrs);
    return msg;
  }
  
  let moveText = function(text, x, y) {
    text.animate({
      x: x,
      y: y
    }, animateSpeed, animate)
  }
  
  this.drawLine = function(p) {
    let h = p.height;
    let path = 'M' + this.position + ',0L' + this.position + ',' + h;
    if (this.vLine == undefined) {
      this.vLine = p.path(path);
    } else {
      this.vLine.animate({path: path}, animateSpeed, animate);
    }
    this.vLine.toBack();
  }
  
  let showEars = function() {
    this.ears.left.show();
    this.ears.right.show();
    this.message.top.attr('opacity', '.2');
  }
  
  let hideEars = function() {
    this.ears.left.hide();
    this.ears.right.hide();
    this.message.top.attr('opacity', '1');
  }
}