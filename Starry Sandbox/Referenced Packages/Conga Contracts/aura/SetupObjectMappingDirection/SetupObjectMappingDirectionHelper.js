({
    highlightButtonForSelectedDirection: function(cmp, selectedDirection) {
        var buttons = cmp.find("btnDirection");
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].get("v.value") === selectedDirection) {
                $A.util.addClass(buttons[i], 'slds-is-selected');
            } else {
                $A.util.removeClass(buttons[i], 'slds-is-selected');
            }
        }
    }
})