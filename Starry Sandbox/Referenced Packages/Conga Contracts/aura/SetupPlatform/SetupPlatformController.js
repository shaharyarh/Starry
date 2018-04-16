({
    init: function(cmp, event, helper) {
        // Set current files setting status
        helper.getFilesEnabled(cmp);
        helper.getExternalConnections(cmp);
    },
    filesEnabledChange: function(cmp, event, helper) {
        var target = event.target;
        cmp.set("v.isFilesEnabled", target.checked ? true : false);
        cmp.set("v.isDirty", true);
    },
    save: function(cmp, event, helper) {
        helper.save(cmp);
    },
    cancel: function(cmp, event, helper) {
        // User canceled action reset UI to current state
        helper.getFilesEnabled(cmp);
    }
})