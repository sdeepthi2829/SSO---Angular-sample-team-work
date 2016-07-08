$(function() {
	SecurityDomains = Backbone.Collection.extend({
		url : function() {
			return atmometadata.getSecurityDomainsAPIEndpoint(atmoconsolehomemetadata.federationMemberId) + "?DomainType=com.soa.securitydomain.oauth.provider";
		},

		parse : function(resp) {
			var entities = [];
			for (var i in resp.channel.item) {
				domain = resp.channel.item[i];

				var entity = new SecurityDomain({
					name : domain.title,
					description : domain.description
				});

				entities.push(entity);
			}

			return entities;
		}
	});

	SecurityDomain = Backbone.Model.extend({
		idAttribute : 'SecurityDomainID',
		url : function() {
			return atmometadata.getSecurityDomainsAPIEndpoint(atmoconsolehomemetadata.federationMemberId) + "/" + this.id;
		},
		parse : function(xhr, model) {
			this.set({
				name : xhr.Name,
				description : xhr.Description,
				systemType : xhr.IdentitySystemType,
				configuration : JSON.parse(xhr.DomainConfiguration)
			});
		}
	});

	ApiOauthDetails = Backbone.Model.extend({
		idAttribute : 'ApiOauthDetails',
		url : function() {
			return atmometadata.getAPIsAPIEndpoint(atmoconsolehomemetadata.federationMemberId) + "/versions/" + this.id + "/oauthdetails";
		}

	});
});
