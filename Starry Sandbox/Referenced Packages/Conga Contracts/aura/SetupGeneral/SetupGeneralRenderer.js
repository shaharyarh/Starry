({
  afterRender: function(cmp, helper) {
    this.superAfterRender();
    // If IE then fix issue where iframe doesnt fill available space
    helper.fixIEFlexRenderer(cmp, "iframe", "header");
  }
})