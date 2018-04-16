({
  getSearchResults: function(cmp) {
    var helper = this;
    // Get object describe from objectName or recordId
    var action = cmp.get("c.searchClauses");
    var json = JSON.stringify({
      searchText: cmp.get("v.searchText"),
      types: [cmp.get("v.filterClauseTypeId")],
      recordId: cmp.get("v.recordId"),   
    });
    return helper.callAction(action, {jsonParams:json})
    .then(helper.safeCallback(cmp,function(json) {
      var results = JSON.parse(json);
      if (results.success) {

        helper.setComponentAttributes(cmp, results);
  
      }
      else {
        helper.handleError(results.errorMsg);
      }
    }))
    .catch(function(err) {
      helper.handleError(err);
    });
  },
  setComponentAttributes: function(cmp, results) {
    var altClauseExist = results.restrictToAlt? false: results.altClausesExist;
    var restrictToAlt = results.showRevertClause ? false: results.restrictToAlt;
     
    cmp.set("v.noClausesFound", results.data.length === 0);
    cmp.set("v.searchResults", results.data);
    cmp.set("v.restrictToAlt", restrictToAlt);
    cmp.set("v.altClausesExist", altClauseExist);  
    cmp.set("v.showRevertClause", results.showRevertClause);
  },
  getClauseTypes: function(cmp) {
    var helper = this;
    // Get object describe from objectName or recordId
    var action = cmp.get("c.getClauseTypes");
    // Cache clause types
    action.setStorable({
      defaultExpiration: 60 * 5,
    });
    return helper.callAction(action)
    .then(helper.safeCallback(cmp,function(types) {
      cmp.set("v.clauseTypes", types);
    }))
    .catch(function(err) {
      helper.handleError(err);
    });
  }
})