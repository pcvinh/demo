var express = require("express")
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

var redis = require('redis');
var fs = require('fs');
var url = require('url');
var util = require('util');

// New Code
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/opentv5');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  log('info', 'mongoose once');
});

var stbSchema = mongoose.Schema({
    uuid: String,
	bEnable:  Boolean,
	userlist: [{id : ObjectId, User : String, bAllow: Boolean, bConnected: Boolean, Info: String}],
	stbInfo: {name: String, caid: String, smartcard: String, mac: String},
	last_sync: Date
})

log('info', 'connected to redis server');
var currentdata, currentdata2, lastmodified = new Date("1900-01-01 00:00:00"), lastmodified2 = new Date("1900-01-01 00:00:00");

//server.enable("jsonp callback");
server.listen(8080);

app.use(express.json());
app.use(express.urlencoded());

// to return the remote page. 
app.get('/', function (req, res) { // to get the "remote" 
  res.sendfile(__dirname + '/index.html');
});

/* 
 * stbid using CAID
 * pairing code generate random & store at mongodb. have expire
 * command in json will be forward to stb directly.
 * state in json, and store in mongodb.
 * 
 * hoi bi mac muu o cai thang json mot chut. nhung khong sao, 
 * bay gio minh cu forward qua truoc di, lam duoc gi thi lam nhung chac chang phai xai json
 * 
 * 
 */

////////////////////////////////////////////////////////
//////////// utility functions /////////////////////////
////////////////////////////////////////////////////////

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}



////////////////////////////////////////////////////////
//////////// private functions /////////////////////////
////////////////////////////////////////////////////////


//---------- database process --------///
function insert_db() {
	
}

function query_db() {
	
}

function update_db() {
	
}

//-------- stb processing -------------//

function stb_process_register(caid, smartcard, mac) {
	
}
function stb_process_enable(uuid, data) {

}
function stb_process_deregister(uuid) {

}
function stb_process_user_ban_allow(uuid, user_id) {

}
function stb_process_user_remove(uuid, user_id) {

}

function stb_process_get_paring_code(uuid) {

}

//------------- remote processing --------////

function remote_register() {
	
}

function remote_deregister() {
	
}

function remote_login() {
	
}

function remote_setting() {
	
}

function remote_pairing() {
	
}


function remote_connecting() {
	
}

function is_stb_online() {
	
}

////////////////////////////////////////////////////////
///////////// to serve stb connection///////////////////
////////////////////////////////////////////////////////


//----- admin task for STB to register OR for STB do settings task @ rbs: register, deregister, setting(update stb info/name, remove user, enable/disable rbs ), pairing code generation... ----//

app.get('/stb_register', function(request, response, next) {  // input: caid, smartcard --output: the stbid
	var caid = request.query.caid;
	var smartcard = request.query.smartcard;
	var mac = request.query.mac;
	log('info', 'stb_register: ' + caid +" "+ smartcard +" "+ mac);
	
	var ret = stb_process_register(caid, smartcard, mac); //
	
	response.send(ret);
	request.socket.end();

});

app.post('/stb_enable/:uuid', function(request, response, next) {  
	var uuid = request.params.uuid;
	log('info', 'stb_enable: ' + uuid);
	
	var ret = stb_process_enable(uudi, request.body) ; 
	
	response.send(ret);
	request.socket.end();
});

app.get('/stb_deregister/:uuid', function(request, response, next) {  
	var uudi = request.params.uuid;
	log('info', 'stb_deregister: ' + uuid);
	
	ret = stb_process_deregister(uudi) ; 

	response.send(ret);
	request.socket.end();
});

app.get('/stb_user_ban_allow/:uuid', function(request, response, next) {  
	var uudi = request.params.uuid;
	var user = request.query.user_id;
	
	log('info', 'stb_user_ban_allow uuid=' + uuid + ", user_id = " + user_id);
	
	ret = stb_process_user_ban_allow(uuid, user_id) ; 

	response.send(ret);
	request.socket.end();
});

app.get('/stb_user_remove/:uuid', function(request, response, next) {  
	var uudi = request.params.uuid;
	var user = request.query.user_id;
	
	log('info', 'stb_user_remove uuid=' + uuid + ", user_id = " + user_id);
	
	ret = stb_process_user_remove(uuid, user_id) ; 

	response.send(ret);
	request.socket.end();
});



app.get('/stb_get_paring_code/:uuid', function(request, response, next) {  
	var uudi = request.params.uuid;
	log('info', 'stb_get_paring_code: ' + uuid);
	
	ret = stb_process_get_paring_code(uudi) ; 

	response.send(ret);
	request.socket.end();
});

app.get('/stb_pairing_wait/:uuid', function(request, response, next) {   // just use for notify to STB only.
	var uudi = request.params.uuid;
	
	var channel = "paring"+uuid;
	log('info', 'stb_pairing_wait: ' + uuid);
	const subscriber = redis.createClient();
	subscriber.subscribe(channel);
	request.socket.setTimeout(60*1000);

	request.socket.on('timeout', function() {
		subscriber.quit();
		this.end();
		log('warn', 'timeout, so quit subcribe & close socket for stb: ' + channel);
	});
	
	subscriber.on("message", function(channel, message) {
            log('info', 'now response command to stb: ' + channel + " : " + message);
			//response.type('json');
			response.send(String(message)); // send the whole message back to stb
			request.socket.end();
			this.unsubscribe();
			this.quit();
        });
});




// ---- polling 2 types of polling: listening (GET) (timeout 60s) and updating (POST) ------//

// response will include: command to act @ stb, info [which user is connecting...] to update/store/show @ stb.
app.get('/stb_listening/:stbid', function(request, response, next) {
	log('info', 'there is request polling to port 8080 - long polling port');
	
	var channel = request.params.stbid; // each 
	const subscriber = redis.createClient();
	
	subscriber.subscribe(channel);
	request.socket.setTimeout(60*1000);
	
	request.socket.on('timeout', function() {
		subscriber.quit();
		this.end();
		log('warn', 'timeout, so quit subcribe & close socket for stb: ' + channel);
	});
	
	subscriber.on("message", function(channel, message) {
            log('info', 'now response command to stb: ' + channel + " : " + message);
			//response.type('json');
			response.send(String(message)); // send the whole message back to stb
			request.socket.end();
			this.unsubscribe();
			this.quit();
        });

});

app.post('/stb_updating/:stbid', function(request, response, next) { 
	// update state then broadcast to all remote. 
	var channel = request.params.stbid;
	log('info', 'there is update state from stb: ' + channel + ":" + String(request.body.menu));
	
	const publisher = redis.createClient();
	// get body of post and send it to update engine.
	
	//stb_updating(stbid, request.body);
	
	
	
	// publish for all user which are connecting to this channel 
	publisher.publish("u"+channel, String(request.body));
	publisher.quit();
	
	//response.send(request.body);
	request.socket.end();


});

/*
app.post('/return_request', function(request, response, next) {
	log('info', 'there is request polling to port 8080 - long polling port');
	const subscribe = redis.createClient();
	subscribe.subscribe('realtime');
	request.socket.setTimeout(60*1000);
	
	request.socket.on('timeout', function() {
		subscribe.quit();
		this.end();
		log('warn', 'timeout, so quit subcribe');
	});
	subscribe.on("message", function(channel, message) {
            log('info', 'now response new updated of file data.txt');
			//response.type('json');
			response.send(String(currentdata));
			request.socket.end();
			this.unsubscribe();
			this.quit();
            log('msg', "received from channel #" + channel + " : " + message);
        });

});
*/


////////////////////////////////////////////
//////////// to serve remote ///////////////
////////////////////////////////////////////





// register, deregister, update acct, login, pairing, connecting, websocket-sendcommand.
app.get('/remote_register/', function(request, response, next) { // query the paired table and return list of STBid belong to this user. 
	log('info', 'there is request polling to port 8080 - long polling port');

	// generate UUID 
	
	
	
});

app.get('/remote_deregister/:userid', function(request, response, next) { // query the paired table and return list of STBid belong to this user. 
	log('info', 'there is request polling to port 8080 - long polling port');

});

app.get('/remote_updates/:userid', function(request, response, next) { // query the paired table and return list of STBid belong to this user. 
	log('info', 'there is request polling to port 8080 - long polling port');

});

app.get('/remote_login/:userid', function(request, response, next) { // query the paired table and return list of STBid belong to this user. 
	log('info', 'there is request polling to port 8080 - long polling port');

});

app.get('/remote_paring/:code/:userid', function(request, response, next) { 
	// incase of anonymous, no update to paired, if userid --> update paired table. after this, remote will open websocket with stbid to init connection section. 
	log('info', 'there is request polling to port 8080 - long polling port');


});

app.get('/remote_connecting/:userid/:stibid', function(request, response, next) { 
	// if user already register, it will open websocket for stbid. 
	log('info', 'there is request polling to port 8080 - long polling port');

});

//////////// websocket ////////////////

io.sockets.on("connection", function (socket) {
	const subscriber = redis.createClient();
	const publisher = redis.createClient();
	subscribe.subscribe();
	
	socket.on("init", function(data) {
		socket.set("stbid", data, function(){});
		
		// publish to stb 
	});
	socket.on("message", function(data) {
		// after receive command - publish it to pubsub with command data. channel = stbid
		/*
		command sample data
		{
			cmd-code: 0x01,
			cmd: "change-channel",
			param : {
				channel : "106" 
			},
		} 
		 
		*/
		
		
	});
	
	socket.on("close", function(data) {
		// close websocket and other resource.  publish about info user quit.
	});
	
	
});



//////////////////////////////////////

function log(type, msg) {

    var color   = '\u001b[0m',
        reset = '\u001b[0m';

    switch(type) {
        case "info":
            color = '\u001b[36m';
            break;
        case "warn":
            color = '\u001b[33m';
            break;
        case "error":
            color = '\u001b[31m';
            break;
        case "msg":
            color = '\u001b[34m';
            break;
        default:
            color = '\u001b[0m'
    }

    console.log(color + '   ' + type + '  - ' + reset + msg);
}
