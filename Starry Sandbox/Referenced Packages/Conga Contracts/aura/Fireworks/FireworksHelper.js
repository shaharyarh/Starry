({
  drawLoop: function(canvas, cmp) {
    var playing = cmp.get("v.playing");
    var width = canvas.width; //cmp.get("v.width");
    var height = canvas.height; //cmp.get("v.height");
    var time = 0; //cmp.get("v.time");
    var frame = 0;
    var helper = this;
    var canvas2d = canvas.getContext("2d");
    var sprites = [];
    var environment = this.createEnvironment(width,height,0.02,this.PointAt(0,0.25));
    environment.context = canvas2d;
    environment.hasTop = false;  
    environment.hasBottom = false;  
    environment.hasLeft = false;  
    environment.hasRight = false;  

    var burst = function(point) {
      setTimeout(function() {
        var mult = 2 + Math.round(Math.random() * 6);
        for (var i=0; i<150; i++) {
          var sprite = helper.fireworksSpriteAt(point.x + Math.round(Math.random()), point.y + Math.round(Math.random()), 5, environment);
          sprite.burst = true;
          sprite.color = point.color.map(function(c) { return Math.max(0, Math.min(c + (Math.round(Math.random() * 60) - 30), 255)); });
          // sprite.size = point.size;
          sprite.prev.x = sprite.x;
          sprite.prev.y = sprite.y;
          sprite.prev.x += (Math.random() * mult) - Math.round(mult/2); 
          sprite.prev.y += (Math.random() * mult) - Math.round(mult/2);
          sprites.push(sprite);
        }
      }, 500 + (Math.random() * 3000) - 1500);
    };

    // Create a lot of confetti sprites
    var half = (width / 2);
    var num = 30;
    var fire = function() {
      var sprite = helper.fireworksSpriteAt(width/2, height, 1, environment);
      sprite.prev.x = sprite.x;
      sprite.prev.y = sprite.y;
      sprite.prev.x += (Math.random() * 10) - 5;
      sprite.prev.y += (0.023 * height) + (Math.random() - 0.5);
      sprites.push(sprite);
      if (num-- > 0) setTimeout(fire, 300 + Math.round(Math.random() * 3000));
    };
    fire();
    var drawFrame = function() {
      if (playing){
        requestAnimationFrame(drawFrame);
      }
      time = frame/60;
      if(time * 60 | 0 == frame - 1){
        time += 0.000001;
      }
      frame++;
      environment.context.fillStyle  = helper.rgb(0,0,0,0.1);
      environment.context.fillRect(0,0,environment.width,environment.height);
      var victims = [];
      for (var i=0; i<sprites.length; i++) {
        var startBurst = sprites[i].burst;
        if (sprites[i].tick) sprites[i].tick(0.5);
        sprites[i].draw(environment.context);
        if (sprites[i].burst != startBurst) {
          burst(sprites[i]);
          break;
        }
        else if (sprites[i].burst && sprites[i].time > (500 + (Math.random() * 250))) {
          victims.push(sprites[i]);
        }
      }
      victims.forEach(function(p) {
        sprites.splice(sprites.indexOf(p), 1);
      });
    };
    drawFrame();
  },
  fireworksSpriteAt:function(x, y, mass, environment, pointSize) {
    var helper = this;
    mass += (Math.random());
    var ret = this.PointMassAt(x,y,mass,environment);
    if (typeof pointSize !== "number") {
        pointSize = 2;
    }
    var orange = [255,129,79,0.8];
    var red = [255,88,54,0.8]; 
    var purple = [169,133,242,0.8];
    var blue = [24,126,247,0.8];
    var pink = [255,101,170,0.8];
    var green = [64,203,106,0.8]; 
    var yellow = [246,212,64,0.8];
    var white = [255,255,255,0.8];
    var colors = [blue,orange,purple,red,pink,green,yellow,white];
    ret.color = colors[Math.round(Math.random() * (colors.length - 1))];
    ret.size = 1 + Math.round(Math.random());
    ret.time = Math.random() * 1000;
    ret.burst = false;
    ret.draw = function(canvasCtx) {
      var x = Math.round(ret.x); 
      var y = Math.round(ret.y);
      var pen = canvasCtx;
          
      var time = ret.time/60;
      if(time * 60 | 0 == ret.time - 1){
        time += 0.000001;
      }
      ret.time++;
      var t = time;

      if (y > ret.prev.y) {
        ret.burst = true;
      }

      var S = Math.sin;
      var C = Math.cos;
      pen.save();
      pen.beginPath();
      /* Draw dot */
      // pen.fillStyle = helper.rgb(0,0,0,0.5);
      // pen.arc(ret.prev.x, ret.prev.y, 2, 0, 2*Math.PI, false);
      // pen.fill();
      if (ret.burst) {
        pen.fillStyle = helper.rgb.apply(window, ret.color);
      }
      else {
        pen.fillStyle = helper.rgb(255,255,255,0.5);
      }
      pen.arc(x, y, ret.size, 0, 2*Math.PI, false);
      pen.fill();
      pen.restore();
    };
      
    return ret;
  }
})