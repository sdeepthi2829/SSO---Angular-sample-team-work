//= require resource.js
/*globals $ Backbone AtmoResource atmometadata FDN*/
$(function () {
    /*
     * User object
     */
    User = AtmoResource.extend({
        type: 'user',
        idAttribute: 'UserID'
    });
    
    UserPassword = AtmoResource.extend({
        
		type: 'password',
		
        idAttribute: 'UserID',
		
//		initialize: function(args) {
//			args = args ? args : {};
//			this.attributes = args;
//			this.id = args[this.attributes.idAttribute];
//		},
        
        url: function () {
            var userId = this.attributes.UserId;
            return [atmometadata.getUsersAPIEndpoint(new FDN(this.id)), this.id, 'password'].join("/");
        },
		
		toJSON : function () {
			return {
				NewPassword: this.attributes.NewPassword,
				OldPassword: this.attributes.OldPassword
			};
		}
		
    });
	
	
});
