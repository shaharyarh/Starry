({
    init: function(cmp, e, helper) {
        // Check and set isConnected status
        helper.getIsConnected(cmp);
        // Check if any pending authCode, if user generated one and later returned
        helper.getPendingAuthorization(cmp);
        // Load external connections
        helper.getExternalConnections(cmp);
        // Check if file storage enabled
        helper.getFilesEnabled(cmp);
        // initialize oauth link
        helper.setOAuthUrl(cmp);
    },
    pollForPlatformConnection: function(cmp, e, helper) {
        helper.pollForPlatformConnection(cmp);
    },
    navigateEnableFiles: function(cmp, e, helper) {
        // When files are disabled user can click tooltip to be navigated to enable
        var selectEvent = cmp.getEvent("selectTreeItem");
        if (selectEvent) {
            selectEvent.setParam("value", "platformGeneral");
            selectEvent.fire();
        }
    },
    cancelDeleteConnection: function(cmp, e, helper) {
        cmp.set("v.confirmDeleteConnectionId", undefined);
        helper.hideDeleteConnectionModal(cmp);
    },
    confirmDeleteConnection: function(cmp, e, helper) {
        var id = e.currentTarget.getAttribute("data-id");
        cmp.set("v.confirmDeleteConnectionId", id);
        helper.showConfirmDeleteConnection(cmp);
    },
    deleteConnection: function(cmp, e, helper) {
        // Delete clicked from external connection row menu
        var id = cmp.get("v.confirmDeleteConnectionId");
        helper.deleteConnection(cmp, id);
        helper.hideDeleteConnectionModal(cmp);
        cmp.set("v.confirmDeleteConnectionId", undefined);
    },
    cancelConnection: function(cmp, e, helper) {
        // Hide new connection modal
        helper.cancelConnection(cmp);
    },
    addConnection: function(cmp, e, helper) {
        helper.addConnection(cmp);
    },
    toggleConnectionMenu: function(cmp, e, helper) {
        // External connections row menu clicked
        // Get all row menu buttons
        var sender = e.currentTarget;
        if (sender && sender.getAttribute) {
            var id = sender.getAttribute("data-id");
            helper.openRowMenu(cmp, id);            
        }
    },
    connectionMenuBlur: function(cmp, e, helper) {
        // This fires when external connection row menu loses focus, we want to close all menus when that happens
        // Close menu after short delay so that menu item user clicked still fires click event
        setTimeout(helper.safeCallback(cmp, function() {
            helper.openRowMenu(cmp);
        }), 300);
    },
    disconnect: function(cmp, e, helper) {
        helper.disconnect(cmp);
    },
    generateCode: function(cmp, e, helper) {
        helper.getAuthCode(cmp);
    },
    newConnection: function(cmp, e, helper) {
        // Show new connection modal UI
        if (cmp.get("v.isConnected")) {
            helper.showNewConnectionModal(cmp, true);
        } else {
            cmp.set("v.modalTitle", "Cannot Create Connection");
            cmp.set("v.modalBody", "You must first connect to the Conga Platform.");
            helper.showInformationalModal(cmp);
        }
    },
    dismissInformationalModal: function(cmp, e, helper) {
        helper.hideInformationalModal(cmp);
    }
})