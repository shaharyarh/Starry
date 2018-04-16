({
	init : function(component, event, helper) {
    helper.setRecordId(component);
	},
  recordIdChanged: function(cmp, event, helper) {
    helper.setRecordId(cmp);
  },
  parseValue: function(cmp, e, helper) {
    // Setting value by name instead of Id
    var params = e.getParam("arguments");
    var value = params.value;
    var parseEvent = cmp.getEvent("valueParsed");
    if (value && value.length > 0) {
      var searchAction = cmp.get("c.getSearchResults");
      helper.callAction(searchAction, {
        objectName: cmp.get("v.sObjectName"),
        searchText: value
      })
      .then(function(results) {
        if (results.length == 1) {
          // If exactly one match, success
          cmp.set("v.recordId", results[0].Id);
          parseEvent.setParams({
            success: true
          });
        }
        else {
          // Otherwise no juju
          var lblLookupResults = cmp.get("v.lblapxt_trueUp_lookupFoundResults");
          parseEvent.setParams({
            success:false,
            message: helper.formatString(lblLookupResults, results.length, value)
          });
        }
        parseEvent.fire();
      })
      .catch(function(err) {
        helper.handleError(err);
      });
    }
  },
  search: function(cmp, e, helper) {
    clearInterval(helper.debounceTimer);
    helper.debounceTimer = setTimeout(function() {
      var objectName = cmp.get("v.sObjectName");
      var nameField = cmp.get("v.nameField");
      var searchText = e.target.value;
      cmp.set("v.searchText", searchText);
      if (objectName && searchText) {
        helper.callAction(cmp.get("c.getSearchResults"), {
          objectName: objectName,
          searchText: searchText
        })
        .then(function(results) {
          // Normalize name field so that we can use .Name in component iterator
          if (nameField != "Name") {
            results.forEach(function(x) {
              x.Name = x[nameField];
            });
          }
          cmp.set("v.searchResults", results);
          helper.open(cmp);
        })
        .catch(function(err) {
          helper.handleError(err);
        });
      }
    }, 300);
  },
  selectClick: function(cmp, e, helper) {
    var searchResults = cmp.get("v.searchResults");
    var nameField = cmp.get("v.nameField");
    var idAttribute = e.currentTarget.attributes["data-id"];
    var clickedItem = searchResults.find(function(x) {
      return idAttribute && x.Id == idAttribute.value;
    });
    if (clickedItem) {
      cmp.set("v.recordId", clickedItem.Id);
    }
  },
  open: function(cmp, e, helper) {
    helper.open(cmp);
  },
  close: function(cmp, e, helper) {
    // put in short timeout so that selectClick event can fire when clicking within opened menu
    setTimeout(helper.safeCallback(cmp, function() {
      helper.close(cmp);
    }),200);
  },
  newClick: function(cmp, e, helper) {
    var lookupInfo = cmp.get("v.lookupInfo");
    if (lookupInfo) {
      helper.createRecord(lookupInfo.ObjectName, lookupInfo.ObjectPrefix);
    }
  },
  removeClick: function(cmp, e, helper) {
    cmp.set("v.recordId", null);
  }
})