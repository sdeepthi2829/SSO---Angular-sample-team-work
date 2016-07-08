$(function() {

	UserAgreement = Backbone.Model.extend({

		idAttribute : 'AgreementID',

		url : function() {

			var base = atmometadata.getLegalsAPIEndpoint(login.homeFederationMemberId()) + '/agreements';

			return this.isNew() ? base : base + '/' + encodeURIComponent(this.id);

		}
	});

	AgreementDocument = Backbone.Model.extend({

		idAttribute : 'DocumentID',

		url : function() {

			var base = atmometadata.getLegalsAPIEndpoint(login.homeFederationMemberId());

			return this.isNew() ? base : base + '/' + encodeURIComponent(this.id);

		}
	});

	AgreementDocuments = Backbone.Collection.extend({

		model : AgreementDocument,

		initialize : function(args) {

			this.apiVersionID = args.apiVersionID;

		},

		url : function() {
			if (this.apiVersionID !== undefined) {
				return atmometadata.getAPIsAPIEndpoint(new FDN(this.apiVersionID)) + '/versions/' + this.apiVersionID + '/legals';
			}
			return atmometadata.getLegalsAPIEndpoint(login.homeFederationMemberId());
		},

		parse : function(resp, xhr) {
			var entities = [];

			for (var object in resp.channel.item) {
				object = resp.channel.item[object];
				var docCategory = getCategory(object, 'uddi:soa.com:documenttype');
				if (docCategory != null) {
					docCategory = docCategory.value;
				}

				var entity = new AgreementDocument({
					DocumentID : object.guid.value,
					Name : object.title,
					ContentPath : object.link,
					Description : object.description,
					Type : docCategory
				});

				entities.push(entity);
			}

			return entities;

		}
	});

});
