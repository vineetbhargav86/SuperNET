var Auth = {};

$(document).ready(function() {
	

	var modal = $("#loginModal"),
		loginBtn = $("#btnLoginForm"),
		username = $("#loginFormUsername"),
		password = $("#loginFormPassword"),
		passphrase = $("#loginFormPassphrase"),
		rememberPass = $("#loginFormRememberPassphrase");

	modal.modal('show');    

	$("#btnLoginForm").on("click", function(e) {
		e.preventDefault();
		
		if(username.val() && password.val() && passphrase.val()) {
			var request='{"agent":"SuperNET","method":"login","handle":"'+ username.val() +'","password":"' + password.val() + '", "passphrase":"' + passphrase.val() + '"}';
		    
		    SPNAPI.makeRequest(request, function(req,res) {
		      	var res = dJson._checkJson(res);

		      	if(res) {
		      		// extend Auth with login response
		      		for(var prop in res) {
		      			Auth[prop] = res[prop];
		      		};
		      	};

		      	if(rememberPass.prop("checked")) {
					Auth.passphrase = passphrase.val();
				};
				
				modal.modal('toggle');
		    });
		}; 
	});
});