({
  close: function(cmp, skip, isCompleted) {
    cmp.set("v.isVisible", false);
    var closeEvent = cmp.getEvent("close");
    if (closeEvent) {
      closeEvent.setParams({
        value: {
          skip: skip,
          isCompleted: isCompleted
        }
      });
      closeEvent.fire();
    } 
  },
  valueChanged: function(cmp) {
    var helper = this;
    // Value attribute changed, strip any html and set related attributes if needed
    var value = cmp.get("v.value");
    if (value && value.length > 0) {
      // Remove all html content
      value = helper.stripHtml(value);
      // Truncate to some length, append ... if needed
      var maxLen = 80;
      if (value.length > maxLen) {
        value = value.substring(0, maxLen-3);
        value += "..."
      }
      cmp.set("v.truncatedValue", value);
      helper.adjustPosition(cmp);
    }
  },
  getSObject: function(cmp) {
    var recordId = cmp.get("v.recordId");
    var objectName = cmp.get("v.sObjectName");
    var sobject = {
      "sobjectType": objectName,
      Id: recordId
    };
    if (this.isQuoteTermObject(objectName)) {
      // Clone QT and set StandardTerm relationship to existing recordId
      var cloneObject = cmp.get("v.sobject");
      var describe = cmp.get("v.describe");
      // Clone required fields for CPQ Quote Terms
      for (var field in describe.fields) {
        var meta = describe.fields[field];
        if (meta && meta.nillable == false && meta.createable == true && cloneObject[meta.name] != undefined) sobject[meta.name] = cloneObject[meta.name];
      }
      var masterId = cmp.get("v.parentRecordId");
      if (cloneObject["SBQQ__Quote__c"] === undefined) {
        // If saving standard quote term (a QT without associated Quote) then insert new QT clone, otherwise update existing
        sobject.Id = undefined;
        sobject["SBQQ__StandardTerm__c"] = recordId;
      }
      sobject["SBQQ__Quote__c"] = masterId;
    }
    return sobject;
  },
  showError: function(cmp, err) {
    cmp.set("v.showError", true);
    cmp.set("v.error", err);
  },
  save: function(cmp) {
    var field = cmp.find("field");
    if (field.length == 1) field = field[0];
    var fieldName = cmp.get("v.fieldName");
    var isCurrent = cmp.get("v.isCurrent");
    var isTextarea = cmp.get("v.isTextarea");

    cmp.set("v.isLoading", true);
    if (isCurrent || isTextarea) {
      // Accept whatever is in the current value input box
      var dirty = field.get("v.isDirty");
      var value = field.get("v.value");
      var sobject = this.getSObject(cmp);
      sobject[fieldName] = value;

      // When clause field is rich text editor and doesnt have dirty attribute
      if (dirty == true || (dirty == undefined && isTextarea)) {
        // Field value has been modified, save record
        this.saveSObject(cmp, sobject);
      }
      else {
        // Field value unmodified, don't actually save
        this.saveComplete(cmp);
      }
    }
    else {
      // Parse and save whatever is in the proposed area
      var value = cmp.get("v.value");
      // Tell input component to parse, will raise parsed event when ready to save
      field.parse(value);
    }
  },
  saveComplete: function(cmp) {
    var skip = cmp.get("v.isSaveAndContinue");
    var helper = this;
    // Show success briefly then skip to next popover
    setTimeout(helper.safeCallback(cmp,function() {
      if (skip) {
        helper.close(cmp, true, true);
      }
      else {
        helper.close(cmp, false, true);
      }
    }),700);
    cmp.set("v.isLoading", false);
  },
  saveSObject: function(cmp, sobject) {
    var helper = this;
    var objectName = cmp.get("v.sObjectName");
    var fieldMeta = cmp.get("v.fieldMeta");
    var recordId = cmp.get("v.recordId");
    // Call action to save sobject
    return helper.callAction(cmp.get("c.saveObject"),{
      data: sobject
    })
    .then(helper.safeCallback(cmp, function(Id) {
      if (Id && Id != recordId){
        cmp.set("v.recordId", Id);
      }
      helper.saveComplete(cmp);
      helper.mixpanelTrack("True Up: Save", {
        ObjectName: objectName,
      });
    }))
    .catch(function(message) {
      // Stop showing button spinner
      cmp.set("v.isLoading", undefined);
      if (message.length) message = message[0];
      if (message.message) message = message.message;
      helper.handleError(new Error(message));
    });
  },
  getDescribe: function(component) {
    var recordId = component.get("v.recordId");
    var objectName = component.get("v.sObjectName");
    var helper = this;
    if (recordId || objectName) {
      // Get object describe from objectName or recordId
      var describeAction = component.get("c.describe");
      // Cache describes
      describeAction.setStorable({
        defaultExpiration: 60 * 15, 
      });
      return helper.callAction(describeAction, {prefix:recordId || objectName})
      .then(helper.safeCallback(component, function(json) {
        var describe = JSON.parse(json);
        helper.setDescribe(component, describe);
        return helper.getData(component);
      }))
      .catch(function(err) {
        helper.handleError(err);
      });
    }
  },
  setDescribe: function(component, describe) {
    // Get sObject name field if non standard
    var nameField = this.getNameField(describe);

    var fieldName = component.get('v.fieldName');
    // If Clause, find field that holds clause text
    var isClause = component.get("v.isClause");
    var isEditing = component.get("v.isEditing");
    var isCapture = component.get("v.isCaptureMode");
    var useQT = component.get("v.useQuoteTerms");
    if (isClause && fieldName == undefined) {
      var bodyName = useQT ? "SBQQ__Body__c" : "text_rich__c";
      for (var field in describe.fields) {
        if (field.indexOf(bodyName.toLowerCase()) > -1){
          fieldName = describe.fields[field].name;
        }
      }
    }

    if (fieldName && describe.fields[fieldName.toLowerCase()]) {
      var fieldDescribe = describe.fields[fieldName.toLowerCase()];
      component.set("v.fieldMeta", fieldDescribe);
      // Field component is not bound to fieldMeta intentionally so that we can manually update after data is available
      var field = component.find("field");
      if (field) {
        if (field.length == 1) field = field[0];
        field.set("v.fieldDescribe", fieldDescribe);
      }
    }
    else {
      component.set("v.fieldMeta", null);
    }

    // Set attributes that are based on describe
    component.set("v.sObjectName", describe.objectName.toLowerCase());
    component.set("v.objectLabel", describe.objectLabel);
    component.set("v.nameField", nameField);
    component.set("v.describe", describe);

    if (!fieldName && (isEditing || isCapture)) {
      this.getSuggestions(component);
    }

  },
  filterSuggestions: function(objectName, describe, results) {
    var suggestions = [];
    var helper = this;
    // Find schema results for this object name
    var suggestionCnt = 0;
    var maxSuggestionCnt = 5;
    results.forEach(function(result) {
      if (result.ner_suggestions && result.ner_suggestions.length > 0) {
        result.ner_suggestions.forEach(function (suggest) {
          if (suggest.schema_suggestions && suggest.schema_suggestions.length > 0) {
            suggest.schema_suggestions.forEach(function (schema) {
              // SFC-588: limit to 5 suggestions
              if (suggestionCnt < maxSuggestionCnt && 
                schema.object_name.toLowerCase() === objectName.toLowerCase() && 
                (schema.field_name !== undefined && schema.field_name.length > 0)) {

                var fieldDescribe = describe.fields[schema.field_name.toLowerCase()];
                if(fieldDescribe !== undefined && fieldDescribe.updateable) {
                  // Add suggestion
                  suggestions.push({
                      suggestedObjectName: schema.object_name,
                      suggestedFieldType: suggest.field_type,
                      suggestedFieldName: schema.field_name,
                      suggestedText: suggest.field_text,
                      fieldText: result.field_text,
                      fieldStart: result.field_text_start,
                      fieldEnd: result.field_text_end,
                      orgTag: result.org_tag,
                      userTag: result.user_tag,
                      localeCode: result.locale_code,
                      name: schema.field_name,
                      label: fieldDescribe.label,
                      model: suggest.model_name
                  });
                  suggestionCnt++;
                }
              }
            });
          }
        });
      }
    });
    return suggestions;
  },
  adjustPosition: function(cmp) {
    var helper = this;
    var popover = cmp.find("popover");
    // Reposition after short delay to render
    setTimeout(helper.safeCallback(popover, function () {
      popover.reposition();
    }), 100);
  },
  setValue: function(cmp, plain, html) {
    var isTextarea = cmp.get("v.isTextarea");
    cmp.set("v.value", isTextarea ? html : plain);
    cmp.set("v.htmlValue", html);
  },
  getSuggestions: function(component) {
    // Don't bother getting suggestions if user selection is null (possible when picking a
    // field from Tree list where the value in Salesforce is null)
    var userSelection = component.get("v.userSelection");
    var helper = this;
    if (userSelection != null) {
      // suggestion states:
      // 1 - processing
      // 0 - done and got suggestions back
      // -1 - done and no suggestion found or exception
      component.set("v.suggestionState", 1);
      var objectName = component.get("v.sObjectName");
      var describe = component.get("v.describe");
      component.set("v.isExtracting", true);
      component.set("v.suggestionError", undefined);
      return this.callAction(component.get("c.extractContent"), {
        userSelectionJSON: JSON.stringify(userSelection),
      })
      .catch(helper.safeCallback(component, function(err) {
        // Extraction error, warn user
        component.set("v.isExtracting", false);
        component.set("v.extractionError", err.message);
        helper.adjustPosition(component);
      }))
      .then(helper.safeCallback(component, function(json) {
        component.set("v.isExtracting", false);
        var contentExtract = JSON.parse(json);
        if (contentExtract && contentExtract.length > 0) {
          contentExtract = contentExtract[0];
          if (contentExtract.plainText && contentExtract.plainText.length > 0) {
            // Use extracted text in case selection contains redlines
            helper.setValue(component, contentExtract.plainText, contentExtract.htmlText);
          }
          return helper.callAction(component.get("c.getSuggestion"), {
            contentExtractJson: JSON.stringify(contentExtract),
            objectName: objectName
          });
        }
        else {
          return Promise.reject("Error extracting content");
        }
      }))
      .catch(helper.safeCallback(component, function (err) {
        // Suggestion service failure
        helper.adjustPosition(component);
        component.set("v.suggestionState", -1);
        // Fail back to user selected text
        var plaintext = component.get("v.value");
        helper.setValue(component, plaintext, plaintext);
        // Silently log error dont show user
        console.log("Error occured getting suggestions: " + err);
      }))
      .then(helper.safeCallback(component, function (results) {
        if (results == null) {
          // No results
          component.set("v.suggestionState", -1);
        }
        else {
          var results = JSON.parse(results);
          suggestions = helper.filterSuggestions(objectName, describe, results);
          if (suggestions.length > 0) {
            component.set("v.suggestionState", 0);
            component.set("v.suggestions", suggestions);
            component.set("v.hasSuggestions", true);
          }
          else {
            component.set("v.suggestionState", -1);
          }
        }
      }))
      .catch(helper.safeCallback(component, function (err) {
        // Unexpected
        component.set("v.suggestionState", -1);
        helper.handleError(err);
      }));

    }
  },
  postFeedback: function(cmp) {
    var helper = this;
    var suggestions = cmp.get("v.suggestions");
    var fieldMeta = cmp.get("v.fieldMeta");
    var describe = cmp.get("v.describe");
    if (suggestions != undefined && suggestions.length > 0 && fieldMeta != undefined) {
      var mlFeedbacks = [{
        suggested_object_name: suggestions[0].suggestedObjectName,
        suggested_field_name: suggestions[0].suggestedFieldName,
        suggested_field_type: suggestions[0].suggestedFieldType,
        suggested_text: suggestions[0].suggestedText,
        object_name: describe.objectName,
        object_label: describe.objectLabel,
        field_name: fieldMeta.name,
        field_label: fieldMeta.label,
        field_type: fieldMeta.type,
        field_text: suggestions[0].fieldText,
        field_start: suggestions[0].fieldStart,
        field_end: suggestions[0].fieldEnd,
        org_tag: suggestions[0].orgTag,
        locale_code: suggestions[0].localeCode,
        user_tag: suggestions[0].userTag,
        doc_tag: cmp.get("v.contentVersionId")
      }];
      this.callAction(cmp.get("c.postFeedback"), {
        mlFeedbacksJSON: JSON.stringify(mlFeedbacks)
      })
      .catch(function(err) {
        console.log("postFeedback returned error: ", err);
      })
    }
  },
  getData: function(component) {
    var ret = Promise.resolve();
    var describe = component.get("v.describe"); 
    var fieldName = component.get("v.fieldName");
    var objectName = component.get("v.sObjectName");
    var nameField = component.get("v.nameField") || "Name";
    var recordId = component.get("v.recordId");
    var helper = this;

    if (recordId && fieldName) {
      var dataFields = [fieldName, nameField];
      if (helper.isQuoteTermObject(describe.objectName) && describe) {
        // Load Quote__r lookup to check if this is standard term
        dataFields.push("SBQQ__Quote__c");
        // Clone required fields for CPQ Quote Terms
        for (var field in describe.fields) {
          var meta = describe.fields[field];
          if (meta && meta.nillable == false && meta.createable == true) dataFields.push(field);
        }
      }
      // Get data for record
      return helper.callAction(component.get("c.data"), {
        recordId: recordId, 
        fields: dataFields
      })
      .then(function(data) {
        return helper.setData(component, data);
      });
    }
    else {
      helper.setData(component, undefined);
    }
    return ret;
  },
  setData: function(component, data) {
    var nameField = component.get("v.nameField");
    var describe = component.get("v.describe");
    var fieldName = component.get("v.fieldName");
    var value = component.get("v.value");
    if (data) {
      if (data && fieldName && data[fieldName]) {
        component.set("v.data", data[fieldName]);
      }
      component.set("v.sobject", data);
      component.set("v.recordLabel", data[nameField]);
    }
  },
  setIsCurrent: function(cmp, isCurrent) {
    cmp.set("v.isCurrent", isCurrent);
    var isTextarea = cmp.get("v.isTextarea");
    if (isTextarea) {
      cmp.set("v.inputValue", isCurrent ? cmp.get("v.data") : cmp.get("v.value"));
    }
  }
})