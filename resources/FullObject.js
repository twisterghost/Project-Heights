/**
 * FullObject.js
 * This file contains the skeleton object for an object using all passive 
 * systems and built-in object structure standards.
 */


/**
 * FullObject constructor
 */
var FullObject = function(x, y, id, params) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.params = params;
  this.drawn = new Draw().rectangle({x: this.x, y: this.y, width: 16, 
      height: 16, filled: true});
      
  // This enables the Passive Input System for this object.
  inputHook(this);
  
  // This enables the Passive Collision System for this object.
  collideable(this);
};


/**
 * Handle input events sent to this object by the Passive Input System.
 */
FullObject.prototype.handleInput = function(input) {
  
  // Here we are doing a switch on the input type to handle different inputs.
  switch(getInputType(input)) {
    case "click":
      // Handle click input.
      break;
    case "keydown":
      // Handle keydown input.
      break;
    case "keyup":
      // Handle keyup input.
      break;
  }
};


/**
 * Handle collisions events sent to this object by the Passive Collision System.
 */
FullObject.prototype.onCollision = function(other) {
  /**
   * Handle collisions here. 'other' is the object this is colliding with.
   * Other objects must be collideable for this function to be called. This is
   * using the Passive Collision System.
   * Docs: http://docs.heightsjs.com/details/passiveCollisionSystem
   */
};


FullObject.prototype.step = function() {
  // Object step code here.
}


FullObject.prototype.drawObj = function() {
  // Update this object's draw.
  this.drawn.update({x: this.x, y: this.y});
}


FullObject.prototype.destroy = function() {
  
}