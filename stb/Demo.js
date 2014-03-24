var Demo = (function () {
	var $N = window.parent.$N;
	
	// view & control component.
	var view = {};
	var view_rbs_no, view_rbs_yes, view_rbs_setting, view_rbs_userlist, view_rbs_pair; // this is svg element 
	var userlist = null, rbs_yes_tab = null; // this is componenet in view. 
	
	var userlist_data = [];

	var tab_data = [{
		"Page": "SETTING", "index" : 1, "bAllow" : false
	},{
		"Page": "USERLIST", "index" : 2, "bAllow" : false
	},{
		"Page": "PAIR", "index" : 3, "bAllow" : false
	},{
		"Page": "DEMO", "index" : 4, "bAllow" : false
	}];
	// socket
	var socket_polling;
	var socket;
	var handle_interval_check_socket_polling;
	
			
	var is_use_XML =true;
	var flag_connection_count = 0;

	// config & system var	
	var is_stb_rbs_enable = false;
	var is_stb_rbs_registered = false;
	var caid, smartcard, mac, stb_name;
	var uuid = null;
	
	var log = new $N.apps.core.Log("Demo", "Demo");
	var current_userid = null;

/*
	/////////// DEMO feature ////////////
	function tune_chn(chn) { // get current channel
		var chn;
		chn = $N.app.ServiceManager.getChannelByLCN(chn);
		var playoutRequest = {
			url: $N.app.ServiceManager.getServiceUri(chn, true),
			serviceId: $N.app.ServiceManager.getServiceId(chn, true),
			context: ""
		}
		
		$N.app.fullScreenPlayer.requestPlayout(playoutRequest, true, null, false);
	}
	
	function prv_recordbyTime(){ // update
		
	}
	
	function prv_recordbyShow() {
		
	}
	
	function luanch_app(){
		
	}
	
	
	/////////////// DEMO update from STB to remotes ///////
	
	function _process_stb_update(){ // if there is something happen, retry a few times, if imposible then terminate the connection.
		
	} 
	
	function request_stb_update() {
		
	}
	
*/	
	
	
	////////// process sremote function /////////////
	
	function __process_update(command) { // for any update from server
		// user update: user add, user remove, user connected, 

	} 
	
	function __process_command(command) { // command send from remote forward from 
		// remote control: volumn, up/down/left/right, number
		
		
		// custom RC: player, keyboard, game console (only in some case)
		
		// shortcut: change channel, play VOD, launch app, purchase instant buy

		// remote setting: pvr, parental control, other setting.
		
		// refresh update command from STB.
		
	}
	
	
	
	//////// RBS polling Egnine ///////
	
	function interval_check_polling_socket() {
		if( flag_connection_count > 6 ) {
			socket_listening = new $N.apps.core.AjaxHandler();
			socket_listening.requestData("http://172.28.2.161:8080/stb_listening/"+uuid);
			socket_listening.setResponseCallback(_socket_listening_response);
			
			flag_connection_count = 0;
		} else {
			flag_connection_count++;
			log("flag_connection_count", flag_connection_count);
		}
	}	
	
	function _socket_listening_response(s, success) {
		log("_socket_listening_response", "Enter");
		if(!is_stb_rbs_enable) return;
		
		if( s ) {			
			if( s && s.readyState == 4 && s.status == 200) {
				res_data = JSON.parse(s.responseText);
				if(res_data.type == 0) {
					__process_command(res_data.command);
				} else {
					__process_update(res_data.update);
				}

				log("_socket_listening_response", "readyState: "+ s.readyState + " | " + s.status + " | success = " + success );
			} else {
				log("_socket_listening_response", "WARNING: readyState: "+ s.readyState + " | " + s.status + " | success = " + success );
			}
		} else {
			log("_socket_listening_response", "s = null | "  + success);
		}
		
		rbs_polling();
		
		flag_connection_count = 0;
		log("_socket_listening_response", "Exit");
	}
	
	function rbs_polling() { // to make the GET request *** this STARTING POINT for polling
		if(!is_stb_rbs_enable) return;
		
		socket_listening = new $N.apps.core.AjaxHandler();
		socket_listening.requestData("http://172.28.2.161:8080/stb_listening/"+uuid);
		socket_listening.setResponseCallback(_socket_listening_response);
	}
	
	
	
	//////// utility /////////////
	function predicatBy(prop){ // use for sort
	   return function(a,b){
	      if( a[prop] > b[prop]){
	          return 1;
	      }else if( a[prop] < b[prop] ){
	          return -1;
	      }
	      return 0;
	   }
	}

	function read_rbs_flag() {
		return $N.platform.system.Preferences.get("rbs");
	}
	
	function read_rbs_enable_disable_flag() {
		return $N.platform.system.Preferences.get("rbs_enable");
	}
	
	function write_rbs_flag(uuid) {
		return $N.platform.system.Preferences.set("rbs", uuid);
	}
	
	function write_rbs_enable_disable_flag(flag) { // flag = true | false
		return $N.platform.system.Preferences.set("rbs_enable", flag);
	}
	
	function delete_rbs_flag() {
		$N.platform.system.Preferences.deletePreference("rbs");
		$N.platform.system.Preferences.deletePreference("rbs_enable");
	}
	
	function get_stb_mac() {
		return "00-AA-BB-CC-DD-EE";
	}
		
	function get_stb_caid() {
		return $N.platform.ca.ConditionalAccess.getCASN();
	}
		
	function get_stb_smartcard() {
		//return $N.platform.ca.ConditionalAccess.getSmartcardNumber();
		return "090243512215";
	}
	
	function show_popup(msg) {
		log("popup", msg);
	}
	
	function is_rbs_registered() {
		if(uuid = read_rbs_flag()) {return true;}
		return false;
	}
	
	function is_rbs_enable() {
		return read_rbs_enable_disable_flag();
	}
	
	function get_index_of(user) {
		for(var i=0;i<userlist_data.length; i++) {
			if(userlist_data.User === user.User) return i;
		}
		
		return -1;
	}
	
	function user_add(user) {
		userlist_data.push(user);
		
		// get current userlist selectedItem
		var tmp_selected = userlist.getSelectedItem();
		
		// sort data again. 
		userlist_data.sort(predicatBy("bConnect"));
		var tmp_index = get_index_of(tmp_selected);
		
		// update data
		userlist.setData(userlist_data);
		userlist.displayData();
		// select again the data. 
 		if(tmp_index != -1){
 			userlist.selectItemAtIndex(tmp_index, true);
 		}
		
		_userlist_show_select_user(userlist.getSelectedItem());
	}
	
	function user_remove(user) {
		var tmp_selected = userlist.getSelectedItem();
		
		var tmp_index = get_index_of(user);
		
		userlist_data.splice(tmp_index,1);
		
		// sort data again. 
		userlist_data.sort(predicatBy("bConnect"));
		var tmp_index = get_index_of(tmp_selected);
		
		// update data
		userlist.setData(userlist_data);
		userlist.displayData();
		
		if(tmp_selected.User == user.User) {
			userlist.selectItemAtIndex(0, true);
		} else {
			tmp_index = get_index_of(tmp_selected);
	 		if(tmp_index != -1){
	 			userlist.selectItemAtIndex(tmp_index, true);
	 		}
		}
		
		_userlist_show_select_user(userlist.getSelectedItem());
	}
	
	function user_update(user) { // this is user json object
		var tmp_selected = userlist.getSelectedItem();
		var tmp_index = get_index_of(tmp_selected);
		
		user_remove(user);
		user_add(user);
		
		if(tmp_index != -1){
 			userlist.selectItemAtIndex(tmp_index, true);
 		}
 		
 		_userlist_show_select_user(userlist.getSelectedItem());
	}


	function query_stb_state() { // 
		// current channel
		// setting
		// pvr
		// cuurent app.
	}
	
	//////// http request/update ///////
	function _response_register(s, success) { // get 
		if( s ) {			
			if( s && s.readyState == 4 && s.status == 200) {
				var res_data = JSON.parse(s.responseText);
				// process res_data
				if(res_data.ret == 0) {
					uuid = res_data.description;
					// set flag = true & write flag
					is_stb_rbs_registered = true;
					write_rbs_flag(uuid);
					// enable rbs service.
					request_setting_enable();
				} else {
					var error = res_data.description;
					show_popup(error);
				}
				log("_response_register", "readyState: "+ s.readyState + " | " + s.status + " | success = " + res_data );
			} else {
				log("_response_register", "WARNING: readyState: "+ s.readyState + " | " + s.status + " | success = " + success );
			}
		} else {
			log("_response_register", "s = null | "  + success);
		}
	}
	
	function request_register() {
		var caid = get_stb_caid();
		var smartcard = get_stb_smartcard();
		var caid = get_stb_mac();
		
		socket = new $N.apps.core.AjaxHandler();
		socket.requestData("http://172.28.2.161:8080/stb_register?caid=" + caid + "&smartcard=" + smartcard + "&mac=" + mac);
		socket.setResponseCallback(_response_register);
	}
	
	// ------ setting enable/diable ----- //// after enable will get the userlist. 
	function _response_setting_enable(s, success) {
		if( s ) {			
			if( s && s.readyState == 4 && s.status == 200) {
				var res_data = JSON.parse(s.responseText);
				if(res_data.ret == 0) {
					userlist_data = JSON.stringify(res_data.userlist);
					_setting_enable_processing();
				} else {
					var error = res_data.description;
					show_popup(error);
				}
				log("_response_register", "readyState: "+ s.readyState + " | " + s.status + " | success = " + res_data );
			} else {
				log("_response_register", "WARNING: readyState: "+ s.readyState + " | " + s.status + " | success = " + success );
			}
		} else {
			log("_response_register", "s = null | "  + success);
		}
	}
	
	function request_setting_enable() {
			// get current data to sync with server.
			var data = query_stb_state();
			
			socket = new $N.apps.core.AjaxHandler();
			socket.postData("http://172.28.2.161:8080/stb_enable/" + uuid, data);
			socket.setResponseCallback(_response_setting_enable);
	}	
	
	// ------ setting deregister ----- ////
	function _response_deregister(s, success) {
		if( s ) {			
			if( s && s.readyState == 4 && s.status == 200) {
				var res_data = JSON.parse(s.responseText);
				// process res_data
				if(res_data.ret == 0) {
					// delete everything
					_setting_deregister_processing();
				} else {
					var error = res_data.description;
					show_popup(error);
				}
				log("_response_register", "readyState: "+ s.readyState + " | " + s.status + " | success = " + res_data );
			} else {
				log("_response_register", "WARNING: readyState: "+ s.readyState + " | " + s.status + " | success = " + success );
			}
		} else {
			log("_response_register", "s = null | "  + success);
		}
	}
	
	function request_setting_deregister() {
		socket = new $N.apps.core.AjaxHandler();
		socket.requestData("http://172.28.2.161:8080/stb_deregister/" + uuid);
		socket.setResponseCallback(_response_deregister);
	}
	
	// ------ user ban/allow ----- ////
	function _response_user_ban_allow(s, success) {
		if( s ) {			
			if( s && s.readyState == 4 && s.status == 200) {
				res_data = JSON.parse(s.responseText);
				if(res_data.ret == 0) {
					// update the user list
					var user = JSON.stringify(res_data.user);
					// update text of this user.
					user_update(user);
					
					//update_userlist_data();
					
				} else {
					show_popup("Server cannot remove user. Please exit and try again.");
				}
				log("_socket_updating_response", "readyState: "+ s.readyState + " | " + s.status + " | success = " + res_data );
			} else {
				log("_socket_updating_response", "WARNING: readyState: "+ s.readyState + " | " + s.status + " | success = " + success );
			}
		} else {
			log("_socket_updating_response", "s = null | "  + success);
		}
	}
	
	function request_user_ban_allow(userid) {
		socket_updating = new $N.apps.core.AjaxHandler();
		socket_updating.requestData("http://172.28.2.161:8080/stb_ban_allow_user/" + uuid + "?user_id=" + userid);
		socket_updating.setResponseCallback( _response_register);
	
	}
	
	// ------ user remove ----- ////
	function _response_remove_user(s, success) {
		if( s ) {			
			if( s && s.readyState == 4 && s.status == 200) {
				res_data = JSON.parse(s.responseText);
				if(res_data.ret == 0) {
					// update the user list
					var user = JSON.stringify(res_data.user);
					
					user_remove(user);
					// refresh the userlist view					
					update_userlist_data();
				} else {
					show_popup("Server cannot remove user. Please exit and try again.");
				}
				log("_socket_updating_response", "readyState: "+ s.readyState + " | " + s.status + " | success = " + res_data );
			} else {
				log("_socket_updating_response", "WARNING: readyState: "+ s.readyState + " | " + s.status + " | success = " + success );
			}
		} else {
			log("_socket_updating_response", "s = null | "  + success);
		}
	}
	
	function request_user_remove(userid) {
		socket = new $N.apps.core.AjaxHandler();
		socket.requestData("http://172.28.2.161:8080/stb_remove_user/" + uuid + "?user_id=" + userid);
		socket.setResponseCallback(_response_remove_user);
	
	}

	// ------ pair ----- ////
	function _response_get_pairing_code(s, success) {
		if( s ) {			
			if( s && s.readyState == 4 && s.status == 200) {
				res_data = JSON.parse(s.responseText);
				if(res_data.ret == 0) {
					var pairing_code = res_data.code;
					// show code
					_pairing_show_pair_code(pairing_code);
					// start polling
					polling_pairing_wait();
				} else {
					show_popup("Error happen. Please Exit and try again.");
				}
				
				log("_response_get_pairing_code", "readyState: "+ s.readyState + " | " + s.status + " | success = " + res_data );
			} else {
				log("_response_get_pairing_code", "WARNING: readyState: "+ s.readyState + " | " + s.status + " | success = " + success );
			}
		} else {
			log("_response_get_pairing_code", "s = null | "  + success);
		}
	}	
	
	function request_pairing_code() {
		socket = new $N.apps.core.AjaxHandler();
		socket.requestData("http://172.28.2.161:8080/stb_get_pairing_code/" + uuid);
		socket.setResponseCallback(_response_get_pairing_code);
	
	}
	
	function _response_polling_pairing_wait(s, success) {
		if( s ) {			
			if( s && s.readyState == 4 && s.status == 200) {
				res_data = JSON.parse(s.responseText);
				if(res_data.ret == 0) { // pair success
					// user add
					user_add(JSON.parse(res_data.user));
					// show pair success
					_pairing_show_pair_status("Success paired with: " + res_data.user.User);
				} else if( res_data == 1) { // pair expire
					// show pair expired
					_pairing_show_pair_status("Pairing code is expired. Please press GREEN to generate another pair code");
				} else { // 
					polling_pairing_wait();
				}				
				log("_socket_updating_response", "readyState: "+ s.readyState + " | " + s.status + " | success = " + res_data );
				return true;
			} else {
				log("_socket_updating_response", "WARNING: readyState: "+ s.readyState + " | " + s.status + " | success = " + success );
			}
		} else {
			log("_socket_updating_response", "s = null | "  + success);
		}
		// if http request session expired, start polling again. 

	}
	
	function polling_pairing_wait() {
		socket = new $N.apps.core.AjaxHandler();
		socket.requestData("http://172.28.2.161:8080/stb_pairing_wait/" + uuid);
		socket.setResponseCallback(_response_polling_pairing_wait);
	}
	
	////////  GUI & control ///////

	//-------- rbs_no ---------//
	function register_show() {
		view_rbs_yes.hide();
		view_rbs_no.show();
	}
	
	function register_processing() {
		// after press ok it will send the register request toserver 
		request_register();
	}
	
	// ----- rbs_yes ----- //

	function register_yes_show() { // or can use to refresh
		view_rbs_yes.show();
		view_rbs_no.hide();

		setting_show();
	}
	
	// ---- setting ------------//
	function setting_show() {
		view_rbs_setting.show();
		view_rbs_userlist.hide();
		view_rbs_pair.hide();
	}
	
		
	function _setting_enable_processing() {
			// there is new data updated. refresh the userlist with new data. 
			update_userlist_data();
			// start polling again.
			is_stb_rbs_enable = true; 
			write_rbs_enable_disable_flag(true);
			// after enable -- start POLLING
			rbs_polling();					
			// start interval check for polling
			handle_interval_check_socket_polling = setInterval(interval_check_polling_socket, 10000);

			// show the enable text
			view_rbs_setting.rbs_setting_enable_disable.setText("RBS is enable now. Press BLUE to disable");
			// show tab
			rbs_yes_tab.show();
			// show the register_yes
			register_yes_show();
	}
	
	function setting_enable_disable_processing() {
		if(is_stb_rbs_enable) {
			is_stb_rbs_enable = false;
			write_rbs_enable_disable_flag(false);
			// disable - update text 
			view_rbs_setting.rbs_setting_enable_disable.setText("RBS is enable now. Press BLUE to disable");
			// hide tab
			rbs_yes_tab.hide();
			// clear interval
			if(handle_interval_check_socket_polling) {
				clearInterval(handle_interval_check_socket_polling);
			}
			
			// register yes show need to be refresh.
			register_yes_show()
		} else { // when enable, it will need to sync up with server. 
			// request enable - after request enable success will start the polling and interval check 
			request_setting_enable();
		}
	}
	
	
	//--------- deregister ----//
	function _setting_deregister_processing() {
		uuid = null;
		is_stb_rbs_registered = false;
		is_stb_rbs_enable = false;
		delete_rbs_flag();					
		// stop interval check & polling.
		if(handle_interval_check_socket_polling) {
			clearInterval(handle_interval_check_socket_polling);
		}
		register_show();
	}
	
	function setting_deregister_processing() {
		request_setting_deregister();
	}
	
	// ------ userlist ---- //
			
	function update_userlist_data() { // in case of userlist data change as user disconnect, user just paired to stb, user remove
		// check userlist_data to change the itemConfig.
		var len = userlist_data.length;
		if(len < 6) {
			var opacity = "0,";
			var movement = "0,-60;";
			for( i=0 ; i < len ; i++) {
				opacity += "1,";
				movement += "0,"+60*i+";";
			}
			opacity += "0";
			movement += "0,"+60*i+"";
			
			userlist.setOpacityValue(opacity);
			userlist.setMovementPosition(movement);
		}
		// sort data again. 
		userlist_data.sort(predicatBy("bConnect"));
		
		
		// update data
		userlist.setData(userlist_data);
		userlist.displayData();
	}

	function userlist_show() {
		// show page
		view_rbs_setting.hide();
		view_rbs_userlist.show();
		view_rbs_pair.hide();
	}
	
	function _userlist_show_select_user(user) {
		// show user detail
		view_rbs_userlist.rbs_user_allow.setText(user.bAllow ? 
			"This user is allowed to remote connect to this STB. Press GREEN button to ban this user." 
			: "This user is banned to remote connect to this STB. Press GREEN button to allow this user.");
		view_rbs_userlist.rbs_user_remove.setText("Press RED button to remove User " + user.User + ".");
		view_rbs_userlist.rbs_user_info.setText(user.Info);
	}
	
	function userlist_ban_allow_processing(user) {
		// request to ban/allow this user
		request_user_ban_allow(user.id);
	}
	
	function userlist_remove_processing(user) {
		// request to remove this user. 
		request_user_remove(user.id);
	}

	// ------ pairing ------ //
	function pairing_show() {
		// show page
		view_rbs_setting.hide();
		view_rbs_userlist.hide();
		view_rbs_pair.show();
		// get pairing code
		request_pairing_code();
	}
	
	function _pairing_show_pair_code(code) {
		// show pairing code
		view_rbs_pair.rbs_pair_code.setText(code);
		_pairing_show_pair_status("waiting...");
	}
	
	function _pairing_show_pair_status(status) {
		view_rbs_pair.rbs_pair_status.setText(status);
	}
	
	
	///////////////////////////////////////////////////
	function selectedPage(item) {		
		log("selectedPage", item.index);
		switch(item.index) {
			case 1: {
				setting_show();
				break;
			}
			case 2: {
				userlist_show();
				break;
			}
			case 3: {
				pairing_show();
				break;
			}
		}
	}
	
	function selectedUser(item) {
		log("selectedUser", item.User);
		// show user detail
		_userlist_show_select_user(item);
		
	}

	// -----------init--------------//
	function init_rbs() { // starting point
		view_rbs_yes = view.rbs_yes;
		view_rbs_no = view.rbs_no;
		view_rbs_setting = view.rbs_yes.rbs_setting;
		view_rbs_userlist = view.rbs_yes.rbs_userlist;
		view_rbs_pair = view.rbs_yes.rbs_pair;
		userlist = view.rbs_yes.rbs_userlist.userlist;
		rbs_yes_tab = view.rbs_yes.rbs_yes_tab;
		
		// init for the userlist pivotlist
		var dataMapperTab = {
			getTitle: function (item) {
				return item.Page;
			}
		};
		

		rbs_yes_tab.setDataMapper(dataMapperTab);
		rbs_yes_tab.setData(tab_data);
		rbs_yes_tab.setOrientation($N.gui.PivotList.consts.ORIENTAION_HORIZONTAL);
		rbs_yes_tab.setWrapAround(true);
		rbs_yes_tab.setFocusPosition(2);
		rbs_yes_tab.setItemHighlightedCallback(selectedPage);
		rbs_yes_tab.initialise();
		
		
				// init for the userlist pivotlist
		var dataMapperUser = {
			getTitle: function (item) {
				return item.User;
			}
		};
		

		userlist.setDataMapper(dataMapperUser);
		//userlist.setData(userlist_data);
		userlist.setOrientation($N.gui.PivotList.consts.ORIENTAION_VERTICAL);
		userlist.setWrapAround(false);
		userlist.setItemSelectedCallback(selectedUser);
		userlist.initialise();
		
		if(is_rbs_registered()) {
			is_stb_rbs_registered = true;
			if(is_rbs_enable()) {
				is_stb_rbs_enable = true;
				request_setting_enable();
			} else {
				is_stb_rbs_enable = false;
			}
		} else {
			is_stb_rbs_registered = false;
		}
	}
	
	// ---------- activate ------------//
	function activate_rbs() {
		if(!is_stb_rbs_registered) {
			// show the register page 
			register_show();
		} else {
			// show setting page.
			register_yes_show();
		}
	}
	
	
	////////////// public function ////////////////
	return {
    	load: function () {
			$N.gui.ResolutionManager.initialiseContext(document);
			Demo.init();
		},

		init: function () {
			if ( is_use_XML ) {
				$N.gui.FrameworkCore.loadGUIFromXML($N.app.Config.getConfigValue("server.url") + "apps/Demo/view/Demo.xml", document.getElementById("content"), view, window);
			} else {
				$N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
				
				// or view = document.getElementById("content");				
			}

			//log("$N.platform.ca.ConditionalAccess.getCASN()", $N.platform.ca.ConditionalAccess.getCASN());
			init_rbs();
			$N.apps.core.ContextManager.initialisationComplete(Demo);
		},
		


		activate: function () {
			//view.background.setPreserveAspect(false);

			activate_rbs();
		},
		
		passivate: function () {
			is_passive = true;
		},
		
		preview: function () {
		
		},
		
		dismissPreview: function () {
		
		},
		
		toString: function () {
			return "Demo";
		},
		
		
		keyHandler: function (key) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap();
			var handled = false;
			
			switch (key) {
				case keys.KEY_BACK:
					log("keyHandler", "KEY_BACK");
					handled = true;
					delete socket_listening;
					$N.apps.core.ContextManager.navigateToDefaultContext();
					
					return handled;
				case keys.KEY_MENU:
					log("keyHandler", "KEY_MENU");
					delete socket_listening;
					$N.apps.core.ContextManager.navigate($N.apps.core.ContextManager.getNavigationLink("MAINMENU"), null);
					handled = true;
					return handled;
				case keys.KEY_LEFT:
					log("keyHandler", "KEY_LEFT");
					rbs_yes_tab.keyHandler(key);
					handled = true;
					return handled;
				case keys.KEY_RIGHT:
					log("keyHandler", "KEY_RIGHT");
					rbs_yes_tab.keyHandler(key);
					handled = true;
					return handled;
				case keys.KEY_UP:
					log("keyHandler", "KEY_LEFT");
					userlist.keyHandler(key);
					handled = true;
					return handled;
				case keys.KEY_DOWN:
					log("keyHandler", "KEY_RIGHT");
					userlist.keyHandler(key);
					handled = true;
					return handled;
				case keys.KEY_GREEN:
					log("keyHandler", "KEY_GREEN");
					handled = true;
					return handled;
				default:
					log("keyHandler", "default");
					return rbs_yes_tab.keyHandler(key);
			}
		}
	}
}());