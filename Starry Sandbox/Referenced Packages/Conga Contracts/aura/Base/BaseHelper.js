({
  SLDSPromise: function(fn) {
    // Specializes JS Promises to use Lightning $A.getCallback to safely handle async code in lightning
    var p = new Promise($A.getCallback(fn));
    var t = p.then;
    var c = p.catch;
    p.then = $A.getCallback(function() {
      return t.apply(p, arguments);
    });
    p.catch = $A.getCallback(function() {
      return c.apply(p, arguments);
    });

    return p;
  },
  promiseAction: function(action, params) {
    // Return a promise that calls an @AuraAction
    return this.SLDSPromise(function(resolve,reject) {
      if (params) action.setParams(params);
      action.setCallback(this, function(response) {
        var status = response.getState();
        if (status === "SUCCESS") {
          var val = response.getReturnValue();
          resolve(val);
        }
        else {
          var errors = response.getError();
          if (errors.length > 0) {
            errors = errors[0].message;
          }
          reject(new Error(errors));
        }
      });
    });
  },
  // Deprecated, for API v40 and higher use promiseAction instead which does not call enqueueAction
  callAction: function(action, params) {
    // Return a promise that calls an @AuraAction
    return this.SLDSPromise(function(resolve,reject) {
      if (params) action.setParams(params);
      action.setCallback(this, function(response) {
        var status = response.getState();
        if (status === "SUCCESS") {
          var val = response.getReturnValue();
          resolve(val);
        }
        else {
          var errors = response.getError();
          if (errors.length > 0) {
            errors = errors[0].message;
          }
          reject(new Error(errors));
        }
      });
      $A.enqueueAction(action);
    });
  },
  // Deprecated, replaced by getUserInfo
  setUserInfo: function(cmp) {
    var userAction = cmp.get("c.getUserMeta");
    // No need to call this action for every single component, so cache it
    userAction.setStorable({
      defaultExpiration: 60000
    });
    var helper = this;
    return helper.callAction(userAction)
    .then(function(userInfo) {
      helper.theme = userInfo.SalesforceUIName;
      cmp.set("v.userInfo", userInfo);
      return userInfo;
    });
  },
  getUserInfo: function(cmp, getUserMetaAction) {
    getUserMetaAction.setStorable({
      defaultExpiration: 60000
    });
    var helper = this;
    return helper.promiseAction(getUserMetaAction)
    .then(function(userInfo) {
      helper.theme = userInfo.SalesforceUIName;
      cmp.set("v.userInfo", userInfo);
      return userInfo;
    });
  },
  initMixpanel: function(userInfo) {
    if (userInfo && window.mixpanel) {
      // Setup mixpanel to capture profile and session info
      // Identify this user as org + userId combo
      window.mixpanel.identify(userInfo.OrgId + userInfo.UserId);
      // Properties that will be tracked with every event
      window.mixpanel.register(userInfo);
      // Info about this user
      window.mixpanel.people.set(userInfo);
    }
  },
  initLaunchDarkly: function(userInfo, ldclient) {
    // Defensively init launch darkly for feature enablement
    if (userInfo && ldclient) {
      // User object identifies who we are to LD and 
      // allows us to toggle features by these attributes
      var user = {
        // key is only require LD attribute, everything else custom
        key: userInfo.OrgId + "." + userInfo.UserId,
        custom: {
          orgId: userInfo.OrgId,
          userId: userInfo.UserId,
          companyName: userInfo.CompanyName,
          isSandbox: userInfo.IsSandbox,
        }
      };
      // Check if in test environment based on namespace
      var isTest = (userInfo.AppNamespace === "APXT_Redlining" ? false : true);
      var clientid = isTest ? "5a5fa4d554277121fb5f6607" : "5a5fa4d554277121fb5f6608";
      var client = ldclient.initialize(clientid, user);
      return new Promise(function(resolve, reject) {
        // Notify when feature enablement flags are ready or changed
        client.on('ready', function() {
          resolve(client, user);
        });
      });
    }
    // LDclient not available
    return Promise.reject();
  },
  mixpanelTrack: function(eventName, eventData) {
    if (window.mixpanel && eventName) {
      return new Promise(function(resolve, reject) {
        window.mixpanel.track(eventName, eventData, resolve);
      });
    }
  },
  mixpanelIncrement: function(eventName, amount) {
    amount = amount || 1;
    if (window.mixpanel && eventName) {
      window.mixpanel.people.increment(eventName, 1);
    }
  },
  navigateToSObject: function(recordId) {
    var theme = this.theme;
    switch (theme) {
      case "Lightning":
      case "SF1":
        sforce.one.navigateToSObject(recordId);
        break;
      case "Classic":
      default:
        window.location.assign("/" + recordId);
        break;
    }
  },
  createRecord: function(apiName, prefix) {
    var theme = this.theme;
    switch (theme) {
      case "Lightning":
      case "SF1":
        sforce.one.createRecord(apiName);
        break;
      case "Classic":
      default:
        window.location.assign("/" + prefix + "/e");
        break;
    }
  },
  createComponents: function(components) {
    // Return a promise that create components
    return this.SLDSPromise(function(resolve, reject) {
      $A.createComponents(components, function(components, status, message) {
        if (status === "SUCCESS") resolve(components);
        else reject(message);
      });
    });
  },
  createComponent: function(type, options) {
    // Return a promise that create components
    return this.SLDSPromise(function(resolve, reject) {
      $A.createComponent(type, options, function(c,status,message) {
        if (status === "SUCCESS") resolve(c);
        else reject(message);
      });
    });
  },
  handleError: function(err) {
    // $A.reportError(err.message);
    console.error(err);
    var promptEvent = $A.get("e.APXT_Redlining:PromptEvent");
    if (promptEvent) {
      promptEvent.setParams({
        message: err.message
      });
      promptEvent.fire();
    }
  },
  safeCallback: function(component, fn) {
    // Return a Lightning callback that passes a component to a function if the component is still valid
    return $A.getCallback(function() {
      if (component.isValid()) {
        return fn.apply(null, arguments);
      }
    });
  },
  isSalesforceId: function(value) {
    // Test if value appears to be a valid salesforce id
    return /[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}/.test(value);
  },
  isQuoteTermObject: function(objectName) {
    return objectName && objectName.toLowerCase && objectName.toLowerCase() === "sbqq__quoteterm__c";
  },
  isClauseObject: function(objectName) {
    var clauseObjects = ["managed_clause__c", "clause__c", "sbqq__quoteterm__c"];
    var match = clauseObjects.find(function(x) {
      return objectName && objectName.length && objectName.toLowerCase().indexOf(x) > -1;
    });
    return match;
  },
  getNameField: function(describe) {
    var name = "Name";
    if(describe && describe.fields) {
      if (describe.objectName.indexOf("Managed_Clause__c") > -1) {
        var ns = describe.objectName.replace("Managed_Clause__c", "");
        name = ns + "Label__c";
      }
      else {
        for (var field in describe.fields) {
          if (describe.fields[field] && describe.fields[field].nameField) {
            return describe.fields[field].name;
          }
        }
      }
    }
    return name;
  },
  transition: function(component, fromClass, toClass, ms) {
    // Returns a promise to animate a component between two css classes
    return this.SLDSPromise($A.getCallback(function(resolve, reject) {
        $A.util.addClass(component, toClass);
        setTimeout($A.getCallback(function() {
          $A.util.removeClass(component, fromClass);
          resolve();
        }), ms || 150);
    }));
  },
  formatString: function(str, nArgs) {
    // Format string with {N} placeholders with whatever arguments are passed in
    var match = str.match(/{\d+}/g);
    for (var i=0; i<match.length; i++) {
      var argNum = parseInt(match[i].replace(/[{}]/, ""));
      str = str.replace(match[i], arguments[argNum+1]);
    }
    return str;
  },
  parseDate: function(value) {
    if (!(value instanceof Date)) value = $A.localizationService.parseDateTimeUTC(value);
    if (!(value instanceof Date)) value = new Date(Date.parse(value));
    if (!(value instanceof Date) || value == "Invalid Date") throw new Error("apxt_trueUp_unableParseDate");
    return value.toISOString();
  },
  stripHtml: function(val) {
    // Use DOM to remove any HTML in val to compare like plaintext
    if (val && typeof(val) === "string") {
      try {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = val;
        val = tmp.textContent || tmp.innerText || "";
      } catch (e) {
        // Invalid html? Abort and compare raw values
      }
    }
    return val;
  },
  isFieldValueEqual: function(fieldDescribe, parsedValueA, parsedValueB) {
    var type = fieldDescribe.type || "string";
    var ret = false;
    var helper = this;
    var removeWhitespace = function(val) {
      // Treat empty string/null as undefined
      if (val === "" || val === null) {
        val = undefined;
      }
      if (val && typeof(val) === "string") {
        // Treat all whitespace as single space
        val = val.replace(/\s+/g, "");
        // Remove all occurences of \r so \n is used uniformly to represent newline
        val = val.replace("\r", "");
      }
      return val;
    };
    switch (type) {
      case "textarea":
        if (fieldDescribe.htmlFormatted) {
          // If rich text we should compare plaintext to avoid noisy HTML diffs
          parsedValueA = helper.stripHtml(parsedValueA);
          parsedValueB = helper.stripHtml(parsedValueB);
        }
        parsedValueA = removeWhitespace(parsedValueA);
        parsedValueB = removeWhitespace(parsedValueB);
        break;
      case "date":
      case "time":
      case "datetime":
      case "currency":
      case "int":
      case "integer":
      case "double":
      case "percent":
      case "boolean":
      case "multipicklist":
      case "picklist":
      case "combobox":
      case "phone":
      case "email":
      case "url":
      case "string":
      default:
        parsedValueA = removeWhitespace(parsedValueA);
        parsedValueB = removeWhitespace(parsedValueB);
        break;
    }
    return parsedValueA === parsedValueB;
  },
  parseFieldValue: function(fieldDescribe, value) {
    var type = fieldDescribe.type || "string";
    if (value !== undefined && value != null) {
      switch (type) {
        case "date":
        case "time":
        case "datetime":
          value = this.parseDate(value);
          break;
        case "currency":
        case "int":
        case "integer":
        case "double":
        case "percent":
          if (typeof(value) != "number") value = +(value.replace(/[^\d\.e\+\-]+/g, ""));
          if (typeof(value) != "number" || isNaN(value)) throw new Error("apxt_trueUp_unableParseNumber");
          break;
        case "boolean":
          if (value && value.length > 0) value = value.toLowerCase();
          if (typeof(value) != "boolean") value = value === "true" || value === "yes" || value === "1" || value === "on" || value === "active";
          break;
        case "multipicklist":
          value = value.split(";");
          if (value && value.length > 0) {
            var validOptions = [];
            value.forEach(function(value) {
              if (value) {
                var validOption = fieldDescribe.picklistValues.filter(function(x) {
                  return value && x.value.toLowerCase() === value.trim().toLowerCase();
                });
                if (!validOption || validOption.length !== 1) {
                  throw new Error("apxt_trueUp_unableParsePicklist");
                }
                validOptions.push(value.trim());
              }
            });
            value = validOptions.join(";");
          }
          break;
        case "picklist":
        case "combobox":
          var validOption = fieldDescribe.picklistValues.filter(function(x) {
            return value && x.value.toLowerCase() === value.trim().toLowerCase();
          });
          if (!validOption || validOption.length !== 1) {
            throw new Error("apxt_trueUp_unableParsePicklist");
          }
          value = validOption[0].value;
          break;
        case "phone":
        case "email":
        case "textarea":
        case "url":
        case "string":
          if (!value || value.length === 0) value = undefined;
          break;
        default:
          break;
      }
    }

    return value;
  },
  fixIEFlexRenderer: function(cmp, fillAuraId, headerAuraId) {
    // applies to component elements named iframe and header
    var isIE = navigator.userAgent.indexOf("MSIE")!==-1 || navigator.appVersion.indexOf("Trident/") > 0;
    if (isIE) {
      setTimeout(this.safeCallback(cmp, function() {
        // Set iframe fixed height because IE does not work properly with flexbox
        var iframe = cmp.find(fillAuraId);
        var header = cmp.find(headerAuraId);
        if (iframe) {
          if (iframe instanceof Array) {
            iframe = iframe[0];
          }
          var el = iframe.getElement();
          var hheight = 0;
          if (header) {
            if (!(header instanceof Array)) {
              header = [header];
            }
            header.forEach(function(h) {
              var hel = h.getElement();
              hheight += hel.clientHeight;
            });
          }
          // Iframe should fill available space minus header
          el.height = window.innerHeight - hheight;
        }
      }));
    }
  }

})