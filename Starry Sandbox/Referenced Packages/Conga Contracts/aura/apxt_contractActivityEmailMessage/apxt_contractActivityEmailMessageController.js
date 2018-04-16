({
    onInit: function(component, event, helper) {
        var emailMessage = component.get('v.emailMessage');
        var emailMessageRelationList = [];
        var toAddressList = [];
        var ccAddressList = [];
        var bccAddressList = [];
        var fromAddressList = [];

        if (emailMessage && emailMessage.data && emailMessage.data.EmailMessageRelations) {
            emailMessageRelationList = emailMessage.data.EmailMessageRelations.records;
        }

        for (var i = 0; i < emailMessageRelationList.length; i++) {
            var emailMessageRelation = emailMessageRelationList[i];

            switch (emailMessageRelation.RelationType) {
                case 'ToAddress':
                    toAddressList.push(helper.getHtml(emailMessageRelation));
                    break;
                case 'CcAddress':
                    ccAddressList.push(helper.getHtml(emailMessageRelation));
                    break;
                case 'BccAddress':
                    bccAddressList.push(helper.getHtml(emailMessageRelation));
                    break;
                case 'FromAddress':
                    fromAddressList.push(helper.getHtml(emailMessageRelation));
                    break;
            }
        }

        component.set('v.toAddressHtml', toAddressList.join(', '));
        component.set('v.ccAddressHtml', ccAddressList.join(', '));
        component.set('v.bccAddressHtml', bccAddressList.join(', '));
    },
    openFilePreview: function(component, event, helper) {
        var action = $A.get('e.forceContent:openPreview');
        var recordId = event.target.getAttribute('data-attachmentid');

        action.setParams({
            recordId: recordId
        });
        action.fire();
    }
})