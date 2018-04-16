({
  sendScrollToMessage: function(cmp, e, helper) {
    var args = e.getParam("arguments");
    if (args && args.elementId) {
      helper.sendScrollToMessage(cmp, args.elementId);
    }
  },
  iframeLoad: function(cmp, e, helper) {
    cmp.set("v.isIframeLoaded", true);
    var scrollToElement = cmp.get("v.scrollToElementOnLoad");
    if (scrollToElement) {
      helper.sendScrollToMessage(cmp, scrollToElement);
      cmp.set("v.scrollToElementOnLoad", undefined);
    }
  }
})