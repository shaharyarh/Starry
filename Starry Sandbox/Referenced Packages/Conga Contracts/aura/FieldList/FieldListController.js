({
	init : function(cmp, e, helper) {
    var describe = cmp.get("v.describe");
    var sObjectName = cmp.get("v.sObjectName");
    if (!describe && sObjectName && sObjectName.length > 0) {
      // Cache describes
      var describeAction = cmp.get("c.describe");
      describeAction.setStorable({
        defaultExpiration: 60 * 15, 
      });
      helper.callAction(describeAction,{
        prefix: sObjectName
      }).then(helper.safeCallback(cmp, function(json) {
        var describe = JSON.parse(json);
        cmp.set("v.describe", describe);
        cmp.set("v.searchResults", helper.searchDescribe(describe, undefined, cmp));
      })).catch(function(err) {
        console.log(err);
      });
    }
    if (describe && describe.fields) {
      cmp.set("v.searchResults", helper.searchDescribe(describe, undefined, cmp));
    }
	},
  describeChanged: function(cmp, e, helper) {
    helper.describeChanged(cmp)
  },
  valueChanged: function(cmp, e, helper) {
    helper.valueChanged(cmp);
  },
  select: function(cmp, e, helper) {
    var searchResults = cmp.get("v.searchResults");
    var idAttribute = e.currentTarget.attributes["data-id"];
    var clickedItem = searchResults.find(function(x) {
      return idAttribute && x.name == idAttribute.value;
    });
    if (clickedItem) {
      cmp.set("v.value", clickedItem);
    }
  },
  removeClick: function(cmp, e, helper) {
    var describe = cmp.get("v.describe");
    cmp.set("v.value", null);
    cmp.set("v.searchResults", helper.searchDescribe(describe, undefined, cmp));
  },
  search: function(cmp, e, helper) {
    clearTimeout(helper.searchTimer);
    helper.searchTimer = setTimeout(helper.safeCallback(cmp,function() {
      var describe = cmp.get("v.describe");
      var text = e.target.value;
      var results = helper.searchDescribe(describe, text, cmp);
      cmp.set("v.searchResults", results);
    },400));
  }
})