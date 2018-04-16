({
    getParentData: function(component, helper, params) {
        var showingTrueUp = component.get("v.showTrueUp");
        if (showingTrueUp) this.showTrueUp(component, false);
        this.showSpinner(component);

        return helper.callAction(component.get('c.getCompareData'), {
            jsonString: JSON.stringify(params)
        })
        .then(function(res) {
            var parsedJson = JSON.parse(res);

            component.set('v.namespace', parsedJson.namespace);
            component.set('v.namespaceApi', parsedJson.namespaceApi);
            component.set('v.isInit', false);

            if (parsedJson == null || parsedJson.noFiles) {
                component.set('v.hasNoFiles', true);
                helper.closeSpinner(component);
            } else {
                component.set('v.hasNoFiles', false);
                component.set('v.avaliableCds', parsedJson.formattedCds);
                component.set('v.selectedCdId', parsedJson.selectedCdId);

                if (parsedJson.formattedCdsById && parsedJson.selectedCdId && parsedJson.formattedCdsById[parsedJson.selectedCdId]) {
                    var selectedCd = parsedJson.formattedCdsById[parsedJson.selectedCdId];
                    component.set('v.cdName', selectedCd.Title);
                    component.set('v.primaryVersions', selectedCd.primaryVersionList);
                    component.set('v.selectedPrimaryVersion', parsedJson.selectedPrimaryVersion);
                    helper.calculateAvailableToVersions(component, selectedCd.primaryVersionList.length);
                }

                component.set('v.selectedToVersion', parsedJson.selectedToVersion);
                component.set('v.currentPrimaryVersion', parsedJson.selectedPrimaryVersion);
                component.set('v.currentToVersion', parsedJson.selectedToVersion);
                component.set('v.parentName', parsedJson.parentName);
                component.set('v.parentTypePrefix', parsedJson.parentTypePrefix);
                component.set('v.parentTypeLabel', parsedJson.parentTypeLabel);
                component.set('v.cdsById', parsedJson.formattedCdsById);
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
    },
    enableFeatures: function(cmp) {
        // Get user info
        var helper = this;
        helper.setUserInfo(cmp)
        .then(function(userInfo) {
            // Tell launch darkly we're this user
            return helper.initLaunchDarkly(userInfo, window.LDClient);
        })
        .then(helper.safeCallback(cmp, function(ldclient) {
            // Determine what features should be enabled
            var enableComments = ldclient.variation('enable-view-comments', false);
            cmp.set("v.ldEnableComments", enableComments);
        }));
    },
    saveAndDownload: function(cmp, actuallyDownload) {
        var treeList = cmp.find("negotiateTreeList");
        var helper = this;
        if (treeList) {
            var items = treeList.get("v.items");
            // Because items is a tree, we go one level deep to get clause items
            if (items.length > 0 && items[0].items) items = items[0].items;
            // Identify items which have a clauseId set (means theyve been replaced)
            var replacements = items.filter(function(x) {
                return x.clauseId != undefined;
            });
            var arrReplacements = [];
            if (replacements && replacements.length > 0) {
                arrReplacements = replacements.map(function(item) {
                    return {
                        objectIdOld: item.value.recordId,
                        objectIdNew: item.clauseId,
                        fieldNew: cmp.get("v.namespaceApi") + "Text_Rich__c",
                        fieldOld: item.value.fieldName,
                        page: -1,
                        occurrence: -1
                    };
                });
            }
            var revisionNo = cmp.get('v.selectedPrimaryVersion');
            var cdId = cmp.get("v.selectedCdId");
            var cdInfo = cmp.get("v.cdsById");
            if (revisionNo && cdInfo[cdId] && cdInfo[cdId].avaliableVersions[parseInt(revisionNo) - 1]) {
                var versionId = cdInfo[cdId].avaliableVersions[parseInt(revisionNo) - 1].Id;
                this.showSpinner(cmp);
                this.callAction(cmp.get("c.replaceObjects"), {
                    contentVersionId: versionId,
                    objectReplacementsJson: JSON.stringify(arrReplacements)
                })
                .then(helper.safeCallback(cmp, function(versionUrl) {
                    if (actuallyDownload) {
                        // Download file using hidden iframe
                        var davFrame = cmp.find("davFrame");
                        if (davFrame) {
                            var el = davFrame.getElement();
                            el.setAttribute("src", versionUrl);
                        }                                                                                       
                    }
                    // Refresh document view to see new version
                    recordId = cmp.get('v.recordId');
                    var params = {
                        parentId: recordId
                    }
                    helper.getParentData(cmp, helper, params)
                    .then(function() {
                        helper.showNegotiate(cmp, false);
                        helper.mixpanelTrack("Negotiate: Save", {
                            ObjectName: cmp.get("v.parentAPIName"),
                            NumReplacements: arrReplacements.length
                        });
                    });
                }))
                .catch(function(err) {
                    helper.handleError(err);
                });
            }
        }
    },
    showComments: function(cmp, show) {
        var helper = this;
        var msg = {
            action: "hideComments"
        };
        if (show === true) {
            msg.action = "showComments";
        }
        // Comments always off by default
        cmp.set("v.showComments", show);
        cmp.set("v.comments", undefined);
        setTimeout(helper.safeCallback(cmp, function() {
            // Short delay before sending iframe message
            // Is to allow for time for PDF.JS to resize
            // When comments panel is shown
            helper.sendIframeMessage(cmp, msg);
        }), 100);
    },
    showNegotiate: function(cmp, isShowing) {
        var helper = this;
        // CC-243 - Negotiate always shows last two revisions
        helper.setVersionsLast(cmp);
        // enable version selectors
        helper.disableVersions(cmp, false);
        helper.getIframeUrl(cmp);
        if (cmp.get("v.showTrueUp")) cmp.set("v.showTrueUp", false);
        cmp.set("v.showNegotiate", isShowing); // toggle to redlines when false
        // Comments are always off by default
        helper.showComments(cmp, false);
    }, 
    showTrueUp: function(cmp, isShowing) {
        var helper = this;
        if (isShowing) {
            // Change versions to first and last
            helper.calculateAvailableToVersions(cmp, cmp.get("v.selectedPrimaryVersion"), true);
            cmp.set("v.selectedPrimaryVersion", helper.getHighestPrimaryVersion(cmp) +  '');      
            // disable version selectors
            helper.disableVersions(cmp, true);
        }
        else { // toggle to redlines                       
            // CC-243 - Redlines always shows last two revisions
            helper.setVersionsLast(cmp);
            helper.disableVersions(cmp, false); 
        }
        helper.getIframeUrl(cmp);
        if (cmp.get("v.showNegotiate")) cmp.set("v.showNegotiate", false);
        cmp.set("v.showTrueUp", isShowing); // toggle to redlines when false       
    },
    setVersionsLast: function(cmp) {
        var highestPrimaryVersion = this.getHighestPrimaryVersion(cmp);
        this.calculateAvailableToVersions(cmp, highestPrimaryVersion);
        cmp.set("v.selectedPrimaryVersion", highestPrimaryVersion + '');
    },
    getHighestPrimaryVersion: function(cmp) {
        var highestPrimaryVersion = 1;
        var primaryVersions = cmp.get("v.primaryVersions");
        if (primaryVersions) highestPrimaryVersion = cmp.get("v.primaryVersions").length;
        return highestPrimaryVersion;
    },
    disableVersions: function(cmp, disabled) {
        var toVersion = cmp.find("toVersion");
        var primaryVersion = cmp.find("primaryVersion");
        if (Array.isArray(toVersion)) {
            toVersion.forEach(function(c) {
                c.set("v.disabled", disabled);
            });
        }
        if (Array.isArray(primaryVersion)) {
            primaryVersion.forEach(function(c) {
                c.set("v.disabled", disabled);
            });
        }
    },
    sendEnableSelectionMessage: function(component) {
        var helper = this;
        var showTrueUp = component.get("v.showTrueUp");
        component.set("v.iframeLoaded", true);
        
        if (showTrueUp) {
            helper.sendIframeMessage(component, {
                action:"enableSelection"
            });
        }
        helper.closeSpinner(component);
    },
    gotIframeMessage: function(component, e) {
        var helper = this;
        // Listen for events from pdfjs iframe
        if (e.data && e.data.action) {
            switch (e.data.action) {
                case "displayComments":
                    // If only one comment position aboslutely, otherwise position static so no overlaps
                    if (e.data && e.data.commentIds && e.data.commentIds.length > 1) {
                        component.set("v.commentsPositionAbsolute", false);
                    }
                    else {
                        component.set("v.commentsPositionAbsolute", true);
                    }
                    helper.createComments(component, e.data.commentIds);
                    break;
                case "documentReady":
                    helper.sendEnableSelectionMessage(component);
                    break;
                case "locationChange":
                default:
                    component.set("v.popover", undefined);
                    helper.createPopover(component, e);
                    break;
            }
        }
    },
    getLatestDocumentVersion: function(cmp) {
        // Get latest document version Id
        var revisionNo = cmp.get("v.selectedPrimaryVersion");
        var cdId = cmp.get("v.selectedCdId");
        var cdInfo = cmp.get("v.cdsById");
        if (revisionNo && cdInfo[cdId] && cdInfo[cdId].avaliableVersions[parseInt(revisionNo) - 1]) {
            var versionId = cdInfo[cdId].avaliableVersions[parseInt(revisionNo) - 1].Id;
            return versionId;
        }
    },
    getCommentInfo: function(cmp, versionId, commentIds) {
        // Get comment data for comments not currently displayed
        var helper = this;
        var action = cmp.get("c.getDocumentComments");
        action.setStorable({
            defaultExpiration: 60 * 5,
        });
        return helper.callAction(action, {
            documentVersionId: versionId,
            commentIdLstJson: JSON.stringify(commentIds)
        });
    },
    createCommentComponents: function(cmp, cmtInfo, commentLst) {
        // Transform metadata in to create components array
        var helper = this;
        var components = cmtInfo.map(function(c) {
            var comment = commentLst.find(function(x) {
                return x.commentId == c.commentId;
            });
            if (comment) {
                var coords = {y: comment.top};
                helper.adjustIframeOffset(cmp, coords);
                return ["APXT_Redlining:DocumentComment", {
                    offsetTop: coords.y,
                    author: c.author,
                    commentBody: c.commentBody,
                    date: new Date(parseInt(c.dateMs)),
                    commentId: c.commentId,
                    positionAbsolute: cmp.get("v.commentsPositionAbsolute")
                }];
            }
        });
        if (components && components.length > 0) {
            return helper.createComponents(components).then(helper.safeCallback(cmp, function(commentCmps) {
                commentCmps.forEach(helper.safeCallback(cmp, function(c) {
                    // When comment is rendered we will draw annotation back to document
                    c.addEventHandler("render", cmp.getReference("c.commentsRendered"));
                }));
                cmp.set("v.comments", commentCmps);
            }));
        }
        else {
            cmp.set("v.comments", null);
        }
    },
    createComments: function(cmp, commentLst) {
        var helper = this;
        var showComments = cmp.get("v.showComments");
        if (showComments && commentLst && commentLst.length > 0) {
            var versionId = helper.getLatestDocumentVersion(cmp);
            var newComponentIds = [];
            var helper = this;
            commentLst.forEach(function(c) {
                newComponentIds.push(c.commentId.replace("cmt_", ""));
            });
            // Retrieve data for new components
            helper.getCommentInfo(cmp, versionId, newComponentIds)
            .then(helper.safeCallback(cmp, function(cmtInfoJson) {
                var cmtInfo = JSON.parse(cmtInfoJson);
                return helper.createCommentComponents(cmp, cmtInfo, commentLst);
            }))
            .catch(function(err) {
                helper.handleError(err);
            });
        }
        else {
            // Don't display any comments
            cmp.set("v.comments", null);
        }
    },
    adjustIframeOffset: function(cmp, coords) {
        // Adjust offsets relative to iframe to relative to parent window
        var viewer = cmp.find("viewer");
        if (viewer) {
            if (viewer instanceof Array) viewer = viewer[0];
            var viewerEl = viewer.getElement();
            var y = parseInt(coords.y + viewerEl.offsetTop);
            var x = parseInt(coords.x + viewerEl.offsetLeft);
            coords.x = x;
            coords.y = y;
            return coords;
        }
    },
    createPopover: function(component, e) {
        var helper = this;
        // find midpoint of bounding box
        var recordId = component.get('v.recordId');
        var isNegotiate = component.get("v.showNegotiate");
        var useQT = component.get("v.useQuoteTerms");
        var isEditing = e.data.data == undefined || e.data.data.data === undefined;
        if (e.data && e.data.x && e.data.y) {
            var coords = {
                x: e.data.x,
                y: e.data.y
            };
            helper.adjustIframeOffset(component, coords);
            var data = isEditing ? {} : e.data.data;
            var fieldMeta = undefined;
            if (data.describe && data.fieldName && data.describe.fields[data.fieldName.toLowerCase()]) {
                fieldMeta = data.describe.fields[data.fieldName.toLowerCase()];
            }
            var objectName = data.objectName;
            if (data.describe && data.describe.objectName) {
                objectName = data.describe.objectName;
            }
            var isClause = helper.isClauseObject(objectName);
            var type = "APXT_Redlining:DocumentPopover";
            if (isNegotiate) {
                type = "APXT_Redlining:ClausePlaybookPopover";
            }

            var versionId = null;
            var revisionNo = component.get('v.selectedPrimaryVersion');
            var cdId = component.get("v.selectedCdId");
            var cdInfo = component.get("v.cdsById");
            if (revisionNo && cdInfo[cdId] && cdInfo[cdId].avaliableVersions[parseInt(revisionNo) - 1]) {
                versionId = cdInfo[cdId].avaliableVersions[parseInt(revisionNo) - 1].Id;
            }

            helper.createComponent(type, {
                popoverX: coords.x,
                popoverY: coords.y,
                popoverHeight: e.data && e.data.height,
                popoverPageNumber: data.page,
                popoverOccurrenceNumber: data.occurrence,
                isEditing: isEditing,
                isClause: isClause,
                useQuoteTerms: useQT,
                isTextarea: isClause || (fieldMeta != undefined && fieldMeta.type == "textarea" && fieldMeta.htmlFormatted),
                recordId: data.recordId || recordId,
                parentRecordId: recordId,
                sObjectName: objectName,
                fieldName: data.fieldName,
                fieldMeta: fieldMeta,
                data: data.data,
                describe: data.describe,
                userSelection: helper.getUserSelection(component, e.data),
                value: e.data.text || data.value || (e.data && e.data.data && e.data.data.value),
                contentVersionId: versionId
            })
            .then(function(popover,status,message) {
                component.set("v.popover", popover);
            })
            .catch(function(err) {
                helper.handleError(err);
            });
        }
    },
    focusIframe: function(cmp) {
        // This gives iframe input focus so that lightning components don't steal away focus when interacting with document
        var iframe = cmp.find("viewer");
        if (iframe && iframe.getElement) {
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
    getUserSelection: function(cmp, data) {
        var revisionNo = cmp.get("v.selectedPrimaryVersion");
        var cdId = cmp.get("v.selectedCdId");
        var cdInfo = cmp.get("v.cdsById");
        var content = data.text || (data.data && data.data.value);
        if (content != null && content.trim() != "" && revisionNo && cdInfo[cdId] && cdInfo[cdId].avaliableVersions[parseInt(revisionNo) - 1]) {
            var versionId = cdInfo[cdId].avaliableVersions[parseInt(revisionNo) - 1].Id;
            var originalId = cdInfo[cdId].avaliableVersions[0].Id;

            return {
                objectId: cmp.get('v.recordId'),
                documentId: versionId,
                documentOriginalId: originalId,
                values: [
                    {
                        content: [content],
                        occurrence: data.occurrence,
                        page: data.page,
                        fieldName: data.fieldName,
                        textInputName: data.data != null ? data.data.inputName : null
                    }
                ]
            };
        } else return null;
    },
    toggleOptionsMenu: function(cmp) {
        // If options ddl rendered, toggle open/close state
        var ddlOptions = cmp.find("ddlOptions");
        if (ddlOptions) {
            $A.util.toggleClass(ddlOptions, "slds-is-open");
        }
    },
    calculateAvailableToVersions: function(component, highestPrimaryVersion, selectFirst) {
        var toVersions = [];

        for (var i = 1; i <= highestPrimaryVersion; i++) {
            toVersions.push(i + ''); //make sure they're strings
        }

        component.set('v.toVersions', toVersions);

        if (highestPrimaryVersion == 1 || selectFirst) {
            component.set('v.selectedToVersion', '1');
        }
        else {
            component.set('v.selectedToVersion', (highestPrimaryVersion - 1) + '');
        }
    },
    getIframeUrl: function(component) {
        var helper = this;
        var selectedCd = component.get('v.cdsById')[component.get('v.selectedCdId')];
        var avaliableVersions = selectedCd.avaliableVersions;
        var selectedPrimaryVersion = component.get('v.selectedPrimaryVersion');
        var selectedToVersion = component.get('v.selectedToVersion');
        var action = component.get('c.getCompareUrl');
        var iframe = component.find("viewer");
        
        var params = {
            selectedPrimaryVersion: selectedPrimaryVersion,
            selectedToVersion: selectedToVersion,
            avaliableVersions: avaliableVersions
        };

        action.setParams({
            jsonString: JSON.stringify(params)
        });
        // Reset comments to off by default when reloading iframe
        helper.showComments(component, false);
        component.set("v.iframeLoaded", false);

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
    showWebDavModal: function(cmp) {
        var helper = this;
        this.createComponent("APXT_Redlining:EditLatestModal")
        .then(function(modal) {
            cmp.set("v.modal", modal);
        })
        .catch(function(err) {
            this.handleError(err);
        });
    },
    openWebDav: function(component, helper) {
        var selectedCd = component.get('v.cdsById')[component.get('v.selectedCdId')];
        var avaliableVersions = selectedCd.avaliableVersions;
        var selectedPrimaryVersion = component.get('v.selectedPrimaryVersion');
        var selectedToVersion = component.get('v.selectedToVersion');
        var action = component.get('c.getWebDavSession');
        var isLightning = component.get('v.isLightning');

        var params = {
            selectedPrimaryVersion: selectedPrimaryVersion,
            selectedToVersion: selectedToVersion,
            avaliableVersions: avaliableVersions
        };

        action.setParams({
            jsonString: JSON.stringify(params)
        });
        helper.showWebDavModal(component);
        action.setCallback(this, function(res) {
            var parsedJson = JSON.parse(res.getReturnValue());
            if(parsedJson.webDavUrl == undefined){
                // Are we not connected to Heroku?
                alert('Error: ' + parsedJson.errMsg);
                return;
            }

            if (isLightning==true){
                // Load page-to-open-msword in using sforce.one navigateToURL.
                // Allowed by lightning CSP, but has redundant prompts added.
                var davNav = $A.get("e.force:navigateToURL");
                davNav.setParams({ "url": parsedJson.webDavUrl });
                davNav.fire();
            } else {
                // Load page-to-open-msword in iframe.
                // Iframe allows load without redundant prompts but blocked by lightning CSP.
                $('#davFrame')[0].setAttribute('src', parsedJson.webDavUrl);
            }

        });

        $A.enqueueAction(action);
    },
    showSpinner: function(cmp) {
        var spinner = cmp.find('pdf-spinner') ? cmp.find('pdf-spinner').getElement() : null;
        if (spinner) {
            $A.util.removeClass(spinner, 'slds-hide');
        }
    },
    sendIframeMessage: function(cmp, params) {
        var iframe = cmp.find("viewer");
        if (iframe) {
            if (iframe instanceof Array) iframe = iframe[0];
            iframe = iframe.getElement().contentWindow;
            iframe.postMessage(params,"*");
        }
    },
    closeSpinner: function(component) {
        if (component.get('v.isInit') == false) {
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
    },
    closeOverlay: function(component) {

        var sldsContainer = component.find('slds-container').getElement();
        var congaContainer = component.find('conga-container') ? component.find('conga-container').getElement() : null;
        var compareSelector = component.find('compareSelector') ? component.find('compareSelector').getElement() : null;
        var spinner = component.find('pdf-spinner').getElement();

        $A.util.removeClass(spinner, 'slds-hide');
        if (congaContainer) {
            $A.util.addClass(congaContainer, 'slds-hide');
        }
        $A.util.addClass(sldsContainer, 'slds-hide');

        if (compareSelector) {
            $A.util.removeClass(compareSelector, 'conga-changed--transparent');
            $A.util.removeClass(compareSelector, 'conga-changed');
        }
    },
    markSelectionChanged: function(component) {
        var compareSelector = component.find('compareSelector').getElement();
        var isLightning = component.get('v.isLightning');
        var yellowClass = isLightning ? 'conga-changed--transparent' : 'conga-changed'
        $A.util.addClass(compareSelector, yellowClass);
    }
})