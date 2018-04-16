({
  setSelectedId: function(cmp) {
    var helper = this;
    var selectedId = cmp.get("v.selectedId");
    if (helper.isSalesforceId(selectedId)) {
      helper.callAction(cmp.get("c.getLookupInfo"), {
        apiNameOrId: selectedId
      })
      .then(function(lookupInfo) {
        var value = {
          Name: lookupInfo.NameValue,
          Id: selectedId
        };
        cmp.set("v.value", value);
      })
      .catch(function(err) {
        helper.handleError(err);
      });
    }
  },
  removeClick: function(cmp) {
    cmp.set("v.value", undefined);
    cmp.set("v.selectedId", undefined);
    this.getSearchResults(cmp);
  },
  truncateText: function(value) {
    // Remove all html content
    value = this.stripHtml(value);
    // Truncate to some length, append ... if needed
    var maxLen = 1024;
    if (value.length > maxLen) {
      value = value.substring(0, maxLen);
    }
    return value;
  },
  select: function(cmp, e, helper) {
    var searchResults = cmp.get("v.searchResults");
    var idAttribute = e.currentTarget.attributes["data-id"];
    var clickedItem = searchResults && searchResults.find(function(x) {
      return idAttribute && x.Id === idAttribute.value;
    });
    cmp.set("v.value", clickedItem);
    cmp.set("v.selectedId", clickedItem.Id);
  },
	getSearchResults : function(cmp, text) {
    var ret = Promise.resolve();
    var recordId = cmp.get("v.recordId");
    var helper = this;
    var useQT = cmp.get("v.useQuoteTerms");
    if (recordId) {
      ret = this.callAction(cmp.get("c.getSearchResults"), {
        recordId: recordId,
        searchText: text,
        useQT: useQT
      })
      .then(function(results) {
        // Normalize results
        var items = [];
        var bodyName = useQT ? "SBQQ__Body__c" : "Latest_Revision_Text__c";
        var labelName = useQT ? "Name" : "Label__c";
        if (results && results.length > 0) {
          results.forEach(function(r) {
            var item = {};
            for (var name in r) {
              if (r.hasOwnProperty(name)) {
                if (name.indexOf(bodyName) > -1) {
                  item.Text = helper.truncateText(r[name]);
                }
                else if (name.indexOf(labelName) > -1) {
                  item.Name = r[name];
                }
                else if (name === "Id") {
                  item.Id = r[name];
                }
              }
            }
            items.push(item);
          });
        }
        cmp.set("v.searchResults", items);
      })
      .catch(function(err) {
        helper.handleError(err);
      });
    }
    return ret;
	}
})