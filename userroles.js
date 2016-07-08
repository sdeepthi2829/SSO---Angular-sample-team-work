$(function() {
	UserRoles = Backbone.Model.extend({
		rolesAssignedToUser : [],

		initialize : function(options) {
			this.set(options);
		},

		url : function() {
			return atmometadata.getUsersAPIEndpoint(new FDN(this.get("ResourceID"))) + "/" + login.userFDN() + "/roles";
		},

		sync : function(method, model, options) {
			options.data = {
				ResourceID : this.get("ResourceID")
			};
			return Backbone.sync(method, model, options);
		},

		isAuthorized : function(role) {
			return _.include(rolesAssignedToUser, role);
		},

		parse : function(resp, xhr) {
			var data = JSON.parse(xhr.responseText);
			rolesAssignedToUser = data.RoleName;
		}
	});
});