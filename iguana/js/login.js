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
		// TODO here we can call api
		//      "agent": "SuperNET", 
		//      "method": "login", 
		//      "handle": $scope.username, 
		//      "password": $scope.password, 
		//      "passphrase": $scope.passphrase
		if(username.val() && password.val() && passphrase.val()) {
			if(rememberPass.prop("checked")) {
				Auth.passphrase = passphrase.val();
			};
			modal.modal('toggle');
		}; 
	});
});