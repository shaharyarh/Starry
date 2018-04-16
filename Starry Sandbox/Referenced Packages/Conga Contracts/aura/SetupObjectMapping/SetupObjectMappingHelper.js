({
    initObjectMappings: function(cmp) {
        var helper = this;

        return helper.callAction(cmp.get("c.getObjectMappings"), {
                connectionId: cmp.get("v.connectionId")
            })
            .then(helper.safeCallback(cmp, function(result) {
                cmp.set("v.items", result);
            }))
            .catch(function(err) {
                helper.handleError(err);
            });
    },
    populateSalesforceObjects: function(cmp) {
        var helper = this;

        return helper.callAction(cmp.get("c.getSalesforceObjects"), {})
            .then(helper.safeCallback(cmp, function(result) {
                var salesforceObjects = JSON.parse(result);
                cmp.set("v.salesforceObjects", salesforceObjects);
            }))
            .catch(function(err) {
                helper.handleError(err);
            });
    },
    populateExternalObjects: function(cmp) {
        var helper = this;
        var connectionId = cmp.get("v.connectionId");

        return helper.callAction(cmp.get("c.getExternalObjects"), {
                connectionId: connectionId
            })
            .then(helper.safeCallback(cmp, function(result) {
                var externalObjects = JSON.parse(result);
                cmp.set("v.externalObjects", externalObjects);
            }))
            .catch(function(err) {
                helper.handleError(err);
            });
    },
    setObjectLabels: function(cmp) {
        var helper = this;
        var items = cmp.get("v.items");
        if (!items)
            return;

        var salesforceObjects = cmp.get("v.salesforceObjects");
        var externalObjects = cmp.get("v.externalObjects");

        for (var i = 0; i < items.length; i++) {
            var salesforceObject = helper.findByAttribute(salesforceObjects, "value", items[i].SalesforceObjectName);
            var externalObject = helper.findByAttribute(externalObjects, "value", items[i].ExternalObjectName);
            
            items[i].SalesforceObjectLabel = salesforceObject && salesforceObject.label ? salesforceObject.label : items[i].SalesforceObjectName;
            items[i].ExternalObjectLabel = externalObject && externalObject.label ? externalObject.label : items[i].ExternalObjectName;
        }

        cmp.set("v.items", items);
    },
    findByAttribute: function(array, attr, value) {
        if (!array)
            return undefined;

        for(var i = 0; i < array.length; i++) {
            if(array[i][attr] === value) {
                return array[i];
            }
        }

        return undefined;
    },
    save: function(cmp) {
        var helper = this;
        cmp.set("v.showSpinner", true);

        var objectMapping = cmp.get("v.objectMappingToBuild");

        return helper.callAction(cmp.get("c.saveObjectMapping"), {
                objectMappingJson: JSON.stringify(objectMapping)
            })
            .then(helper.safeCallback(cmp, function(result) {
                helper.initObjectMappings(cmp)
                    .then(helper.safeCallback(cmp, function(result) {
                        helper.setObjectLabels(cmp);
                        cmp.set("v.showSpinner", false);
                        cmp.set("v.objectMappingToBuild", undefined);
                    }));
            }))
            .catch(function(err) {
                helper.handleError(err);
                cmp.set("v.showSpinner", false);
            });
    },
    loadObjectMapping: function(cmp, itemIndex) {
        var items = cmp.get("v.items");
        cmp.set("v.objectMappingToBuild", items[itemIndex]);
    },
    deleteObjectMapping: function(cmp, itemIndex) {
        var helper = this;

        var objectMapping = cmp.get("v.items")[itemIndex];

        return helper.callAction(cmp.get("c.deleteObjectMapping"), {
                objectMappingJson: JSON.stringify(objectMapping)
            })
            .then(helper.safeCallback(cmp, function(result) {
                helper.initObjectMappings(cmp)
                    .then(helper.safeCallback(cmp, function(result) {
                        helper.setObjectLabels(cmp);
                        cmp.set("v.showSpinner", false);
                    }));                
            }))
            .catch(function(err) {
                helper.handleError(err);
            });
    }
})