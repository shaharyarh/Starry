({
    rerender : function(cmp, helper){
        this.superRerender();
        helper.fixIEFlexRenderer(cmp, "viewer", "header");
    },
    afterRender: function(component, helper) {
        this.superAfterRender();
        helper.fixIEFlexRenderer(component, "viewer", "header");
        var isEdge = navigator.appName == 'Netscape' && navigator.appVersion.indexOf('Edge') > -1;

        if (!isEdge && !component.get('v.mutatorSet')) {
            var mutatorInterval = window.setInterval($A.getCallback(function() {
                if (component.isValid()) {
                    var congaContainer = component.find('conga-container');

                    if (congaContainer) {
                        var el = congaContainer.getElement();
                        var newWidth = el.clientWidth;
                        var newHeight = el.clientHeight;

                        component.set("v.top", 'calc(100% - ' + newHeight + 'px)');
                        component.set("v.left", 'calc(100% - ' + newWidth + 'px)');
                        component.set("v.width", newWidth + 'px');
                        component.set("v.height", newHeight + 'px');
                    }
                } else {
                    clearInterval(mutatorInterval);
                }
            }), 100);
        }

        if (!component.get('v.isLightning') && component.get('v.isInit')) {
            var redlineIframeContainer = component.find('redlineIframeContainer');

            if (redlineIframeContainer) {
                var redlineIframe = redlineIframeContainer.getElement();

                $A.util.addClass(redlineIframe, 'conga-redlines-iframe--classic');
                $A.util.addClass(redlineIframe, 'conga-redlines-iframe');
            }

            var sldsContainer = component.find('slds-container').getElement();

            $A.util.removeClass(sldsContainer, 'slds-hide');
        }
    }
})