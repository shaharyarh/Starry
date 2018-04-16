({
    getIsConnected: function(cmp) {
        var helper = this;
        return helper.callAction(cmp.get("c.getConnectionStatus"))
        .then(helper.safeCallback(cmp, function(isConnected) {
            cmp.set("v.isConnected", isConnected);
        }))
        .catch(function(err) {
            helper.handleError(err);
        });
    },
    getFilesEnabled: function(cmp) {
        var helper = this;
        return helper.callAction(cmp.get("c.getFileRepositoryEnabled"))
        .then(helper.safeCallback(cmp, function(isEnabled) {
            cmp.set("v.isFilesEnabled", isEnabled);
        }))
        .catch(function(err) {
            helper.handleError(err);
        });
    },
    disconnect: function(cmp) {
        var helper = this;
        return helper.callAction(cmp.get("c.disconnectPlatform"))
        .then(helper.safeCallback(function() {
            cmp.set("v.isConnected", false);
        }))
        .catch(function(err) {
            helper.handleError(err);
        });
    },
    showNewConnectionModal: function(cmp, show) {
        cmp.set("v.showNewConnection", show);
    },
    showPendingAuthCodeModal: function(cmp, show) {
        cmp.set("v.showPendingAuthCode", show);
    },
    resetAuthCode: function(cmp) {
        // Restore default values
        cmp.set("v.authCodeRedeemed", undefined);
        cmp.set("v.authCode", undefined);
        cmp.set("v.approvalUser", undefined);
        cmp.set("v.approvalSystem", undefined);
    },
    addConnection: function(cmp) {
        var helper = this;

        // hide pending/new connection boxes right away
        helper.showNewConnectionModal(cmp, false);
        helper.showPendingAuthCodeModal(cmp, false);

        // New external connection has been authorized and now finalizing connecting
        var connectionName = cmp.get("v.connectionName");
        var connectionSystem = cmp.get("v.connectionSystem");
        var authCode = cmp.get("v.authCode");
        if(authCode){
            authCode = authCode.replace(new RegExp('\"', 'g'), '');
        }
        // name: connectionName,
         //systemName: connectionSystem,
        return helper.callAction(cmp.get("c.approveConnection"), {
            authCode: authCode
        })
        .then(helper.safeCallback(cmp, function() {
            // Refresh external connections list
            helper.getExternalConnections(cmp);
            // Reset UI for new connections 
            helper.resetAuthCode(cmp);
        }))
        .catch(function(err) {
            helper.handleError(err);
        });
    },
    cancelConnection: function(cmp) {
        var helper = this;

        // hide pending/new connection boxes right away
        helper.showNewConnectionModal(cmp, false);
        helper.showPendingAuthCodeModal(cmp, false);
        
        // New external connection has been authorized and now finalizing connecting
        var authCode = cmp.get("v.authCode");
        if(authCode){
            authCode = authCode.replace(new RegExp('\"', 'g'), '');
        }
        // name: connectionName,
         //systemName: connectionSystem,
        return helper.callAction(cmp.get("c.denyConnection"), {
            authCode: authCode
        })
        .then(helper.safeCallback(cmp, function() {
            // Refresh external connections list
            helper.resetAuthCode(cmp);
        }))
        .catch(function(err) {
            helper.handleError(err);
        });
    },
    deleteConnection: function(cmp, id) {
        var helper = this;
        helper.callAction(cmp.get("c.removeConnection"), {
            connectionId: id
        })
        .then(helper.safeCallback(cmp, function() {
            // Refresh external connections list
            helper.getExternalConnections(cmp);
        }))
        .catch(helper.safeCallback(cmp, function(err) {
            helper.getExternalConnections(cmp);
            helper.handleError(err);
        }));
    },
    getPendingRedemption: function(cmp) {
        var helper = this;
        return helper.callAction(cmp.get("c.getPendingRedemption"))
        .then(helper.safeCallback(cmp, function(result) {
            if (result) {
                var invite = JSON.parse(result);
                cmp.set("v.authCode", invite.authCode);
                cmp.set("v.connectionName", invite.connectionName);
                helper.showNewConnectionModal(cmp, false);
                helper.showPendingAuthCodeModal(cmp, true);
                helper.pollForRedemption(cmp);
            } else {
                cmp.set("v.authCode", undefined);
                helper.showPendingAuthCodeModal(cmp, false);
            }
        }))
        .catch(function(err) {
            helper.handleError(err);
        });
    },
    getPendingAuthorization: function(cmp) {
        var helper = this;
        return helper.callAction(cmp.get("c.getPendingAuthorization"))
        .then(helper.safeCallback(cmp, function(result) {
            if (result) {
                var invite = JSON.parse(result);
                cmp.set("v.authCode", invite.authCode);
                cmp.set("v.connectionName", invite.connectionName);
                cmp.set("v.approvalUser", invite.approvalUser);
                cmp.set("v.approvalSystem", invite.approvalSystem);

                // Code has been redeemed - now needs approval
                cmp.set("v.authCodeRedeemed", true);
                helper.showNewConnectionModal(cmp, false);
                helper.showPendingAuthCodeModal(cmp, true);
            } else {
                helper.getPendingRedemption(cmp);
            }
        }))
        .catch(function(err) {
            helper.handleError(err);
        });
    },
    getExternalConnections: function(cmp) {
        var helper = this;
        // Show loading spinner when list is undefined
        cmp.set("v.connectionList", undefined);
        return helper.callAction(cmp.get("c.getExternalConnections"))
        .then(helper.safeCallback(cmp, function(connJson) {
            if (connJson && connJson.length > 0) {
                var connections = JSON.parse(connJson);
                cmp.set("v.connectionList", connections);

                var populatedEvent = cmp.getEvent("populatedExternalConnections");
                if (populatedEvent) {
                    populatedEvent.setParam("value", connections);
                    populatedEvent.fire();
                }
            }
        }))
        .catch(helper.safeCallback(cmp, function(err) {
            // Log error and make connections list appear empty
            cmp.set("v.connectionList", []);
            console.log(err);
        }));
    },
    pollForPlatformConnection: function(cmp) {
        var helper = this;
        helper.platformConnectTimer = setTimeout(helper.safeCallback(cmp, function() {
            clearTimeout(helper.platformConnectTimer);
            
            
            helper.getIsConnected(cmp)
            .then(helper.safeCallback(cmp, function() {
                var isConnected = cmp.get("v.isConnected");

                if (!isConnected) {
                    helper.pollForPlatformConnection(cmp);
                }                
            }))
            .catch(function(err) {
                console.log("Error polling for platform connection... Status: " + err);
            });
        }), 3000);
    },
    pollForRedemption: function(cmp) {
        var helper = this;
        helper.pollTimer = setTimeout(helper.safeCallback(cmp, function() {
            clearTimeout(helper.pollTimer);
            var authCode = cmp.get("v.authCode"); 
            if(authCode){
                authCode = authCode.replace(new RegExp('\"', 'g'), '');

                helper.callAction(cmp.get("c.isAuthCodeRedeemed"), {
                    authCode: authCode
                })
                .then(helper.safeCallback(cmp, function(redeemedJson) {
                    var redeemedCode = JSON.parse(redeemedJson);
                    if (redeemedCode.isRedeemed === true) {
                        // Code has been redeemed - now needs approval
                        cmp.set("v.authCodeRedeemed", true);
                        cmp.set("v.approvalUser", redeemedCode.approvalUser);
                        cmp.set("v.approvalSystem", redeemedCode.approvalSystem);
                    }
                    else {
                        // Continue polling
                        helper.pollForRedemption(cmp);
                    }
                }))
                .catch(function(err) {
                    helper.handleError(err);
                });
            }
        }), 5000);
    },
    generateAuthCode: function(cmp) {
        var helper = this;
        return helper.callAction(cmp.get("c.generateAuthCode"),{
            name: cmp.get("v.connectionName"),
            sys: cmp.get("v.connectionSystem")
        })
        .then(helper.safeCallback(cmp, function(code) {
            // Display new code
            cmp.set("v.authCode", code);
            helper.showNewConnectionModal(cmp, false);
            helper.showPendingAuthCodeModal(cmp, true);

            // Start polling to check if code has been approved
            helper.pollForRedemption(cmp);
        }))
        .catch(helper.safeCallback(cmp, function(err) {
            helper.handleError(err);
        }));
    },
    getAuthCode: function(cmp) {
        var helper = this;
        // Check required fields then generate and display new auth code
        var connectionName = cmp.get("v.connectionName");
        var connectionSystem = cmp.get("v.connectionSystem");
        var formElement = cmp.find("connNameFormElement");
        if (connectionName && connectionName.length > 0) {
            $A.util.removeClass(formElement, "slds-has-error");
            // Reset auth code and approval but dont close modal
            helper.resetAuthCode(cmp);
            helper.generateAuthCode(cmp);
        }
        else {
            // Connection name required
            $A.util.addClass(formElement, "slds-has-error");
        }
    },
    openRowMenu: function(cmp, id) {
        var menus = cmp.find("rowMenu");
        // When only single row in table, make in to array
        if (!(menus instanceof Array)) menus = [menus];
        var openClass = "slds-is-open";
        menus.forEach(function(menu) {
            if (menu && menu.getElement && menu.getElement()) {
                var menuId = menu.getElement().getAttribute("data-id");
                if (menuId == id && !$A.util.hasClass(menu, openClass)) {
                    // Open menu
                    $A.util.addClass(menu, openClass);
                }
                else {
                    // Close menu
                    $A.util.removeClass(menu, openClass);
                }
            }
        });
    },
    setOAuthUrl: function(cmp){
        var helper = this;
        return helper.callAction(cmp.get("c.getOAuthConnectionUrl"))
        .then(helper.safeCallback(cmp, function(oauthUrl) { 
            cmp.set("v.oauthUrl", oauthUrl);            
        }))
        .catch(function(err) {
            helper.handleError(err);
        });

    },
    showInformationalModal: function(cmp){
        var modal = cmp.find('informModal').getElement();
        var modalBackdrop = cmp.find('backdrop').getElement();
        $A.util.addClass(modal, 'slds-fade-in-open');
        $A.util.addClass(modalBackdrop, 'slds-backdrop--open');
    },
    hideInformationalModal: function(cmp, className){
        var modal = cmp.find('informModal').getElement();
        var modalBackdrop = cmp.find('backdrop').getElement();

        $A.util.removeClass(modal, 'slds-fade-in-open');
        $A.util.removeClass(modalBackdrop, 'slds-backdrop--open');

        cmp.set("v.modalTitle", "");
        cmp.set("v.modalBody", "");
    },
    showConfirmDeleteConnection: function(cmp){
        var modal = cmp.find('confirmDeleteConnectionModal').getElement();
        var modalBackdrop = cmp.find('backdrop').getElement();
        $A.util.addClass(modal, 'slds-fade-in-open');
        $A.util.addClass(modalBackdrop, 'slds-backdrop--open');
    },
    hideDeleteConnectionModal: function(cmp, className){
        var modal = cmp.find('confirmDeleteConnectionModal').getElement();
        var modalBackdrop = cmp.find('backdrop').getElement();

        $A.util.removeClass(modal, 'slds-fade-in-open');
        $A.util.removeClass(modalBackdrop, 'slds-backdrop--open');

        cmp.set("v.modalTitle", "");
        cmp.set("v.modalBody", "");
    }
})