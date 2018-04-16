({
  init: function(cmp, e, helper) {
    var objectName = cmp.get("v.managedClauseAPIName");
    if (objectName) {
      cmp.set("v.useQuoteTerms", helper.isQuoteTermObject(objectName));
    }
  },
  cancel: function(cmp) {
    // Cheap way to hide window, if its reopened it will be destroyed and reinitialized
    $A.util.addClass(cmp, "hide");
  },
  save: function(cmp, event, helper) {
    var clauseNameCmp = cmp.find("clauseName");
    var printOrder = cmp.find("printOrder");
    var useQT = cmp.get("v.useQuoteTerms");
    var nameValid = clauseNameCmp && clauseNameCmp.get("v.validity").valid;
    var printOrderValid = printOrder && printOrder.get("v.validity").valid;
    if (nameValid || (useQT && printOrderValid)) {
      cmp.set("v.isLoading", true);
      var parentId = cmp.get("v.parentRecordId");
      var text = cmp.get("v.text");
      var clauseName = cmp.get("v.clauseName");
      var managedClauseAPIName = cmp.get("v.managedClauseAPIName");
      var tokens = managedClauseAPIName.split("__");
      var ns = "";
      if (tokens.length > 2 && tokens[0].length > 0) {
        ns = tokens[0] + "__";
      }

      var sObj = {
        sobjectType: managedClauseAPIName,
      };
      if (useQT) {
        sObj["SBQQ__Body__c"] = text;
        sObj["SBQQ__PrintOrder__c"] = cmp.get("v.printOrder");
        sObj["SBQQ__Active__c"] = true;
        sObj["SBQQ__Status__c"] = "Approved";
        sObj["SBQQ__StandardTerm__c"] = cmp.get("v.standardTermId");
      }
      else {
        sObj[ns + "Text_Rich__c"] = text;
        sObj[ns + "Label__c"] = clauseName;
      }

      var saveAction = cmp.get("c.saveManagedClause");
      helper.callAction(saveAction, {
        clause: sObj,
        parentId: parentId
      })
      .then(helper.safeCallback(cmp,function(Id) {
        setTimeout(helper.safeCallback(cmp,function() {
          $A.util.addClass(cmp, "hide");
        }),700);
        cmp.set("v.isLoading", false);
      }))
      .catch(helper.safeCallback(cmp, function(err) {
        cmp.set("v.isLoading", undefined);
        helper.handleError(err);
      }));
    }
  }
})