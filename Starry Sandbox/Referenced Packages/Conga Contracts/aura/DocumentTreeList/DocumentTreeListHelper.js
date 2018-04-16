({
  replaceClause: function(cmp, params) {
    var targetId = params.targetRecordId;
    var newId = params.newRecordId;
    var items = cmp.get("v.items");
    if (targetId && newId && newId != targetId) {
      // Try to locate matching recordId in tree heirarchy one level deep
      var match;
      for (var i=0; i<items.length; i++) {
        var x = items[i];
        if (x.items && x.items.length > 0) {
          match = x.items.find(function(y) {
            if (y.value && y.value.recordId) return y.value.recordId == targetId;
          });
          if (match) break;
        }
      }
      if (match) {
        match.iconName = "utility:warning";
        match.page = params.page;
        match.clauseId = newId;
        cmp.set("v.items", items);
      }
    }
  },
  setSelectedIcon: function(cmp, iconName) {
    iconName = iconName || "utility:check";
    var selected = cmp.get("v.selectedItem");
    if (selected) {
      selected.set("v.iconName", iconName);
    }
  },
  selectNext: function(cmp, isCompleted) {
    var helper = this;
    var treeView = cmp.find("treeList");
    var selected = cmp.get("v.selectedItem");
    if (selected) {
      var selectedId = selected.get("v.unique");
      if (isCompleted) {
        helper.setSelectedIcon(cmp, "utility:check");
      }
    }
    var items = cmp.get("v.items");
    if (items.length > 0) {
      // Queue items to be selected
      var queue = [];
      items.forEach(function(x) {
        // Filter each node by child with warning icons
        if (x.items && x.items.length > 0) {
          queue = queue.concat(x.items.filter(function(item) {
            return item.iconName == "utility:warning";
          }));
        }
      });
      if (queue.length > 0) {
        var selectedItem = queue.find(function(x) {
          return x.id == selectedId;
        });
        var index = queue.indexOf(selectedItem);
        var next = queue.length > index + 1 ? queue[index+1] : queue[0];
        if (next != selectedItem) {
          treeView.selectItem(next.id);
        }
        // else {
        //   // Fire completion event
        //   var e = cmp.getEvent("treeListComplete");
        //   var val = cmp.get("v.value");
        //   e.setParams({
        //     value: {
        //       action:"showComplete"
        //     }
        //   });
        //   e.fire();
        // }
      }
    }
  },
  getBookendData: function(cmp) {
    var helper = this;
    var recordId = cmp.get("v.recordId");
    var documentId = cmp.get("v.documentId");
    var apiName = cmp.get("v.sObjectName");
    helper.callAction(cmp.get("c.getBookendData"), {contentDocId: documentId || recordId})
    .then(helper.safeCallback(cmp, function(json) {
      // Valid word document
      return helper.createItems(cmp, json);
    }))
    .catch(function(error) {
      // Something bad happened!
      helper.handleError(error);
      // helper.setEmpty(cmp);
    });
  },
  getRecordIcon: function(fieldmeta, raw, val) {
    // Determine if data in bookend is different than current salesforce data
    var iconName;
    var helper = this;
    var proposedParsed;
    try {
      // Does it parse in to corrent data type?
      proposedParsed = helper.parseFieldValue(fieldmeta, raw);
    } 
    catch (e) {
      // Value didn't parse but still show it to the user
    }

    var currentParsed = helper.parseFieldValue(fieldmeta, val);
    var isEqual = helper.isFieldValueEqual(fieldmeta, currentParsed, proposedParsed);


    // Set tree-item icon based on if data is different in SF
    if (fieldmeta.updateable == false) {
      iconName = "utility:lock";
    }
    else if (!isEqual) {
      iconName = "utility:warning";
    }
    else {
      iconName = "utility:check";
    }
    return iconName;
  },
  getId: function() {
    var size = 10000000;
    return parseInt((Math.random() * size) + size).toString(16);
  },
  getTreeItemOptions: function(cmp, recordId, fieldmeta, inputName, describe, data, raw, relName) {
    // Generate unique identifier for tree item
    var helper = this;
    var onlyClauses = cmp.get("v.doOnlyShowClauses");
    var id = this.getId();
    var ret;
    var displayValue = raw;
    // TreeItem options
    var options = {
      label: fieldmeta.label,
      selected:false,
      id: id,
      iconName: "utility:check",
      value: {
        action: "showPopover",
        inputName: inputName.substring(0,20),
        fieldName: fieldmeta.name,
        fieldLabel: fieldmeta.label,
        describe: describe,
        recordId: recordId,
        value: raw,
        data: data && (data[fieldmeta.name] == undefined ? null : data[fieldmeta.name])
      }
    };
    if (fieldmeta.type == "reference" && helper.isSalesforceId(displayValue)) {
      // Passed an reference field with an Id value, don't show this to the user its a pre-set FK
      options.value = displayValue;
      options.hidden = true;
    }

    if (helper.isClauseObject(describe.objectName)) {
      var name = helper.getNameField(describe);
      if (data && data[name]) {
        options.label = data[name];
      }
    }

    var val = data && data[fieldmeta.name];
    if (data && fieldmeta && fieldmeta.type == "reference") {
      // For reference types, compare name field values
      for (var nameField in data[relName]) {
        // Find first non-null non-Id field on the lookup (there should only be Id and Name)
        if (nameField != "Id" && data[relName].hasOwnProperty(nameField) && data[relName][nameField]) {
          val = data[relName][nameField];
          break;
        }
      }
    }
    if (!onlyClauses) {
      // For negotiate icons are not based on record data
      options.iconName = helper.getRecordIcon(fieldmeta, raw, val);
    }

    return options;
  },
  getTreeOptions: function(cmp, viewModel, describe, data, describeMap) {
    var helper = this;
    var fields = [];

    viewModel.fields.forEach(function(f, i) {
      var fieldName = f.fieldId;
      // inputName is name of pdf form field input in pdfjs viewer
      var inputName = viewModel.objectHashcode + "" + f.fieldHashcode;
      var raw = f.values;
      if (f.values instanceof Array) {
        raw = f.values[0];
      }

      var fieldmeta = describe.fields[f.fieldId.toLowerCase()];
      if (fieldName.indexOf(".") > 0) {
          // Parental field find Id by relationship name
          var relName = f.fieldId.split(".")[0];
          for (var apiName in describe.fields) {
              if (describe.fields[apiName].relationshipName == relName) {
                  fieldmeta = describe.fields[apiName];
                  // fieldName = fieldmeta.name;
                  break;
              }
          }
      }
      if (fieldmeta) {
        // if (f.htmlTemplatedValues && f.htmlTemplatedValues.length > 0 && f.htmlTemplatedValues[0] && f.htmlTemplatedValues[0].length > 0) {
        //       raw = helper.resolveMergeTags(data[fieldName], f.htmlTemplatedValues[0], describeMap);
        // } else 
        if (fieldmeta.htmlFormatted && f.htmlValues && f.htmlValues.length > 0 && f.htmlValues[0] && f.htmlValues[0].length > 0) {
          // If we have an html value use is
          raw = f.htmlValues[0];
        }
        fields.push(helper.getTreeItemOptions(cmp, data.Id, fieldmeta, inputName, describe, data, raw, relName)); 
      }
    });
    return fields;
  },
    // resolveMergeTags: function(oldValue, newValue, describeMap) {
    //     // matches merge tags {{some name}}, including the curly brackets
    //     var tagRegExp = new RegExp('{{([^}]+)}}', 'g');
    //     // matches object and field suffixes like __c, __p, __r, etc. starting from the __ to the end of the string
    //     var suffixRegExp = new RegExp('__([^__]+)$');
    //     // matches namespace in the beginning of the string up to the __
    //     var prefixRegExp = new RegExp('^.*?(?=__)__');
    //     var oldTags = oldValue.match(tagRegExp);
    //     var newTags = newValue.match(tagRegExp);
    //     for(var i = 0; i < newTags.length; i++) {
    //         var newTagTokens = newTags[i].replace("{{","").replace("}}","").split("|");
    //         if (newTagTokens.length == 2) {
    //             var prefix = newTagTokens[0].substring(0,3);
    //             var translatedTag = "";

    //             // if prefix exists in describe map, we do the translation.
    //             if (describeMap[prefix]) {
    //                 // get dev name of object (api name minus suffix)
    //                 var objectDevName = describeMap[prefix].objectName.replace(suffixRegExp, "");
    //                 translatedTag += objectDevName;
    //                 // get dev name of field (without namespace and suffix).
    //                 // for intermediate tokens (parent relationship names), we only remove the suffix.
    //                 // for the last token (field), we remove both namespace and suffix.
    //                 var fieldTokens = newTagTokens[1].split(".");
    //                 for(var j = 0; j < fieldTokens.length; j++) {
    //                     var fieldDevName = fieldTokens[j].replace(suffixRegExp, "");
    //                     if (j == (fieldTokens.length-1)) fieldDevName = fieldDevName.replace(prefixRegExp, "");
    //                     translatedTag += "_" + fieldDevName;
    //                 }
    //                 translatedTag = translatedTag.toUpperCase();
    //                 // see if we can find the translated tag in the old tags.
    //                 var oldTagIndex = null;
    //                 for(var j = 0; j < oldTags.length; j++){
    //                     // if found, we use the old tag so that we can grab any existing special
    //                     // composer tag attributes (HTML, date format, etc). we'll also remove the
    //                     // old tag from the list in case the tag appears multiple times. we want
    //                     // to match in order of occurrence.
    //                     // we're assuming here that tags that appear multiple times with different
    //                     // special composer codes have not been rearranged.
    //                     if (oldTags[j].toUpperCase().includes(translatedTag)) {
    //                         translatedTag = oldTags[j];
    //                         oldTagIndex = j;
    //                         break;
    //                     }
    //                 }

    //                 if (oldTagIndex != null) oldTags.splice(oldTagIndex, 1);
    //                 else translatedTag = "{{" + translatedTag + "}}";

    //                 // replace tag in new value with the translated tag
    //                 newValue = newValue.replace(newTags[i], translatedTag);

    //             }
    //         }

    //     }

    //     return newValue;
    // },
  getRecordData: function(component, recordId, dataFields, useQT) {
    var helper = this;
    if (recordId) {
      if (useQT === true) {
        // Check if there is any existing QT associated with master record
        var masterId = component.get("v.recordId");
        return this.callAction(component.get("c.queryQuoteTerms"), {
          recordId: masterId,
          standardTermId: recordId
        }).then(function(Id) {
          // Get data for record
          return helper.callAction(component.get("c.data"), {
            recordId: Id, 
            fields: dataFields
          });
        });
      }
      else {
        // Get data for record
        return this.callAction(component.get("c.data"), {
          recordId: recordId, 
          fields: dataFields
        });
      }
    }
    else {
      return Promise.resolve();
    }
  },
  getDescribeMap: function(payload) {
    var prefixes = {};
    var helper = this;
    // Get distinct list of object prefixes
    payload.objects.forEach(function(obj) {
      var recordId = obj.objectId && obj.objectId.substring(0,15);
      var prefix = recordId ? recordId.substring(0,3) : obj.objectName;
      prefixes[prefix] = recordId || obj.objectName;
    });
    return prefixes;
  },
  getDescribes: function(cmp, payload) {
    var describes = this.getDescribeMap(payload);
    var helper = this;
    // Return promise to get all describes
    var ret = [];
    for (var prefix in describes) {
      if (describes.hasOwnProperty(prefix)) {
        var describeAction = cmp.get("c.describe");
        // Cache describes
        describeAction.setStorable({
          defaultExpiration: 60 * 15, 
        });
        ret.push(helper.callAction(describeAction, {prefix:describes[prefix]}));
      }
    }
    return ret;
  },
	createItems : function(cmp, payload) {
    if (payload) {
      payload = JSON.parse(payload);
      var helper = this;
      var onlyClauses = cmp.get("v.doOnlyShowClauses");
      var describeMap = helper.getDescribeMap(payload);
      var quoteTermsLabel = cmp.get("v.quoteTermsLabel");
      var clausesLabel = cmp.get("v.clausesLabel");
      var unknownLabel = cmp.get("v.unknownChangesLabel");
      var objectName = cmp.get("v.sObjectName");
      var useQT = objectName && objectName.indexOf("SBQQ") == 0 ? true : false;
      // Create a promise of describes for all objects in payload
      Promise.all(this.getDescribes(cmp, payload))
      .then(function(jsonArr) {
        var i = 0;
        for (var prefix in describeMap) {
          describeMap[prefix] = JSON.parse(jsonArr[i++]);
        }
        return Promise.all(payload.objects.map(function(obj) {
          var recordId = obj.objectId && obj.objectId.substring(0,15);
          var prefix = recordId ? recordId.substring(0,3) : obj.objectName;
          var describe = describeMap[prefix];
          var dataFields = obj.fields.map(function(x){return x.fieldId;});

          if (helper.isClauseObject(describe.objectName)) {
            dataFields.push(helper.getNameField(describe));
            if (helper.isQuoteTermObject(describe.objectName)) {
              // Set use quote terms attribute to notify parent component that we're using QT object for clauses
              // Alternatively we could do this by querying doc type Id when there are no bookends in document
              useQT = true;
            }
            else {
              useQT = false;
            }
          }

          return helper.getRecordData(cmp, recordId, dataFields, useQT).then(function(data) {
            var fieldOptions = helper.getTreeOptions(cmp, obj, describe, data, describeMap);
            fieldOptions = fieldOptions.sort(function(a,b) {
              return a && b && a.label < b.label ? -1 : 1;
            });
            return {
              name: describe.objectName,
              label: describe.objectLabel,
              id: "root",
              items: fieldOptions
            };
          });
        }))
        .then(helper.safeCallback(cmp,function(tree) {
          // Collapse clause objects in to one parent node
          var clauseNode = {
            label: useQT ? quoteTermsLabel : clausesLabel, 
            id: "clauses",
            items: []
          };
          var newTree = [];
          tree.forEach(function(node) {
            if (helper.isClauseObject(node.name)) {
              node.items.forEach(function(child) {
                clauseNode.items.push(child);
              });
            }
            else {
              if (!onlyClauses) {
                newTree.push(node);
              }
            }
          });
          if (clauseNode.items.length > 0) {
            newTree.push(clauseNode);
          }

          // SFC-584 (MS 7/21/17): display unidentified revisions in the tree
          if (!onlyClauses && payload.unidentifiedRevisions != null && payload.unidentifiedRevisions.length > 0) {
            var unidentifiedRevisionNode = {
              label: unknownLabel,
              id: "unidentifiedRevisions",
              items: []
            };

            payload.unidentifiedRevisions.forEach(function(el) {
              var label = el.values[0];
              if (label.length > 15) label = label.substring(0,15) + "...";
              var revNode = {
                label: label,
                id: el.fieldId,
                selected: false,
                value: {
                  action: "showPopover",
                  inputName: el.fieldHashcode,
                  value: el.values[0]
                }
              };
              unidentifiedRevisionNode.items.push(revNode);
            });

            if (unidentifiedRevisionNode.items.length > 0) newTree.push(unidentifiedRevisionNode);
          }

          // Construct a tree for each object in the list with fields as children
          cmp.set("v.items", newTree);
          cmp.set("v.useQuoteTerms", useQT);
          cmp.set("v.isLoading", false);
          // Select first item in tree after short delay
          setTimeout(helper.safeCallback(cmp, function() {
            helper.selectNext(cmp);
          }),1000);
        }));
      })
      .catch(function(err) {
        helper.handleError(err);
      });
    }
	}
})