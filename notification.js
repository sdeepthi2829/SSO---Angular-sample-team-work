$(function() {
	Notification = Backbone.Model.extend({

		idAttribute : 'NotificationID',

		url : function() {

			var base = atmometadata.getNotificationAPIEndpoint(login.homeFederationMemberId());

			return this.isNew() ? base : base + '/' + encodeURIComponent(this.id);

		},
		destroy : function(params) {

			var destroyurl = atmometadata.getUsersAPIEndpoint(login.homeFederationMemberId()) + "/" + login.userFDN() + "/notifications/" + this.id + "/state";

			// return this.save(null, null, {url: destroyurl, contentType: "text/plain", data: "archived"});
			$.ajax({
				type : "PUT",
				url : destroyurl,
				contentType : "text/plain",
				data : "archived",
				dataType : "html",
				async:false,
				context : {
					model : this
				},
				success : function(data, status, xhr) {
					var triggerDestroy = function() {
						model.trigger('destroy', model, model.collection, options);
					};
					return xhr;
				}
			});
			return true;
		}
	});

	Notifications = Backbone.Collection.extend({

		model : Notification,
		
		 initialize: function (args) {
			 if(args)
			 {
			 	this.start = args;
			 }	
			 else{
				 this.start = 0;
			 }
		 },

		url : function() {
			return atmometadata.getUsersAPIEndpoint(login.homeFederationMemberId()) + "/" + login.userFDN() + "/notifications?count=100&start=" + this.start;
		},
		
		

		parse : function(resp, xhr) {
			var entities = [];
			if(typeof resp.channel.item != 'undefined'){
				var items = resp.channel.item;
				var totalResults = resp.channel.totalResults;
				for ( var i = 0; i < items.length; i++) {
					try {
						var object = items[i];
						var pubDate = object.pubDate;
						var time = new Date(pubDate.substring(0, pubDate.length - 4)).getTime();
						var date = new Date(time);
	
						// IE8 doesn't support this property, had to format date and time here.
						// pubDate = date.toISOString();
						var postDate = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
						var postTime = date.toLocaleTimeString();
	
						var entity = new Notification({
							"NotificationID" : object.guid.value,
							"Subject" : object.title,
							"Content" : object.description,
							"GuidId" : object.guid.value.replace(/\./gi, ''),
							"Reference" : object.EntityReferences ? object.EntityReferences.EntityReference[0] : {},
							"PostDate" : postDate,
							"PostTime" : postTime
						});
						var iconClass;
						if (object.category[0].domain == "uddi:soa.com:resourcetype") {
							iconClass = "notification_iconSpacer";
						}
						if (object.category[0].value.match(/ticket/i)) {
							iconClass = "notification_iconTicket";
						} else if (object.category[0].value.match(/alert/i)) {
							iconClass = "notification_iconAlert";
							// make link active
							// data.channel.item[i].linkClass = "resource_item_active";
						} else if (object.category[0].value.match(/post/i)) {
							// make link active
							// data.channel.item[i].linkClass = "resource_item_active";
						}
						entity.set({
							"IconClass" : iconClass
						});
						entities.push(entity);
					} catch (e) {
						alert(e);
						break;
					}
				}
			}
			return entities;

		}
	});

});