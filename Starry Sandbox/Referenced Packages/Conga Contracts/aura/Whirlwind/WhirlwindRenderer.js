({
  afterRender: function(cmp, helper) {
    var canvas = document.getElementById(cmp.getGlobalId() + "_canvas");
    helper.drawLoop(canvas, cmp);
  }
})