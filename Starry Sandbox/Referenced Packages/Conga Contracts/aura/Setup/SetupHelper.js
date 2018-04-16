({
  connectionMenuItems: [],
  initTreeItems : function(cmp) {
    var helper = this;
    var treeList = cmp.find("setupTreeList");
    if (treeList) {
      treeList.set("v.items", helper.getMenuItems(cmp));
      treeList.selectItem("connect");
    }
  },
  refreshMenuItems: function(cmp) {
    var helper = this;
    var treeList = cmp.find("setupTreeList");
    treeList.set("v.items", helper.getMenuItems(cmp));
  },
  enableFeatures: function(cmp, ldclient) {
    // Get user info
    var helper = this;
    var userAction = cmp.get("c.getUserMeta");
    helper.getUserInfo(cmp, userAction)
    .then(function(userInfo) {
      // Tell launch darkly we're this user
      return helper.initLaunchDarkly(userInfo, ldclient);
    })
    .then(helper.safeCallback(cmp, function(ldclient) {
      // Determine what features should be enabled
      var enablePlatform = ldclient.variation('enable-platform', false);
      cmp.set("v.ldEnablePlatform", enablePlatform);
      helper.refreshMenuItems(cmp);
    }));
    $A.enqueueAction(userAction);
  },
  getMenuItems: function(cmp) {
    let defaultItems = [
      {
        label:cmp.get("v.lblContractsHeader"),
        items:[
          {
            label: cmp.get("v.lblConnect"),
            id:"connect",
            value:"connect"
          },
          {
            label: cmp.get("v.lblConfig"),
            value:"config"
          },
          {
            label: cmp.get("v.lblemailDisplayNameLabel"),
            value:"emailDisplayName"
          },
          {
            label: cmp.get("v.lblEmailTemplates"),
            value:"templates"
          },
          {
            label: cmp.get("v.lblReports"),
            value:"reports"
          },
          {
            label: cmp.get("v.lblAdditional"),
            value:"additional"
          }
          // {
          //   label: "Guided Tour",
          //   value: {
          //     component: "APXT_Redlining:SetupGuided"
          //   }
          // }
        ]
      }
    ];

    let ldEnablePlatform = cmp.get("v.ldEnablePlatform");
    if (ldEnablePlatform) {
      defaultItems[0].items.push({
        label: cmp.get("v.lblPlatforms"),
        items: [{
          label: cmp.get("v.lblPlatformGeneral"),
          id: "platformGeneral",
          value: {
            component: "APXT_Redlining:SetupPlatform"
          }
        },
        {
          label: cmp.get("v.lblConnections"),
          value: {
            component: "APXT_Redlining:SetupConnections"
          },
          alwaysExpanded: true,
          items: this.connectionMenuItems
        }]
      });
    }

    return defaultItems;
  },
  populateConnections: function(cmp, connections) {
    var helper = this;

    helper.connectionMenuItems = [];
    for (var i = 0; i < connections.length; i++) {
      helper.connectionMenuItems.push( {
        label: connections[i].name,
        items: [ 
          // {
          //   label: cmp.get("v.lblRecordMapping")
          // },
          {
            label: cmp.get("v.lblObjectMapping"),
            value: {
              component: "APXT_Redlining:SetupObjectMapping",
              args: {
                connectionId: connections[i].id,
                connectionName: connections[i].name
              }
            }
          }
        ]
      });
    }
    helper.refreshMenuItems(cmp);
  },
  sendScrollToMessage: function(cmp, item) {
    var detail = cmp.get("v.detailFacet");
    if (detail && detail.sendScrollToMessage && typeof(item) === "string") {
      detail.sendScrollToMessage(item);
    }
  },
  itemSelected: function(cmp, item) {
    var helper = this;
    var detailFacet = cmp.get("v.detailFacet");
    var detailType;
    if (detailFacet && detailFacet.getType) {
      detailType = detailFacet.getType();
    }
    var cmpName;
    if (item) {
      if (typeof(item) === "string") {
        // Subsection of general setup
        cmpName = "APXT_Redlining:SetupGeneral";
      }
      else if (item.component) {
        // Show lightning component in detail area
        cmpName = item.component;
      }
      if (cmpName && cmpName != detailType) {
        var args = item.args ? item.args : {};

        helper.createComponent(cmpName, args).then(function(c) {
          cmp.set("v.detailFacet", c);
        }).then(helper.safeCallback(cmp, function() {
          helper.sendScrollToMessage(cmp, item);
        }));
      }
      else {
        helper.sendScrollToMessage(cmp, item);
      }
    }
  }
})