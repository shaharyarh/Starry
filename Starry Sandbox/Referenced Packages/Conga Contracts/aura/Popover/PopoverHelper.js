({
  close: function(cmp, skip, isCompleted) {
    cmp.set("v.isVisible", false);
    var closeEvent = cmp.getEvent("close");
    if (closeEvent) {
      closeEvent.setParams({
        value: {
          skip: skip,
          isCompleted: isCompleted
        }
      });
      closeEvent.fire();
    } 
  },
	position : function(cmp) {
    // Adjust popover coordiantes from origin
    var nubSize = 24; // Size of nubbin plus padding (popover arrow)
    var showBack = cmp.get("v.showBack");
    var sizedCmp;
    if (showBack) {
      sizedCmp = cmp.find("back");
    }
    else {
      sizedCmp = cmp.find("front");
    }
    var element = sizedCmp.getElement();
    var height = element.clientHeight;
    var width = element.clientWidth;
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var minLeft = 200;
    var popoverX = cmp.get("v.popoverX") || 0;
    var popoverY = cmp.get("v.popoverY") || 0;
    var popoverHeight = (cmp.get("v.popoverHeight") || 0) / 2;
    popoverX -= width / 2;
    if (popoverY + height + nubSize > windowHeight) {
      // Show popover above text with callout at bottom
      cmp.set("v.calloutDirection", "bottom");
      popoverY -= height + nubSize - popoverHeight;
      if (popoverX + width > windowWidth) {
        cmp.set("v.calloutDirection", "bottom-right");
        popoverX -= width/2 - nubSize;
      }
      else if (popoverX < minLeft) {
        cmp.set("v.calloutDirection", "bottom-left");
        popoverX += width/2 - nubSize;
      }
    }
    else {
      // Not enough space to display popover above text, show below text instead
      popoverY += nubSize + popoverHeight;
      cmp.set("v.calloutDirection", "top");
      if (popoverX + width > windowWidth) {
        cmp.set("v.calloutDirection", "top-right");
        popoverX -= width/2 - nubSize;
      }
      else if (popoverX < minLeft) {
        cmp.set("v.calloutDirection", "top-left");
        popoverX += width/2 - nubSize;
      }
    }

    if (popoverY < 0 || (popoverY + height + nubSize) > windowHeight) {
      // Unable to display with callout without going offscreen, center on screen with no callout
      cmp.set("v.calloutDirection", "none");
      popoverY = windowHeight / 2 - height / 2;
      popoverX = windowWidth / 2 - width / 2;
    }
    cmp.set("v.offsetX", parseInt(popoverX));
    cmp.set("v.offsetY", parseInt(popoverY));
    cmp.set("v.width", parseInt(width));
    cmp.set("v.height", parseInt(height));
	}

})