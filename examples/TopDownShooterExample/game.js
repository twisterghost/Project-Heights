var difficulty = 1;
var intervals = [];
$(document).ready(function() {
  setCanvas($("canvas"));

  // Make BG
  //createInstance(0, 0, background);
  new Draw().sprite({url: spriteLoc + "bg.png", x: this.x, y: this.y});
  createInstance(100, 100, plane);
  intervals.push(setInterval(createPlane, 2000));
  intervals.push(setInterval(makeHarder, 10000));

  start();
  setFPS(60);
});


function createPlane() {
  createInstance(Math.random()*640, 0, enemy);
}

function makeHarder() {
  intervals.push(setInterval(createPlane, 2000));
  difficulty++;
  $("#diff").html("Difficulty: " + difficulty);
}

function endGame() {
  for (var i = 0; i < intervals.length; i++) {
    clearInterval(intervals[i]);
  }
}
