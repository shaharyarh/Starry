({
  afterRender: function(cmp, helper) {
    var canvas = document.getElementsByTagName("canvas")[0];
    // Fill to parent containers height and width
    var parentWidth = canvas.parentNode.clientWidth;
    var parentHeight = canvas.parentNode.clientHeight;
    canvas.width = parentWidth;
    canvas.height = parentHeight;
    helper.drawLoop(canvas, cmp);
  }
})