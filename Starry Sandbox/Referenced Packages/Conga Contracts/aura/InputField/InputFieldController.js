({
  init : function(component, event, helper) {
    // helper.createInput(component);
  },
  fieldDescribeChanged: function(component, e, helper) {
    helper.createInput(component);
  },
  valueChanged: function(cmp, event, helper) {
    if (event.getSource() != cmp) {
      // Mark field as dirty if changed by something other than this component
      var placeholder = cmp.get("v.placeholder");
      var value = event.getParam("value");
      if (value != placeholder) {
        cmp.set("v.isDirty", true);
      }
      else {
        cmp.set("v.isDirty", false);
      }
    }
  },
  parse: function(comp, event, helper) {
    var params = event.getParam("arguments");
    var value = params.value;
    if (value instanceof Array) value = value[0];
    var meta = comp.get("v.fieldDescribe");
    var input = comp.get("v.input");

    if (input) {
      if (value !== null) {
        if (input.parse) {
          // Component has it's own parsing method
          input.parse(value);
          comp.set("v.isDirty", true);
        }
        else {
          var parseEvent = comp.getEvent("valueParsed");
          try {
            var parsedValue = helper.parseFieldValue(meta, value);
            input.set("v.value", parsedValue);
            comp.set("v.isDirty", true);
            parseEvent.setParams({
              success: true
            });
          }
          catch (e) {
            var lblName = e.message;
            var lblValue = comp.get("v.lbl" + lblName);
            if (lblValue && lblValue.length > 0) {
              parseEvent.setParams({
                success: false,
                message: lblValue + " " + value
              });
            }
          }
          parseEvent.fire();
        }
      }
      else {
        helper.resetValue(comp); 
        comp.set("v.isDirty", false);
      }
    }
  }
})