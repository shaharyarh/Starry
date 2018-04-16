({
    setAbsolutePosition: function(cmp) {
        // Compute absolute offset based on component height
        // So that comment is vertically centered at offset
        var element = cmp.getElement();
        var height = element.clientHeight;
        var realOffset = element.offsetTop;
        var offset = cmp.get("v.offsetTop");
        cmp.set("v.staticTop", realOffset + height/2);
        cmp.set("v.absoluteTop", parseInt(offset - height/2));
        cmp.set("v.height", parseInt(height));
        // Fire event to let others know we're rendering
        // Debounce because this is happening more than once per render
        var timer = cmp.get("v.renderTimer");
        clearTimeout(timer);
        cmp.set("v.renderTimer", setTimeout(this.safeCallback(cmp, function() {
            var e = cmp.getEvent("render");
            e.fire();
        }),200));
    },
    setShowDate: function(cmp) {
        var date = cmp.get("v.date");
        if (date && date.toDateString) {
            // Show only time if today otherwise only date
            if (date.toDateString() == new Date(Date.now()).toDateString()) {
                cmp.set("v.showDate", false);
            }
        }
    }
})