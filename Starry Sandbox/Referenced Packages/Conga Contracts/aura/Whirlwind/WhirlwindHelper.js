({
  draw: function(x, t) {
    var R = this.rgb;
    var S = Math.sin;
    var C = Math.cos;
    var i,b,a;
    x.clearRect(0,0,1920,1080);
    for(b=i=200;i--;) {
      i>180?a=10*S(t*4+i*9):a=0;
      var p = 1000+2*(b-i)*C(i-t)*S(i-t)+100*S(t+i*0.03-a*.08)+b*S(t/2)
      x.fillRect(p,i*5+a,9,5);
    }
  },
  drawLoop: function(canvas, cmp) {
    var playing = cmp.get("v.playing");
    var width = cmp.get("v.width");
    var height = cmp.get("v.height");
    var time = 0; //cmp.get("v.time");
    var frame = 0;
    var helper = this;
    var canvas2d = canvas.getContext("2d");
    canvas2d.scale(width/1920, height/1080);
    canvas2d.fillStyle = helper.rgb(84, 105, 141,1);
    var drawFrame = function() {
      if (playing){
        requestAnimationFrame(drawFrame);
      }
      time = frame/60;
      if(time * 60 | 0 == frame - 1){
        time += 0.000001;
      }
      frame++;
      helper.draw(canvas2d, time);
    };
    drawFrame();
  }
})