//= require resource.js
/*globals $ Backbone AtmoResource atmometadata FDN*/
$(function () {
    /*
     * Document object
     */
	Document = Backbone.Model.extend({

		idAttribute : 'Path',

		initialize : function(args) {

			this.viewObj = args.viewObj;

		},
		url : function() {
			var contentUrl = [];
			var viewObj = this.viewObj;
			// build base url base on view object
			if(viewObj.objectType) contentUrl.push(viewObj.objectType);
			if(viewObj.objectId) contentUrl.push(viewObj.objectId);
			if(viewObj.viewName) contentUrl.push(viewObj.viewName);
			
			loadfile = (viewObj.viewExt) ? viewObj.viewExt : ((viewObj.querystring) ? viewObj.querystring : widgetInstance.defaultDocument);
			contentUrl.push(loadfile);
			
			contentUrl = contentUrl.join('/');
			contentUrl = atmometadata.getContentAPIEndpoint(new FDN(currentView.objectId)) + '/' + contentUrl;
			
			var base = atmometadata.getContentAPIEndpoint(login.homeFederationMemberId());
			return this.isNew() ? base : base + '/' + encodeURIComponent(this.id);

		}
	});

	Documents = Backbone.Collection.extend({

		model : Document,

		initialize : function(args) {

			this.viewObj = args.viewObj;

		},

		url : function() {
			var contentUrl = [];
			var viewObj = this.viewObj;
			// build base url base on view object
			if(viewObj.objectType) contentUrl.push(viewObj.objectType);
			if(viewObj.objectId) contentUrl.push(viewObj.objectId);
			if(viewObj.viewName) contentUrl.push(viewObj.viewName);
			/*
			loadfile = (viewObj.viewExt) ? viewObj.viewExt : ((viewObj.querystring) ? viewObj.querystring : widgetInstance.defaultDocument);
			contentUrl.push(loadfile);
			
			// check if ends with file extension
			filepathext = contentUrl[contentUrl.length-1];
			fileext = filepathext.split('/');
			fileext = fileext[fileext.length-1];
			if(fileext.indexOf('.') == -1) {
				filepathext += '/' + ((viewObj.querystring) ? viewObj.querystring : widgetInstance.defaultDocument);
				contentUrl[contentUrl.length-1] = filepathext;
			}
			*/
			contentUrl = contentUrl.join('/');
			contentUrl = atmometadata.getContentAPIEndpoint(new FDN(currentView.objectId)) + '/' + contentUrl;
			
			return contentUrl;
		},

		parse : function(resp, xhr) {
			var entities = [];

			if (resp) {
				for (var object in resp.channel.item) {
					object = resp.channel.item[object];
	
					var entity = new Document({
						Path : object.link,
						Name : object.title,
						Description : object.description,
						Type : getEntityReference(object, 'file')
					});
	
					entities.push(entity);
				}
			}
			return entities;

		}
	});
	
});
