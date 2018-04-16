({
  afterRender: function(cmp, helper) {
    helper.setAbsolutePosition(cmp);
    this.superAfterRender();
  }
})