({
  init: function(cmp, e, helper) {
    helper.initTreeItems(cmp);
  },
  initLaunchDarkly: function(cmp, e, helper) {
    helper.enableFeatures(cmp, window.LDClient);
  },
  selectItem: function(cmp, e, helper) {
    // Child component asked that we select item in treelist
    var treeList = cmp.find("setupTreeList");
    if (treeList && treeList.selectItem) {
      var params = e.getParams();
      // Select TreeItem with specified id value
      treeList.selectItem(params.value);
    }
  },
  itemSelected: function(cmp, e, helper) {
    var params = e.getParams();
    helper.itemSelected(cmp, params.value);
  },
  showConnectionMenuItems: function(cmp, e, helper) {
    var treeList = cmp.find("setupTreeList");
    if (treeList) {
      var connections = e.getParams().value;
      helper.populateConnections(cmp, connections);
    }
  }
})