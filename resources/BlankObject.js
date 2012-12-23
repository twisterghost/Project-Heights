/**
 * BlankObject.js
 * This file contains the skeleton object for an object using all passive 
 * systems and built-in object structure standards, without filler code or 
 * comments.
 * Begin by find/replace-alling "BlankObject" with your object's name.
 */


var BlankObject = function(x, y, id, params) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.params = params;
  inputHook(this);
  collideable(this);
};


BlankObject.prototype.handleInput = function(input) {

};


BlankObject.prototype.onCollision = function(other) {

};


BlankObject.prototype.step = function() {

}


BlankObject.prototype.drawObj = function() {

}


BlankObject.prototype.destroy = function() {

}