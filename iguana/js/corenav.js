
	var rel = "BTC";
    var data = [{'coin': "NXT" , 'volume': 20000000},{'coin': "VPN" , 'volume': 20000000}];
    
    var coreNav = 0;
	var callback = function(i){
		//console.log("coreNav start" , i , coreNav);
		var request="{\"agent\":\"tradebot\",\"method\":\"aveprice\",\"base\":\""+data[i].coin+"\",\"rel\":\""+rel+"\",\"basevolume\":\""+data[i].volume+"\"}";
	      SPNAPI.makeRequest(request, function(request,response){
	            response=JSON.parse(response);
	            if(response.result){
	            	console.log('Before coreNav' , coreNav);
	             	coreNav = coreNav + (response.aveprice * data[i].volume)
	             	console.log('After coreNav' , coreNav);
	            }
	            if(coreNav > 0){
				    coreNav = coreNav/816061.0;
				   // coreNav = coreNav.toFixed(20);
				}
				document.getElementById("coreNavV").innerHTML= "<b>coreNAV: "+coreNav + " BTC</b>";
	       });
	}
	
	function getNav(){
		for( var i in data){
	      var temp = callback(i);
	    }
	    coreNav = 0;
	};
	

   var refreshId = setInterval(getNav, 10000);