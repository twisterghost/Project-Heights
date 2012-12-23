/**
 * InputObject.js
 * This file contains the skeleton object for an input-responsive object for 
 * heights.js using the Passive Input System.
 */


/**
 * InputObject constructor
 */
var InputObject = function(x, y, id, params) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.params = params;
  this.drawn = new Draw().rectangle({x: this.x, y: this.y, width: 16, 
    height: 16, filled: true});
      
  // This enables the Passive Input System for this object.
  inputHook(this);
};


/**
 * Handle input events sent to this object by the Passive Input System.
 * Docs: http://docs.heightsjs.com/details/passiveInputSystem
 */
InputObject.prototype.handleInput = function(input) {
  
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


InputObject.prototype.step = function() {
  // Object step code here.
}


InputObject.prototype.drawObj = function() {
  // Update this object's draw.
  this.drawn.update({x: this.x, y: this.y});
}


// What to do when this object is deleted.
InputObject.prototype.destroy = function() {
  this.drawn.undraw();
}