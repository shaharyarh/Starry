({
	init : function(cmp, event, helper) {
    helper.getSearchResults(cmp);
    helper.setSelectedId(cmp);
    var value = cmp.get("v.selectedText");
    if (value && value.length > 0) {
      cmp.set("v.truncatedText", helper.truncateText(value));
    }
  },
  select: function(cmp, e, helper) {
    helper.select(cmp,e);
  },
  removeClick: function(cmp, e, helper) {
    helper.removeClick(cmp)
  },
  search: function(cmp, e, helper) {
    clearTimeout(helper.searchTimer);
      helper.searchTimer = setTimeout(helper.safeCallback(cmp,function() {
        var text = e.target.value;
        helper.getSearchResults(cmp, text);
      },400));
  }
})