({
  sendScrollToMessage: function(cmp, name) {
    var iframe = cmp.find("iframe");
    var isIframeLoaded = cmp.get("v.isIframeLoaded");
    if (iframe && iframe.getElement && isIframeLoaded) {
      iframe = iframe.getElement().contentWindow;
      iframe.postMessage({
        scrollElement: name
      },"*");
    }
    else {
      // Iframe not available yet, unable to scroll to area so set reminder to do it later
      cmp.set("v.scrollToElementOnLoad", name);
    }
  }
})