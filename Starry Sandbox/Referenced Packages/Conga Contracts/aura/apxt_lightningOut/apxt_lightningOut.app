<aura:application extends="ltng:outApp" access="global" template="APXT_Redlining:apxt_appTemplate">
    <!-- Components created dynamically in lightning-out need to be specified here or creation may occassionally fail with cryptic error -->
    <aura:dependency resource="APXT_Redlining:apxt_contractStatus"/>
    <aura:dependency resource="APXT_Redlining:apxt_viewRedlines"/>
    <aura:dependency resource="APXT_Redlining:DocumentPopover"/>
    <aura:dependency resource="APXT_Redlining:DocumentComment"/>
    <aura:dependency resource="APXT_Redlining:ClausePlaybookPopover"/>
    <aura:dependency resource="APXT_Redlining:Capture"/>
    <aura:dependency resource="APXT_Redlining:Setup"/>
</aura:application>