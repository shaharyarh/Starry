({
    getParentData: function(component, helper, params) {
      this.showSpinner(component);
      var action = component.get('c.getCompareData');
      action.setParams({
        jsonString: JSON.stringify(params)
      });

      action.setCallback(this, function(res) {
        var parsedJson = JSON.parse(res.getReturnValue());

        component.set('v.namespace', parsedJson.namespace);
        component.set('v.namespaceApi', parsedJson.namespaceApi);

        if (parsedJson == null || parsedJson.noFiles) {
          component.set('v.hasNoFiles', true);

          helper.closeSpinner(component);
        } else {
          component.set('v.hasNoFiles', false);
          var versionInfo = parsedJson.formattedCdsById;
          var documentId = parsedJson.selectedCdId;
          var versions = versionInfo[documentId].avaliableVersions;
          var versionId = versions[versions.length-1];
          component.set("v.documentVersionId", versionId.Id);
          // component.set('v.avaliableCds', parsedJson.formattedCds);
          // component.set('v.selectedCdId', parsedJson.selectedCdId);

          // if (parsedJson.formattedCdsById && parsedJson.selectedCdId && parsedJson.formattedCdsById[parsedJson.selectedCdId]) {
          //   var selectedCd = parsedJson.formattedCdsById[parsedJson.selectedCdId];
          //   component.set('v.cdName', selectedCd.Title);
          //   component.set('v.primaryVersions', selectedCd.primaryVersionList);
          //   component.set('v.selectedPrimaryVersion', parsedJson.selectedPrimaryVersion);
          // }

          // component.set('v.selectedToVersion', parsedJson.selectedToVersion);
          // component.set('v.currentPrimaryVersion', parsedJson.selectedPrimaryVersion);
          // component.set('v.currentToVersion', parsedJson.selectedToVersion);
          // component.set('v.cdsById', parsedJson.formattedCdsById);
          component.set('v.parentName', parsedJson.parentName);
          component.set('v.parentTypePrefix', parsedJson.parentTypePrefix);
          component.set('v.parentTypeLabel', parsedJson.parentTypeLabel);
          component.set("v.parentAPIName", parsedJson.parentApiName);

          if (parsedJson.hasError) {
            component.set('v.hasError', parsedJson.hasError);
            component.set('v.errMsg', parsedJson.errMsg);
            helper.closeSpinner(component);
          } else {
            component.set('v.hasError', false);
            component.set('v.errMsg', '');
            component.set('v.iframeUrl', parsedJson.iframeUrl);
          }
        }
      });

      $A.enqueueAction(action);
    },
    focusIframe: function(cmp) {
      // This gives iframe input focus so that lightning components don't steal away focus when interacting with document
      var iframe = cmp.find("viewer");
      if (iframe) {
        var iframeEl = iframe.getElement();
        if (iframe.contentWindow && iframe.contentWindow.focus) {
            iframe.contentWindow.focus();
        }
      }
      this.sendIframeMessage(cmp, {
        action: "showPopover"
      });
      // Set popover to undefined
      cmp.set("v.popover", undefined);
    },
    sendIframeMessage: function(cmp, params) {
      var iframe = cmp.find("viewer");
      if (iframe) {
        iframe = iframe.getElement().contentWindow;
        iframe.postMessage(params,"*");
      }
    },
    getUserSelection: function(cmp, data) {
      var versionId = cmp.get("v.documentVersionId");
      return {
          objectId: cmp.get('v.recordId'),
          documentId: versionId,
          values: [
              {
                  content: [data.text || (data.data && data.data.value)],
                  occurrence: data.occurrence,
                  page: data.page,
                  fieldName: data.fieldName
              }
          ]
      };
    },
    saveDocType: function(cmp) {
      var tree = cmp.find("captureTree");
      var treeItems = tree.get("v.items");
      var recordId = cmp.get("v.recordId");
      var versionId = cmp.get("v.documentVersionId");
      var helper = this;
      // Construct selection objects from tree items
      var selections = [];
      treeItems.forEach(function(headerNode) {
        headerNode.items.forEach(function(itemNode) {
          var nodeValue = itemNode.value;
          var isClause = helper.isClauseObject(nodeValue.describe.objectName);
          // Dummy recordId with correct object prefix
          var recordId = isClause ? nodeValue.recordId : nodeValue.describe.objectPrefix + "000000000000";
          selections.push({
            content: [nodeValue.value],
            occurrence: nodeValue.occurrence,
            page: nodeValue.page,
            fieldName: nodeValue.fieldName,
            objectid: recordId
          });
        });
      });
  
      var saveAction = cmp.get("c.saveDocType");
      var objectName = cmp.get("v.targetObjectName");
      helper.callAction(saveAction, {
        masterObjectName: objectName,
        userSelectionJson: JSON.stringify({
          objectId: "",
          documentId: versionId,
          templateId: recordId,
          values: selections
        })
      })
      .then(function(versionId) {
        // Track successful Capture: Save in mixpanel
        helper.mixpanelTrack("Capture: Save", {
          ObjectName: objectName,
          NumSelections: selections.length
        }).then(function() {
          helper.navigateToSObject(recordId);
        });
      })
      .catch(function(err) {
        helper.handleError(err);
      });
    },
    gotIframeMessage: function(component, e) {
      var helper = this;
      component.set("v.popover", undefined);

      if (e.data && e.data.x && e.data.y) {
        // find midpoint of bounding box
        var recordId = component.get('v.recordId');
        var clauseType = component.get("v.clauseType");
        var viewer = component.find("viewer");
        if (viewer) {
          var viewerEl = viewer.getElement();
          var y = e.data.y + viewerEl.offsetTop;
          var x = e.data.x + viewerEl.offsetLeft;
          var objectName = component.get("v.targetObjectName");
          var type = "APXT_Redlining:DocumentPopover";
          helper.createComponent(type, {
            popoverX: x,
            popoverY: y,
            popoverHeight: e.data && e.data.height,
            popoverPageNumber: e.data.page,
            popoverOccurrenceNumber: e.data.occurrence,
            isEditing: true,
            isCaptureMode: true,
            useQuoteTerms: clauseType == "CPQ Quote Terms",
            parentRecordId: recordId,
            sObjectName: objectName,
            userSelection: helper.getUserSelection(component, e.data),
            value: e.data.text || (e.data && e.data.data && e.data.data.value)
          })
          .then(function(popover,status,message) {
            component.set("v.popover", popover);
          })
          .catch(function(err) {
            helper.handleError(err);
          });
        }
      }
    },
    getIframeUrl: function(component, helper) {
      // var spinner = component.find('spinner').getElement();
      // $A.util.removeClass(spinner, 'slds-hide');

      var selectedCd = component.get('v.cdsById')[component.get('v.selectedCdId')];
      var avaliableVersions = selectedCd.avaliableVersions;
      var selectedPrimaryVersion = component.get('v.selectedPrimaryVersion');
      var selectedToVersion = component.get('v.selectedToVersion');
      var action = component.get('c.getCompareUrl');

      var params = {
        selectedPrimaryVersion: selectedPrimaryVersion,
        selectedToVersion: selectedToVersion,
        avaliableVersions: avaliableVersions
      };

      action.setParams({
        jsonString: JSON.stringify(params)
      });

      action.setCallback(this, function(res) {
        var parsedJson = JSON.parse(res.getReturnValue());

        component.set('v.cdName', selectedCd.Title);
        component.set('v.currentPrimaryVersion', selectedPrimaryVersion);
        component.set('v.currentToVersion', selectedToVersion);
        component.set('v.hasError', parsedJson.hasError);
        component.set('v.errMsg', parsedJson.errMsg);
        component.set('v.iframeUrl', parsedJson.iframeUrl);

        if (parsedJson.hasError) {
          helper.closeSpinner(component);
        }
      });

      // Remove iframe so that nagivation doesn't record in history.
      component.set('v.iframeUrl', null);
      $A.enqueueAction(action);
    },
    showSpinner: function(cmp) {
      var spinner = cmp.find('pdf-spinner') ? cmp.find('pdf-spinner').getElement() : null;
      if (spinner) {
        $A.util.removeClass(spinner, 'slds-hide');
      }
    },
    closeSpinner: function(component) {
      var spinner = component.find('pdf-spinner') ? component.find('pdf-spinner').getElement() : null;
      var congaContainer = component.find('conga-container') ? component.find('conga-container').getElement() : null;
      var isLightning = component.get('v.isLightning');

      if (!isLightning) {
        var modalBackdrop = component.find('modalBackdrop') ? component.find('modalBackdrop').getElement() : null;

        if (modalBackdrop) {
          $A.util.removeClass(modalBackdrop, 'slds-hide');
        }
      }

      if (spinner) {
        $A.util.addClass(spinner, 'slds-hide');
      }

      if (congaContainer) {
        $A.util.removeClass(congaContainer, 'slds-hide');
      }

      // var docSpinner = component.find('spinner').getElement();
      // $A.util.addClass(docSpinner, 'slds-hide');
    }
})