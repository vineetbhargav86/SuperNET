var selected_asset = 0;
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


var day = d3.time.format("%b %e");
var hour = d3.time.format("%H");
var minute = d3.time.format("%M");
var decimals;
var bids = [];
var asks = [];

$("document").ready(function() {
  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();
candlesticks();

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
			depth();
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
			depth();
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
			depth();
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
			depth();
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

		req("requestType=getTrades&asset="+asset+"&firstIndex="+indexing+"&lastIndex="+(indexing+9), function(data){
			var newtrades = JSON.parse(data);
			
			for(var i=0;i<newtrades.trades.length;i++){
			if(parseInt(newtrades.trades[i].timestamp) != parseInt(assets.trades[0].timestamp)){
				subtrades.push(newtrades.trades[i]);
			} else {
				cont = false;
				break;
			}
		}

		
		});
		
		indexing += 10;

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
	});



setTimeout(function(){
	$('.side_assets_item').click(function(){
	selected_asset = $(this).data("asset");
	$('.side_assets_item').removeClass('activeasset');
	var self = $(this);
	load_assets(getHashtag(), function(data) {
		jay = data;
		decimals = jay.assetData.decimals;

		topinfo(data);


		adjust(data);
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
		$(this).popover("hide");
	});

	}, function()
	{
		$("h1").html("Error: asset data timed out");
	});
	
});
}, 1000);



function topinfo(info)
{
	var twofour = Array();
	var time = getNxtTime();
	var tradec = 0;
	var vol = 0;
	var avg = 0;
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

	var bidask = info.askOrders[0].priceNQT/Math.pow(10,8-decimals)-info.bidOrders[0].priceNQT/Math.pow(10, 8-decimals);
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
{
			orders = ord;
			$("#buy_orders_count").text(orders.length);
			bids = orders;
			if(asks.length > 0) depth();
			var priceone = orders[0].priceNQT/Math.pow(10, 8-decimals);
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
	orders = ord;
			$("#sell_orders_count").text(orders.length);
			asks = orders;
			if(bids.length > 0) depth();
			$("#sell_orders_table tbody").empty();
			var priceone = orders[0].priceNQT/Math.pow(10, 8-decimals);
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
				depth();
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
				depth();
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
				depth();
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
				depth();
			})
}


$(document).on("mousemove", function(e)
{
		offsetX = $("#ex_chart").offset().left;
		offsetY = $("#ex_chart").offset().top;
		if(e.pageY-offsetY > 0 && e.pageY-offsetY < height && e.pageX-offsetX > 0 && e.pageX-offsetX < width)
		{
			var xval = Math.floor(e.pageX-offsetX)+0.5;
			var yval = Math.floor(e.pageY-offsetY)+0.5;
			$("#cursor_follow_x").attr("x1", 0).attr("x2", width).attr("y1", yval).attr("y2", yval).attr("stroke-width", 1);
			$("#cursor_follow_y").attr("y1", 0).attr("y2", height+50).attr("x1", xval).attr("x2", xval).attr("stroke-width", 1);

			var vol = (height-yval)/volscale;
			vol = Math.round(vol * Math.pow(10, -Math.floor(Math.log10(vol)-2)))/Math.pow(10, -Math.floor(Math.log10(vol)-2));

			$("#cursor_follow_vol").attr("y", yval-2).attr("x", 10).text(vol);
			var pc = (height-yval)/scale+localmin;
			pc = Math.round(pc * Math.pow(10, -Math.floor(Math.log10(pc)-2)))/Math.pow(10, -Math.floor(Math.log10(pc)-2));

			$("#cursor_follow_price").attr("y", yval-2).attr("x", width-xscales+10).text(pc);

			var volrect = d3.select("#cursor_follow_vol").node().getBBox();
			d3.select("#backbox_vol").attr("x", volrect.x).attr("y", volrect.y)
			.attr("width", volrect.width).attr("height", volrect.height)
			.attr("fill", "white");
			var volrect = d3.select("#cursor_follow_price").node().getBBox();
			d3.select("#backbox_price").attr("x", volrect.x).attr("y", volrect.y)
			.attr("width", volrect.width).attr("height", volrect.height)
			.attr("fill", "white")
		}
		else
		{
			$("#cursor_follow_x").attr("stroke-width", 0);
			$("#cursor_follow_y").attr("stroke-width", 0);
			$("#cursor_follow_vol").text("");
			$("#cursor_follow_price").text(""); 
			$("#backbox_vol").attr("width", 0);
			$("#backbox_price").attr("width", 0);
		}

		if(isDragging)
		{
			var xval = Math.round(e.pageX-offsetX);
			var yval = Math.round(e.pageY-offsetY);

			var timespan =  $("input[name=time_span]:checked").val();
			if(timespan == 0) timespan = getNxtTime() - first;
			var chwidth = timespan/(getNxtTime()-first)*width;
			var newpos = xval-draggingPos;
			if(newpos < 0) newpos = 0;
			if(newpos+chwidth > width) newpos = width-chwidth;
			d3.select("#scroll").attr("x", newpos);
			scrollpos = newpos+chwidth;
			draw();
		}

		depthoffsetX = $("#depth").offset().left;
		depthoffsetY = $("#depth").offset().top;
		if(e.pageY-depthoffsetY > 0 && e.pageY-depthoffsetY < (depthheight-20) && e.pageX-depthoffsetX > 0 && e.pageX-depthoffsetX < depthwidth)
		{
			var xval = e.pageX-depthoffsetX;
			var xprc = ((pricestep*(xval-100))+pricemin)*Math.pow(10, 8-decimals);
			var xreal = 0;
			var yreal = 0;
			var zreal = 0;
			var cntr = 0;
			var ctr = 0;
			var side = "";
			if(xprc < bids[0].priceNQT)	
			{
				side = "bid";
				for(var i=0;i<bids.length;i++)
				{
					cntr += bids[i].priceNQT/Math.pow(10, 8-decimals)*bids[i].quantityQNT/Math.pow(10, decimals);
					ctr += bids[i].quantityQNT/Math.pow(10, decimals);
					if(xprc > bids[i].priceNQT)
					{
						if(xprc-bids[i].priceNQT < bids[i-1].priceNQT-xprc) 
						{
							xreal = bids[i].priceNQT/Math.pow(10, 8-decimals);
							yreal = cntr;
							zreal = ctr;
						}
						else 
						{
							xreal = bids[i-1].priceNQT/Math.pow(10, 8-decimals);
							yreal = cntr - bids[i].priceNQT/Math.pow(10, 8-decimals)*bids[i].quantityQNT/Math.pow(10, decimals);
							zreal = ctr - bids[i].quantityQNT/Math.pow(10, decimals);;
						}
						break;
					}
				}
			}
			else if(xprc > asks[0].priceNQT)
			{
				side = "ask";
				for(var i=0;i<asks.length;i++)
				{
					cntr += asks[i].priceNQT/Math.pow(10, 8-decimals)*asks[i].quantityQNT/Math.pow(10, decimals);
					ctr += asks[i].quantityQNT/Math.pow(10, decimals);

					if(xprc < asks[i].priceNQT)
					{
						if(xprc-asks[i].priceNQT > asks[i-1].priceNQT-xprc)
						{
							xreal = asks[i].priceNQT/Math.pow(10, 8-decimals);
							yreal = cntr;
							zreal = ctr;
						}
						else 
						{
							xreal = asks[i-1].priceNQT/Math.pow(10, 8-decimals);
							yreal = cntr - asks[i].priceNQT/Math.pow(10, 8-decimals)*asks[i].quantityQNT/Math.pow(10, decimals);
							zreal = ctr - asks[i].quantityQNT/Math.pow(10, decimals);;
						}
						break;
					}
				}
			}

			if(xreal == 0)
			{
				d3.select("#depth_circle").attr("cx", -1000);
				d3.select("#depth_bar").attr("y1" -100).attr("y2", -100);
				$("#depth_hover").hide();
			}
			else
			{
				var xval = Math.floor(((xreal-pricemin)/pricestep)+100)+0.5;
				var yval = Math.floor((depthheight-20) - yreal/depthstep)+0.5;
				d3.select("#depth_circle").attr("cy", yval).attr("cx", xval);
				d3.select("#depth_bar").attr("x1", xval).attr("x2", xval)
				.attr("y1", 0).attr("y2", depthheight);

				$("#depth_hover").show();
				if(side == "bid")
				{
					$("#depth_hover").css("top", yval+depthoffsetY-100);
					$("#depth_hover").css("left", xval+depthoffsetX+4);
				}
				else
				{
					$("#depth_hover").css("top", yval+depthoffsetY-100);
					$("#depth_hover").css("left", xval+depthoffsetX-4-$("#depth_hover").width());
				}
				$("#hover_price").text(xreal);
				$("#hover_nxt").text(toDecimal(yreal, 8-decimals));
				$("#hover_asset").text(toDecimal(zreal, decimals));

			}
		}
		else 
		{
			d3.select("#depth_circle").attr("cx", -1000);
			d3.select("#depth_bar").attr("y1" -100).attr("y2", -100);
			$("#depth_hover").hide();

		}
	});
var isDragging = false;
var draggingPos = 0;

$("#ex_chart").mousedown(function(e) {
	offsetX = $("#ex_chart").offset().left;
	offsetY = $("#ex_chart").offset().top;
	var xval = Math.round(e.pageX-offsetX);
	var yval = Math.round(e.pageY-offsetY);
	if(yval > 650 && yval < 750 && xval > 0 && xval < width)
	{
		var timespan =  $("input[name=time_span]:checked").val();
		if(timespan == 0) timespan = getNxtTime() - first;
		var chwidth = timespan/(getNxtTime()-first)*width;
		if(xval < scrollpos && xval > scrollpos-chwidth && getNxtTime()-first > timespan)
		{
			isDragging = true;
			draggingPos = xval-scrollpos+chwidth;
		}
	}

})

$(document).mouseup(function(e) {
	isDragging = false;
})

$("input[name=time_width]").change(function() {
	if(jay != undefined) adjust(jay);
});

$("input[name=time_span]").change(function() {
	candlesticks();
	if(jay != undefined) adjust(jay);
})

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

var depthlen = 50;
var depthheight = 400;
var depthwidth = $("h1").data("wide") == "true" ? window.innerWidth - 60 : window.innerWidth - 250-80;
var depthoffsetX = $("#depth").offset().left;
var depthoffsetY = $("#depth").offset().top;
var pricestep = 0;
var pricemin = 1000000000000;
var depthstep = 0;
function depth()
{
	depthwidth = $("h1").data("wide") == "true" ? window.innerWidth - 60 : window.innerWidth - 250-80;
	d3.select("#outline").append("rect").attr("x1", 0).attr("x2", depthwidth).attr("y1", 0).attr("y2", depthheight).attr("stroke-width", 1).attr("stroke","black");
	$("#depth").attr("width",depthwidth);
	$("#depth").attr("height", depthheight);
	d3.select("#pricenxt").attr("x", depthwidth-80).attr("y", depthheight-6)


	$("#xaxis").empty();
	$("#yaxis").empty();
	var bidside = [];
	var bidprice = [];
	var total = 0;
	var depthmax=0,pricemax=0;
	var counter = 0;
	var deficit = 0;
	for(var i=0;i<bids.length;i++)
	{
		var price = bids[i].priceNQT/Math.pow(10, 8-decimals);
		total += price*bids[i].quantityQNT/Math.pow(10, decimals);
		bidside.push(total);
		bidprice.push(price);
		if(depthmax < total) depthmax = total;	
		if(pricemin > price) pricemin = price;
		if(pricemax < price) pricemax = price;

		deficit = bidprice[0] - price;
		if(++counter == depthlen) break;
	}
	var askside = [];
	var askprice = [];
	total = 0;
	counter = 0;
	for(var i=0;i<asks.length;i++)
	{

		var price = asks[i].priceNQT/Math.pow(10, 8-decimals);
		total += price*asks[i].quantityQNT/Math.pow(10, decimals);
		if(++counter == depthlen || price > askprice[0]+deficit) break;

		askside.push(total);
		askprice.push(price);
		if(depthmax < total) depthmax = total;
		if(pricemin > price) pricemin = price;
		if(pricemax < price) pricemax = price;
	}
	depthstep = depthmax/(depthheight-20)/0.95;
	pricestep = (pricemax-pricemin)/(depthwidth-100);

	var depths = 5;
	var prices = 10;
	for(var i=0;i<depths;i++)
	{
		var yamt = (depthheight-20) - ((depthheight-20)/depths)*i;
		setDepth(i, yamt, Math.round(depthstep*((depthheight-20)-yamt)));
	}
	for(var i=0;i<prices;i++)
	{
		var xamt = ((depthwidth-100)/prices)*i;
		var pc = (xamt*pricestep)+pricemin;
		if(pc != 0) pc = Math.round(pc * Math.pow(10, -Math.floor(Math.log10(pc)-2)))/Math.pow(10, -Math.floor(Math.log10(pc)-2));
		else pc = "0.00";
		setPrice(i, 100+xamt, pc);
	}
	$("#depthdots").empty();
	$("#depthlines").empty();
	var m = "M"+ (100+(bidprice[0]-pricemin)/pricestep) +" "+(depthheight-20)+" ";

	for(var i=0;i<bidprice.length;i++)
	{
		// change mapping
		m += "L"+(100+(bidprice[i]-pricemin)/pricestep)+" "+((depthheight-20)-bidside[i]/depthstep)+" ";
		if(bids[i].highlit)
		{
			d3.select("#depthdots").append("circle").attr("fill", "yellow").attr("cx", (100+(bidprice[i]-pricemin)/pricestep)).attr("cy", (depthheight-20-bidside[i]/depthstep)).attr("r",4).attr("stroke", "black").attr("stroke-width", 1);
		}
		else if(bids[i].unconf)
		{
			d3.select("#depthdots").append("circle").attr("fill", "gray").attr("cx", (100+(bidprice[i]-pricemin)/pricestep)).attr("cy", (depthheight-20-bidside[i]/depthstep)).attr("r",4).attr("stroke", "black").attr("stroke-width", 1);
		}
		else if(bids[i].cancel)
		{
			d3.select("#depthdots").append("circle").attr("fill", "red").attr("cx", (100+(bidprice[i]-pricemin)/pricestep)).attr("cy", (depthheight-20-bidside[i]/depthstep)).attr("r",4).attr("stroke", "black").attr("stroke-width", 1);
		}
		else if(bids[i].accountRS == rs)
		{
			d3.select("#depthdots").append("circle").attr("fill", "blue").attr("cx", (100+(bidprice[i]-pricemin)/pricestep)).attr("cy", (depthheight-20-bidside[i]/depthstep)).attr("r",4).attr("stroke", "black").attr("stroke-width", 1);
		}
		else if(bids[i].accountRS == jay.assetData.accountRS)
		{
			d3.select("#depthdots").append("circle").attr("fill", "green").attr("cx", (100+(bidprice[i]-pricemin)/pricestep)).attr("cy", (depthheight-20-bidside[i]/depthstep)).attr("r",4).attr("stroke", "black").attr("stroke-width", 1);
		}
	}
	m += "L100 "+(depthheight-20);
	d3.select("#depthlines").append("path").attr("id", "bids").attr("stroke", "green").attr("fill", "#98FB98").attr("stroke-width", 2).attr("d", m);

	var m = "M"+ (100+(askprice[0]-pricemin)/pricestep) +" "+(depthheight-20)+" ";

	for(var i=0;i<askprice.length;i++)
	{
		// change mapping
		m += "L"+(100+(askprice[i]-pricemin)/pricestep)+" "+((depthheight-20)-askside[i]/depthstep)+" ";
		if(asks[i].highlit)
		{
			d3.select("#depthdots").append("circle").attr("fill", "yellow").attr("cx", (100+(askprice[i]-pricemin)/pricestep)).attr("cy", (depthheight-20-askside[i]/depthstep)).attr("r",4).attr("stroke", "black").attr("stroke-width", 1);
		}
		else if(asks[i].unconf)
		{
			d3.select("#depthdots").append("circle").attr("fill", "gray").attr("cx", (100+(askprice[i]-pricemin)/pricestep)).attr("cy", (depthheight-20-askside[i]/depthstep)).attr("r",4).attr("stroke", "black").attr("stroke-width", 1);
		}
		else if(asks[i].cancel)
		{
			d3.select("#depthdots").append("circle").attr("fill", "red").attr("cx", (100+(askprice[i]-pricemin)/pricestep)).attr("cy", (depthheight-20-askside[i]/depthstep)).attr("r",4).attr("stroke", "black").attr("stroke-width", 1);

		}
		else if(asks[i].accountRS == rs)
		{
			d3.select("#depthdots").append("circle").attr("fill", "blue").attr("cx", (100+(askprice[i]-pricemin)/pricestep)).attr("cy", (depthheight-20-askside[i]/depthstep)).attr("r",4).attr("stroke", "black").attr("stroke-width", 1);
		}
		else if(asks[i].accountRS == jay.assetData.accountRS)
		{
			d3.select("#depthdots").append("circle").attr("fill", "green").attr("cx", (100+(askprice[i]-pricemin)/pricestep)).attr("cy", (depthheight-20-askside[i]/depthstep)).attr("r",4).attr("stroke", "black").attr("stroke-width", 1);
		}
	}
	m += "L"+depthwidth+" "+(depthheight-20)
	d3.select("#depthlines").append("path").attr("id", "asks").attr("stroke", "red").attr("fill", "#FFCCCB").attr("stroke-width", 2).attr("d", m);


}

	var offsetX = $("#ex_chart").offset().left;
	var offsetY = $("#ex_chart").offset().top;
	var width = $("h1").data("wide") == "true" ? window.innerWidth - 60 : window.innerWidth - 250-80;
	var xscales = 100;
	var height = 600;
	var volumes = [];
	var localmin;
	var amounts = [];
	var scale = 0;
	var volscale = 0;
	var first = 0;
	var scrollpos = 1200;

// 42628958


function adjust(asset)
{
	width = $("h1").data("wide") == "true" ? window.innerWidth - 60 : window.innerWidth - 250-80;
	$("#ex_chart").attr("width", width);
	$("#divider2").attr("x2", width);
	$("#pricenxtb").attr("x", width-90)

	first = asset.trades[asset.trades.length-1].timestamp;
	var now = getNxtTime();
	var timespread = now - first;
	var timescale = timespread/width;
	var starttime = first;
	var endtime = now;
	var span = endtime-starttime;
	var timespan = $("input[name=time_span]:checked").val();
	if(timespan == 0) timespan = now - first;
	scrollpos = width;


	var candlesticks = $("input[name=time_width]:checked").val();
	var sticknum = Math.round(span/candlesticks);
	var xstep = (width)/sticknum;

	var show = (timespan/timespread)*(width);

	//var starttime = 42827311-(60*60*20);

	$("#bottom_scroll").empty();
	d3.select("#bottom_scroll").append("rect").attr("id","scroll")
	.attr("x", width-show).attr("width", show)
	.attr("y", 650).attr("height", 100).attr("fill", "lightgray");

	d3.select("#bottom_scroll").append("line").attr("id", "centerline")
	.attr("x1", 0).attr("x2", width)
	.attr("y1", 700.5).attr("y2", 700.5)
	.attr("stroke", "black");

	var divtime = (endtime-starttime)/(sticknum);
	var phases = [];
	for(var e=0;e<asset.trades.length;e++)
	{
		var trade = asset.trades[e];
		var phase = Math.floor((asset.trades[e].timestamp - starttime)/divtime);
		if(phases[phase] == undefined) phases[phase] = [];
		phases[phase].push(trade);
	}
	var prev = 0;
	vals = [];
	vols = [];
	var chwidth = (width)/sticknum;
	var minchange=1000000000,maxchange=0;
	var minavg=100000000,maxavg=0;
	var changes = [];
	var averages = [];
	var prevavg = 0;
	for(var i=0;i<sticknum;i++)
	{
		if(phases[i] == undefined) phases[i] = [];
		vals[i] = Array();
		vols[i] = 0;
		averages[i] = 0;
		if(phases[i].length == 0)
		{
			vals[i].push(prev);
			averages[i] += prev;
		}
		else
		{	
			for(var j=0;j<phases[i].length;j++)
			{
				var price = phases[i][j].priceNQT/Math.pow(10, 8-decimals);
				vols[i] += (phases[i][j].quantityQNT/Math.pow(10, decimals))*(phases[i][j].priceNQT/Math.pow(10, 8-decimals));
				vals[i].push(price);
				averages[i] += price;
				prev = price;
			}
		}
		if(phases[i].length > 0) averages[i] /= phases[i].length;
		if(averages[i] < minavg) minavg = averages[i];
		if(averages[i] > maxavg) maxavg = averages[i];
		var change = prevavg == 0 ? 0 : prevavg-averages[i];
		prevavg = averages[i];
		if(change < minchange) minchange = change;
		if(change > maxchange) maxchange = change;
		changes.push(change);
	}
	var chscale = maxchange > -minchange ? 50/maxchange : 50/-minchange;
	chscale *= 0.95;
	var fst = Math.round(653 + (94-(averages[0]-minavg)/(maxavg-minavg)*94));
	var m = "M0 "+fst+" L"+Math.round(chwidth/2)+" "+fst + " ";

	for(var i=0;i<sticknum;i++)
	{
		// change mapping
		setChange(i, chwidth*i-(chwidth/2), (chwidth/4)*3, chscale*changes[i]);
		var b = (averages[i]-minavg)/(maxavg-minavg)*94;
		m += "L"+Math.round(chwidth*i+(chwidth/2))+" "+Math.round(653 + (94-(b)))+" ";
	}
		d3.select("#bottom_scroll").append("path").attr("id", "bottom_path").attr("stroke", "black").attr("fill", "none").attr("stroke-width", 2);

	d3.select("#bottom_path").attr("d", m);

	amounts = vals;
	volumes = vols;
	draw();
}

	function draw()
	{
		var now = getNxtTime();
		var timespread = now - first;
		var timescale = timespread/width;
		var end = scrollpos*timescale;
		var span = $("input[name=time_span]:checked").val();
		if(span == 0) span = now-first;
		var start = span != 0 ? end-span : first;
		var candlesticks = $("input[name=time_width]:checked").val();
		var sticknum = Math.round(span/candlesticks);
		var xstep = (width-200)/sticknum;

		var sp = Math.round(amounts.length * (scrollpos/width));
		if(sticknum > amounts.length)
		{
			var vals = amounts.reverse();
			while(sticknum > vals.length) vals.push([0]);
			var vols = volumes.reverse();
			while(sticknum > vols.length) vols.push(0);
		}
		else
		{
			var vals = amounts.slice(sp-sticknum, sp).reverse();
			var vols = volumes.slice(sp-sticknum, sp).reverse();
		}

		localmin=1000000000;
		var localmax=0;
		var volmax=0;
		for(var i=0;i<sticknum;i++)
		{
			var n = vals[i].length;
			for(var j=0;j<n;j++)
			{
				if(vals[i][j] > localmax) localmax = vals[i][j];
				if(vals[i][j] < localmin) localmin = vals[i][j];
			}
			if(vols[i] > volmax) volmax = vols[i];
		}
		localmin /= 1.02;
		localmax /= 0.98;
		var spread = localmax - localmin;
		scale = height/spread;
		volscale = height/volmax;
		volscale /= 1.1;

		$("#boxes").empty();
		$("#volbars").empty();
		$("#axis").empty();
		var prev = 0;
		for(var i=0;i<vals.length;i++)
		{
			vals[i] = vals[i].sort(numberSort);
			var info = {};
			info.head = vals[i][vals[i].length-1];
			info.tail = vals[i][0];
			info.midline = vals[i][Math.floor(vals[i].length/2)];
			info.bottom = vals[i][Math.floor(vals[i].length/4)];
			info.top = vals[i][Math.floor((vals[i].length/4)*3)];
			if(prev > info.midline) setColor("bw_"+(i-1), true);
			else info.direction = setColor("bw_"+(i-1), false);
			prev = info.midline;


			var mdl = Math.round(chartConvert(info.midline, scale, localmin, height));
			var btm = Math.round(chartConvert(info.bottom, scale, localmin, height)-mdl);
			var tl = Math.round(chartConvert(info.tail, scale, localmin, height)-btm-mdl);
			var tp = Math.round(mdl-chartConvert(info.top, scale, localmin, height));
			var hd = Math.round(mdl-tp-chartConvert(info.head, scale, localmin, height));
			var xamt = (width-200)-(i*xstep)+xscales;
			if((width-200)%xstep == 0) xamt -= (xstep/2);
			else xamt -= (xstep/2);
			xamt = Math.round(xamt);

			box("bw_"+i, info.direction, xamt, mdl, Math.round(xstep/2), btm, tl, tp, hd);
			volbar("vb_"+i, xamt, Math.round((xstep/4)*3), volscale*vols[i])
		}
		setColor("bw_"+(vals.length-1), true);

		var axisnum = 10;
		for(var i=0;i<axisnum;i++)
		{
			var pc = (height/axisnum)*i/scale+localmin;
			if(pc != 0) pc = Math.round(pc * Math.pow(10, -Math.floor(Math.log10(pc)-2)))/Math.pow(10, -Math.floor(Math.log10(pc)-2));
			var vol = (height/axisnum)*i/volscale;
			if(vol != 0) vol = Math.round(vol * Math.pow(10, -Math.floor(Math.log10(vol)-2)))/Math.pow(10, -Math.floor(Math.log10(vol)-2));
			setAxis(i, height - (height/axisnum)*i, pc, vol);
		}

		var datesnum = 8;
		var datestep = Math.round(span/datesnum);
		var scrollamt = (scrollpos-$("#scroll").attr("width"))/width;
		var scrollwd = $("#scroll").attr("width")/width;
		for(var i=0;i<datesnum+1;i++)
		{
			setDateAxis(i, first+((span/datesnum)*i)+((now-first)*scrollamt), ((datestep*i)/(span))*((width-200))+xscales)
		}		
	}

	function chartConvert(value, scale, cutoff, topvalue)
	{
		return topvalue - (value-cutoff)*scale;
	}
	function box(id, direction, xpos, ypos, width, bottom, tail, top, head)
	{
		d3.select("#boxes").append("g").attr("id", id);
		d3.select("#"+id).append("rect").attr("id", "body")
		.attr("x", xpos-Math.round(width/2))
		.attr("width", width)
		.attr("y", ypos-top)
		.attr("height",bottom+top)
		d3.select("#"+id).append("line").attr("id", "midline")
		.attr("x1", xpos-Math.round(width/2))
		.attr("x2", xpos+Math.round(width/2))
		.attr("y1", ypos)
		.attr("y2",ypos)
		d3.select("#"+id).append("line").attr("id", "bottom")
		.attr("x1", xpos)
		.attr("x2", xpos)
		.attr("y1", ypos+bottom)
		.attr("y2",ypos+bottom+tail).attr("stroke-width", Math.floor(width/3)+0.5);
		d3.select("#"+id).append("line").attr("id", "top")
		.attr("x1", xpos)
		.attr("x2", xpos)
		.attr("y1", ypos-top)
		.attr("y2",ypos-head-top).attr("stroke-width", Math.round(width/3)+0.5);
	}

	function setColor(id, color)
	{
		if(color == true)
		{
			d3.select("#"+id+" #body").attr("fill","green").attr("stroke","black").attr("stroke-width","2");
			d3.select("#"+id+" #midline").attr("stroke","black").attr("stroke-width", "2");
			d3.select("#"+id+" #top").attr("stroke","black");
			d3.select("#"+id+" #bottom").attr("stroke","black");

		}
		else
		{
			d3.select("#"+id+" #body").attr("fill","red").attr("stroke","black").attr("stroke-width","2");
			d3.select("#"+id+" #midline").attr("stroke","black").attr("stroke-width", "2");
			d3.select("#"+id+" #top").attr("stroke","black");
			d3.select("#"+id+" #bottom").attr("stroke","black");
		}
	}

	function volbar(id, volx, wd, ht)
	{
		d3.select("#volbars").append("rect").attr("id",id).attr("fill", "gray")
		.attr("x", volx-Math.round(wd/2))
		.attr("width", wd)
		.attr("y", height-ht)
		.attr("height", ht);
	}

	function setAxis(id, axisy, priceText, volumeText)
	{
		d3.select("#axis").append("line").attr("id", "line_"+id)
		.attr("x1", 0).attr("x2", width)
		.attr("y1", Math.floor(axisy)+0.5).attr("y2", Math.floor(axisy)+0.5)
		.attr("stroke", "black").attr("stroke-width", "0.1");
		d3.select("#axis").append("text").attr("id", "vol_"+id)
		.attr("x", 10).attr("y", axisy-2).text(volumeText);
		d3.select("#axis").append("text").attr("id", "price_"+id)
		.attr("x", width-xscales+10).attr("y", axisy-2).text(priceText);
	}

	function setDepth(id, axisy, desc)
	{
		d3.select("#xaxis").append("line").attr("id", "line_"+id)
		.attr("x1", 0).attr("x2", depthwidth)
		.attr("y1", Math.floor(axisy)+0.5).attr("y2", Math.floor(axisy)+0.5)
		.attr("stroke", "black").attr("stroke-width", "0.1");
		d3.select("#xaxis").append("text").attr("id", "text_"+id)
		.attr("x", 10).attr("y", axisy-2).text(desc);
	}

	function setPrice(id, axisx, desc)
	{
		d3.select("#yaxis").append("text").attr("id","text_"+id)
		.attr("x", axisx-20).attr("y", depthheight-6).text(desc);
	
		d3.select("#yaxis").append("line").attr("id", "line_"+id)
		.attr("x1", Math.floor(axisx)+0.5).attr("x2", Math.floor(axisx)+0.5)
		.attr("y1", 0).attr("y2", depthheight-20)
		.attr("stroke", "black").attr("stroke-width", "0.1");
	}

	function setDateAxis(id, date, xpos)
	{

		var time = new Date((date + 1385294400)*1000);
		var h = hour(time);
		var min = Math.round(minute(time)/10)*10;
		if(min == 60) 
		{
			min = "00";
			h++;
		}
		if(min == 0) min = "00";
		hour(time) + ":" + min;

		d3.select("#axis").append("text").attr("id","date_"+id)
		.attr("x", xpos-20).attr("y", 620)
		d3.select("#date_"+id).append("tspan").text(day(time));
		d3.select("#date_"+id).append("tspan").attr("x", xpos-20).attr("dy", 20).text(h+":"+min);
	
		d3.select("#axis").append("line").attr("id", "dl_"+id)
		.attr("x1", Math.floor(xpos)+0.5).attr("x2", Math.floor(xpos)+0.5)
		.attr("y1", 0).attr("y2", 600)
		.attr("stroke", "black").attr("stroke-width", "0.1");
	}

	function setChange(id, posx, width, amount)
	{
		if(amount > 0)
		{
			d3.select("#bottom_scroll").append("rect").attr("id", id)
			.attr("x", Math.floor(posx + (width/2))+0.5).attr("width", width)
			.attr("y", 700.5).attr("height", Math.round(amount))
			.attr("fill", "red").attr("stroke", "black");
		}
		else
		{
			d3.select("#bottom_scroll").append("rect").attr("id", "ch_"+id)
			.attr("x", Math.floor(posx + (width/2))+0.5).attr("width", Math.round(width))
			.attr("y", 700.5-Math.round(-amount)).attr("height", Math.round(-amount))
			.attr("fill", "green").attr("stroke", "black");
		}
	}

	function candlesticks()
	{
		var span = $("input[name=time_span]:checked").val();
		if(span == 0) span = getNxtTime() - first;
		var phase = 0;
		var at;
		var before;
		var after;
		var prev;
		$("input[name=time_width]").each(function() {
			if(span/$(this).val() <= 128 && span/$(this).val() >= 4)
			{
				$(this).parent().show();
				if(phase == 0) 
				{
					before = this;
					phase = 1;
				}
			}
			else
			{
				if(phase == 1) 
				{
					phase = 2;
					after = prev;
				}
				$(this).parent().hide();
			}
			if($(this).prop("checked"))
			{
				at = this;
			}
			prev = this;
		})
		if(parseInt($(at).val()) < parseInt($(before).val()))
		{
			$(at).removeAttr("checked");
			$(at).parent().removeClass("active");
			$(before).prop("checked", true);
			$(before).parent().addClass("active");
		}
		else if(parseInt($(at).val()) > parseInt($(after).val()))
		{
			$(at).removeAttr("checked");
			$(at).parent().removeClass("active");
			$(after).prop("checked", true);
			$(after).parent().addClass("active");
		}
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
			if($("#side-menu").hasClass('pre-scrollable'))
				$("#side-menu").removeClass('pre-scrollable');
			if($("#page-wrapper").hasClass('pre-scrollable'))
				$('#page-wrapper').removeClass('pre-scrollable');
			if(!$('#iguana_page_panel').hasClass('pre-scrollable'))
				$('#iguana_page_panel').addClass('pre-scrollable');
			if($("#page-wrapper").css('margin-left')=='250px')
				$("#page-wrapper").css('margin-left', 0);
		}
		if(window.width>=768){
			if($('.sidebar').css('display')=='none')
				$("#page-wrapper").css('margin-left', 0);
			else if($('.sidebar').css('display')=='block')
				$("#page-wrapper").css('margin-left', 250);
			if(!$("#side-menu").hasClass('pre-scrollable'))
				$("#side-menu").addClass('pre-scrollable');
			if(!$("#page-wrapper").hasClass('pre-scrollable'))
				$('#page-wrapper').addClass('pre-scrollable');
			if($('#iguana_page_panel').hasClass('pre-scrollable'))
				$('#iguana_page_panel').removeClass('pre-scrollable');
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
			depth();
			adjust(jay);
		}
		else
		{
			$("h1").data("wide", "true");
			$(".page").attr("id", "page-notwrapper");
			$(".page").css("padding","20px").css("background-color", "white");
			depth();
			adjust(jay);
		}
	}

	$(window).bind("resize", function() {
		/*if(window.innerWidth < 1500)
		{
			$("h1").data("wide", "false");
			resize();
		}*/
		depth();
		adjust(jay);
	});
		
});