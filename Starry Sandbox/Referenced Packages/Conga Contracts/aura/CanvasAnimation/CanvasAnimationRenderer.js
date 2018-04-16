({
  render: function(cmp, helper) {
    var ret = this.superRender();
    var canvas = helper.createCanvas(cmp);
    ret.push(canvas);
    return ret;
  }
})