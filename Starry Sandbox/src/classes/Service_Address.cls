@RestResource(urlMapping='/Service_Address/*')
global with sharing class Service_Address {

    @HttpDelete
    global static void doDelete() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        String addId = req.requestURI.substring(req.requestURI.lastIndexOf('/')+1);
        try
        {
        	Service__c address = [SELECT Id FROM Service__c WHERE Id = :addId];
        	delete address;
        }
         catch (Exception e)
        {
        }
    }
  
    @HttpGet
    global static Service__c doGet() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        String addId = req.requestURI.substring(req.requestURI.lastIndexOf('/')+1);
        try{
        		Service__c result = [SELECT Id, Name, Address__c, Building__c, Geolocation__c FROM Service__c WHERE Id = :addId];
        		return result;   
        }
         catch (Exception e)
        {
            Service__c result2 = new Service__c();
            return result2;
            
        }
        
        
    }
  
  @HttpPost
    global static String doPost(String address, String phone, String website) {
        Service__c add = new Service__c();
        add.Address__c = address;
       // account.phone = phone;
       // account.website = website;
        insert add;
        return add.Id;
    }
}