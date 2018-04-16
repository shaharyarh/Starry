({
  drawLoop: function(canvas, cmp) {
    var playing = cmp.get("v.playing");
    var width = canvas.width; 
    var height = canvas.height; 
    var helper = this;
    var canvas2d = canvas.getContext("2d");
    var sprites = [];
    var environment = this.createEnvironment(width,height,0.05,this.PointAt(0,2));
    environment.context = canvas2d;
    environment.hasTop = false;  
    environment.hasBottom = false;  

    canvas.addEventListener('dblclick', function(e) {
      helper.createComponent("APXT_Redlining:TowerBuilder", {})
      .then(function(game) {
        cmp.set("v.game", game);
      });
    });

    // Create a lot of confetti sprites
    var half = (width / 2);
    for (var i=0; i<75; i++) {
      var sprite = this.confettiSpriteAt((half/2) + Math.random() * half, 0, 2, environment);
      sprite.prev.x = sprite.x;
      sprite.prev.y = sprite.y;
      sprite.prev.x += (Math.random() * 6) - 3;
      sprite.prev.y += (Math.random()* 20) - 10;
      sprites.push(sprite);
    }
    setTimeout(function() {
      // Stop animation after some duration
      playing = false;
    }, 15 * height);
    var drawFrame = function() {
      if (playing){
        requestAnimationFrame(drawFrame);
      }
      environment.context.clearRect(0,0,environment.width,environment.height);
      for (var i=0; i<sprites.length; i++) {
        if (sprites[i].tick) sprites[i].tick(0.5);
        sprites[i].draw(environment.context);
      }
    };
    drawFrame();
  },
  confettiSpriteAt:function(x, y, mass, environment, pointSize) {
    mass += (Math.random());
    var ret = this.PointMassAt(x,y,mass,environment);
    if (typeof pointSize !== "number") {
        pointSize = 2;
    }
    var orange = this.rgb(255, 154, 60, 1);
    var red = this.rgb(194, 57, 52,1);
    var purple = this.rgb(11, 35, 153,1);
    var blue = this.rgb(94, 180, 255,1);
    var colors = [blue,orange,purple,red];
    ret.color = colors[Math.round(Math.random() * (colors.length - 1))];
    ret.size = 6 + Math.round(Math.random() * 3);
    ret.time = Math.random() * 1000;
    ret.draw = function(pen) {
      var x = Math.round(ret.x); 
      var y = Math.round(ret.y);
          
      var time = ret.time/60;
      if(time * 60 | 0 == ret.time - 1){
        time += 0.000001;
      }
      ret.time++;
      var t = time;

      var S = Math.sin;
      var C = Math.cos;
      pen.save();
      pen.beginPath();
      pen.fillStyle = ret.color;
      pen.translate(x,y);
      // Transform rect for tumbling effect
      pen.transform(C(t), S(t), -S(t), -C(t), S(t), C(t));
      pen.fillRect(0,0,ret.size,Math.round(ret.size*9/16));
      pen.restore();
    };
      
    return ret;
  }
})