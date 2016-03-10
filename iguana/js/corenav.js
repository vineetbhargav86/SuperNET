
	var rel = "BTC";
    var data = [{'coin': "NXT" , 'volume': 20000000},{'coin': "VPN" , 'volume': 20000000},{'coin': "VRC" , 'volume': 2000000},{'coin': "BTCD" , 'volume': 50000},{'coin': "SYS" , 'volume': 1000000}];
    
    var coreNav = 0;
	var callback = function(i){
		var request="{\"agent\":\"tradebot\",\"method\":\"aveprice\",\"base\":\""+data[i].coin+"\",\"rel\":\""+rel+"\",\"basevolume\":\""+data[i].volume+"\"}";
	      SPNAPI.makeRequest(request, function(request,response,coreNav){
	            response=JSON.parse(response);
	            if(response.result){
	            	console.log('Before coreNav' , this.coreNav);
	             	this.coreNav = this.coreNav + (response.aveprice * data[i].volume)
	             	console.log("After coreNav",  this.coreNav);
	            }
	       });
	      if(this.coreNav > 0 && i == (data.length-1)){
				    this.coreNav = this.coreNav/816061.0;
				    console.log('Final coreNav' , this.coreNav);
		   }
		   document.getElementById("coreNavV").innerHTML= "<b>coreNAV: "+this.coreNav + " BTC</b>";
	}
	
	function getNav(){
		for( var i in data){
	      callback(i);
	    }
	    coreNav = 0;
	};
	

   var refreshId = setInterval(getNav, 10000);