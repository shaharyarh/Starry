({
    getParentData: function(component, event, helper) {
        var isLightning = component.get('v.isLightning');
        var timestampMatch = location.href.match(/t=(\d+)/);
        var recordId;

        if (isLightning != true) {
            recordId = component.get('v.recordId');
            var params = {
                parentId: recordId
            }

            helper.getParentData(component, helper, params);
        }

        if (timestampMatch && timestampMatch.length > 1) {
            component.set('v.timestamp', timestampMatch[1]);
        }

        addEventListener("message", helper.safeCallback(component,function(e) {
            helper.gotIframeMessage(component, e);
        }));
    },
    toggleComments: function(cmp, e, helper) {
        var checked = e.target.checked;
        helper.showComments(cmp, checked);
    },
    popoverClose: function(cmp, e, helper){
        helper.focusIframe(cmp);
        var params = e.getParam("value");
        if (params) {
            var treeList = cmp.find("trueUpTreeList");
            if (treeList) {
                treeList.updateSelected(params.skip, params.isCompleted)
            }
        }
    },
    showNewClauseModal: function(cmp, e, helper) {
        var params = e.getParams();
        var useQT = cmp.get("v.useQuoteTerms");
        var managedClauseAPI = "SBQQ__QuoteTerm__c";
        if (!useQT) {
            var userInfo = cmp.get("v.userInfo");
            var ns = userInfo && userInfo.AppNamespace && userInfo.AppNamespace.length > 0 && userInfo.AppNamespace + "__";
            managedClauseAPI = ns + "Managed_Clause__c";
        }
        helper.createComponent("APXT_Redlining:CreateClause", {
            text:params.value,
            managedClauseAPIName: managedClauseAPI,
            parentRecordId: cmp.get("v.recordId")
        })
        .then(helper.safeCallback(cmp,function(modal) {
            // Hide popover
            cmp.set("v.popover", undefined);
            // Show modal create window
            cmp.set("v.modal", modal);
        }))
        .catch(function(err) {
            helper.handleError(err);
        });
    },
    initMixpanel: function(cmp, e, helper) {
        helper.setUserInfo(cmp)
        .then(function(userInfo) {
            helper.initMixpanel(userInfo);
            helper.mixpanelTrack("View Redlines", {
                ObjectName: cmp.get("v.parentAPIName")
            });
        })
        .catch(function(err) {
            console.log(err);
        });
    },
    initLaunchDarkly: function(cmp, e, helper) {
        helper.enableFeatures(cmp);
    },
    optionsClick: function(cmp, e, helper) {
        helper.toggleOptionsMenu(cmp);
    },
    save: function(cmp, e, helper) {
        helper.saveAndDownload(cmp, false);
    },
    saveAndDownload: function(cmp, e, helper) {
        helper.saveAndDownload(cmp, true);
    },
    commentsRendered: function(cmp, e, helper) {
        var target = e.getSource();
        var offset = target.get("v.staticTop");
        var absolute = target.get("v.positionAbsolute");
        // To go from window coords to iframe coords we pass in negative value and get absolute value
        var endY = undefined;
        if (absolute == false) {
            var container = cmp.find("commentStaticContainer");
            var cEl = container.getElement();
            var coords = helper.adjustIframeOffset(cmp, {x:0,y:-offset - cEl.offsetTop});
            endY = Math.abs(coords.y);
        }
        // Tell PDF.JS to draw an annotation to 
        // Where our comment is rendered
        helper.sendIframeMessage(cmp, {
            action:"updateCommentAnnotation",
            isSelected: false,
            endY: endY,
            commentId: target.get("v.commentId")
        });
    },
    showNegotiate: function(cmp, e, helper) {
        var isShowing = cmp.get("v.showNegotiate");
        helper.showNegotiate(cmp, !isShowing);
        helper.toggleOptionsMenu(cmp);
        if (!isShowing) {
            helper.mixpanelTrack("View Redlines: Negotiate", {
                ObjectName: cmp.get("v.parentAPIName"),
            });
        }
    },
    showTrueUp: function(cmp, e, helper) {
        var isShowing = cmp.get("v.showTrueUp");
        helper.showTrueUp(cmp, !isShowing);
        helper.toggleOptionsMenu(cmp);
        if (!isShowing) {
            helper.mixpanelTrack("View Redlines: True Up", {
                ObjectName: cmp.get("v.parentAPIName"),
            });
        }
    },
    getIframeUrl: function(component, event, helper) {
        helper.getIframeUrl(component);
        helper.mixpanelTrack("View Redlines: Compare", {
            ObjectName: component.get("v.parentAPIName")
        });
    },
    openWebDav: function(component, event, helper) {
        helper.openWebDav(component, helper);
        helper.toggleOptionsMenu(component);
        helper.mixpanelTrack("View Redlines: Edit Latest", {
            ObjectName: component.get("v.parentAPIName")
        });
    },
    recalcToVersions: function(component, event, helper) {
        helper.calculateAvailableToVersions(component, component.get('v.selectedPrimaryVersion'));
        helper.getIframeUrl(component, helper);
    },
    markSelectionChanged: function(component, event, helper) {
        helper.markSelectionChanged(component);
    },
    sendIframeMessage: function(cmp, e, helper) {
        var iframeLoaded = cmp.get("v.iframeLoaded");
        if (iframeLoaded) {
            var params = e.getParams();
            helper.sendIframeMessage(cmp, params.value);
        }
    },
    displayOverlay: function(component, event, helper) {
        document.body.onkeydown = function(e) {
            // On escape close the overlay
            if (e.keyCode == 27) {
                helper.closeOverlay(component);
            }
        };

        var ids = event.getParam('recordId').split('|');
        var timestamp = component.get('v.timestamp');

        if (ids.length >= 2 && timestamp && timestamp !== ids[2]) {
            return;
        }

        var params = {
            contentVersionId: ids[0],
            parentId: ids[1]
        }

        helper.getParentData(component, helper, params);

        var sldsContainer = component.find('slds-container').getElement();
        $A.util.removeClass(sldsContainer, 'slds-hide');
    },
    closeOverlay: function(component, event, helper) {
        // Remove listener on close
        document.body.onkeydown = null;
        helper.closeOverlay(component);
    },
    changedDocument: function(component, event, helper) {
        var selectedCd = component.get('v.cdsById')[component.get('v.selectedCdId')]
        var totalVersions = selectedCd.primaryVersionList.length;
        component.set('v.primaryVersions', selectedCd.primaryVersionList);
        component.set('v.selectedPrimaryVersion', totalVersions + '');
        var isTrueUp = component.get("v.showTrueUp");
        helper.calculateAvailableToVersions(component, totalVersions, isTrueUp);
        helper.disableVersions(component, isTrueUp);
        helper.getIframeUrl(component, helper);
    },
    changedDocumentDialog: function(component, event, helper) {
        var selectedCd = component.get('v.cdsById')[component.get('v.selectedCdId')]
        var totalVersions = selectedCd.primaryVersionList.length;
        component.set('v.primaryVersions', selectedCd.primaryVersionList);
        component.set('v.selectedPrimaryVersion', totalVersions + '');
        var isTrueUp = component.get("v.showTrueUp");
        helper.calculateAvailableToVersions(component, totalVersions, isTrueUp);
        helper.disableVersions(component, isTrueUp);
        helper.markSelectionChanged(component);
    },
    goToParent: function(component, event, helper) {
        window.location.href = '/' + component.get('v.recordId');
    },
    mobileGetIframeUrl: function(component, event, helper) {
        var modalBackdrop = component.find('modalBackdrop').getElement();
        var dismissModal = component.get('c.dismissModal');

        $A.util.addClass(modalBackdrop, 'slds-hide');
        $A.enqueueAction(dismissModal);
        helper.getIframeUrl(component, helper);
    },
    showModal: function(component, event, helper) {
        var modal = component.find('modal').getElement();
        var modalBackdrop = component.find('modalBackdrop').getElement();
        $A.util.addClass(modal, 'slds-fade-in-open');
        $A.util.addClass(modalBackdrop, 'slds-backdrop--open');
        helper.toggleOptionsMenu(component);
    },
    dismissModal: function(component, event, helper) {
        var modal = component.find('modal').getElement();
        var modalBackdrop = component.find('modalBackdrop').getElement();

        $A.util.removeClass(modal, 'slds-fade-in-open');
        $A.util.removeClass(modalBackdrop, 'slds-backdrop--open');
    }
})