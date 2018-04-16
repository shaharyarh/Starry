/**This is a sample controller with sample data of how to use the
	Paginate class*/
public with sharing class PaginationDemoController {
	public Paginate paginater {get;set;}
	public List<CustomClass> genericList{get;set;}
	public List<List<CustomClass>> fullGenericList{get;set;}

	public PaginationDemoController(){
		//Get the data we need to paginate
		List<CustomClass> resultsList = populateData();
		
		//Set the page size
    	Integer pageSize = 10;
    	
    	//Create a new instance of Paginate passing in the overall size of 
    	//the list of data and the page size you want
       	this.paginater = new Paginate(resultsList.size(), pageSize);

		//These lists hold the data
		this.fullGenericList = new List<List<CustomClass>>();
		this.genericList = new List<CustomClass>();
		
		//Break out the full list into a list of lists
		if(resultsList.size() > 0){
			List<CustomClass> tempCC = new List<CustomClass>();       	
	       	Integer i = 0;
	       	for(CustomClass cc : resultsList){
	       		tempCC.add(cc);
	       		i++;
	       		if(i == pageSize){
	       			this.fullGenericList.add(tempCC);
	       			tempCC = new List<CustomClass>();
	       			i = 0;
	       		}
	       	}
	       	if(!tempCC.isEmpty()){
       			this.fullGenericList.add(tempCC);
	       	}
	       	
	       	//Gets the correct list of data to show on the page
	       	this.genericList = this.fullGenericList.get(this.paginater.index);
		}
	}

    public PageReference previousPage(){
    	this.paginater.decrement();
    	return changeData();
    }
    
    public PageReference nextPage(){
    	this.paginater.increment();
    	return changeData();
    }

    public PageReference updatePage(){
    	this.paginater.updateNumbers();
    	return changeData();
    }
    
    public PageReference changeData(){
    	this.genericList = this.fullGenericList.get(this.paginater.index);
    	return null;
    }
	
	public List<CustomClass> populateData(){
		List<CustomClass> customClassList = new List<CustomClass>();
        Account accounts = [SELECT id,Name FROM account LIMIT 100]; 
		/*
        for(Integer i = 1; i < 50; i++)
        {
			customClassList.add(new CustomClass(i, 'Name:  ' + String.valueOf(i)));
		}
*/
		return customClassList;
	}
	
	public class CustomClass{
		public Integer num{get;set;}
		public String name{get;set;}
        public Account acc{get;set;}
		
		public CustomClass(Integer num, String name,Account a){
			this.num = num;
			this.name = name;
            this.acc = a;
		}
	}
}