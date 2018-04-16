({
  afterRender: function(cmp, helper) {
    this.superAfterRender();
    helper.fixIEFlexRenderer(cmp, "viewer", "header");
  }
})