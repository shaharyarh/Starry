({
  getParentData: function(component, event, helper) {
    var recordId = component.get('v.recordId');
    var params = {
      parentId: recordId
    }

    helper.getParentData(component, helper, params);
    addEventListener("message", helper.safeCallback(component,function(e) {
      helper.gotIframeMessage(component, e);
    }));
  },
  focusIframe: function(cmp, e, helper) {
    helper.focusIframe(cmp);
  },
  saveDocTypeClick: function(cmp, e, helper) {
    helper.saveDocType(cmp);
  },
  initMixpanel: function(cmp, e, helper) {
    helper.setUserInfo(cmp)
    .then(function(userInfo) {
      helper.initMixpanel(userInfo);
    })
    .catch(function(err) {
      console.log(err);
    });
  },
  docTypeUpdated: function(cmp, e, helper) {
    var eventParams = e.getParams();
    var sObject = cmp.get("v.docType");
    if (sObject && sObject.fields) {
      switch (eventParams.changeType) {
        case "LOADED":
          var targetObjectName, clauseType;
          // Get field values ignoring namespace
          for (var name in sObject.fields) {
            if (sObject.fields.hasOwnProperty(name)) {
              if (name.indexOf("TargetObjectName") > -1) {
                targetObjectName = sObject.fields[name].value;
              }
              else if (name.indexOf("ClauseType") > -1) {
                clauseType = sObject.fields[name].value;
              }
            }
          }
          cmp.set("v.targetObjectName", targetObjectName);
          cmp.set("v.clauseType", clauseType);
          // Successfully loaded data track capture mixpanel event
          helper.mixpanelTrack("Capture", {
            ObjectName: targetObjectName
          });
        default:
          break;
      }
    }
  },
  getIframeUrl: function(component, event, helper) {
    helper.getIframeUrl(component, helper);
  },
  sendIframeMessage: function(cmp, e, helper) {
    var params = e.getParams();
    helper.sendIframeMessage(cmp, params.value);
  },
  iframeLoaded: function(component, event, helper) {
    helper.sendIframeMessage(component, {
      action:"enableSelection"
    });
    helper.closeSpinner(component);
  },
  goToParent: function(component, event, helper) {
    var recordId = component.get("v.recordId");
    helper.navigateToSObject(recordId);
  }
})