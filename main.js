var TwitchClient = require("./node_modules/node-twitchtv/node-twitchtv.js");
var account = {client_id: "mp5uhm6sf97srjeilrb40zuv4amrwy2", oauth_token: "efdsr401e938mi4n4vhaivqzuk3jtsh"};
var client = new TwitchClient(account);

var D3ItemClient = require("./node_modules/D3ItemStream/main.js");
var config = {filter: 3};
var d3items = new D3ItemClient(config);

var ircClient = require('./node_modules/irc/client.js');
var irc = new ircClient();

var me = "MaiND3";
var reactToStreamStatus = true;

//don't modify
var sendItems = !reactToStreamStatus;

//check this once on init
if (reactToStreamStatus) {
	client.streamIsLive(me, function(err,res) {
		if (!sendItems && (!err && res)) {
			console.log("Stream is online, activating");
			setTimeout(checkStream,30000);
		}
		if (err || !res) {
			console.log("Stream is offline, halting item bot");
			setTimeout(checkStream,5000);
		}
		sendItems = !err && res;
	});
}

//when a new item appears, say it in chat
d3items.events.on("item", function(item) {
	if (sendItems) {
		irc.Say(getPrettyStats(item));
	}
});

function getPrettyStats(obj) {
	var updmg = obj.updmg;
	var upheal = obj.upheal;
	var uptough = obj.uptough;
	var offstats = obj.offstats;
	var defstats = obj.defstats;

	delete obj.armortot;
	delete obj.reqlevel;
	delete obj.updmg;
	delete obj.upheal;
	delete obj.uptough;
	delete obj.offstats;
	delete obj.defstats;
	delete obj.weapas;

	pretty = "Got";
	pretty += parseInt(obj.ancient) ? " Ancient " : " ";
	pretty += obj.name + " - ";
	
	delete obj.ancient;

	if (obj.str) pretty += obj.str+" STR, ";
	if (obj.dex) pretty += obj.dex+" DEX, ";
	if (obj.int) pretty += obj.int+" INT, ";

	var cnt = 0;
	for (var stat in obj) {
		if (cnt++ > 20 && obj[stat] != "None" && obj[stat] != "0" && stat != "int" && stat != "dex" && stat != "str") {
			obj[stat] = parseInt(obj[stat]);
			if (stat.indexOf('%') > -1) {
				var temp = stat;
				var temp1 = obj[stat];
				delete obj[stat];
				stat = temp.replace("%","");
				obj[stat] = "+"+String(temp1) + "%";
			}
			switch(stat) {
				case "dps":
					pretty += obj[stat]+stat.toUpperCase();
					break;
				case "weapmindmg":
					pretty += "("+obj[stat]+"-";
					break;
				case "weapmaxdmg":
					pretty += obj[stat]+"), ";
					break;
				case "sockets":
					pretty += obj[stat]+" "+(obj[stat] == 1 ? "SOCKET" : "SOCKETS") + ", ";
					break;
				case "weapdmg":
					pretty += obj[stat]+" DMG, ";
				case "weapdmg%":
					break;
				default:
					pretty += obj[stat]+" "+stat.toUpperCase() + ", ";
					break;
			}
		}
	}

	return escape(pretty.substr(0,pretty.length-2));
}

//check if stream is offline, if so, disable bot items function
function checkStream(recur){
	if (typeof recur === 'undefined') recur = true;
	client.streamIsLive(me, function(err,res) {
		if (!sendItems && !err && res) {
			console.log("Stream is back online, reactivating");
			if (recur) setTimeout(checkStream, 30000);
		}
		if (err || !res) {
			console.log("Stream is offline, halting item bot");
			if (recur) setTimeout(checkStream, 5000);
		}

		sendItems = !err && res;
	});
}