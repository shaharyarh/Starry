({
  afterRender: function(cmp, helper) {
    this.superAfterRender();
    helper.position(cmp);
  }
})