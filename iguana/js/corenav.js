
	var rel = "BTC";
    var data = [{'coin': "NXT" , 'volume': 20000000},{'coin': "VPN" , 'volume': 20000000},{'coin': "VRC" , 'volume': 2000000},{'coin': "BTCD" , 'volume': 50000},{'coin': "SYS" , 'volume': 1000000}];
    
	var callback = function(i, coreNav){
		console.log("coreNav start" , coreNav);
		var request="{\"agent\":\"tradebot\",\"method\":\"aveprice\",\"base\":\""+data[i].coin+"\",\"rel\":\""+rel+"\",\"basevolume\":\""+data[i].volume+"\"}";
	      SPNAPI.makeRequest(request, function(request,response){
	            response=JSON.parse(response);
	            if(response.result){
	             	coreNav += (response.aveprice * data[i].volume)
	             	console.log("call - ", i, coreNav);
	            }
	            if(coreNav > 0){
				    coreNav = coreNav/816061.0;
				   // coreNav = coreNav.toFixed(20);
				}
				document.getElementById("coreNavV").innerHTML= "<b>coreNAV: "+coreNav + " BTC</b>";
	       });
	}
	
	function getNav(){
		var coreNav = 0;
		for( var i in data){
	      var temp = callback(i, coreNav);
	    }
	};
	getNav();

   var refreshId = setInterval(getNav, 10000);