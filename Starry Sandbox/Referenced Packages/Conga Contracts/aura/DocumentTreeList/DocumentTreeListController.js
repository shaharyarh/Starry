({
  init : function(cmp, event, helper) {
    var loadImmediately = cmp.get("v.doLoadImmediately");
    if (loadImmediately) {
      helper.getBookendData(cmp);
    }
  },
  capture: function(cmp, e, helper) {
    // Add a new tree item
    var params = e.getParams();
    var fieldName = params.fieldName;
    var describe = params.describe;
    var label = params.treeItemLabel;
    if (fieldName && describe && label) {
      var fieldDescribe = describe.fields[fieldName.toLowerCase()];
      var items = cmp.get("v.items") || [];
      // Find parent header node if exists
      var headerNode = items.find(function(x) {
        return x && x.value && x.value.objectName == describe.objectName;
      });
      if (!headerNode) {
        // Create header node
        headerNode = {
          label: helper.isClauseObject(describe.objectName) && !helper.isQuoteTermObject(describe.objectName) ? cmp.get("v.clausesLabel") : describe.objectLabel,
          id: helper.getId(),
          value: describe,
          items: []
        };
        items.push(headerNode);
      }
      // Item node
      headerNode.items.push({
        label: label,
        id: helper.getId(),
        value: params
      });
      // Redraw items
      cmp.set("v.items", items);
    }
  },
  updateList: function(cmp, event, helper) {
      helper.getBookendData(cmp);
  },
  updateSelected: function(cmp, e, helper) {
    var params = e.getParam("arguments");
    var isCompleted = params && params.isCompleted;
    var selectNext = params && params.skip;
    if (selectNext) {
      helper.selectNext(cmp, isCompleted);
    }
    else if (isCompleted) {
      helper.setSelectedIcon(cmp, "utility:check");
    }
  },
  replaceClause: function(cmp, e, helper) {
    var params = e.getParams();
    helper.replaceClause(cmp, params);
  }
})