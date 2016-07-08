$(function() {
	Policy = Backbone.Model.extend({

		idAttribute : 'PolicyKey',

		url : function() {

			var base = atmometadata.getPoliciesAPIEndpoint(login.homeFederationMemberId());

			return this.isNew() ? base : base + '/' + encodeURIComponent(this.id);

		}
	});

	Policies = Backbone.Collection.extend({

		model : Policy,

		initialize : function(args) {

			this.policyType = args.policyType;

		},

		url : function() {
			return atmometadata.getPoliciesAPIEndpoint(login.homeFederationMemberId()) + '?Type=' + this.policyType;
		},

		parse : function(resp, xhr) {
			var entities = [];

			for (object in resp.channel.item) {
				object = resp.channel.item[object];

				var entity = new Policy({
					PolicyKey : object.guid.value,
					Name : object.title,
					Description : object.description
				});

				entities.push(entity);
			}

			return entities;

		}
	});

	/**
	 * Gets an OAuth 2.0 authorization from the server
	 * 
	 * How to use:
	 * 
	 *   var azn = new OAuth2Authorization({ 
	 *     client_key: '6cgjhjw4CwI8AxuHV5zqEi8Y.atmosphere', 
	 *     client_secret: '7f09e9abf8d4e9414b057ab1d4559fc81d8004bd' 
	 *   });
	 * 
	 *   azn.auth({ success: function() { alert(azn.auth_header); } });
	 */
	OAuth2Authorization = Backbone.Model.extend({

		initialize : function(args) {
			args = args ? args : {};
			args.grant_type = 'client_credentials';
		},

		idAttribute : 'accessToken',

		auth : function(options) {
			this.save({}, options);
		},

		url : function() {
			return "/oauth/oauth20/token";
		},

		auth_header : function() {
			return [ "Bearer", this.id ].join(" ");
		},

		auth_header_key : "Authorization",

		sync : function(method, model, options) {
			
			var key = model.attributes.client_key;
			var secret = model.attributes.client_secret;
			var auth = $.base64.encode([key,secret].join(':'));
						
			return $.ajax({
				type : 'POST',
				url : model.url(),
				async:false,
				data : {
					'token_type' : 'client_credentials',
					'grant_type' : 'client_credentials'
				},
				contentType : 'application/x-www-form-urlencoded',
				dataType : 'json',
				processData : true,
				success: options.success,
				error: options.error,
				complete: options.complete,
				headers: {Authorization : "Basic " + auth}
			});
		}

	});
	
	OAuthProvider = Backbone.Model.extend({

		initialize : function(args) {
			this.apiKey = args.apiKey;
			this.apiSecret = args.apiSecret;
		},

		getRequestToken : function(options) {
			this.fetch({}, options);
		},

		getAccessToken : function(options) {
			this.fetch({}, options);
		},

		url : function() {
			return "/api/devconsole/oauth";
		},

		sync : function(method, model, options) {
			
			var key = model.attributes.client_key;
			var secret = model.attributes.client_secret;
			var auth = $.base64.encode([key,secret].join(':'));
			
			return $.ajax({
				type : 'GET',
				url : model.url(),
				async:false,
				data : {
					'token_type' : 'client_credentials',
					'grant_type' : 'client_credentials'
				},
				contentType : 'application/x-www-form-urlencoded',
				dataType : 'json',
				processData : true,
				success: options.success,
				error: options.error,
				complete: options.complete,
				headers: {Authorization : "Basic " + auth}
			});
		}

	});
	
	
	OAuthProviders = Backbone.Collection.extend({
		model: OAuthProvider,
		initialize : function(args) {
			this.apiVersionID = args.apiVersionID;
			this.appVersionID = args.appVersionID;
		},

		url : function() {
			return "/api/devconsole/oauth/providers?apiVersionID=" + this.apiVersionID + "&appVersionID=" + this.appVersionID;
		},
		parse : function(resp, xhr) {
			var entities = [];

			for (object in resp.channel.item) {
				object = resp.channel.item[object];
				var entity = new Follower({
					FollowerID : object.guid.value,
					Name : object.title,
					UserID : getReferenceUserDN(object)
				});

				entities.push(entity);
			}

			return entities;
		}
	});
	
	
	OAuthRequest = Backbone.Model.extend({
		initialize : function(args) {
			this.TokenKey = args.TokenKey;
			this.Verb = args.Verb;
			this.Url = args.Url;
			if (args.QueryString) {
				this.QueryString = args.QueryString;
			}
			if (args.PostParameters) {
				this.PostParameters = args.PostParameters;
			}
			if (args.ContentType) {
				this.ContentType = args.ContentType;
			}
		},
		url : function() {
//			return "/api/devconsole/oauth/request?" + this.oauthAccessToken + "&verb=" + this.verb + "&url=" + this.targetUrl;
			return "/api/devconsole/oauth/request";
		}
	});
	
	
	AuthPolicy = Backbone.Model.extend({
		
	});
	
	AuthPolicies = Backbone.Collection.extend({
		model: AuthPolicy,
		initialize : function(args) {
			this.apiVersionID = args.apiVersionID;
			this.environment = args.environment;
		},

		url : function() {
			var result = atmometadata.getRootEndpointByFedmember(new FDN(this.apiVersionID)) + "/api/devconsole/authpolicy?apiVersionDN=" + this.apiVersionID + "&environment=" + this.environment;
			return result;
		},
		
		parse: function(data) {
            var entities = [];
            //for (var x in data.AuthPolicy) {
            for (var x = 0; x < data.AuthPolicy.length; x++) {
				var policy = data.AuthPolicy[x];
				policy.id = policy.Key;
				entities.push(policy);
			}
            return entities;
        }
	});

});
