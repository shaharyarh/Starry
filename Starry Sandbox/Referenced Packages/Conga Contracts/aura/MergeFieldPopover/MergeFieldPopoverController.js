({
  cancel: function(cmp, e, helper) {
    cmp.set("v.isVisible", false);
  },
  insert: function(cmp, e, helper) {
    var fieldList = cmp.find("fieldList");
    if (fieldList) {
      var val = fieldList.get("v.value");
      var insertEvent = cmp.getEvent("insertEvent");
      if (insertEvent && val && val.name) {
        insertEvent.setParams({
          value: "{{User." + val.name + "}}"
        });
        insertEvent.fire();
        cmp.set("v.isVisible", false);
      }
    }
  }
})