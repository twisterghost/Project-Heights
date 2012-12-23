var spriteLoc = "sprites/";
var score = 0;

var plane = function(x, y, id, params) {
  this.x = x;
  this.y = y;
  this.id = id;
  this.frame = 0;
  this.cropX = 0;
  this.moveSpeed = 5;
  this.shootSpeed = 5;
  this.shootCooldown = 0;
  this.width = 47;
  this.height = 47;
  this.minY = 270;
  this.maxY = 480 - this.height;
  this.minX = 0;
  this.maxX = 640 - this.width;
  this.drawn = new Draw().spriteSheet({url: spriteLoc + "plane_strip3.png",
      x: this.x - 9, y: this.y - 4, cropWidth: 65, cropHeight: 65});
  collideable(this);
}

plane.prototype.onCollision = function(obj) {
  if (obj instanceof enemyBullet ||
      obj instanceof enemy) {
    pauseSteps();
    destroyInstance(obj);
    createInstance(320, 240, gameover);
    endGame();
  }
}

plane.prototype.step = function() {

  // Calculate animation frame.
  this.frame = (this.frame + 1) % 3;
  this.cropX = this.frame * 65;

  // Movement.
  if (keyDown("LEFT")) {
    this.x -= this.moveSpeed;
  }
  if (keyDown("RIGHT")) {
    this.x += this.moveSpeed;
  }
  if (keyDown("UP")) {
    this.y -= this.moveSpeed / 2;
  }
  if (keyDown("DOWN")) {
    this.y += this.moveSpeed / 2;
  }
  boundInstance(this, this.minX, this.minY, this.maxX, this.maxY);

  // Shooting.
  if (this.shootCooldown > 0) {
    this.shootCooldown -= 1;
  }
  if (this.shootCooldown == 0 &&
      keyDown("SPACE")) {
    createInstance(this.x + 19, this.y + 1, bullet);
    this.cooldown();
  }

  score++;
  $("#score").html("Score: " + score);

};

plane.prototype.cooldown = function() {
  this.shootCooldown = this.shootSpeed;
};

plane.prototype.drawObj = function() {
  this.drawn.update({x: this.x - 9, y: this.y - 4, cropX: this.cropX});
};


var bullet = function(x, y, id, params) {
  this.x = x;
  this.y = y;
  this.width = 9;
  this.height = 20;
  this.id = id;
  this.moveSpeed = 10;
  collideable(this);
  this.drawn = new Draw().sprite({url: spriteLoc + "spr_bullet.png",
      x: this.x, y: this.y});
}

bullet.prototype.step = function() {
  this.y -= this.moveSpeed;
  if (this.y <= -100) {
    destroyInstance(this);
  }
};

bullet.prototype.drawObj = function() {
  this.drawn.update({y: this.y});
}

bullet.prototype.destroy = function() {
  this.drawn.undraw();
}


var background = function(x, y, id, params) {
  this.x = x;
  this.y = y;
  this.drawn = new Draw().sprite({url: spriteLoc + "bg.png", x: this.x, y: this.y})
}


var enemy = function(x, y, id, params) {
  this.x = x;
  this.y = y;
  this.id = id;
  this.frame = 0;
  this.width = 32;
  this.height = 32;
  this.cropX = 0;
  this.moveSpeed = 2;
  this.shootSpeed = Math.random() * 80 + 40;
  this.cooldown = 5;
  collideable(this);
  this.drawn = new Draw().spriteSheet({url: spriteLoc + "spr_enemy_strip.png",
      x: this.x, y: this.y, cropWidth: 32, cropHeight: 32});
}

enemy.prototype.onCollision = function(obj) {
  if (obj instanceof bullet) {
    score += 100;
    destroyInstance(this);
    destroyInstance(obj);
    $("#score").html("Score: " + score);
  }
}

enemy.prototype.step = function() {
  this.frame = (this.frame + 1) % 3;
  this.cropX = this.frame * 65;
  this.y += this.moveSpeed;
  this.cooldown -= 1;
  if (this.cooldown <= 0) {
    this.cooldown = this.shootSpeed;
    createInstance(this.x + 12, this.y + 16, enemyBullet);
  }

  if (this.y > viewX + viewHeight + 100) {
    destroyInstance(this);
  }
}

enemy.prototype.drawObj = function() {
  this.drawn.update({x: this.x, y: this.y, sx: this.cropX});
}

enemy.prototype.destroy = function() {
  this.drawn.undraw();
}

var enemyBullet = function(x, y, id, params) {
  this.x = x;
  this.y = y;
  this.width = 9;
  this.height = 20;
  this.id = id;
  this.moveSpeed = 5;
  collideable(this);
  this.drawn = new Draw().sprite({url: spriteLoc + "spr_bullet.png",
      x: this.x, y: this.y, rotate: 180});
}

enemyBullet.prototype.step = function() {
  this.y += this.moveSpeed;
  if (this.y >= viewX + viewHeight + 100) {
    destroyInstance(this);
  }
};

enemyBullet.prototype.drawObj = function() {
  this.drawn.update({y: this.y});
}

enemyBullet.prototype.destroy = function() {
  this.drawn.undraw();
}


var gameover = function(x, y, id, params) {
  this.x = x;
  this.y = y;
  this.drawn = new Draw().text({x: this.x, y: this.y, text: "Game Over",
    font: "72pt Helvetica", centered: true});
}
