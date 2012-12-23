/**
 * CollideableObject.js
 * This file contains the skeleton object for a collideable object using the 
 * Passive Collision System.
 */


/**
 * CollideableObject constructor.
 */
var CollideableObject = function(x, y, id, params) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.params = params;
  this.drawn = new Draw().rectangle({x: this.x, y: this.y, width: 16, 
      height: 16, filled: true});
      
  // This enables the Passive Collision System for this object.
  collideable(this);
};


/**
 * Handle collisions events sent to this object by the Passive Collision System.
 */
CollideableObject.prototype.onCollision = function(other) {
  /**
   * Handle collisions here. 'other' is the object this is colliding with.
   * Other objects must be collideable for this function to be called. This is
   * using the Passive Collision System.
   * Docs: http://docs.heightsjs.com/details/passiveCollisionSystem
   */
};


CollideableObject.prototype.step = function() {
  // Object step code here.
}


CollideableObject.prototype.drawObj = function() {
  // Update this object's draw.
  this.drawn.update({x: this.x, y: this.y});
}


// What to do when this object is deleted.
CollideableObject.prototype.destroy = function() {
  this.drawn.undraw();
}