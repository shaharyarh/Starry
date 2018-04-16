({
  init : function(cmp, event, helper) {
    helper.getClauseTypes(cmp);
    helper.getSearchResults(cmp);
  },
  search: function(cmp, e, helper) {
    clearTimeout(helper.searchTimer);
    helper.searchTimer = setTimeout(helper.safeCallback(cmp,function() {
      var text = e.target.value;
      cmp.set("v.searchText", text);
      helper.getSearchResults(cmp, text);
    },400));
  },
  selectType: function(cmp, e, helper) {
    var typeId = e.target.value;
    if (helper.isSalesforceId(typeId)) {
      cmp.set("v.filterClauseTypeId", typeId);
    }
    else {
      cmp.set("v.filterClauseTypeId", undefined);
    }
    helper.getSearchResults(cmp);
  },
  select: function(cmp, e, helper) {
    var searchResults = cmp.get("v.searchResults");
    var selectedId = cmp.get("v.selectedId");
    var idAttribute = e.currentTarget.attributes["data-id"];
    var clickedItem = searchResults && searchResults.find(function(x) {
      return idAttribute && x.Id == idAttribute.value;
    });
    var selectedItem = searchResults && searchResults.find(function(x) {
      return selectedId && x.Id == selectedId;
    });
    if (clickedItem) {
      if (selectedItem) {
        selectedItem.selected = false;
      }
      clickedItem.selected = true;
      cmp.set("v.searchResults", searchResults);
      cmp.set("v.selectedId", idAttribute.value);
    }
  },
  closeClick : function(cmp, event, helper) {
    cmp.set("v.isVisible", false);
  },
  replaceClick: function(cmp, e, helper) {
    var nextEvent = $A.get("e.APXT_Redlining:DocumentReplaceEvent");
    if (nextEvent) {
      nextEvent.setParams({
        targetRecordId: cmp.get("v.recordId"),
        newRecordId: cmp.get("v.selectedId"),
        page: cmp.get("v.popoverPageNumber")
      });
      nextEvent.fire();
      cmp.set("v.isVisible", false);
    }
  }
})