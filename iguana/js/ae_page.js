var selected_asset = 0;
var assets_are_loaded = true;
$("#depth_hover").hide();
Jay.setNode("jnxt.org");
Jay.setRequestMethod(Jay.requestMethods.single);
Jay.msTimeout = 10000;

function getHashtag()
{	
	return selected_asset;
}
function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
} 
var jay;
function numberSort(a, b)
{
    return a - b;
}

function getNxtTime()
{
	return Math.floor(Date.now() / 1000) - 1385294400;
}

function nxtTimeToDate(time)
{
	var time = new Date((time + 1385294400)*1000);
	var min = Math.round(minute(time)/10)*10;
	return day(time) + "<br/>" + hour(time) + ":" + min;
}

function toDecimal(number, dec)
{
	number *= Math.pow(10, dec);
	number = Math.round(number);
	number /= Math.pow(10, dec);
	number = number.toString();
	if(number.indexOf(".") === -1 && dec != 0)
	{
		number += ".";
	}
	while(number.indexOf(".")+dec >= number.length) number += "0";
	if(number.indexOf(".")+dec > number.length) number = number.substring(0, number.indexOf(".")+dec);
	return number;
}

function setCookie(name, value, days) {
    var expires;

    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function eraseCookie(name) {
    setCookie(name, "", -1);
}

function timeago(timestamp)
{
	var fromnow =  getNxtTime() - timestamp;
		
	var days =  Math.floor(fromnow/86400);
	var hours = Math.floor((fromnow%86400)/3600);
	var minutes = Math.floor((fromnow%3600)/60);
	var seconds = Math.floor(fromnow&60);
	var acc = "";
	if(days != 0 && days != 1) acc = days + " days ago";
	else if(days == 1) acc = " 1 day ago";
	else if(hours != 0 && hours != 1) acc = hours + " hours ago";
	else if(hours == 1) acc = "1 hour ago";
	else if(minutes != 0 && minutes != 1) acc = minutes + " minutes ago";
	else if(minutes == 1) acc = "1 minute ago";
	else if(seconds != 0 && seconds != 1) acc = seconds + " seconds ago";
	else if(seconds == 1) acc = "1 second ago";
	else acc = "just now";
		
	return acc;
}

function sortByParam(obj, param)
{
	var sorted = [];
	var arr = [];
	for(var a=0;a<obj.length;a++)
	{
		arr.push(obj[a][param]);
	}
	arr = arr.sort(numberSort);
	for(var a=0;a<arr.length;a++)
	{
		for(var b=0;b<arr.length;b++)
		{
			if(arr[a] == obj[b][param])
			{
				sorted.push(obj[b]);
				obj.splice(b, 1);
				break;
			}
		}
	}
	return sorted;
}

function comma(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
var forgers = [];
var fff = [];
var pub = [];
var eff = [];
var hlt = [];
var prevtx = 0;
var rndnum = 0;

function prepareBlock()
{
	$.getJSON("./forgers.json", function(d) {
		fff = d.forgers;
		for(var a=0; a<fff.length;a++)
		{
			// forger pubkeys
			rndnum = a;
			$.getJSON("http://jnxt.org:7876/nxt?requestType=getAccount&account="+fff[a], function(dat)
			{

				forgers.push(dat.accountRS);
				pub.push(dat.publicKey);
				eff.push(dat.effectiveBalanceNXT);
			});
		}
	});
}
prepareBlock();

function getNextBlock(fn)
{
	// ready to go
	$.getJSON("http://jnxt.org:7876/nxt?requestType=getBlockchainStatus", function(data) 
	{
		$.getJSON("http://jnxt.org:7876/nxt?requestType=getBlock&block="+data.lastBlock, function(blk) 
		{
			var jsonobj = {};
			var total = [];
			var lastbase = Math.floor((blk.baseTarget/153722867)*100);
			var lastbasetarget = new BigInteger(blk.baseTarget);
			var lasttime = data.time - blk.timestamp - 45;
			var gensig = converters.hexStringToByteArray(blk.generationSignature);
			var fgr;
			var facc;
			jsonobj["timeSinceBlock"] = lasttime;


			var text = "";
			var accum = 10000000000;
			var accum2 = 10000000000;
			for(var d=0; d<forgers.length;d++)
			{
				SHA256_init();
									//alert(new BigInteger(blk.generationSignature))
				var pubb = converters.hexStringToByteArray(pub[d]);
				var gens = gensig;

				SHA256_write(gens.concat(pubb));
				var hithash = SHA256_finalize();
				var arr = hithash.slice(0, 8);
				arr2 = arr.reverse();
				arr = [hithash[0], hithash[1], hithash[2], hithash[3], hithash[4], hithash[5], hithash[6], hithash[7]];
				var hit = converters.byteArrayToBigInteger(arr, 0);
							
				var basetarget = lastbasetarget
				var beff = new BigInteger(eff[d].toString());


				var time = Math.abs(hit.divide(basetarget.multiply(beff)));

									// ok now lets do stuff...
				if(time < accum && time != 0)
				{
					accum = time;
					fgr = pub[d];
					facc = forgers[d];
				}
			}
			var nbst = Math.floor(lastbasetarget*(accum/60));
			if(nbst < lastbasetarget/2) nbst = Math.floor(lastbasetarget/2);
			if(nbst > lastbasetarget*2) nbst = lastbasetarget*2;
			var tmp = {};
			jsonobj["blockTime"] = accum;
			jsonobj["baseTarget"] = nbst;
			jsonobj["basePercent"] = Math.floor((nbst/153722867)*100);
			jsonobj["forgerPublicKey"] = fgr
			jsonobj["forgerAccountRS"] = facc;
			jsonobj["blockHeight"] = data.numberOfBlocks+1;

			fn(jsonobj);
		});
	});
}

var decimals;
var bids = [];
var asks = [];

$("document").ready(function() {
  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();

$("#buy_qr").click(function() {
	$("#qrzone").empty().qrcode({'text':$("#buy_order_trf").val(),'width':256,'height':256});
	$("#qrtrf").val($("#buy_order_trf").val());
	$("#modal_qr").modal("show");
});

$("#sell_qr").click(function() {
	$("#qrzone").empty().qrcode({'text':$("#sell_order_trf").val(),'width':256,'height':256});
	$("#qrtrf").val($("#sell_order_trf").val());
	$("#modal_qr").modal("show");
});
blocks();
setInterval(blocks, 1000);

var indicator = "";
function blocks() 
{
	getNextBlock(function(block) {
		var blocktime = block.blockTime;
		if(blocktime < 60)
		{
			$("#block_type").text("Short");
			$("#block_indicator").removeClass(indicator);
			indicator = "alert-success";
			$("#block_indicator").addClass(indicator);
		}
		else if(blocktime < 120)
		{
			$("#block_type").text("Average");
			$("#block_indicator").removeClass(indicator);
			indicator = "alert-success";
			$("#block_indicator").addClass(indicator);
		}
		else if(blocktime < 160)
		{
			$("#block_type").text("Longish");
			$("#block_indicator").removeClass(indicator);
			indicator = "alert-warning";
			$("#block_indicator").addClass(indicator);
		}
		else if(blocktime < 240)
		{
			$("#block_type").text("Long");
			$("#block_indicator").removeClass(indicator);
			indicator = "alert-warning";
			$("#block_indicator").addClass(indicator);
		}
		else if(blocktime < 500)
		{
			$("#block_type").text("Too Long");
			$("#block_indicator").removeClass(indicator);
			indicator = "alert-danger";
			$("#block_indicator").addClass(indicator);
		}
		else
		{
			$("#block_type").text("Way Too Long");
			$("#block_indicator").removeClass(indicator);
			indicator = "alert-danger";
			$("#block_indicator").addClass(indicator);
		}
		$("#block_length").text((blocktime-block.timeSinceBlock) + " / " + blocktime + " s");
		if(unconfs.length != 1) $("#block_unconf").text(unconfs.length + " pending trades");
		else $("#block_unconf").text("1 pending trade")
	});

	Jay.request("getUnconfirmedTransactions", {}, function(txs)
	{
		txs = JSON.parse(txs).unconfirmedTransactions;

		if(txs.length > unconfs.length)
		{
			for(var a=0;a<txs.length;a++)
			{
				if(txs[a].type != 2 || (txs[a].subtype != 3 && txs[a].subtype != 2 && txs[a].subtype != 4 && txs[a].subtype != 5)) continue;
				var found = false;
				for(var b=0;b<unconfs.length;b++)
				{
					if(txs[a].transaction == unconfs[b].transaction) found = true;
				}
				if(!found)
				{
					txs[a].unconf = true;
					unconfs.push(txs[a]);
					if(txs[a].subtype == 4) cancelAskOrder(txs[a]);
					if(txs[a].subtype == 5) cancelBidOrder(txs[a]);
					if(txs[a].attachment.asset == getHashtag())
					{
						if(txs[a].subtype == 2) addAskOrder(txs[a]);
						else if(txs[a].subtype == 3) addBidOrder(txs[a]);
					}
				}
			}
		}
		else if(txs.length < unconfs.length)
		{
			unconfs = [];
			// a new block is here...
		}
	});
}

var unconfs = [];

function addAskOrder(order)
{
	if(jay == undefined)
	{
		setTimeout(function() {addAskOrder(order);}, 200);
		return;
	}
	var prev = 0;
	for(var a=0;a<jay.askOrders.length;a++)
	{
		if(parseInt(order.attachment.priceNQT) < parseInt(jay.askOrders[a].priceNQT) || a == jay.askOrders.length-1)
		{
			var od = {};

			od.priceNQT = order.attachment.priceNQT;
			od.quantityQNT = order.attachment.quantityQNT;
			od.accountRS = order.senderRS;
			od.unconf = true;
			jay.askOrders.splice(a, 0, od);
			askOrders(jay.askOrders);
			break;
		}
		prev = jay.askOrders[a].priceNQT;
	}
}

function addBidOrder(order)
{
	if(jay == undefined)
	{
		setTimeout(function() {addBidOrder(order);}, 200);
		return;
	}
	var prev = 0;
	for(var a=0;a<jay.bidOrders.length;a++)
	{
		if(parseInt(order.attachment.priceNQT) > parseInt(jay.bidOrders[a].priceNQT) || a == jay.bidOrders.length-1)
		{
			var od = {};
			od.priceNQT = order.attachment.priceNQT;
			od.quantityQNT = order.attachment.quantityQNT;
			od.accountRS = order.senderRS;
			od.unconf = true;
			jay.bidOrders.splice(a, 0, od);
			bidOrders(jay.bidOrders);
			break;
		}
		prev = jay.bidOrders[a].priceNQT;
	}
}

function cancelAskOrder(order)
{
	if(jay == undefined)
	{
		setTimeout(function() {cancelAskOrder(order)}, 200);
		return;
	}
	for(var a=0;a<jay.askOrders.length;a++)
	{

		if(order.attachment.order == jay.askOrders[a].order)
		{
			jay.askOrders[a].cancel = true;
			askOrders(jay.askOrders);
			break;
		}
	}
}

function cancelBidOrder(order)
{
	if(jay == undefined)
	{
		setTimeout(function() {cancelBidOrder(order)}, 200);
		return;
	}
	for(var a=0;a<jay.bidOrders.length;a++)
	{
		if(order.attachment.order == jay.bidOrders[a].order)
		{
			jay.bidOrders[a].cancel = true;
			bidOrders(jay.bidOrders);
			break;
		}
	}
}


// handle logging in things..

var isAttached = getCookie("rs") != null;
if(isAttached)
{
	var rs = getCookie("rs");
	$("#attach_text").text("Unattach Account");
	Jay.request("getBalance", {"account":rs}, function(am) {
		am = JSON.parse(am);
		$("#buy_rs").text(Number(am.unconfirmedBalanceNQT)/Math.pow(10, 8));
	});

	Jay.request("getAccountAssets", {"account":rs,"asset":getHashtag()}, function(am) {
		if(am == "{}")
		{
			$("#sell_rs").text("0");
			return;
		}
		am = JSON.parse(am);
		$("#sell_rs").text(Number(am.unconfirmedQuantityQNT)/Math.pow(10, Number(am.decimals)));
	})
}
else 
{
	var rs = "No Account Attached";
	$("#sell_rs").text("0");
	$("#buy_rs").text("0");
}
$(".address").text(rs);

$("#modal_attach_attach").click(function() {
	var addy = $("#modal_attach_input").val();
	if(addy.indexOf("NXT-") === 0)
	{
		setCookie("rs", addy);
		location.reload();
	}
})

$("#attach_account").click(function() {
	if(isAttached)
	{
		eraseCookie("rs");
		location.reload();
	}
	else
	{
		$("#modal_attach").modal("show");
	}

})


$("#search").on("input propertychange", function() {
	$("#side_assets").empty();
	if($("#search").val() !== "")
	{
		for(var a=0;a<assets.length;a++)
		{
			if(assets[a].name.toLowerCase().indexOf($("#search").val().toLowerCase()) !== -1 || assets[a].asset.indexOf($("#search").val()) !== -1)
			{
				var row = "<li>"; 
				if(getHashtag() == assets[a].asset)
				{
					row += "<a class='side_assets_item activeasset' data-asset='"+assets[a].asset+"' style='color:#333' href='#'>"+assets[a].name+"/NXT <span class='pull-right'><span class='label label-primary'>"+assets[a].volume+" NXT</span></span></a>";

				}
				else
				{
					row += "<a class='side_assets_item' data-asset='"+assets[a].asset+"' style='color:#333' href='#'>"+assets[a].name+"/NXT <span class='pull-right'><span class='label label-primary'>"+assets[a].volume+" NXT</span></span></a>";

				}
				row += "</li>";
				$("#side_assets").append(row);
			}
		}
	}
	else
	{
		var maxasset = 50;
		var assetcount = 0;
		for(var a=0;a<assets.length;a++)
		{
			if(maxasset == assetcount++) break;
			if(assets[a].volume == 0) break;
			var row = "<li>"; 
			if(getHashtag() == assets[a].asset)
			{
				row += "<a class='side_assets_item activeasset' data-asset='"+assets[a].asset+"' style='color:#333' href='#'>"+assets[a].name+"/NXT <span class='pull-right'><span class='label label-primary'>"+assets[a].volume+" NXT</span></span></a>";

			}
			else
			{
				row += "<a class='side_assets_item' data-asset='"+assets[a].asset+"' style='color:#333' href='#'>"+assets[a].name+"/NXT <span class='pull-right'><span class='label label-primary'>"+assets[a].volume+" NXT</span></span></a>";

			}
			row += "</li>";
			$("#side_assets").append(row);
		}
	}
	

})

  		$('[data-toggle="popover"]').popover();


var highlight = "none";
var hacc = "";
var litnum = 0;

var load_assets = function(asset, callback, error){
	var indexing = 0,
		cont = true,
		subtrades = [],
		self = $(this),
		assets;

	var req = function(params, callback){

		$.get("http://jnxt.org:7876/nxt?" + params)
		.done(function(data){
			callback(data);
		})
		.fail(function(){
			error();
		});
		
	};	

	var getNxtTime = function(){

		return Math.floor(Date.now() / 1000) - 1385294400;
	};

	if(!asset){

		$.get("http://jnxt.org/jayex/data/assets.json") 
		.done(function(data){
			callback(data);
		})
		.fail(function(){
			error();
		});

		return;
	}	else {


		$.get("http://jnxt.org/jayex/data/" + asset + ".json") 
		.done(function(data, status){
			assets = data;

	while(cont) {

		$.when(req("requestType=getTrades&asset="+asset+"&firstIndex="+indexing+"&lastIndex="+(indexing+9), function(data){
			var newtrades = JSON.parse(data);
			
			for(var i=0;i<newtrades.trades.length;i++){
			if(parseInt(newtrades.trades[i].timestamp) != parseInt(assets.trades[0].timestamp)){
				subtrades.push(newtrades.trades[i]);
			} else {
				cont = false;
				break;
			}
		}
		})).then(function(data){
			
			indexing += 10;
		
		});
			

		if(indexing==100)
			break;
	}

	assets.trades = subtrades.concat(assets.trades);

	req("requestType=getBidOrders&asset="+asset+"&lastIndex=49", function(data){
		var bidss = JSON.parse(data);
		assets.bidOrders = bidss.bidOrders;

		req("requestType=getAskOrders&asset="+asset+"&lastIndex=49", function(data){
			var asks = JSON.parse(data);
			assets.askOrders = asks.askOrders;
			callback(assets);
		});
	});
	
		})
		.fail(function(){
			error();
		});
	}				


};

	load_assets(0, function(data) {
		assets = data;
		if(isAttached)
		{
			Jay.request("getAccountAssets", {"account":rs}, function(data) {
				data = JSON.parse(data);

				var maxasset = 50;
				var assetcount = 0;
				for(var a=0;a<assets.length;a++)
				{
					if(maxasset == assetcount++) break;
					if(assets[a].volume == 0) break;
					var row = "<li>"; 
					found = false;
					for(var b=0;b<data.accountAssets.length;b++)
					{
						if(data.accountAssets[b].asset == assets[a].asset)
						{
							console.log("ye");
							found = true;
							if(getHashtag() == assets[a].asset)
							{
								row += "<a class='activeattached' style='color:#333;' href='?"+assets[a].asset+"'>"+assets[a].name+"/NXT <span class='badge'>"+(data.accountAssets[b].quantityQNT/Math.pow(10,data.accountAssets[b].decimals))+" "+data.accountAssets[b].name+" </span><span class='pull-right'><span class='label label-primary'>"+assets[a].volume+" NXT</span></span></a>";

							}
							else
							{
								row += "<a class='attached' style='color:#333' href='?"+assets[a].asset+"'>"+assets[a].name+"/NXT <span class='badge'>"+(data.accountAssets[b].quantityQNT/Math.pow(10,data.accountAssets[b].decimals))+" "+data.accountAssets[b].name+" </span><span class='pull-right'><span class='label label-primary'>"+assets[a].volume+" NXT</span></span></a>";

							}
							break;
						}
					}
					if(getHashtag() == assets[a].asset && !found)
					{
						row += "<a class='side_assets_item activeasset' data-asset='"+assets[a].asset+"' style='color:#333' href='#'>"+assets[a].name+"/NXT <span class='pull-right'><span class='label label-primary'>"+assets[a].volume+" NXT</span></span></a>";
					}
					else if(!found)
					{
						row += "<a class='side_assets_item' data-asset='"+assets[a].asset+"' style='color:#333' href='#'>"+assets[a].name+"/NXT <span class='pull-right'><span class='label label-primary'>"+assets[a].volume+" NXT</span></span></a>";
					}
					row += "</li>";
					$("#side_assets").append(row);
				}
			})
		}
		else
		{
			var maxasset = 50;
			var assetcount = 0;
			for(var a=0;a<assets.length;a++)
			{
				if(maxasset == assetcount++) break;
				if(assets[a].volume == 0) break;
				var row = "<li>"; 
				if(getHashtag() == assets[a].asset)
				{
					row += "<a class='side_assets_item activeasset' data-asset='"+assets[a].asset+"' style='color:#333' href='#'>"+assets[a].name+"/NXT <span class='pull-right'><span class='label label-primary'>"+assets[a].volume+" NXT</span></span></a>";
				}
				else
				{
					row += "<a class='side_assets_item' data-asset='"+assets[a].asset+"' style='color:#333' href='#'>"+assets[a].name+"/NXT <span class='pull-right'><span class='label label-primary'>"+assets[a].volume+" NXT</span></span></a>";
				}
				row += "</li>";
				$("#side_assets").append(row);
			}
		}
      
      $('.side_assets_item').click(function(){
      if(assets_are_loaded){
        assets_are_loaded = false;
	selected_asset = $(this).data("asset");
	$('.side_assets_item').removeClass('activeasset');
	var self = $(this);
	load_assets(getHashtag(), function(data) {
		jay = data;
		decimals = jay.assetData.decimals;
		
		topinfo(data);


		$("h1 span.asset").attr("data-content", jay.assetData.description);
		$("span.asset").text(jay.assetData.name);
		$(".assetid").text(jay.assetData.asset);
		$(".issuer").text(jay.assetData.accountRS);
			history(jay.trades);

		  	bidOrders(data.bidOrders);

			/*$(".buy_order").hover(function() {
				$(this).tooltip("show");
			});
			$("[data-toggle='tooltip']").hover(function() {
				$(this).tooltip("show");
			})
			$(".buy_order").mouseleave(function() {
				var $that = $(this);
				setTimeout(function() {$that.tooltip("hide");}, 30);
			})*/

			askOrders(data.askOrders);
			self.addClass('activeasset');
		$("tr").mouseout(function() {
		$(this).popover("hide"); });
      var values = [];
      var phases = [];
      var prices = [];
      var depthData = [];
      var pricemin = 1000000000000, pricemax = 0, ctr = 0;
      var depthlen = 50, depthmax = 0, total =0, deficit = 0, counter = 0;
      var bids = data.bidOrders;
      var asks = data.askOrders;
      for(var i=0;i<bids.length;i++)
	{
		var price = Math.round((bids[i].priceNQT/Math.pow(10, 8-decimals))*1000)/1000;
		total += price*bids[i].quantityQNT/Math.pow(10, decimals);
        ctr += bids[i].quantityQNT/Math.pow(10, decimals);
        total = Math.round(total*10000)/10000;
        ctr = Math.round(ctr*10000)/10000;
          depthData.push({
            price: price,
            total: total,
            totalQ: ctr,
            type: jay.assetData.name
          });

		if(depthmax < total) depthmax = total;	
		if(pricemin > price) pricemin = price;
		if(pricemax < price) pricemax = price;
      
		deficit = depthData[0].price - price;
		if(++counter == depthlen) break;
	}
      total = 0, counter = 0, ctr = 0;
      depthData = depthData.reverse();
      depthData[0].lineColor = '#b7e021';
      var depthLength = depthData.length;
      for(var i=0;i<asks.length;i++)
	{
      var price = Math.round((asks[i].priceNQT/Math.pow(10, 8-decimals))*1000)/1000;
        if(!i){
          var newPrice = price - (price - depthData[depthLength-1].price)/2;
          depthData.push({
            price: newPrice,
            total: null,
            totalQ: 0,
            type: jay.assetData.name
          });
          depthLength = depthData.length;
        }
		
		total += price*asks[i].quantityQNT/Math.pow(10, decimals);
        ctr += asks[i].quantityQNT/Math.pow(10, decimals);
      if(i)
		if(++counter == depthlen || price > depthData[depthLength].price+deficit) break;
      
        total = Math.round(total*10000)/10000;
        ctr = Math.round(ctr*10000)/10000;
      
        if(!i){
          depthData.push({
            lineColor: '#df5020',
            price: price,
            total: total,
            totalQ: ctr,
            type: jay.assetData.name
          });
        }
        else
          depthData.push({
            price: price,
            total: total,
            totalQ: ctr,
            type: jay.assetData.name
          });
      
		if(depthmax < total) depthmax = total;
		if(pricemin > price) pricemin = price;
		if(pricemax < price) pricemax = price;
	}

		for(var i=0;i<jay.trades.length;i++){
			var d = new Date((jay.trades[i].timestamp+1385294400)*1000);
			var y = d.getFullYear().toString();
			var m = d.getMonth()+1;
			if(m<10)
				m = '0'+ m.toString();
			else
				m = m.toString();
			var day = d.getDate();
			if(day<10)
				day = '0'+day.toString();
			else
				day = day.toString();
			jay.trades[i].volume = jay.trades[i].priceNQT/Math.pow(10, 8 - decimals)*jay.trades[i].quantityQNT/Math.pow(10, decimals);
			jay.trades[i].date = y + '-' + m + '-' + day;
			jay.trades[i].price = jay.trades[i].priceNQT/Math.pow(10, 8 - decimals);
		}
      	for(var e=0,rem='',j=0;e<jay.trades.length;e++)
	{  var trade = jay.trades[e];
		var phase = jay.trades[e].date;
        if(rem==phase || e==0){
          if(phases[j]==undefined) phases[j]=[];
		  phases[j].push(trade);
          if(prices[j]==undefined) prices[j]=[];
          prices[j].push(trade.priceNQT/Math.pow(10, 8 - decimals));
          rem=phase;
        }
        else {
          j++;
          rem=phase;
          if(phases[j]==undefined) phases[j]=[];
          phases[j].push(trade);
          if(prices[j]==undefined) prices[j]=[];
          prices[j].push(trade.priceNQT/Math.pow(10, 8 - decimals));
        }
	}
    for(var i=0;i<phases.length;i++){
      var open = Math.round(prices[i][phases[i].length-1]*100)/100;
      var close = Math.round(prices[i][0]*100)/100;
      var high = Math.max.apply(null, prices[i]);
      high = Math.round(high*100)/100;
      var low = Math.min.apply(null, prices[i]);
      low = Math.round(low*100)/100;
      var vol = 0;
      var date = phases[i][0].date;
      for(var j=0;j<phases[i].length;j++){
        vol += phases[i][j].volume;
      }
      vol = Math.round(vol);
      values.push({open: open, close: close, high: high, low: low, volume: vol, date: date});
    }
      
		var amdata = values.reverse();

var chart = AmCharts.makeChart("stockchart", {
  "type": "stock",
  "color": "#fff",
  "dataSets": [{
  "title": "NXT",
    "fieldMappings": [{
      "fromField": "open",
      "toField": "open"
    }, {
      "fromField": "high",
      "toField": "high"
    }, {
      "fromField": "low",
      "toField": "low"
    }, {
      "fromField": "close",
      "toField": "close"
    }, {
      "fromField": "volume",
      "toField": "volume"
    }],
    "compared": false,
    "categoryField": "date",
    /**
     * data loader for data set data
     */
    "dataProvider": amdata,

   /**
    * data loader for events data
    */
   /* "eventDataLoader": {
      "url": "./amcharts/MSFT_events.csv",
      "format": "csv",
      "showCurtain": true,
      "showErrors": true,
      "async": true,
      "reverse": true,
      "delimiter": ",",
      "useColumnNames": true,
      "postProcess": function ( data ) {
        for ( var x in data ) {
          switch( data[x].Type ) {
            case 'A':
              var color = "#85CDE6";
              break;
            default:
              var color = "#cccccc";
              break;
          }
          data[x].Description = data[x].Description.replace( "Upgrade", "<strong style=\"color: #0c0\">Upgrade</strong>" ).replace( "Downgrade", "<strong style=\"color: #c00\">Downgrade</strong>" );
          data[x] = {
            type: "pin",
            graph: "g1",
            backgroundColor: color,
            date: data[x].Date,
            text: data[x].Type,
            description: "<strong>" + data[x].Title + "</strong><br />" + data[x].Description
          };
        }
        return data;
      }
   } */

  }],
  "dataDateFormat": "YYYY-MM-DD",

  "panels": [{
      "title": "Price",
      "percentHeight": 70,

      "stockGraphs": [{
        "type": "candlestick",
        "id": "g1",
        "openField": "open",
        "closeField": "close",
        "highField": "high",
        "lowField": "low",
        "valueField": "close",
        "lineColor": "#fff",
        "fillColors": "#fff",
        "negativeLineColor": "#db4c3c",
        "negativeFillColors": "#db4c3c",
        "fillAlphas": 1,
        "comparedGraphLineThickness": 2,
        "columnWidth": 0.7,
        "useDataSetColors": false,
        "comparable": true,
        "compareField": "close",
        "showBalloon": false,
        "proCandlesticks": true
      }],

      "stockLegend": {
        "periodValueTextRegular": "[[value.close]]"
      }

    },

    {
      "title": "Volume",
      "percentHeight": 30,
      "marginTop": 1,
      "columnWidth": 0.6,
      "showCategoryAxis": false,

      "stockGraphs": [{
        "valueField": "volume",
        "openField": "open",
        "type": "column",
        "showBalloon": false,
        "fillAlphas": 1,
        "lineColor": "#fff",
        "fillColors": "#fff",
        "negativeLineColor": "#db4c3c",
        "negativeFillColors": "#db4c3c",
        "useDataSetColors": false
      }],

      "stockLegend": {
        "markerType": "none",
        "markerSize": 0,
        "labelText": "",
        "periodValueTextRegular": "[[value.close]]"
      },

      "valueAxes": [{
        "usePrefixes": true
      }]
    }
  ],

  "panelsSettings": {
    "color": "#fff",
    "plotAreaFillColors": "#333",
    "plotAreaFillAlphas": 1,
    "marginLeft": 60,
    "marginTop": 5,
    "marginBottom": 5
  },

  "chartScrollbarSettings": {
    "graph": "g1",
    "graphType": "line",
    "usePeriod": "WW",
    "backgroundColor": "#333",
    "graphFillColor": "#666",
    "graphFillAlpha": 0.5,
    "gridColor": "#555",
    "gridAlpha": 1,
    "selectedBackgroundColor": "#444",
    "selectedGraphFillAlpha": 1
  },

  "categoryAxesSettings": {
    "equalSpacing": true,
    "gridColor": "#555",
    "gridAlpha": 1
  },

  "valueAxesSettings": {
    "gridColor": "#555",
    "gridAlpha": 1,
    "inside": false,
    "showLastLabel": true
  },

  "chartCursorSettings": {
    "pan": true,
    "valueLineEnabled": true,
    "valueLineBalloonEnabled": true
  },

  "legendSettings": {
    "color": "#fff"
  },

  "stockEventsSettings": {
    "showAt": "high",
    "type": "pin"
  },

  "balloon": {
    "textAlign": "left",
    "offsetY": 10
  },

  "periodSelector": {
    "position": "bottom",
    "periods": [{
      "period": "DD",
      "count": 10,
      "label": "10D"
    }, {
      "period": "MM",
      "selected": true,
      "count": 1,
      "label": "1M"
    }, {
      "period": "MM",
      "count": 6,
      "label": "6M"
    }, {
      "period": "YYYY",
      "count": 1,
      "label": "1Y"
    }, {  
      "period": "YYYY",
      "count": 2,
      "label": "2Y"
    }, {
      "period": "YTD",
      "label": "YTD"
    }, {
      "period": "MAX",
      "label": "MAX"
    }]
  }
});
      
var depthchart = AmCharts.makeChart("chartdepth", {
    "type": "serial",
    "theme": "light",
    "marginRight": 80,
    "dataProvider": depthData,
    "balloon": {
        "cornerRadius": 6,
        "horizontalPadding": 15,
        "verticalPadding": 10
    },
    "valueAxes": [{
        "axisAlpha": 0
    }],
    "graphs": [{
        "bullet": "round",
        "bulletBorderAlpha": 1,
        "bulletBorderThickness": 1,
        "fillAlphas": 0.3,
        "hideBulletsCount": 30,
        "connect": false,
        "fillColorsField": "lineColor",
        "legendValueText": "[[value]]",
        "lineColorField": "lineColor",
        "title": "Total",
        "valueField": "total",
        "balloonText": "Total: [[total]] NXT<br>Total: [[totalQ]] [[type]]"
    }],
    "chartScrollbar": {

    },
    "chartCursor": {
        "categoryBalloonText": "Price: [[category]] NXT",
        "cursorAlpha": 0,
        "fullWidth": true
    },
    "categoryField": "price",
    "categoryAxis": {
        "autoGridCount": false,
        "axisColor": "#555555",
        "gridAlpha": 0,
        "gridCount": 10
    },
    "export": {
        "enabled": true        
    }
});
      assets_are_loaded = true;
	}, function()
	{
		$("h1").html("Error: asset data timed out");
	});
      }
});
	});



function topinfo(info)
{
	var twofour = Array();
	var time = getNxtTime();
	var tradec = 0;
	var vol = 0;
	var avg = 0;
	var askAvg = 0;
	var bidAvg = 0;

	for(var a=0;a<info.trades.length;a++)
	{
		if(info.trades[a].timestamp < time-86400) break;
		tradec++;
		twofour.push(info.trades[a])
		vol += info.trades[a].quantityQNT*info.trades[a].priceNQT/Math.pow(10, 8);
	}
	for(var a=0;a<twofour.length;a++)
	{
		var yield = twofour[a].quantityQNT*twofour[a].priceNQT/Math.pow(10, 8);
		avg += (yield/vol)*(Number(twofour[a].priceNQT)/Math.pow(10, 8-decimals));
		console.log(twofour[a].priceNQT/Math.pow(10, decimals));
	}

	if(info.askOrders.length)
		askAvg = info.askOrders[0].priceNQT/Math.pow(10,8-decimals);
	if(info.bidOrders.length)
		bidAvg = info.bidOrders[0].priceNQT/Math.pow(10, 8-decimals);

	var bidask = askAvg - bidAvg;
	
	$("#bidask").text(toDecimal(bidask, 8) + " NXT");
	$("#trades24").text(tradec + " Trades");
	$("#vol24").text(toDecimal(vol, 0) + " NXT");
	$("#avg24").text(toDecimal(avg, 8) + " NXT");

}


function history(trades)
{
	$("#trade_history_table tbody").empty();
			var counter = 0;

		for(var i=0;i<trades.length;i++)
		{
			if(counter++ == 50) break;
			var price = toDecimal(trades[i].priceNQT/Math.pow(10, 8-decimals), 8-decimals);
			var qnt = toDecimal(trades[i].quantityQNT/Math.pow(10, decimals), decimals);
			var nxtprice = toDecimal(Number(price)*Number(qnt), 8);

			if(trades[i].highlit)
			{
				var row = "<tr class='warning'>";
			}
			else if(trades[i].sellerRS == rs || trades[i].buyerRS == rs)
			{
				var row = "<tr class='info'>";
			}
			else if(trades[i].sellerRS == jay.assetData.accountRS || trades[i].buyerRS == jay.assetData.accountRS)
			{
				var row = "<tr class='success'>";
			}
			else
			{
				var row = "<tr>";
			}

			row += "<td><div class='dropdown'><button class='btn btn-xs btn-default dropdown-toggle' type='button' id='buydrop"+i+"' data-toggle='dropdown' aria-expanded='true'><span class='caret'></span></button>";
				row +=  "<ul class='dropdown-menu' role='menu' aria-labelledby='buydrop"+i+"'>";
				row += "<li role='presentation' class='dropdown-header'>Seller: "+trades[i].sellerRS+"</li>";
				row += "<li role='presentation'><a role='menuitem' tabindex='-1' href='#'>Copy Address To Clipboard</a></li>";
				row += "<li role='presentation'><a role='menuitem' tabindex='-1' href='http://www.nxtreporting.com/?ac="+trades[i].sellerRS+"' target='_blank'>Open Account in NxtReporting</a></li>";
				row += "<li role='presentation' class='divider'></li>";
				row += "<li role='presentation' class='dropdown-header'>Buyer: "+trades[i].buyerRS+"</li>";
				row += "<li role='presentation'><a role='menuitem' tabindex='-1' href='#'>Copy Address To Clipboard</a></li>";
				row += "<li role='presentation'><a role='menuitem' tabindex='-1' href='http://www.nxtreporting.com/?ac="+trades[i].buyerRS+"' target='_blank'>Open Account in NxtReporting</a></li>";
			
			row += "<td>" + timeago(trades[i].timestamp) + "</td>";
			row += "<td class='"+trades[i].tradeType+"'>" + trades[i].tradeType + "</td>";
			row += "<td>" + price + "</td>";
			row += "<td>" + qnt + "</td>";
			row += "<td>" + nxtprice + "</td>";
			row += "</tr>";
			$("#trade_history_table tbody").append(row);
		}

		highlighting();
}

function bidOrders(ord)
{			var priceone = 0;
			orders = ord;
			$("#buy_orders_count").text(orders.length);
			bids = orders;
			if(orders.length)
				priceone = orders[0].priceNQT/Math.pow(10, 8-decimals);
			$("#sell_order_price").val(priceone);
			$("#buy_orders_table tbody").empty();
			var total = 0;
			var amts = 0;
			for(var i=0;i<orders.length;i++)
			{
				var price = toDecimal(orders[i].priceNQT/Math.pow(10, 8-decimals), 8-decimals);
				var qnt = toDecimal(orders[i].quantityQNT/Math.pow(10, decimals), decimals);
				var nxtprice = toDecimal(Number(price)*Number(qnt), 8);
				amts += Number(qnt);
				total += Number(nxtprice);
				if(orders[i].highlit)
				{
					var row = "<tr class='buy_order warning' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";

				}
				else if(orders[i].unconf)
				{
					var row = "<tr class='buy_order unconf' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";
				}
				else if(orders[i].cancel)
				{
					var row = "<tr class='buy_order danger' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";

				}
				else if(orders[i].accountRS == rs)
				{
					var row = "<tr class='buy_order info' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";
				}
				else if(orders[i].accountRS == jay.assetData.accountRS)
				{
					var row = "<tr class='buy_order success' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";
				}
				else
				{
					var row = "<tr class='buy_order' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";
				}

				row += "<td><div class='dropdown'><button class='btn btn-xs btn-default dropdown-toggle' type='button' id='buydrop"+i+"' data-toggle='dropdown' aria-expanded='true'><span class='caret'></span></button>";
				row +=  "<ul class='dropdown-menu' role='menu' aria-labelledby='buydrop"+i+"'>";
				if(orders[i].accountRS == rs)
				{
					row += "<li role='presentation'><a data-toggle='modal' data-target='#modal_cancel' role='menuitem' tabindex='-1' href='#'>Cancel Buy Order</a></li>";
					row += "<li role='presentation' class='divider'></li>";

				}

				row += "<li role='presentation' class='dropdown-header'>"+orders[i].accountRS+"</li>";
				row += "<li role='presentation'><a role='menuitem' tabindex='-1' href='#'>Copy Address To Clipboard</a></li>";
				row += "<li role='presentation'><a role='menuitem' tabindex='-1' href='http://www.nxtreporting.com/?ac="+orders[i].accountRS+"' target='_blank'>Open Account in NxtReporting</a></li>";
				row += "<li role='presentation' class='divider'></li>";

				if(highlight == "none" || (highlight == "single" && orders[i].highlit == undefined))
				{
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='hsingle' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='bid' href=''>Highlight This Order</a></li>";
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='hmulti' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='bid' href=''>Highlight All From This Address</a></li>";

				}
				else if(highlight == "single" && orders[i].highlit)
				{
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='highlit' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='bid' href=''>Remove Highlighting</a></li>";
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='hmulti' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='bid' href=''>Highlight All From This Address</a></li>";
				}
				else if(highlight == "account" && hacc != orders[i].accountRS)
				{
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='hmulti' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='bid' href=''>Highlight All From This Address</a></li>";
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='multilit' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='bid' href=''>Clear All Highlighting</a></li>";	
				}
				else if(highlight == "account")
				{
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='multilit' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='bid' href=''>Clear All Highlighting</a></li>";	
				}
				row += "<td>" + price + "</td>";
				row += "<td>" + qnt + "</td>";
				row += "<td>" + nxtprice + "</td>";
				row += "<td>" + toDecimal(total, 8) + "</td>";
 				row += "</tr>";
				$("#buy_orders_table tbody").append(row);
			}
			$('[data-toggle="tooltip"]').tooltip();
			$(".buy_order").off("click").click(function() {
				$("#sell_order_price").val($(this).data("price"));
				$("#sell_order_amount").val($(this).data("amount"));
				$("#sell_order_total").val($(this).data("total"));
				makeSell();
			});

			highlighting();

			makeSell();
			$("#buy_orders_depth").text(toDecimal(amts, decimals));
}


function askOrders(ord)
{			
			var priceone = 0;
			orders = ord;
			$("#sell_orders_count").text(orders.length);
			asks = orders;
			$("#sell_orders_table tbody").empty();
			if(orders.length)
				priceone = orders[0].priceNQT/Math.pow(10, 8-decimals);
			$("#buy_order_price").val(priceone);
			var total = 0;
			var amts = 0;
			for(var i=0;i<orders.length;i++)
			{
				var price = toDecimal(orders[i].priceNQT/Math.pow(10, 8-decimals), 8-decimals);
				var qnt = toDecimal(orders[i].quantityQNT/Math.pow(10, decimals), decimals);
				var nxtprice = toDecimal(Number(price)*Number(qnt), 8);
				total += Number(nxtprice);
				amts += Number(qnt);

				if(orders[i].highlit)
				{
					var row = "<tr class='sell_order warning' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";
				}
				else if(orders[i].unconf)
				{
					var row = "<tr class='sell_order unconf' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";
				}
				else if(orders[i].cancel)
				{
					var row = "<tr class='sell_order danger' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";

				}
				else if(orders[i].accountRS == rs)
				{
					var row = "<tr class='sell_order info' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";
				}
				else if(orders[i].accountRS == jay.assetData.accountRS)
				{
					var row = "<tr class='sell_order success' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";
				}
				else
				{
					var row = "<tr class='sell_order' data-price='"+price+"' data-total='"+toDecimal(total,8)+"' data-amount='"+toDecimal(amts,decimals)+"'>";
				}
				
				row += "<td><div class='dropdown'><button class='btn btn-xs btn-default dropdown-toggle' type='button' id='selldrop"+i+"' data-toggle='dropdown' aria-expanded='true'><span class='caret'></span></button>";
				row +=  "<ul class='dropdown-menu' role='menu' aria-labelledby='selldrop"+i+"'>";
				if(orders[i].accountRS == rs)
				{
					row += "<li role='presentation'><a data-toggle='modal' data-target='#modal_cancel' role='menuitem' tabindex='-1' href='#'>Cancel Sell Order</a></li>";
					row += "<li role='presentation' class='divider'></li>";

				}
				row += "<li role='presentation' class='dropdown-header'>"+orders[i].accountRS+"</li>";
				row += "<li role='presentation'><a role='menuitem' tabindex='-1' href='#'>Copy Address To Clipboard</a></li>";
				row += "<li role='presentation'><a role='menuitem' tabindex='-1' href='http://www.nxtreporting.com/?ac="+orders[i].accountRS+"' target='_blank'>Open Account in NxtReporting</a></li>";
				row += "<li role='presentation' class='divider'></li>";

				
				if(highlight == "none" || (highlight == "single" && orders[i].highlit == undefined))
				{
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='hsingle' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='ask' href=''>Highlight This Order</a></li>";
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='hmulti' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='ask' href=''>Highlight All From This Address</a></li>";

				}
				else if(highlight == "single" && orders[i].highlit)
				{
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='highlit' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='ask' href=''>Remove Highlighting</a></li>";
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='hmulti' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='ask' href=''>Highlight All From This Address</a></li>";
				}
				else if(highlight == "account" && hacc != orders[i].accountRS)
				{
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='hmulti' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='ask' href=''>Highlight All From This Address</a></li>";
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='multilit' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='ask' href=''>Clear All Highlighting</a></li>";	
				}
				else if(highlight == "account")
				{
					row += "<li role='presentation'><a role='menuitem' tabindex='-1' id='multilit' data-rs='"+orders[i].accountRS+"' data-id='"+i+"' data-type='ask' href=''>Clear All Highlighting</a></li>";	
				}

				row += "<td>" + price + "</td>";
				row += "<td>" + qnt + "</td>";
				row += "<td>" + nxtprice + "</td>";
				row += "<td>" + toDecimal(total, 8) + "</td>";
				row += "</tr>";
				$("#sell_orders_table tbody").append(row);
			}
			$("#sell_orders_depth").text(toDecimal(total, 8));

			$('[data-toggle="tooltip"]').tooltip();

			$(".sell_order").click(function() {
				$("#buy_order_price").val($(this).data("price"));
				$("#buy_order_amount").val($(this).data("amount"));
				$("#buy_order_total").val($(this).data("total"));
				makeBuy();
		});
		highlighting();
		makeBuy();
	}

function highlighting()
{

			$("a#hsingle").off("click").click(function(e) {
				e.preventDefault();
				highlight = "single";
				litnum++;
				
				if($(this).data("type") == "bid")
				{
					jay.bidOrders[$(this).data("id")].highlit = true;
					bidOrders(jay.bidOrders);	
				}
				else
				{
					jay.askOrders[$(this).data("id")].highlit = true;
					askOrders(jay.askOrders);	
				}
				
			});

			$("a#highlit").off("click").click(function(e) {
				e.preventDefault();
				litnum--;
				if(litnum == 0) highlight = "none";

				if($(this).data("type") == "bid")
				{
					jay.bidOrders[$(this).data("id")].highlit = undefined;
					bidOrders(jay.bidOrders);	
				}
				else
				{
					jay.askOrders[$(this).data("id")].highlit = undefined;
					askOrders(jay.askOrders);	
				}
				
			});

			$("a#hmulti").off("click").click(function(e) {
				e.preventDefault();
				hacc = $(this).data("rs");
				litnum = 0;
				highlight = "account";

				for(var a=0;a<jay.bidOrders.length;a++)
				{
					if(jay.bidOrders[a].accountRS == hacc)
					{
						jay.bidOrders[a].highlit = true;
					}
					else jay.bidOrders[a].highlit = undefined;
				}
				for(var a=0;a<jay.askOrders.length;a++)
				{
					if(jay.askOrders[a].accountRS == hacc)
					{
						jay.askOrders[a].highlit = true;
						litnum++;
					}
					else jay.askOrders[a].highlit = undefined;
				}
				for(var a=0;a<jay.trades.length;a++)
				{
					if(jay.trades[a].sellerRS == hacc || jay.trades[a].buyerRS == hacc)
					{
						jay.trades[a].highlit = true;
						litnum++;
					}
					else jay.trades[a].highlit = false;
				}
				bidOrders(jay.bidOrders);
				askOrders(jay.askOrders);
				history(jay.trades);
				
			});

			$("a#multilit").off("click").click(function(e) {
				e.preventDefault();
				hacc = "";
				litnum = 0;
				highlight = "none";

				for(var a=0;a<jay.bidOrders.length;a++)
				{
					jay.bidOrders[a].highlit = undefined;
				}
				for(var a=0;a<jay.askOrders.length;a++)
				{
					jay.askOrders[a].highlit = undefined;
				}
				for(var a=0;a<jay.trades.length;a++)
				{
					jay.trades[a].highlit = false;
				}
				bidOrders(jay.bidOrders);
				askOrders(jay.askOrders);
				history(jay.trades);
				
			})
}


$("#sell_order_amount, #sell_order_price, #sell_order_total").on("input propertychange", makeSell);

function makeSell()
{
	var amt = Math.round(Number($("#sell_order_amount").val())*Math.pow(10, decimals));
	var price = Math.round(Number($("#sell_order_price").val())*Math.pow(10, 8-decimals));
	var order = Jay.placeAskOrder(getHashtag(), amt, price);
	$("#sell_order_trf").val(order);
	$("#sell_help_price").text(price + " NQT");
	$("#sell_help_amount").text(amt + " QNT");

}

$("#buy_order_amount, #buy_order_price, #buy_order_total").on("input propertychange", makeBuy);

function makeBuy()
{
	var amt = Math.round($("#buy_order_amount").val()*Math.pow(10, decimals));
	var price = Math.round($("#buy_order_price").val()*Math.pow(10, 8-decimals));
	var order = Jay.placeBidOrder(getHashtag(), amt, price);
	$("#buy_order_trf").val(order);
	$("#buy_help_price").text(price + " NQT");
	$("#buy_help_amount").text(amt + " QNT");
}

$("#buy_rs").click(function() {
	$("#buy_order_total").val(Number($("#buy_rs").text()) - 1);
	buyamt();
	makeBuy();
});


$("#sell_rs").click(function() {
	$("#sell_order_amount").val($("#sell_rs").text());
	sellRetotal();
	makeSell();
})

$("#buy_order_price").on("input propertychange", buyRetotal);
$("#buy_order_amount").on("input propertychange", buyRetotal);
$("#sell_order_price").on("input propertychange", sellRetotal);
$("#sell_order_amount").on("input propertychange", sellRetotal);
$("#buy_order_total").on("input propertychange", buyamt);
$("#sell_order_total").on("input propertychange", sellamt);

function buyRetotal()
{
	var total = toDecimal(Number($("#buy_order_amount").val()*$("#buy_order_price").val()), 8);
	$("#buy_order_total").val(total);
	makeBuy();
}

function sellRetotal()
{
	var total = toDecimal(Number($("#sell_order_amount").val()*$("#sell_order_price").val()), 8);
	$("#sell_order_total").val(total);
	makeSell();
}

function buyamt()
{
	var amt = toDecimal(Number($("#buy_order_total").val()/$("#buy_order_price").val()), decimals);
	$("#buy_order_amount").val(amt);
	makeBuy();
}

function sellamt()
{
	var amt = toDecimal(Number($("#sell_order_total").val()/$("#sell_order_price").val()), decimals);
	$("#sell_order_amount").val(amt);
	makeSell();
}


	if(window.innerWidth < 1500)
	{
		//$("h1").data("wide", "false");
		//resize();
		//adjust(jay);
	}

	$("#minimize").click(function() {
		$(".sidebar").toggle();
		if(window.width>=768 && $("#page-wrapper").css('margin-left')=='250px')
			$("#page-wrapper").css('margin-left', 0);
		else if(window.width>=768)
			$("#page-wrapper").css('margin-left', 250);
	});

	$(window).resize(function(){
		if(window.width<768){
			if($("#ae_panel_body").hasClass('pre-scrollable'))
				$("#ae_panel_body").removeClass('pre-scrollable');
			if(!$('#ae_page_panel').hasClass('pre-scrollable'))
				$('#ae_page_panel').addClass('pre-scrollable');
			if($("#page-wrapper").css('margin-left')=='250px')
				$("#page-wrapper").css('margin-left', 0);
		}
		if(window.width>=768){
			if($('.sidebar').css('display')=='none')
				$("#page-wrapper").css('margin-left', 0);
			else if($('.sidebar').css('display')=='block')
				$("#page-wrapper").css('margin-left', 250);
			if(!$("#ae_panel_body").hasClass('pre-scrollable'))
				$("#ae_panel_body").addClass('pre-scrollable');
			if($('#ae_page_panel').hasClass('pre-scrollable'))
				$('#ae_page_panel').removeClass('pre-scrollable');
		}
	});

	function resize()
	{
		$(".sidebar").toggle();
		if($("h1").data("wide") == "true")
		{
			$("h1").data("wide", "false");
			$(".page").attr("id","page-wrapper");
			$(".page").css("padding", "default");

		}
		else
		{
			$("h1").data("wide", "true");
			$(".page").attr("id", "page-notwrapper");
			$(".page").css("padding","20px").css("background-color", "white");

		}
	}


});