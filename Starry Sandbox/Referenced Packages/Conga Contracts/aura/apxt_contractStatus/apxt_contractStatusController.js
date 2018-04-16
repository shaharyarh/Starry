({
	onInit : function(component, event, helper){
        var recordId = component.get('v.recordId');
		var action = component.get('c.getStatusPicklistValues');
        
        action.setParams({recordId: recordId});

        action.setCallback(this, function(res){
            var parsedJson = JSON.parse(res.getReturnValue());

            component.set('v.namespaceApi', parsedJson.namespaceApi);
            component.set('v.labels', parsedJson.labels);

            if(parsedJson.hasError){
                component.set('v.hasError', true);
				component.set('v.errMsg', parsedJson.errMsg);
                return;
            }

            var statusObjs = [];
            var currentStatusIndex = 0;
            parsedJson.statusOptions.forEach(function(status, index){
                var statusObj = {
                    color : 'slds-is-incomplete',
                    label : status
                }

                if(status == parsedJson.currentStatus){
                    statusObj.color = 'slds-is-current';
                    currentStatusIndex = index;
                }

                statusObjs.push(statusObj);
            });


            for(var i = 0; i < currentStatusIndex; i++){
               	var statusObj = statusObjs[i];
                statusObj.color = 'slds-is-complete';
            }

            component.set('v.statusObjs', statusObjs);
		});

		$A.enqueueAction(action);
    },
    reloadStatus: function(component, event, helper){
        var recordId = component.get('v.recordId');
        var hasError = component.get('v.hasError');

        if(hasError){
            return;
        }

		var action = component.get('c.getNewStatus');

        action.setParams({recordId: recordId});

        action.setCallback(this, function(res){
            var newStatus = res.getReturnValue();
			var statusObjs = component.get('v.statusObjs');
            var currentStatusIndex = 0;

			statusObjs.forEach(function(statusObj, index){
                statusObj.color = 'slds-is-incomplete';

                if(statusObj.label == newStatus){
                    statusObj.color = 'slds-is-current';
                    currentStatusIndex = index;
                }
            });


            for(var i = 0; i < currentStatusIndex; i++){
               	var statusObj = statusObjs[i];
                statusObj.color = 'slds-is-complete';
            }

            component.set('v.statusObjs', []); //remove it first to make the animation smoother.
            component.set('v.statusObjs', statusObjs);
		});

		$A.enqueueAction(action);
    },
    ieSvg: function(component, event, helper) {
        svg4everybody();
    }
})