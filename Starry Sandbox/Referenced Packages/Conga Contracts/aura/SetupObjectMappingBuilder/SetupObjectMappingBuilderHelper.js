({
    initObjects: function(cmp) {
        var helper = this;
        if (!helper.validateSelectedObjects(cmp))
            return;
        
        var selectedSalesforceObject = cmp.get("v.objectMapping.SalesforceObjectName");
        var selectedExternalObject = cmp.get("v.objectMapping.ExternalObjectName");

        var promises = [];

        if (selectedSalesforceObject) {
            promises.push(helper.populateSalesforceObjectFields(cmp, selectedSalesforceObject));
        }

        if (selectedExternalObject) {
            var selectedExternalObjectId = helper.getSelectedExternalObjectId(cmp, selectedExternalObject);
            cmp.set("v.externalObjectId", selectedExternalObjectId);
            
            promises.push(helper.populateExternalObjectFields(cmp, selectedExternalObjectId));
        }

        if (promises.length > 0) {
            cmp.set("v.showFieldSpinner", true);
        }

        Promise.all(promises)
            .then(helper.safeCallback(cmp, function(result) {
                cmp.set("v.showFieldSpinner", false);
            }));
    },
    validateForm: function(cmp) {
        var helper = this;

        var objectsPicked = helper.isLightningControlValid(cmp.find("selectSalesforceObjectName"))
            && helper.isLightningControlValid(cmp.find("selectExternalObjectName"));
        
        helper.setSaveState(cmp, !objectsPicked);

        // var isValid = helper.isLightningControlValid(cmp.find("selectExclusionSalesforceField"));

        // if (!isValid) {
        //     helper.setObjectMappingActiveState(cmp, false);
        //     return;
        // }

        // isValid = helper.isLightningControlValid(cmp.find("selectBypassApprovalSalesforceField"));

        // if (!isValid) {
        //     helper.setObjectMappingActiveState(cmp, false);
        //     return;
        // }

        // var findResult = cmp.find("fieldMapping");
        // if (findResult && findResult.length) {
        //     for (var i = 0; i < findResult.length; i++) {
        //         isValid = findResult[i].find("selectSalesforceField").checkValidity();
        //         if (!isValid) break;

        //         isValid = findResult[i].find("selectExternalField").checkValidity();
        //         if (!isValid) break;
                
        //         isValid = helper.validateFieldValues(cmp, findResult[i], "selectSalesforceFieldValue");
        //         if (!isValid) break;

        //         isValid = helper.validateFieldValues(cmp, findResult[i], "selectExternalFieldValue");
        //         if (!isValid) break;

        //         isValid = findResult[i].find("fieldPrimary").find("selectPrimary").checkValidity();
        //         if (!isValid) break;
        //     }
        // }
        // else if (findResult) {
        //     isValid = findResult.find("selectSalesforceField").checkValidity();
        //     if (isValid)
        //         isValid = findResult.find("selectExternalField").checkValidity();
        //     if (isValid)
        //         isValid = helper.validateFieldValues(cmp, findResult, "selectSalesforceFieldValue");
        //     if (isValid)
        //         isValid = helper.validateFieldValues(cmp, findResult, "selectExternalFieldValue")
        //     if (isValid)
        //         isValid = findResult.find("fieldPrimary").find("selectPrimary").checkValidity();
        // }

        // if (!isValid) {
        //     helper.setObjectMappingActiveState(cmp, false);
        //     return;
        // }
    },
    validateFieldValues: function(cmp, parentResult, id) {
        var findResult = parentResult.find(id);
        if (!findResult)
            return true;
        
        if (findResult.length) {
            for (var i = 0; i < findResult.length; i++) {
                if (!findResult[i].checkValidity())
                    return false;
            }

            return true;
        }
        else {
            return findResult.checkValidity();
        }        
    },
    isLightningControlValid: function(findResult) {
        if (findResult && findResult.length) {
            for (var i = 0; i < findResult.length; i++) {
                if (!findResult[i].checkValidity()) {
                    return false;
                }
            }
        }
        else if (findResult) {
            return findResult.checkValidity();
        }

        return true;
    },
    // this is used for verifying data is still accurate if it the db entry was hand entered
    validateSelectedObjects: function(cmp) {
        var helper = this;

        var selectedSalesforceObject = cmp.get("v.objectMapping.SalesforceObjectName");
        var selectedExternalObject = cmp.get("v.objectMapping.ExternalObjectName");

        if (!helper.isValidSelectedOption(selectedSalesforceObject, cmp.get("v.salesforceObjects"))) {
            cmp.set("v.objectErrorMessage", "Invalid Salesforce object: " + selectedSalesforceObject + ".  Check spelling and case.");
            return false;
        }

        if (!helper.isValidSelectedOption(selectedExternalObject, cmp.get("v.externalObjects"))) {
            cmp.set("v.objectErrorMessage", "Invalid Salesforce object: " + selectedExternalObject + ".  Check spelling and case.");
            return false;
        }

        cmp.set("v.objectErrorMessage", undefined);
        return true;
    },
    isValidSelectedOption: function(selectedValue, availableSelectOptions) {
        if (!selectedValue || !availableSelectOptions)
            return true;

        for (var i = 0; i < availableSelectOptions.length; i++) {
            if (selectedValue === availableSelectOptions[i].value)
                return true;
        }

        return false;
    },
    setSaveState: function(cmp, disabled) {
        var setSaveStateEvent = cmp.getEvent("setSaveState");
        if (setSaveStateEvent) {
            setSaveStateEvent.setParam("value", disabled);
            setSaveStateEvent.fire();
        }
    },
    getSelectedExternalObjectId: function(cmp, selectedApiName) {
        var selectedObjectId = undefined;
        var availableObjects = cmp.get("v.externalObjects");

        // this is a little awkward for external objects - we need to persist the apiName as the selected value,
        // but all integration api interfaces use the object ID instead of the name.
        for (var i = 0; i < availableObjects.length; i++) {
            if (availableObjects[i].value === selectedApiName) {
                selectedObjectId = availableObjects[i].id;
                break;
            }
        }

        return selectedObjectId;
    },
    populateSalesforceObjectFields: function(cmp, objectId) {
        var helper = this;
        var connectionId = cmp.get("v.connectionId");
        
        return helper.callAction(cmp.get("c.getSalesforceObjectFields"), {
            objectId: objectId
        })
        .then(helper.safeCallback(cmp, function(result) {
            var fields = JSON.parse(result);
            cmp.set("v.availableSalesforceFields", fields);
            helper.validateForm(cmp);
        }))
        .catch(function(err) {
            helper.handleError(err);
        });
    },
    populateExternalObjectFields: function(cmp, objectId) {
        var helper = this;
        var connectionId = cmp.get("v.connectionId");
        
        return helper.callAction(cmp.get("c.getExternalObjectFields"), {
            connectionId: connectionId,
            objectId: objectId
        })
        .then(helper.safeCallback(cmp, function(result) {
            var fields = JSON.parse(result);
            cmp.set("v.availableExternalFields", fields);
            helper.validateForm(cmp);
        }))
        .catch(function(err) {
            helper.handleError(err);
        });
    },
    getGlobalDirectionFromMappings: function(cmp, objectMapping) {
        var globalDirection = "";
        
        if (!objectMapping)
            objectMapping = cmp.get("v.objectMapping");

        if (!objectMapping || !objectMapping.FieldMappings)
            return globalDirection;
        
        for (var i = 0; i < objectMapping.FieldMappings.length; i++) {
            if (!globalDirection)
                globalDirection = objectMapping.FieldMappings[i].Direction;
            else if (globalDirection !== objectMapping.FieldMappings[i].Direction) {
                globalDirection = "";
                break;
            }
        }

        return globalDirection;
    },
    getGlobalPrimaryFromMappings: function(cmp, objectMapping) {
        var globalPrimary = "";
        
        if (!objectMapping)
            objectMapping = cmp.get("v.objectMapping");

        if (!objectMapping || !objectMapping.FieldMappings)
            return globalPrimary;
                
        for (var i = 0; i < objectMapping.FieldMappings.length; i++) {
            if (!globalPrimary)
                globalPrimary = objectMapping.FieldMappings[i].Primary;
            else if (globalPrimary !== objectMapping.FieldMappings[i].Primary) {
                globalPrimary = "";
                break;
            }
        }

        return globalPrimary
    },
    getDefaultDirection: function(cmp, objectMapping) {
        if (!objectMapping || !objectMapping.FieldMappings || objectMapping.FieldMappings.length === 0)
            return "both";

        var lastMapping = objectMapping.FieldMappings[objectMapping.FieldMappings.length - 1];
        return lastMapping.Direction;
    },
    getDefaultPrimary: function(cmp, objectMapping, directionOfNewMapping) {
        if (!objectMapping || !objectMapping.FieldMappings || objectMapping.FieldMappings.length === 0 
            || !directionOfNewMapping || directionOfNewMapping !== "both")
            return "";

        var lastMapping = objectMapping.FieldMappings[objectMapping.FieldMappings.length - 1];
        return lastMapping.Primary;
    }
})