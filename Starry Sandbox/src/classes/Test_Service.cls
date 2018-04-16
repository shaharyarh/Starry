@isTest
private class Test_Service {

static 
{
// setup test data  
}

static testMethod void testDoGet() 
{

Test.startTest();
        RestRequest req = new RestRequest(); 
        RestResponse res = new RestResponse();
        req.requestURI = 'https://cs21.salesforce.com/services/apexrest/Service_Address/a0wq0000001qJkV'; 
       // req.params.put('phoneNumber', '9876543210');
      //  req.params.put('claimNumber', '111111');
        req.httpMethod = 'GET';
        req.addHeader('Content-Type', 'application/json'); 
        RestContext.request = req;
        RestContext.response = res;
        Service__c results = Service_Address.doGet();
        System.debug(results);
  // Test.stopTest(); 
    
    
   // Test.startTest();
        req.requestURI = 'https://cs21.salesforce.com/services/apexrest/Service_Address/a0wq0000001qJjV'; 
        req.httpMethod = 'DELETE';
        req.addHeader('Content-Type', 'application/json'); 
        RestContext.request = req;
        RestContext.response = res;
        Service_Address.doDelete();
    
    	String id= Service_Address.doPost('address','','');
    
    
   Test.stopTest(); 
    
    
//RestRequest req = new RestRequest(); 
//RestResponse res = new RestResponse();

//req.requestURI = 'https://cs21.salesforce.com/services/apexrest/Service_Address/a0wq0000001qJkV';  
//req.httpMethod = 'GET';
//RestContext.request = req;
//RestContext.response = res;


//System.assertEquals('true', results.success);
//System.assertEquals(10, results.records.size());
//System.assertEquals('Query executed successfully.', results.message);

}

}