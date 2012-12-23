/************************
 * Variable declarations
 ***********************/
// Original set of objects.
var objects = [];

// Objects which can collide.
var collideableObjs = [];

// Instance ID counter.
var instanceID = 0;

// Steps/second.
var fps = 60;

// Flag for if the steps are running or not.
var running = false;

// Interval ID to start/stop the game.
var runIntervalID = -1;

// Focus canvas for the game to run on.
var gameCanvas = null;

// Keys objects.
var inputObjects = [];

// Sounds.
var sounds = [];

// Flags.
var debugModeFlag = false;

// Collision thread.
var usingCollisionWorker = true;
var collisionWorker = null;

// Version number.
var version = "1.0.3";

// Viewport property variables.
var viewX = 0;
var viewY = 0;
var viewXCurrent = 0;
var viewYCurrent = 0;
var viewWidth = 0;
var viewHeight = 0;
var viewWidthCurrent = 0;
var viewHeightCurrent = 0;

// Character names dictionary.
var charNames = {
  "&" : "UP",
  "(" : "DOWN",
  "%" : "LEFT",
  "'" : "RIGHT",
  " " : "SPACE",
  "17": "CTRL",
  "18": "ALT",
  "16": "SHIFT",
  "20": "CAPS",
  "9" : "TAB",
}

var keyStatus = {};

/************************
 * Engine Functionality
 ***********************/

/**
 * Returns the version number of the engine.
 */
function getVersion() {
  return version;
}

/**
 * Runs the step function on all tracked objects.
 */
function step() {
  for (var i = 0; i < objects.length; i++) {
    try {
      objects[i].step();
      objects[i].drawObj();
    } catch (e) {
      if (debugModeFlag) {
        console.log(e);
      }
    }
  }
  setTranslation();
  setViewScale();
  checkCollisions();

  // Update drawn objects.
  getCanvas().drawLayers();
}


/**
 * Begins running the steps.
 */
function start() {
  if (gameCanvas === null) {
    gameCanvas = $("canvas");
  }

  if (usingCollisionWorker) {
    collisionWorker = new Worker("workers/heights-collisions.js");
  }
  // Set default viewport width and height.
  viewWidth = getCanvas().width();
  viewHeight = getCanvas().height();
  viewWidthCurrent = viewWidth;
  viewHeightCurrent = viewHeight;
  runSteps();
  setUpListeners();
}


/**
 * Turns off use of the collision worker, deactivating the Passive Collision
 * system. Must be called before start();
 */
function deactivatePCS() {
  usingCollisionWorker = false;
}

/**
 * Begins or resets the cycle of steps.
 */
function runSteps() {
  if (running) {
    clearInterval(runIntervalID);
  }
  runIntervalID = setInterval(step, 1000 / fps);
  running = true;
}


/**
 * Stops steps from executing
 */
function pauseSteps() {
  clearInterval(runIntervalID);
}


/**
 * Turns on input listeners.
 */
function setUpListeners() {
  getCanvas().click(handleInputs);
  $(document).keydown(handleInputs);
  $(document).keyup(handleInputs);
}


/**
 * Sets the steps per second and restarts the step interval.
 * @param newfps The new speed to run the steps at.
 */
function setFPS(newfps) {
  fps = newfps;
  runSteps();
}


/**
 * Sets which canvas to use as the game window.
 * @param setGameCanvas jQuery object of the canvas to use as the window.
 */
function setCanvas(setGameCanvas) {
  gameCanvas = setGameCanvas;
}


/**
 * Returns the current canvas in use for the game window.
 * @return The current canvas in use for the game window.
 */
function getCanvas() {
  return gameCanvas;
}


/**
 * Returns the index in the objects array where the given instance is.
 * @param instance An object reference to look up.
 * @return The position of the given object in the array or -1 if not found.
 */
function instanceArrayPosition(instance) {
  for (var i = 0; i < objects.length; i++) {
    if (objects[i] == instance) {
      return i;
    }
  }
  return -1;
}


/**
 * Sends user inputs to input dependent objects.
 * @param event The event object to send to the instances.
 */
function handleInputs(event) {
  if (event.originalEvent.type == "keydown") {
    keyStatus[getKeyPressed(event)] = true;
  } else if (event.originalEvent.type == "keyup") {
    keyStatus[getKeyPressed(event)] = false;
  }

  for (var i = 0; i < inputObjects.length; i++) {
    inputObjects[i].handleInput(event);
  }
}


/**
 * Adds an object instance to the input dependent list.
 * @param instance An object instance to add.
 */
function inputHook(obj) {
  inputObjects.push(obj);
}


/**
 * Removes the given object from the input dependent list.
 * @param instance An object reference to look up.
 */
function inputUnhook(obj) {
  for (var i = 0; i < inputObjects.length; i++) {
    if (inputObjects[i] == obj) {
      inputObjects.splice(i, 1);
    }
  }
}


/**
 * Sets the X and Y position of the viewport based on viewX and viewY.
 */
function setTranslation() {
  var moveX = viewX - viewXCurrent;
  var moveY = viewY - viewYCurrent;
  viewXCurrent = viewX;
  viewYCurrent = viewY;
  getCanvas().translateCanvas({translateX: -moveX, translateY: -moveY});
}


/**
 * Sets the width and height of the viewport based on viewWidth and viewHeight.
 */
function setViewScale() {
  var scaleX = viewWidthCurrent / viewWidth;
  var scaleY = viewHeightCurrent / viewHeight;
  viewHeightCurrent = viewHeight;
  viewWidthCurrent = viewWidth;
  getCanvas().scaleCanvas({scaleX: scaleX, scaleY: scaleY, x: viewX, y: viewY});
}


/**
 * Turn on or off debug mode (exception logging to the console).
 * @param onoff True to turn on debug mode, false to turn it off.
 */
function debugMode(onoff) {
  debugModeFlag = onoff;
}


/**
 * Tells the engine to track collisions for an object.
 * @param obj The object to start tracking.
 */
function collideable(obj) {
  collideableObjs.push(obj);
}


function checkCollisions() {
  collisionWorker.postMessage(JSON.stringify(collideableObjs));
  collisionWorker.onmessage = function(event) {
    var couple = JSON.parse(event.data);
    var obj1 = getInstanceByID(couple[0]);
    var obj2 = getInstanceByID(couple[1]);
    try {
      obj1.onCollision(obj2);
    } catch (e) {
      // yo.
    }
  };
}

/************************
 * Utilities
 ***********************/

/**
 * Includes the given filepath by writing the html.
 * @param filepath Path to the file to include.
 */
function resource(filepath) {
  document.write("<script type='text/javascript' src='" + filepath + "'>" +
      "</script>");
}


/**
 * Returns the given variable or the given default if the variable is undefined.
 * @param variable The variable to check for definition.
 * @param defaultValue The value to return if variable is undefined.
 * @return variable if it is defined, defaultValue if variable is undefined.
 */
function varDefault(variable, defaultValue) {
  return typeof(variable) !== 'undefined' ? variable : defaultValue;
}


/**
 * Returns a unique ID for use anywhere in the engine.
 * @return A unique ID integer.
 */
function getUniqueID() {
  return instanceID++;
}


/**
 * Converts a property name from prop to newProp in obj.
 * @param  obj  The object to convert the property on.
 * @param  prop The original name of the property.
 * @param  newProp The new name of the property.
 * @return The object with the changed property.
 */
function convertProperty(obj, prop, newProp) {
  if (obj.hasOwnProperty(prop)) {
    obj[newProp] = obj[prop];
    delete obj[prop];
  }
  return obj;
}

/************************
 * API Functionality
 ***********************/

/**
 * Creates an instance of the given class at position x, y in the game.
 * @param x The x position to spawn the instance at.
 * @param y The y position to spawn the instance at.
 * @param obj The class of object to spawn.
 * @param params Additional parameters to pass into the object.
 * @return The newly created object.
 */
function createInstance(x, y, obj, params) {
  params = varDefault(params, 0);
  var newObj = new obj(x, y, instanceID, params);
  instanceID++;
  objects.push(newObj);
  return newObj;
}


/**
 * Destroys the instance with the given instanceID.
 * @param instanceID The id of the instance to delete.
 */
function destroyInstance(instance) {

  // Remove from objects array.
  var objectIndex = instanceArrayPosition(instance);
  var ret = objects.splice(objectIndex, 1);

  // Remove from collideable array.
  collideableObjs.splice(collideableObjs.indexOf(instance), 1);

  // Try calling destroy on the object.
  try {
    ret[0].destroy();
  } catch (e) {
    // Object didn't have destroy();
  }

  // Boom.
  delete instance;
}


/**
 * Returns a reference to the object with the given ID.
 * @param instanceID The id of the object to return.
 * @return The object with the given ID or null if not found.
 */
function getInstanceByID(instanceID) {
  for (var i = 0; i < objects.length; i++) {
    if (objects[i].id == instanceID) {
      return objects[i];
    }
  }
  return null;
}


/**
 * Checks if two instances are colliding in a rectangle.
 * @param obj1 The first of the object pair to check.
 * @param obj2 The second of the object pair to check.
 * @return true if a collision is found, false if not.
 */
function collisionInstance(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}


/**
 * Checks if a given instance is colliding with any instance of the given type
 * of object in a rectangle.
 * @param obj The instance to check collision for.
 * @param objclass The class of object to check collision against.
 * @return true if a collision is found, false if not.
 */
function collisionObject(obj, objclass) {
  var checkObjs = getObjectsOfType(objclass);
  for (var i = 0; i < checkObjs.length; i++) {
    if (checkObjs[i] != obj) {
      if (collisionInstance(obj, checkObjs[i])) {
        return checkObjs[i];
      }
    }
  }
  return null;
}


/**
 * Checks if a given instance is colliding with the given point.
 * @param obj The instance to check collision for.
 * @param x The x position of the point in question.
 * @param y The y position of the point in question.
 */
function collisionPoint(obj, x, y) {
  return x >= obj.x && x <= obj.x + obj.width &&
         y >= obj.y && y <= obj.y + obj.height;
}


/**
 * Returns an array of all known objects of the given type.
 * @return An array of all known objects of the given type.
 */
function getObjectsOfType(objType) {
  var objArr = [];
  for (var i = 0; i < objects.length; i++) {
    if (objects[i] instanceof objType) {
      objArr.push(objects[i]);
    }
  }
  return objArr;
}


/**
 * Checks if an instance of the given object type exists.
 * @param objType The class of the object to look for.
 * @return The first object of the given type found or false if no objects of
 *         the given type exist.
 */
function instanceExists(objType) {
  for (var i = 0; i < objects.length; i++) {
    if (objects[i] instanceof objType) {
      return objects[i];
    }
  }
  return false;
}


/**
 * Calculates the distance between two instances.
 * @param obj1 The first of the two objects to calculate from.
 * @param obj2 The second of the two objects to calculate from.
 * @return The distance bewteen obj1 and obj2 based on the distance formula.
 */
function instanceDistance(obj1, obj2) {
  return Math.sqrt(Math.pow((obj2.x - obj1.x), 2) +
      Math.pow((obj2.y - obj1.y), 2));
}


/**
 * Returns the keyCode from the given input object.
 * @param  input The input object.
 * @return The keycode from the input object.
 */
function getKeyCode(input) {
  return input.keyCode;
}


/**
 * Returns the character from the given input object.
 * @param  input The input object.
 * @return The character or string of the key pressed.
 */
function getKeyPressed(input) {
  var pressed = String.fromCharCode(input.keyCode);
  if (charNames.hasOwnProperty(pressed)) {
    pressed = charNames[pressed];
  }
  if (charNames.hasOwnProperty(input.keyCode.toString())) {
    pressed = charNames[input.keyCode.toString()];
  }
  return pressed;
}


/**
 * Returns true if the given key is currently down.
 * @param  key The key to check for.
 * @return True if the key is down. False otherwise.
 */
function keyDown(key) {
  key = key.toUpperCase();
  if (keyStatus.hasOwnProperty(key)) {
    return keyStatus[key];
  }
  return false;
}


/**
 * Bounds an instance by resetting X and Y positions if the instance leaves the
 * boundaries given.
 * @param obj The instance to bound.
 * @param minX The minimum X value the instance can have.
 * @param minY The minimum Y value the instance can have.
 * @param maxX The maximum X value the instance can have.
 * @param maxY The maximum Y value the instance can have.
 */
function boundInstance(obj, minX, minY, maxX, maxY) {
  if (obj.x > maxX) {
    obj.x = maxX;
  }
  if (obj.x < minX) {
    obj.x = minX;
  }
  if (obj.y > maxY) {
    obj.y = maxY;
  }
  if (obj.y < minY) {
    obj.y = minY;
  }
}

/************************
 * API Objects
 ***********************/

 /**
  * Object: sound
  * Interface for loading, playing and controlling sounds.
  * @param soundLocation The url of the sound to be played.
  * @param mimeType The MIME type of the sound to be played.
  */
var Sound = function(soundLocation) {
  // TODO: Further testing w/ lack of MIME type.
  this.mimeType = "";
  var elem = "<audio><source src=\"" + soundLocation + "\" type=\"" +
      this.mimeType + "\"></audio>";
  this.audioElement = $(elem);
  $("body").append(this.audioElement);
  this.audioElement[0].load();
  sounds.push(this);
};


/**
 * Plays the sound.
 */
Sound.prototype.play = function() {
  this.audioElement[0].play();
};


/**
 * Pauses the sound.
 */
Sound.prototype.pause = function() {
  this.audioElement[0].pause();
};


/**
 * Begins looping the sound.
 */
Sound.prototype.loop = function() {
  this.audioElement[0].loop = true;
  this.audioElement[0].play();
};


/**
 * Resets the current position of the sound.
 */
Sound.prototype.reset = function() {
  this.audioElement[0].currentTime = 0;
};


/**
 * Stops the sound.
 */
Sound.prototype.stop = function() {
  this.audioElement[0].pause();
  this.audioElement[0].currentTime = 0;
};


/**
 * Unloads and removes the sound from the page.
 */
Sound.prototype.unload = function() {
  this.audioElement.remove();
};


/**
 * Returns the current playing time of the audio file.
 * @return The current playing time of the audio file in seconds.
 */
Sound.prototype.getTime = function() {
  return this.audioElement[0].currentTime;
};


/**
 * Gets the given property of the audio.
 * @param prop The property to look up.
 * @return The value of the property.
 */
Sound.prototype.getProperty = function(prop) {
  return this.audioElement[0][prop];
};


/**
 * Sets a property of the audio element.
 * @param prop  The property to set.
 * @param value The value to set the property to.
 */
Sound.prototype.setProperty = function(prop, value) {
  this.audioElement[0][prop] = value;
}

/**
 * Object: Draw
 * Handles graphical drawing to the 2D canvas context.
 */
var Draw = function() {
  this.id = getUniqueID();
  this.type = Draw.DRAW;
};


// Define draw object constants.
Draw.prototype.DRAW = 0;
Draw.prototype.CIRLCE = 1;
Draw.prototype.SPRITE = 2;
Draw.prototype.SPRITESHEET = 3;
Draw.prototype.RECTANGLE = 4;
Draw.prototype.LINE = 5;
Draw.prototype.TEXT = 6;
Draw.prototype.POLYGON = 7;


/**
 * Draws a circle with the given params, creating a new layer.
 * @param params An array of parameters for the circle.
 * @return the draw object.
 */
Draw.prototype.circle = function(params) {
  params.x = varDefault(params.x, 0);
  params.y = varDefault(params.y, 0);
  params.rad = varDefault(params.rad, 0);
  params.color = varDefault(params.color, "#000");
  params.width = varDefault(params.width, 1);
  params.centered = varDefault(params.centered, true);
  params.updateable = varDefault(params.updateable, true);
  params.filled = varDefault(params.filled, false);
  
  // Normalize parameters.
  params.layer = true;
  params.name = this.id.toString();
  params = this.normalizeDrawParams(params);
  this.type = Draw.CIRCLE;
  getCanvas().drawArc(params);
  return this;
};


/**
 * Draws an image with the given params, creating a new layer.
 * @param params An array of parameters for the image.
 * @return the draw object.
 */
Draw.prototype.sprite = function(params) {
  params.x = varDefault(params.x, 0);
  params.y = varDefault(params.y, 0);
  params.url = varDefault(params.url, "");
  params.centered = varDefault(params.centered, false);
  params.rotate = varDefault(params.rotate, 0);
  
  // Normalize parameters.
  params = this.normalizeDrawParams(params);
  params.layer = true;
  params.name = this.id.toString();
  this.type = Draw.SPRITE;
  getCanvas().drawImage(params);
  return this;
};


/**
 * Draws an image with the given params, creating a new layer.
 * @param params An array of parameters for the image.
 * @return the draw object.
 */
Draw.prototype.spriteSheet = function(params) {
  params.x = varDefault(params.x, 0);
  params.y = varDefault(params.y, 0);
  params.cropX = varDefault(params.cropX, 0);
  params.cropY = varDefault(params.cropY, 0);
  params.cropWidth = varDefault(params.cropWidth, 32);
  params.cropHeight = varDefault(params.cropHeight, 32);
  params.url = varDefault(params.url, "");
  params.centered = varDefault(params.centered, false);
  params.updateable = varDefault(params.updateable, true);
  params.cropFromCenter = false;
  
  this.spriteWidth = params.cropWidth;
  this.spriteHeight = params.cropHeight;
  this.spritesPerRow = varDefault(params.spritesPerRow, 1);
  this.totalSprites = varDefault(params.totalSprites, 1);
  this.spriteIndex = varDefault(params.spriteIndex, 0);
  
  // Normalize paramseters.
  params = this.normalizeDrawParams(params);
  params.layer = true;
  params.name = this.id.toString();
  this.type = Draw.SPRITESHEET;
  getCanvas().drawImage(params);
  return this;
};


/**
 * Draws the current sprite index from the spritesheet.
 */
Draw.prototype.cropToCurrentSprite = function() {
  var xx = Math.floor(this.spriteIndex / this.spritesPerRow) * this.spriteWidth;
  var yy = (this.spriteIndex % this.spritesPerRow) * this.spriteHeight;
  this.update({cropX: xx, cropY: yy});
}


/**
 * Goes to the next frame on the spriteSheet.
 */
Draw.prototype.nextSprite = function() {
  if (this.type == Draw.SPRITESHEET) {
    this.spriteIndex = (this.spriteIndex + 1) % this.totalSprites;
    this.cropToCurrentSprite();
  }
}


/**
 * Sets the current frame of the spritesheet.
 */
Draw.prototype.gotoSprite = function(ind) {
  if (this.type == Draw.SPRITESHEET) {
    this.spriteIndex = ind % this.totalSprites;
  }
}


/**
 * Draws a rectangle with the given params, creating a new layer.
 * @param params An array of parameters for the rectangle.
 * @return the draw object.
 */
Draw.prototype.rectangle = function(params) {
  params.x = varDefault(params.x, 0);
  params.y = varDefault(params.y, 0);
  params.width = varDefault(params.width, 0);
  params.height = varDefault(params.height, 0);
  params.filled = varDefault(params.filled, false);
  params.color = varDefault(params.color, "#000");
  params.type = Draw.RECTANGLE;
  params.lineWidth = varDefault(params.lineWidth, 1);
  
  // Normalize parameters.
  params = this.normalizeDrawParams(params);
  params.layer = true;
  params.name = this.id.toString();
  this.type = Draw.RECTANGLE;
  
  getCanvas().drawRect(params);
  return this;
}


/**
 * Draws a polygon with the given params, creating a new layer.
 * @param params An array of parameters for the polygon.
 * @return the draw object.
 */
Draw.prototype.polygon = function(params) {
  params.x = varDefault(params.x, 0);
  params.y = varDefault(params.y, 0);
  params.width = varDefault(params.width, 0);
  params.height = varDefault(params.height, 0);
  params.filled = varDefault(params.filled, false);
  params.color = varDefault(params.color, "#000");
  params.type = Draw.POLYGON;
  params.lineWidth = varDefault(params.lineWidth, 1);
  params.sides = varDefault(params.sides, 3);
  params.centered = varDefault(params.centered, true);
  params.radius = varDefault(params.radius, 10);
  params.projection = varDefault(params.projection, .5);
  
  // Normalize parameters.
  params = this.normalizeDrawParams(params);
  this.type = Draw.POLYGON;
  params.layer = true;
  params.name = this.id.toString();
  
  getCanvas().drawPolygon(params);
  return this;
}


/**
 * Draws text with the given params, creating a new layer.
 * @param params An array of parameters for the text.
 * @return the draw object.
 */
Draw.prototype.text = function(params) {
  params.x = varDefault(params.x, 0);
  params.y = varDefault(params.y, 0);
  params.centered = varDefault(params.centered, false);
  params.text = varDefault(params.text, "");
  params.font = varDefault(params.font, "12pt Helvetica");
  params.color = varDefault(params.color, "#000");
  params.filled = varDefault(params.filled, true);
  
  // Normalize parameters.
  params = this.normalizeDrawParams(params);
  this.type = Draw.TEXT;
  params.layer = true;
  params.name = this.id.toString();

  getCanvas().drawText(params);
  return this;
};


/**
 * Updates the drawn object with the given params.
 * @param params An array of jCanvas parameters for the layer.
 */
Draw.prototype.update = function(params) {
  params = this.normalizeDrawParams(params);
  getCanvas().setLayer(this.id.toString(), params);
};


/**
 * Removes the drawn object from the canvas.
 */
Draw.prototype.undraw = function() {
  getCanvas().removeLayer(this.id.toString());
};


/**
 * Normalizes the parameters for the Draw object.
 */
Draw.prototype.normalizeDrawParams = function(params) {
  if (params.filled) {
    params = convertProperty(params, "color", "fillStyle");
  }
  params = convertProperty(params, "cropX", "sx");
  params = convertProperty(params, "cropY", "sx");
  params = convertProperty(params, "cropWidth", "sWidth");
  params = convertProperty(params, "cropHeight", "sHeight");
  params = convertProperty(params, "url", "source");
  params = convertProperty(params, "centered", "fromCenter");
  params = convertProperty(params, "color", "strokeStyle");
  params = convertProperty(params, "lineWidth", "strokeWidth");
  return params;
}
