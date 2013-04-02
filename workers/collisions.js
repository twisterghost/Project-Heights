onmessage = function(event) {
  var objArr = JSON.parse(event.data);
  for (var i = 0; i < objArr.length; i++) {
    for (var j = 0; j < objArr.length; j++) {
      if (i != j &&
          collisionInstance(objArr[i], objArr[j])) {
        var collisionPair = new Array(objArr[i].id, objArr[j].id);
        postMessage(JSON.stringify(collisionPair));
      }
    }
  }
};


function collisionInstance(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}
