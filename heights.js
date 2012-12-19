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
var collisionWorker = new Worker("workers/heights-collisions.js");

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
 * Runs the step function on all tracked objects.
 */
function step() {
  for (var i = 0; i < objects.length; i++) {
    try {
      objects[i].step();
      objects[i].drawObj();
    } catch (e) {
      if (debugMode) {
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

  // Set default viewport width and height.
  viewWidth = getCanvas().width();
  viewHeight = getCanvas().height();
  viewWidthCurrent = viewWidth;
  viewHeightCurrent = viewHeight;
  runSteps();
  setUpListeners();
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
 * Object: draw
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
  this.x = varDefault(params.x, 0);
  this.y = varDefault(params.y, 0);
  this.rad = varDefault(params.rad, 0);
  this.color = varDefault(params.color, "#000");
  this.width = varDefault(params.width, 1);
  this.centered = varDefault(params.centered, true);
  this.updateable = varDefault(params.updateable, true);
  this.filled = varDefault(params.filled, false);
  this.type = Draw.CIRCLE;

  if (this.filled) {
    getCanvas().drawArc({
      layer: this.updateable,
      name: this.id.toString(),
      strokeStyle: this.color,
      strokeWidth: this.width,
      fillStyle: this.color,
      fromCenter: this.centered,
      x: this.x, y: this.y,
      radius: this.rad,
    });
  } else {
    getCanvas().drawArc({
      layer: this.updateable,
      name: this.id.toString(),
      strokeStyle: this.color,
      strokeWidth: this.width,
      fromCenter: this.centered,
      x: this.x, y: this.y,
      radius: this.rad,
    });
  }
  return this;
};


/**
 * Draws an image with the given params, creating a new layer.
 * @param params An array of parameters for the image.
 * @return the draw object.
 */
Draw.prototype.sprite = function(params) {
  this.x = varDefault(params.x, 0);
  this.y = varDefault(params.y, 0);
  this.url = varDefault(params.url, "");
  this.centered = varDefault(params.centered, false);
  this.updateable = varDefault(params.updateable, true);
  this.rotate = varDefault(params.rotate, 0);
  this.type = Draw.SPRITE;

  getCanvas().drawImage({
    layer: this.updateable,
    name: this.id.toString(),
    source: this.url,
    x: this.x, y: this.y,
    rotate: this.rotate,
    fromCenter: this.centered,
  });
  return this;
};


/**
 * Draws an image with the given params, creating a new layer.
 * @param params An array of parameters for the image.
 * @return the draw object.
 */
Draw.prototype.spriteSheet = function(params) {
  this.x = varDefault(params.x, 0);
  this.y = varDefault(params.y, 0);
  this.cropX = varDefault(params.cropX, 0);
  this.cropY = varDefault(params.cropY, 0);
  this.cropWidth = varDefault(params.cropWidth, 32);
  this.cropHeight = varDefault(params.cropHeight, 32);
  this.url = varDefault(params.url, "");
  this.centered = varDefault(params.centered, false);
  this.updateable = varDefault(params.updateable, true);
  this.type = Draw.SPRITESHEET;
  getCanvas().drawImage({
    layer: this.updateable,
    name: this.id.toString(),
    source: this.url,
    x: this.x, y: this.y,
    sx: this.cropX, sy: this.cropY,
    sWidth: this.cropWidth, sHeight: this.cropHeight,
    fromCenter: this.centered,
    cropFromCenter: false,
  });
  return this;
};


/**
 * Draws a rectangle with the given params, creating a new layer.
 * @param params An array of parameters for the rectangle.
 * @return the draw object.
 */
Draw.prototype.rectangle = function(params) {
  this.x = varDefault(params.x, 0);
  this.y = varDefault(params.y, 0);
  this.width = varDefault(params.width, 0);
  this.height = varDefault(params.height, 0);
  this.filled = varDefault(params.filled, false);
  this.color = varDefault(params.color, "#000");
  this.type = Draw.RECTANGLE;
  this.lineWidth = varDefault(params.lineWidth, 1);
  if (this.filled) {
    getCanvas().drawRect({
      x: this.x, y: this.y,
      width: this.width, height: this.height,
      fillStyle: this.color,
      strokeStyle: this.color,
      layer: true,
      name: this.id.toString(),
      fromCenter: false,
    });
  } else {
    getCanvas().drawRect({
      x: this.x, y: this.y,
      width: this.width, height: this.height,
      strokeStyle: this.color,
      strokeWidth: this.lineWidth,
      layer: true,
      name: this.id.toString(),
      fromCenter: false,
    });
  }
  return this;
}


/**
 * Draws a polygon with the given params, creating a new layer.
 * @param params An array of parameters for the polygon.
 * @return the draw object.
 */
Draw.prototype.polygon = function(params) {
  this.x = varDefault(params.x, 0);
  this.y = varDefault(params.y, 0);
  this.width = varDefault(params.width, 0);
  this.height = varDefault(params.height, 0);
  this.filled = varDefault(params.filled, false);
  this.color = varDefault(params.color, "#000");
  this.type = Draw.POLYGON;
  this.lineWidth = varDefault(params.lineWidth, 1);
  this.sides = varDefault(params.sides, 3);
  this.centered = varDefault(params.centered, true);
  this.radius = varDefault(params.radius, 10);
  this.projection = varDefault(params.projection, .5);
  if (this.filled) {
    getCanvas().drawPolygon({
      x: this.x, y: this.y,
      width: this.width, height: this.height,
      fillStyle: this.color,
      layer: true,
      name: this.id.toString(),
      fromCenter: this.centered,
      sides: this.sides,
      radius: this.radius,
      projection: this.projection,
    });
  } else {
    getCanvas().drawPolygon({
      x: this.x, y: this.y,
      width: this.width, height: this.height,
      strokeStyle: this.color,
      strokeWidth: this.lineWidth,
      layer: true,
      name: this.id.toString(),
      fromCenter: this.centered,
      sides: this.sides,
      radius: this.radius,
      projection: this.projection,
    });
  }
  return this;
}


/**
 * Draws text with the given params, creating a new layer.
 * @param params An array of parameters for the text.
 * @return the draw object.
 */
Draw.prototype.text = function(params) {
  this.x = varDefault(params.x, 0);
  this.y = varDefault(params.y, 0);
  this.centered = varDefault(params.centered, false);
  this.text = varDefault(params.text, "");
  this.font = varDefault(params.font, "12pt Helvetica");
  this.color = varDefault(params.color, "#000");

  this.type = Draw.TEXT;

  getCanvas().drawText({
    name: this.id.toString(),
    layer: true,
    x: this.x, y: this.y,
    text: this.text,
    fillStyle: this.color,
    font: this.font,
    fromCenter: this.centered,
  });
  return this;
};


/**
 * Updates the drawn object with the given params.
 * @param params An array of jCanvas parameters for the layer.
 */
Draw.prototype.update = function(params) {

  // Convert parameters from Heights standards to jCanvas standards.
  switch(this.type) {
    case Draw.SPRITESHEET:
      params = convertProperty(params, "cropX", "sx");
      params = convertProperty(params, "cropY", "sx");
      params = convertProperty(params, "cropWidth", "sWidth");
      params = convertProperty(params, "cropHeight", "sHeight");
      params = convertProperty(params, "url", "source");
      params = convertProperty(params, "centered", "fromCenter");
      break;
    case Draw.CIRCLE:
      params = convertProperty(params, "color", "strokeStyle");
      params = convertProperty(params, "width", "strokeWidth");
      params = convertProperty(params, "centered", "fromCenter");
      if (this.filled) {
        params = convertProperty(params, "color", "fillStyle");
        params = convertProperty(params, "color", "strokeStyle");
      } else {
        params = convertProperty(params, "color", "strokeStyle");
      }
      break;
    case Draw.SPRITE:
      params = convertProperty(params, "url", "source");
      params = convertProperty(params, "centered", "fromCenter");
      break;
    case Draw.RECTANGLE:
      params = convertProperty(params, "lineWidth", "strokeWidth");
      if (this.filled) {
        params = convertProperty(params, "color", "fillStyle");
      } else {
        params = convertProperty(params, "color", "strokeStyle");
      }
      break;
    case draw.POLYGON:
      params = convertProperty(params, "lineWidth", "strokeWidth");
      if (this.filled) {
        params = convertProperty(params, "color", "fillStyle");
        params = convertProperty(params, "color", "strokeStyle");
      } else {
        params = convertProperty(params, "color", "strokeStyle");
      }
      params = convertProperty(params, "centered", "fromCenter");
      break;
    case draw.TEXT:
      params = convertProperty(params, "centered", "fromCenter");
      params = convertProperty(params, "color", "fillStyle");
      params = convertProperty(params, "color", "strokeStyle");
  }

  getCanvas().setLayer(this.id.toString(), params);

};


/**
 * Removes the drawn object from the canvas.
 */
Draw.prototype.undraw = function() {
  getCanvas().removeLayer(this.id.toString());
};
