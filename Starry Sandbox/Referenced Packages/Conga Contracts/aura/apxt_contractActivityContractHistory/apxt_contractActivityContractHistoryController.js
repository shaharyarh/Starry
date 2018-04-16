({
    onInit: function(component, event, helper) {
        var fieldHistoryData = component.get('v.fieldHistory.data');

        if (fieldHistoryData.OldValue) {
            fieldHistoryData.OldValue = fieldHistoryData.OldValue.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        }

        if (fieldHistoryData.NewValue) {
            fieldHistoryData.NewValue = fieldHistoryData.NewValue.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        }

        if (fieldHistoryData.primaryDocumentTitle) {
            fieldHistoryData.primaryDocumentTitle = fieldHistoryData.primaryDocumentTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        component.set('v.activatedContractParams', [
            '<a href="/{3}">{4}</a>',
            fieldHistoryData.OldValue,
            fieldHistoryData.NewValue,
            fieldHistoryData.CreatedById,
            fieldHistoryData.CreatedBy.Name
        ]);

        component.set('v.changedContractParams', [
            '<a href="/{3}">{4}</a>',
            fieldHistoryData.OldValue,
            fieldHistoryData.NewValue,
            fieldHistoryData.CreatedById,
            fieldHistoryData.CreatedBy.Name
        ]);

        component.set('v.newPrimaryDocumentParams', [
            '<a href="/{2}">{3}</a>',
            '<a href="javascript:void(0);" '
                + 'onclick="var action = $A.get(\'e.forceContent:openPreview\'); '
                + 'action.setParams({recordId: \'{4}\'}); '
                + 'action.fire();">{5}</a>',
            fieldHistoryData.CreatedById,
            fieldHistoryData.CreatedBy.Name,
            fieldHistoryData.primaryDocumentId,
            fieldHistoryData.primaryDocumentTitle
        ]);
    }
})