({
    update: function(component, event, helper) {
        var label = component.get('v.label');
        var params = component.get('v.params');

        if (!label || !params || params.length == 0) {
            return;
        }
        
        for (var i = 0; i < params.length; i++) {
            label = label.replace(new RegExp('[{]' + i + '[}]', 'g'), params[i]);
        }

        component.set('v.formattedLabel', label);
    }
})