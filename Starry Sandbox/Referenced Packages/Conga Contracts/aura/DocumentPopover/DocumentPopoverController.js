({
  init : function(component, event, helper) {
    var describe = component.get("v.describe");
    if (describe) {
      helper.setDescribe(component, describe);
      helper.getData(component);
    }
    else {
      helper.getDescribe(component);
    }
    helper.setIsCurrent(component, false);
    helper.valueChanged(component);
  },
  capture: function(cmp, e, helper) {
    // Fire capture event
    var captureEvent = $A.get("e.APXT_Redlining:CaptureEvent");
    var fieldDescribe = cmp.get("v.fieldMeta");
    var describe = cmp.get("v.describe");
    if (captureEvent && describe && describe.objectName && fieldDescribe && fieldDescribe.label) {
      var isClause = helper.isClauseObject(describe.objectName);
      var label = isClause ? cmp.get("v.recordLabel") : fieldDescribe.label
      if (label) {
        captureEvent.setParams({
          fieldName: fieldDescribe.name,
          describe: describe,
          page: cmp.get("v.popoverPageNumber"),
          occurrence: cmp.get("v.popoverOccurrenceNumber"),
          treeItemLabel: label,
          recordId: cmp.get("v.recordId"),
          value: cmp.get("v.value")
        });
        captureEvent.fire();
        helper.close(cmp);
      }
    }
  },
  valueParsed: function(cmp, e, helper) {
    var success = e.getParam("success");
    var message = e.getParam("message");

    if (success == false && message) {
      cmp.set("v.isLoading", undefined);
      helper.showError(cmp, message);
    }
    else {
      helper.save(cmp);
    }
  },
  skip: function(cmp, e, helper) {
    helper.close(cmp, true, false);
  },
  save: function(cmp, e, helper) {
    helper.save(cmp);
  },
  saveAndContinue: function(cmp, e, helper) {
    cmp.set("v.isSaveAndContinue", true);
    helper.save(cmp);
  },
  inputChanged: function(cmp, e, helper) {
    // Input value changed, update radio button state
    var isTextarea = cmp.get("v.isTextarea");
    if (!isTextarea) {
      var inputValue = cmp.get("v.inputValue");
      var current = cmp.get("v.data");
      if (inputValue != current) cmp.set("v.isCurrent", true);
    }
  },
  reposition: function(cmp, e, helper) {
    setTimeout(helper.safeCallback(cmp, function() {
      helper.adjustPosition(cmp);
    }));
  },
  recordIdChanged: function(cmp, e, helper) {
    // RecordId is changed when changing clause in editing mode
    var isEditing = cmp.get("v.isEditing");
    var isCapture = cmp.get("v.isCaptureMode");
    if (isEditing) {
      var recordId = cmp.get("v.recordId");
      if (recordId != undefined) {
        // Get new data
        helper.getDescribe(cmp)
        .then(function() {
          if (!isCapture) cmp.set("v.isEditing", false);
        });
      }
    }
  },
  fieldChanged: function(cmp, e, helper) {
    var isEditing = cmp.get("v.isEditing");
    var fieldMeta = cmp.get("v.fieldMeta");
    var isCapture = cmp.get("v.isCaptureMode");
    if (isEditing) {
      if (fieldMeta != undefined) {
        // SFC-490 (MS 9/14/17): send first suggestion and user selection to feedback service
        helper.postFeedback(cmp);

        // New field was selected
        cmp.set("v.fieldName", fieldMeta.name);

        // Adverse affects occur when this code inserted 10 lines below within the setTimeout isCapture block
        if (!isCapture) {
          if (fieldMeta.type == "textarea" && fieldMeta.htmlFormatted) {
            cmp.set("v.value", cmp.get("v.htmlValue"));
            cmp.set("v.isTextarea", true);
          }
        }

        setTimeout(helper.safeCallback(cmp, function() {
          var field = cmp.find("field");
          if (field) {
            if (field.length == 1) field = field[0];
            field.set("v.fieldDescribe", fieldMeta);
          }
          helper.setIsCurrent(cmp, false);
          if (!isCapture) {
            cmp.set("v.isEditing", false);
            helper.adjustPosition(cmp);
          }
          helper.getData(cmp)
          .catch(function(err) {
            helper.handleError(err);
          });
        }),500);
      }
    }
  },
  valueChanged: function(cmp, e, helper) {
    helper.valueChanged(cmp);
  },
  selectSuggestion: function(cmp, e, helper) {
    var valueAttribute = e.currentTarget.attributes["data-value"];
    var textAttribute = e.currentTarget.attributes["data-text"];
    var describe = cmp.get("v.describe");
    var fieldMeta = cmp.get("v.fieldMeta");
    if (describe && valueAttribute && valueAttribute.value) {
      var newFieldMeta = describe.fields[valueAttribute.value.toLowerCase()];
      if (newFieldMeta && newFieldMeta != fieldMeta) {
        cmp.set("v.fieldMeta", newFieldMeta);
      }
      if (textAttribute && textAttribute.value && textAttribute.value.length > 0) {
        // Accept suggested text
        cmp.set("v.value", textAttribute.value);
      }
    }
  },
  recordLabelClick: function(component, event, helper) {
    var recordId = component.get("v.recordId");
    helper.navigateToSObject(recordId);
  },
  edit: function(cmp, e, helper) {
    var isEditing = cmp.get("v.isEditing");
    cmp.set("v.isEditing", !isEditing);
    helper.adjustPosition(cmp);
    // The condition below might be confusing because we're using the original value of the variable isEditing,
      // not after we've set the attribute. If current value of isEditing is false, then user has just
      // clicked Edit therefore we should call getSuggestions.  If current value is true, then user has just
      // clicked Done so we should not call getSuggestions.
    if(!isEditing) helper.getSuggestions(cmp);
  },
  setCurrent: function(cmp, e, helper) {
    helper.setIsCurrent(cmp, true);
  },
  setProposed: function(cmp, e, helper) {
    helper.setIsCurrent(cmp, false);
  },
  setClause: function(cmp) {
    cmp.set("v.recordId", undefined);
    cmp.set("v.isClause", true);
    cmp.set("v.isTextarea", true);
  },
  setField: function(cmp) {
    cmp.set("v.isClause", false);
    var fieldMeta = cmp.get("v.fieldMeta");
    cmp.set("v.isTextarea", fieldMeta && fieldMeta.type == "textarea" && fieldMeta.htmlFormatted);
  },
  hideError: function(cmp) {
    cmp.set("v.showError", false);
  },
  close : function(cmp, event, helper) {
    helper.close(cmp);
  },
  openNewClause: function(cmp, e, helper) {
    var e = cmp.getEvent("showNewClauseModal");
    e.setParams({
      value: cmp.get("v.htmlValue")
    });
    e.fire();
  },
})