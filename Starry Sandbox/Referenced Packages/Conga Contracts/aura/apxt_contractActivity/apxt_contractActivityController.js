({
    onInit: function(component, event, helper) {
        var action = component.get('c.getActivityHistory');
        var recordId = component.get('v.recordId');

        action.setParams({
            recordId: recordId
        });
        action.setCallback(this, function(res) {
            var results = JSON.parse(res.getReturnValue());

            component.set('v.results', results);

            if (results.parent) {
                component.set('v.headerParams', [
                    '<a href="/{1}">{2}</a>',
                    results.parentId ? results.parentId : 'javascript.void(0)',
                    results.parentName
                ]);
            }

            component.set('v.isLoading', false);
        });

        $A.enqueueAction(action);
    },
    ieSvg: function(component, event, helper) {
        svg4everybody();
    }
})