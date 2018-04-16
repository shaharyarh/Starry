({
  close : function(cmp) {
    // Cheap way to hide window, if its reopened it will be destroyed and reinitialized
    $A.util.addClass(cmp, "hide");
  }
})