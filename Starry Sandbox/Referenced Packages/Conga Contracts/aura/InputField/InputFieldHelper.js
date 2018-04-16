({
  createInput: function(component) {
    // Create an input control suitable for field type
    var helper = this;
    var fieldDescribe = component.get("v.fieldDescribe");
    var placeholder = component.get("v.placeholder");
    if (fieldDescribe) {
        // fieldDescribe = {type:"String"};
      var componentType = helper.getComponentType(fieldDescribe);
      var componentOptions = helper.getComponentOptions(component);
      helper.createComponent(componentType, componentOptions)
      .then(function(c) {
        component.set("v.input", c);
      })
      .catch(function(err){
        helper.handleError(err);
      });
    }
  },
  getComponentType : function(fieldDescribe) {
    var type = fieldDescribe.type || "string";
    var componentType = "ui:inputText";
      switch (type) {
        case "id":
        case "reference":
          componentType = "APXT_Redlining:LookupField";
          break;
        case "phone":
          componentType = "ui:inputPhone";
          break;
        case "email":
          componentType = "ui:inputEmail";
          break;
        case "textarea":
          if (fieldDescribe.htmlFormatted) {
            componentType = "lightning:inputRichText";
          }
          else {
            componentType = "ui:inputTextArea";
          }
          break;
        case "url":
          componentType = "ui:inputURL";
          break;
        case "date":
          componentType = "ui:inputDate";
          break;
        case "time":
        case "datetime":
          componentType = "ui:inputDateTime";
          break;
        case "currency":
          componentType = "ui:inputCurrency";
          break;
        case "int":
        case "integer":
        case "double":
        case "percent":
          componentType = "ui:inputNumber";
          break;
        case "boolean":
          componentType = "ui:inputCheckbox";
          break;
        case "multipicklist":
        case "picklist":
        case "combobox":
          componentType = "ui:inputSelect";
          break;
        case "string":
        default:
          componentType = "ui:inputText";
          break;
      }
      return componentType;
  },
  getComponentOptions: function(cmp) {
    var fieldDescribe = cmp.get("v.fieldDescribe");
    var placeholder = cmp.get("v.placeholder");
    var type = fieldDescribe.type || "string";
    var componentOptions = {
      placeholder: placeholder,
      "aura:id": "input",
      class: "slds-input",
      disabled: !fieldDescribe.updateable,
      value: cmp.getReference("v.value") // bind input value to component value
    };
    //maxlength
    // required
    // size
    switch (type) {
      case "boolean":
        cmp.set("v.value", placeholder);
        componentOptions.value = cmp.getReference("v.value");
        break;
      case "id":
      case "reference":
        cmp.set("v.value", placeholder);
        componentOptions = {
          recordId: cmp.getReference("v.value"),
          disabled: !fieldDescribe.updateable,
          sObjectName: fieldDescribe.referenceTo[0]
        };
        break;
      case "date":
      case "time":
      case "datetime":
        cmp.set("v.value", placeholder);
        componentOptions = {
          displayDatePicker: true,
          disabled: !fieldDescribe.updateable,
          class: "slds-input",
          value: cmp.getReference("v.value")
        };
        break;
      case "multipicklist":
      case "picklist":
      case "combobox":
        var options = [];
        if (fieldDescribe && fieldDescribe.picklistValues) {
          options = fieldDescribe.picklistValues.map(function(v) {
            if (v.active) {
              return {
                label: v.label,
                value: v.value,
                selected: (v.value == placeholder)
              };
            }
          });
        }
        componentOptions.class = "slds-select";
        componentOptions.options = options;
        componentOptions.multiple = (type == "multipicklist" ? true : false);
        cmp.set("v.value", placeholder);
        break;
      case "textarea":
        if (fieldDescribe.htmlFormatted) {
          // Hide some toolbar items for space reasons
          componentOptions.disabledCategories = "FORMAT_FONT,REMOVE_FORMATTING";
          componentOptions.placeholder = undefined;
          cmp.set("v.value", placeholder);
        }
        break;
        // cols, rows
      case "phone":
      case "email":
      case "url":
      case "currency":
      case "int":
      case "integer":
      case "double":
      case "percent":
      case "string":
      default:
        break;
    }
    return componentOptions;
  },
  resetValue: function(comp) {
    var describe = comp.get("v.fieldDescribe");
    var type = describe.type || "string";
    var placeholder = comp.get("v.placeholder");
    var input = comp.get("v.input");
    switch (type) {
      // Types that can't use a placeholder, set value to placeholder
      case "reference":
      case "multipicklist":
      case "boolean":
      case "picklist":
      case "combobox":
      case "date":
      case "time":
      case "datetime":
        comp.set("v.value", placeholder);
        break;
      // Types that use placeholder to show existing value, set value to empty
      case "currency":
      case "int":
      case "integer":
      case "double":
      case "percent":
      default:
        input.set("v.value", undefined);
        break;
      case "phone":
      case "email":
      case "textarea":
      case "url":
      case "string":
        input.set("v.value", "");
        break;
    }
  }
})