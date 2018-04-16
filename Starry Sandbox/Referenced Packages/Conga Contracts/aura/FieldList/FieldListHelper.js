({
	searchDescribe : function(describe, searchText, cmp) {
    var fields = [];
    var displayUpdateable = cmp.get("v.displayUpdateable") || true;
    var displayCreateable = cmp.get("v.displayCreateable");
    for (var name in describe.fields) {
      if (describe.fields.hasOwnProperty(name)) {
        var fieldmeta = describe.fields[name];
        if (fieldmeta && 
          fieldmeta.updateable == displayUpdateable && 
          (displayCreateable == undefined || displayCreateable == fieldmeta.createable) &&
          (searchText == undefined || fieldmeta.label.toLowerCase().indexOf(searchText.toLowerCase()) > -1)) {
          fields.push(this.createItem(fieldmeta, cmp));
        }
      }
    }
    fields = fields.sort(function(a,b) {
      return a && b && a.label < b.label ? -1 : 1;
    });
    return fields;
  },
  valueChanged: function(cmp) {
    var value = cmp.get("v.value");
    var helper = this;
    if (value && value.iconName == undefined) {
      cmp.set("v.value", helper.createItem(value, cmp));
    }
  },
  describeChanged: function(cmp, e, helper) {
    var describe = cmp.get("v.describe");
    var helper = this;
    if (describe && describe.fields) {
      cmp.set("v.objectLabel", describe.objectLabel);
      cmp.set("v.searchResults", helper.searchDescribe(describe, undefined, cmp));
    }
  },
  createItem: function(fieldmeta, cmp) {
    var ret = fieldmeta;
    if (fieldmeta.iconName == undefined) {
      ret = Object.create(fieldmeta);
      ret.iconName = this.getIconName(fieldmeta.type);
      ret.typeLabel = this.getTypeLabel(fieldmeta.type, cmp);
    }
    return ret;
  },
  getTypeLabel: function(type, cmp) {
    // Switch to localize type names with salesforce label names
    var label = type;
    switch (type) {
      case "reference":
      case "id":
        label = cmp.get("v.apxt_dataType_reference");
        break;
      case "date":
        label = cmp.get("v.apxt_dataType_date");
        break;
      case "time":
        label = cmp.get("v.apxt_dataType_time");
        break;
      case "datetime":
        label = cmp.get("v.apxt_dataType_dateTime");
        break;
      case "currency":
        label = cmp.get("v.apxt_dataType_currency");
        break;
      case "int":
      case "integer":
        label = cmp.get("v.apxt_dataType_integer");
        break;
      case "double":
        label = cmp.get("v.apxt_dataType_double");
        break;
      case "percent":
        label = cmp.get("v.apxt_dataType_percent");
        break;
      case "boolean":
        label = cmp.get("v.apxt_dataType_boolean");
        break;
      case "multipicklist":
        label = cmp.get("v.apxt_dataType_multiPicklist");
        break;
      case "picklist":
      case "combobox":
        label = cmp.get("v.apxt_dataType_picklist");
        break;
      case "phone":
        label = cmp.get("v.apxt_dataType_phone");
        break;
      case "email":
        label = cmp.get("v.apxt_dataType_email");
        break;
      case "url":
        label = cmp.get("v.apxt_dataType_url");
        break;
      case "textarea":
        label = cmp.get("v.apxt_dataType_textarea");
        break;
      case "string":
        label = cmp.get("v.apxt_dataType_string");
        break;
      default:
        break;
    }
    return label;
  },
  getIconName: function(type) {
    var iconName;
    switch (type) {
      case "reference":
      case "id":
        iconName = "record";
        break;
      case "date":
      case "time":
      case "datetime":
        iconName = "event";
        break;
      case "currency":
        iconName = "moneybag";
        break;
      case "int":
      case "integer":
      case "double":
      case "percent":
        iconName = "feed";
        break;
      case "boolean":
        iconName = "check";
        break;
      case "multipicklist":
      case "picklist":
      case "combobox":
        iconName = "picklist";
        break;
      case "phone":
        iconName = "phone_portrait";
        break;
      case "email":
        iconName = "email";
        break;
      case "url":
        iconName = "link";
        break;
      case "textarea":
      case "string":
      default:
        iconName = "text_color";
        break;
    }
    return "utility:" + iconName;
  }
})