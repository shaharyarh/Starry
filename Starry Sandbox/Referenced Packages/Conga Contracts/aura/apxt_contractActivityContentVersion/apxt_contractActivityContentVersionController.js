({
    onInit: function(component, event, helper) {
        var contentVersionData = component.get('v.contentVersion.data');
        var timestampMatch = location.href.match(/t=(\d+)/);
        var viewRedlinesParameters = contentVersionData.Id + '|' + component.get('v.parentId');

        if (timestampMatch && timestampMatch.length > 1) {
            viewRedlinesParameters += '|' + timestampMatch[1];
        }

        if (contentVersionData.CreatedBy.Name) {
            contentVersionData.CreatedBy.Name = contentVersionData.CreatedBy.Name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        if (contentVersionData.ContentDocument.Title) {
            contentVersionData.ContentDocument.Title = contentVersionData.ContentDocument.Title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        component.set('v.uploadFirstParams', [
            '<a href="/{2}">{3}</a>',
            '<a href="javascript:void(0);" ' 
                + 'onclick="var action = $A.get(\'e.forceContent:openPreview\'); ' 
                + 'action.setParams({recordId: \'{4}\'}); ' 
                + 'action.fire();">{5}</a>',
            contentVersionData.CreatedById,
            contentVersionData.CreatedBy.Name,
            contentVersionData.ContentDocumentId,
            contentVersionData.ContentDocument.Title
        ]);

        component.set('v.uploadValidParams', [
            '<a href="/{3}">{4}</a>',
            '<a href="javascript:void(0);" ' 
                + 'onclick="var action = $A.get(\'e.ltng:selectSObject\'); ' 
                + 'action.setParams({recordId: \'{5}\'}); ' 
                + 'action.fire();">' + component.get('v.labels.apxt_contractActivityContentVersion_uploadValid_newVersion') + '</a>',
            '<a href="javascript:void(0);" ' 
                + 'onclick="var action = $A.get(\'e.forceContent:openPreview\'); ' 
                + 'action.setParams({recordId: \'{6}\'}); ' 
                + 'action.fire();">{7}</a>',
            contentVersionData.CreatedById,
            contentVersionData.CreatedBy.Name,
            viewRedlinesParameters,
            contentVersionData.ContentDocumentId,
            contentVersionData.ContentDocument.Title
        ]);

        component.set('v.uploadInvalidParams', [
            '<a href="/{3}">{4}</a>',
            component.get('v.labels.apxt_contractActivityContentVersion_uploadValid_newVersion'),
            '<a href="javascript:void(0);" ' 
                + 'onclick="var action = $A.get(\'e.forceContent:openPreview\'); ' 
                + 'action.setParams({recordId: \'{5}\'}); ' 
                + 'action.fire();">{6}</a>',
            contentVersionData.CreatedById,
            contentVersionData.CreatedBy.Name,
            contentVersionData.ContentDocumentId,
            contentVersionData.ContentDocument.Title
        ]);
    }
})