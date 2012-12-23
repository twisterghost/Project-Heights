/**
 * BasicObject.js
 * This file contains the skeleton object for a basic object in heights.js.
 */


/**
 * BasicObject constructor.
 */
var BasicObject = function(x, y, id, params) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.params = params;
  this.drawn = new Draw().rectangle({x: this.x, y: this.y, width: 16, 
      height: 16, filled: true});
};


BasicObject.prototype.step = function() {
  // Object step code here.
}


BasicObject.prototype.drawObj = function() {
  // Update this object's draw.
  this.drawn.update({x: this.x, y: this.y});
}

// What to do when this object is deleted.
BasicObject.prototype.destroy = function() {
  this.drawn.undraw();
}