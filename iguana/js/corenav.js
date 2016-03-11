
	var rel = "BTC";
    var data = [{'coin': "NXT" , 'volume': 20000000},{'coin': "VPN" , 'volume': 20000000},{'coin': "VRC" , 'volume': 2000000},{'coin': "BTCD" , 'volume': 50000},{'coin': "SYS" , 'volume': 1000000}];
    
    var coreNav = 0;

    var apiRequestForEachCoin = function(i){
		if(i<5){
			var request="{\"agent\":\"tradebot\",\"method\":\"aveprice\",\"base\":\""+data[i].coin+"\",\"rel\":\""+rel+"\",\"basevolume\":\""+data[i].volume+"\"}";
		      	SPNAPI.makeRequest(request, function(request,response){
		            response=JSON.parse(response);
		            if(response.result){
		             	this.coreNav = this.coreNav + (response.aveprice * (data[i]).volume)
		            }
		            if(i >= (data.length-1)){
					    this.coreNav = this.coreNav/816061.0;
					    i = 0;
					    document.getElementById("coreNav").innerHTML= "<b>coreNAV: "+this.coreNav + " BTC</b>";
					    this.coreNav = 0
			   		}else{
			   			i += 1;
		             	apiRequestForEachCoin(i);
			   		}
			   });
			}
		}
   
   var refreshId = setInterval(function(){apiRequestForEachCoin(0);}, 10000);	