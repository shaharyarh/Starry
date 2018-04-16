({
    init: function(cmp, event, helper) {
        var promises = [];
        promises.push(helper.initObjectMappings(cmp));
        promises.push(helper.populateSalesforceObjects(cmp));
        promises.push(helper.populateExternalObjects(cmp));
        Promise.all(promises)
            .then(helper.safeCallback(cmp, function(result) {
                helper.setObjectLabels(cmp);
                cmp.set("v.showSpinner", false);
            }));
    },
    setSaveState: function(cmp, event, helper) {
        var btnSave = cmp.find("btnSave").getElement();
        if (btnSave) {
            var disabled = event.getParams().value;
            if (disabled) {
                btnSave.disabled = disabled;
            } else {
                btnSave.removeAttribute("disabled");
            }
        }
    },
    resetForm: function(cmp, event, helper) {

    },
    save: function(cmp, event, helper) {
        helper.save(cmp);
    },
    cancel: function(cmp, event, helper) {
        cmp.set("v.showSpinner", true);
        helper.initObjectMappings(cmp)
            .then(helper.safeCallback(cmp, function(result) {
                helper.setObjectLabels(cmp);
                cmp.set("v.showSpinner", false);
                cmp.set("v.objectMappingToBuild", undefined);
            }));
    },
    addMapping: function(cmp, event, helper) {
        cmp.set("v.objectMappingToBuild", { IsActive: false, ConnectionId: cmp.get("v.connectionId") });
    },
    handleItemMenuSelect: function(cmp, event, helper) {
        var option = event.getParam("value");
        var parsedOption = option.split(";");
        var itemIndex = parseInt(parsedOption[0]);
        var action = parsedOption[1];

        if (action === "edit") {
            helper.loadObjectMapping(cmp, itemIndex);
        } else if (action === "delete") {
            cmp.set("v.confirmDeleteIndex", itemIndex);
        }
    },
    cancelDelete: function(cmp, e, helper) {
        cmp.set("v.confirmDeleteIndex", undefined);
    },
    confirmDelete: function(cmp, e, helper) {
        var itemIndex = cmp.get("v.confirmDeleteIndex");
        if (itemIndex == undefined)
            return;

        cmp.set("v.confirmDeleteIndex", undefined);
        cmp.set("v.showSpinner", true);
        helper.deleteObjectMapping(cmp, itemIndex);
    },
})