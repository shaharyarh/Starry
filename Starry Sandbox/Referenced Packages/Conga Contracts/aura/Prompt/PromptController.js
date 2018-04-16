({
	showPrompt : function(cmp, event, helper) {
    var showOnEvent = cmp.get("v.showOnEvent");
    if (showOnEvent) {
      var title = event.getParam("title");
      if (title && title.length > 0) cmp.set("v.title", title);
      cmp.set("v.message", event.getParam("message"));
      cmp.set("v.visible", true);
    }
	},
  close: function(cmp, event, helper) {
    cmp.set("v.visible", false);
  }
})