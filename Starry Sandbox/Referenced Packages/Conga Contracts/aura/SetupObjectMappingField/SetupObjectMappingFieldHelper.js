({
    handleLookupObjectPopulation: function(cmp, field) {
        var helper = this;

        if (!field || field.ExternalFieldType !== "id" || field.SalesforceFieldType !== "id"
            || !field.ExternalFieldName || !field.SalesforceFieldName) {
            cmp.set("v.salesforceLookupObjectFields", undefined);
            cmp.set("v.salesforceLookupObjectLabel", undefined);
            cmp.set("v.field.SalesforceLookupObjectName", undefined);
            cmp.set("v.field.SalesforceExternalIdFieldName", undefined);
            cmp.set("v.field.ExternalLookupObjectName", undefined);
            cmp.set("v.field.ExternalExternalIdFieldName", undefined);
            return;
        }

        var objectId = cmp.get("v.salesforceObjectName");
        return helper.callAction(cmp.get("c.getSalesforceLookupObjectFields"), {
            objectId: objectId,
            lookupFieldId: field.SalesforceFieldName
        })
        .then(helper.safeCallback(cmp, function (resultSerialized) {
            if (!resultSerialized)
                return;

            var result = JSON.parse(resultSerialized);
            cmp.set("v.salesforceLookupObjectFields", result.Items ? result.Items : []);

            cmp.set("v.field.SalesforceLookupObjectName", result.SalesforceLookupObjectName);
            cmp.set("v.salesforceLookupObjectLabel", result.SalesforceLookupObjectLabel);
            
            // hard coded external lookups for now
            cmp.set("v.field.ExternalLookupObjectName", "company");
            cmp.set("v.field.ExternalExternalIdFieldName", "companyName");
        }))
        .catch(function (err) {
            helper.handleError(err);
        });
    },
    populateAvailableSalesforceFieldValues: function (cmp, objectId, fieldId) {
        var helper = this;

        return helper.callAction(cmp.get("c.getSalesforceObjectFieldValues"), {
            objectId: objectId,
            fieldId: fieldId
        })
        .then(helper.safeCallback(cmp, function (result) {
            cmp.set("v.availableSalesforceFieldValues", JSON.parse(result));
            //helper.updateFieldDirection(cmp);
        }))
        .catch(function (err) {
            helper.handleError(err);
        });
    },
    populateAvailableExternalFieldValues: function (cmp, connectionId, fieldId) {
        var helper = this;

        return helper.callAction(cmp.get("c.getExternalObjectFieldValues"), {
            connectionId: connectionId,
            fieldId: fieldId
        })
        .then(helper.safeCallback(cmp, function (result) {
            cmp.set("v.availableExternalFieldValues", JSON.parse(result));
            //helper.updateFieldDirection(cmp);
        }))
        .catch(function (err) {
            helper.handleError(err);
        });
    },
    updateValueMappings: function (cmp) {
        var helper = this;
        var field = cmp.get("v.field");
        var valueMappingCount = helper.getValueMappingCount(cmp);
        var salesforceFieldValues = cmp.get("v.availableSalesforceFieldValues")
        var externalFieldValues = cmp.get("v.availableExternalFieldValues");
        var selectedDirection = cmp.get("v.field.Direction");
        var sourceIsSalesforce = selectedDirection === "both" || selectedDirection === "right";

        if (valueMappingCount === 0) {
            field.ValueMappings = undefined;
            var field = cmp.set("v.field", field);
            return;
        }

        // set default state for out all the value mappings to minimize user interaction
        var valueMappings = [];
        if (sourceIsSalesforce) {
            for (var i = 0; i < valueMappingCount; i++) {
                valueMappings.push(
                    {
                        "SalesforceValue": i < salesforceFieldValues.length ? salesforceFieldValues[i].value : undefined,
                        "ExternalValue": i < salesforceFieldValues.length ? helper.getClosestMatchingTargetValue(salesforceFieldValues[i].value, externalFieldValues) : undefined
                    }
                );
            }

        } else {
            for (var i = 0; i < valueMappingCount; i++) {
                valueMappings.push(
                    {
                        "SalesforceValue": i < externalFieldValues.length ? helper.getClosestMatchingTargetValue(externalFieldValues[i].value, salesforceFieldValues) : undefined,
                        "ExternalValue": i < externalFieldValues.length ? externalFieldValues[i].value : undefined
                    }
                );
            }
        }

        field.ValueMappings = valueMappings;
        var field = cmp.set("v.field", field);
    },
    getClosestMatchingTargetValue: function (sourceValue, availableTargetValues) {
        var helper = this;

        if (!sourceValue || !availableTargetValues)
            return undefined;

        var closestMatch = undefined;
        var closestMatchDistance = 99999;
        for (var i = 0; i < availableTargetValues.length; i++) {
            var distance = helper.getEditDistance(sourceValue.toUpperCase(), availableTargetValues[i].value.toUpperCase());
            if (!closestMatch || distance < closestMatchDistance) {
                closestMatch = availableTargetValues[i].value;
                closestMatchDistance = distance;
            }

            if (distance === 0) break;
        }

        return closestMatch;
    },
    // levenshtein distance formula
    getEditDistance: function(a, b) {
        if (a.length === 0) return b.length
        if (b.length === 0) return a.length
        let tmp, i, j, prev, val, row
        // swap to save some memory O(min(a,b)) instead of O(a)
        if (a.length > b.length) {
            tmp = a
            a = b
            b = tmp
        }
    
        row = Array(a.length + 1)
        // init the row
        for (i = 0; i <= a.length; i++) {
            row[i] = i
        }
    
        // fill in the rest
        for (i = 1; i <= b.length; i++) {
            prev = i
            for (j = 1; j <= a.length; j++) {
                if (b[i - 1] === a[j - 1]) {
                    val = row[j - 1] // match
                } else {
                    val = Math.min(row[j - 1] + 1, // substitution
                        Math.min(prev + 1, // insertion
                            row[j] + 1)) // deletion
                }
                row[j - 1] = prev
                prev = val
            }
            row[a.length] = prev
        }
        return row[a.length]
    },
    getValueMappingCount: function (cmp) {
        var salesforceFieldValues = cmp.get("v.availableSalesforceFieldValues")
        var externalFieldValues = cmp.get("v.availableExternalFieldValues");

        if (!salesforceFieldValues || !externalFieldValues || salesforceFieldValues.length === 0 || externalFieldValues.length === 0)
            return 0;

        return Math.max(salesforceFieldValues.length, externalFieldValues.length);
    },
    getFieldType: function (cmp, fieldApiName, availableFieldsAttribute) {
        var availableFields = cmp.get(availableFieldsAttribute);

        for (var i = 0; i < availableFields.length; i++) {
            if (availableFields[i].value === fieldApiName && availableFields[i].type) {
                return availableFields[i].type.toLowerCase();
            }
        }

        return "string";
    },
    getExternalFieldId: function (cmp, fieldApiName) {
        var availableFields = cmp.get("v.availableExternalFields");

        for (var i = 0; i < availableFields.length; i++) {
            if (availableFields[i].value === fieldApiName) {
                return availableFields[i].id;
            }
        }

        return undefined;
    }





    
    // TODO: REMOVE code that disabled bidirectional field direction after we implement warnings.  This may still be useful
    // updateFieldDirection: function (cmp) {
    //     var helper = this;
    //     var defaultDirection = "right";

    //     var fieldDirection = cmp.find('fieldDirection');
    //     var selectedDirection = cmp.get("v.field.Direction");
    //     var validDirections = helper.getValidDirections(cmp);
    //     fieldDirection.setEnabledDirections(validDirections);

    //     if (validDirections.indexOf(selectedDirection) === -1) {
    //         fieldDirection.changeSelectedDirection(defaultDirection);
    //     }
    // },
    // getValidDirections: function (cmp) {
    //     var salesforceFieldValues = cmp.get("v.availableSalesforceFieldValues")
    //     var externalFieldValues = cmp.get("v.availableExternalFieldValues");

    //     // ensure available values are the same length - if they are we can map both directions
    //     if (!salesforceFieldValues || !externalFieldValues
    //         || salesforceFieldValues.length === 0 || externalFieldValues.length === 0
    //         || salesforceFieldValues.length === externalFieldValues.length)
    //         return ["left", "both", "right"];

    //     // if available values are not the same length we can't map both directions
    //     return ["left", "right"];
    // },









    // TODO: Remove commented code when we implement field typecast warnings (post-MVP).  This code is usable for that.

    // initSelectableFieldsOnPageLoad: function(cmp, field) {
    //     var helper = this;
    //     cmp.set("v.selectableSalesforceFields", helper.getSelectableSalesforceFields(cmp, field));
    //     cmp.set("v.selectableExternalFields", helper.getSelectableExternalFields(cmp, field));
    // },
    // getSelectableSalesforceFields: function(cmp, field) {
    //     var helper = this;
    //     var availableFields = cmp.get("v.availableSalesforceFields");

    //     if (!field.ExternalFieldType)
    //         return availableFields;

    //     var conversionMap = helper.getConversionMap();
    //     var selectableFields = [];

    //     for(var i = 0; i < availableFields.length; i++) {
    //         if (helper.isCastable(field.ExternalFieldType, availableFields[i].type, conversionMap)) {
    //             selectableFields.push(availableFields[i]);
    //         }
    //     }

    //     return selectableFields;
    // },
    // getSelectableExternalFields: function(cmp, field) {
    //     var helper = this;
    //     var availableFields = cmp.get("v.availableExternalFields");
        
    //     var conversionMap = helper.getConversionMap();
    //     var selectableFields = [];

    //     for(var i = 0; i < availableFields.length; i++) {
    //         // filter out all reference fields except for companyid
    //         if (availableFields[i].type !== "id" || availableFields[i].value.toLowerCase() === "companyid") {

    //             // if we haven't picked a salesforce field everything is available
    //             if (!field.SalesforceFieldType) {
    //                 selectableFields.push(availableFields[i]);
    //             } else {
    //                 if (helper.isCastable(field.SalesforceFieldType, availableFields[i].type, conversionMap)) {
    //                     selectableFields.push(availableFields[i]);
    //                 }
    //             }
    //         }
    //     }

    //     return selectableFields;
    // },
    // isCastable: function(sourceType, targetType, conversionMap) {
    //     // these are always able to be casted to
    //     // TODO: what do we do with calculated fields
    //     if (targetType === "string" || targetType === "object" || targetType === "blob")
    //         return true;

    //     // specific case for id - the target must be a id or one of the above types
    //     if (sourceType === "id")
    //         return targetType === "id";
        
    //     // if types are unknown it's castable
    //     if (!conversionMap || !conversionMap[sourceType] || !conversionMap[targetType])
    //         return true;

    //     return conversionMap[sourceType].indexOf(targetType) > -1;
    // },
    // getConversionMap: function() {
    //     // any type not listed here, i.e. string/object/blob, is castable to/from any other type.
    //     var castableTypes = [
    //         // numeric
    //         ["int", "long", "int64", "int32", "double", "decimal", "float", "number", "boolean", "bool"],

    //         //dates
    //         ["date", "datetime", "time"],

    //         //picklist
    //         ["picklist", "multipicklist"],

    //         //id should only map to itself or string/object/blob data types.
    //         ["id"],

    //         //id -- special case for this one.  only maps to other id fields (or string/object/blob per the isCastable function).
    //         ["id"]
    //     ];

    //     var conversionMap = {};

    //     for (var groupIndex = 0; groupIndex < castableTypes.length; groupIndex++) {
    //         for (var typeIndex = 0; typeIndex < castableTypes[groupIndex].length; typeIndex++) {
    //             // each type in a group maps to all the other types in the group
    //             conversionMap[castableTypes[groupIndex][typeIndex]] = castableTypes[groupIndex];
    //         }
    //     }

    //     return conversionMap;
    // }
})