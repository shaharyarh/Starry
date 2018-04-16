public class ContactRelatedListController {     

    public List<Building__c> contacts{get;set;} 

    public Account accounts {get;set;} 

    public Account acc {get;set;} 

     

    //Constructor 

    public ContactRelatedListController(ApexPages.StandardController controller) { 

        acc = (account)controller.getRecord();      

        accounts = [SELECT id FROM account WHERE id=: acc.id LIMIT 1]; 

       //contacts = [Select Name,Address__c,Building_Group__c,Type__c from Building__c where Building_Group__c IN (SELECT Id FROM Building_Group__c where Property_Management__c=:accounts.id) ORDER BY Name ];
       
       contacts = [Select Name,Address__c,Type__c from Building__c ORDER BY Name ]; 
       
        //Select Name,Address__c,Building_Group__c,Type__c from Building__c where Building_Group__c IN (SELECT Id FROM Building_Group__c where Property_Management__c = '001q000000ndvrf')

} 

    //This method is to create a new contact while clicking on the Add contact button 

    public pageReference newContact(){  

        pageReference pageRef = new pageReference(URL.getSalesforceBaseUrl().toExternalForm() + '/a0s/e?&retURL=' + accounts.id);  

        return pageRef; 

    } 

    //This method is to edit the existing contact record while clicking the Edit link 

    public pageReference editContact(){  

        String contactId = Apexpages.currentpage().getParameters().get('contactId');  

        pageReference pageRef = new pageReference(URL.getSalesforceBaseUrl().toExternalForm() + '/' + contactId + '/e?retURL=' + accounts.id);  

        return pageRef;  

    }    


 //This method is to delete the contact record while clicking the Del link 

    public pageReference deleteContact(){  

        String contactId = Apexpages.currentpage().getParameters().get('contactId');  

        contact contactList = [SELECT Id FROM contact WHERE id = : contactId LIMIT 1]; 

        delete contactList; 

        String baseUrl = URL.getSalesforceBaseUrl().toExternalForm(); 

        PageReference redirectPage = new PageReference(baseUrl+'/'+accounts.id); 

       return redirectPage;  

    }   


}