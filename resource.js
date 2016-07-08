//= require search.js
/*globals $ Backbone SearchResultList*/

// TODO: add documentation on usage
// TODO: use federation libraries
// TODO: cleanup AtmoResource.factory to provide a url function to the resources
// TODO: add other items to the ResourceFactory
$(function() {

	/**
	 * Generic class for creating resources understood by the Atmosphere API
	 */
	AtmoResource = Backbone.Model.extend({
		type : null,
		UserRoles : null,

		isReadable : function() {
			return true;
		},

		url : function() {
			var base = this.base_url(this.id);
			return (this.isNew()) ? base : base + '/' + encodeURIComponent(this.id);
		},

		fedID : function() {
			atmometadata.getFederationMemberId();
		},

		base_url : function(id) {
			var url, federationMemberIDOrFDN;
			if (this.id === undefined) {
				federationMemberIDOrFDN = atmoconsolehomemetadata.federationMemberId;
			} else {
				federationMemberIDOrFDN = new FDN(this.id);
			}

			logger.info("federationMemberIDOrFDN is: " + federationMemberIDOrFDN);

			switch (this.type) {
			case "api":
				url = atmometadata.getAPIsAPIEndpoint(federationMemberIDOrFDN);
				break;
			case "app":
				url = atmometadata.getAppsAPIEndpoint(federationMemberIDOrFDN);
				break;
			case "user":
				url = atmometadata.getUsersAPIEndpoint(federationMemberIDOrFDN);
				break;
			case "group":
				url = atmometadata.getGroupAPIEndpoint(federationMemberIDOrFDN);
				break;
			default:
				logger.error("unknown resource type for '" + this.type + "' cannot compute base_url!");
			}

			logger.info("base url: " + url);
			return url;
		},

		applyFilter : function(param) {
			return true;
		}
	});

	/**
	 * Factory method to instantiate sub-classes of Resources
	 * 
	 * @param {Object}
	 *            type the type of resource your want to make
	 * @param {Object}
	 *            args any args to pass to the resource constructor
	 */
	AtmoResource.factory = function(type, args) {
		var resource;
		switch (type) {
		case "api":
			// This is a hack around the use of APIID as the id
			if (args && args.id) {
				args.APIID = args.id;
				delete args.id;
			}
			resource = new Api(args);
			break;
		case "app":
			// This is a hack around the use of AppID as the id
			if (args && args.id) {
				args.AppID = args.id;
				delete args.id;
			}
			resource = new App(args);
			break;
		case "app-version":
			// This is a hack around the use of AppID as the id
			if (args && args.id) {
				args.APPVersionID = args.id;
				delete args.id;
			}
			resource = new AppVersion(args);
			break;
		case "user":
			// This is a hack around the use of AppID as the id
			if (args && args.id) {
				args.UserID = args.id;
				delete args.id;
			}
			resource = new User(args);
			break;
		case "group":
			// This is a hack around the use of AppID as the id
			if (args && args.id) {
				args.GroupID = args.id;
				delete args.id;
			}
			resource = new Group(args);
			break;

		case "system":
			resource = new System({
				Name : "Administrator"
			});
			break;
		default:
			throw new Error("Unable to location a resource of type='" + type + "'");
		}
		return resource;
	};

	// API --------------------------------------------------
	/**
	 * Defines an API version. An API version only exists within the context of
	 * an API
	 */
	ApiVersion = Backbone.Model.extend({
		type : 'apiversion',
		idAttribute : 'APIVersionID',
		deepFetch : function(fetchConfig) {
			this.doFetchTarget = true;
			this.doFetchProxy = true;
			this.fetch({
				async : fetchConfig.async,
				success : fetchConfig.success
			});
		},
		fetchProxy : function() {
			this.doFetchProxy = true;
			this.fetch();
		},

		url : function() {
			var queryParams = [];
			if (this.doDeepFetch) {
				this.doFetchProxy = true;
				this.doFetchTarget = true;
			}

			if (this.doFetchTarget) {
				queryParams.push('includeTargetAPI=true');
			}
			if (this.doFetchProxy) {
				queryParams.push('includeOperations=true');
			}
			var queryString = '';
			if (queryParams.length > 0) {
				queryString = '?' + queryParams.join('&');
			}
			var baseUrl = atmometadata.getAPIsAPIEndpoint(new FDN(this.get('APIID') ? this.get('APIID') : this.id));
			return (this.isNew()) ? baseUrl + '/' + encodeURIComponent(this.get('APIID')) + '/versions' : baseUrl + '/versions/' + encodeURIComponent(this.id) + queryString;
		},

		legals : function() {
			var agreementDocuments = new AgreementDocuments({
				apiVersionID : this.id
			});
			agreementDocuments.fetch({async:false});
			return agreementDocuments;
		},

		groups_url : function() {
			return this.url() + '/viewers';
		}
	});

	/**
	 * Defines an API objet
	 */
	Api = AtmoResource.extend({
		type : 'api',
		idAttribute : 'APIID',

		deepFetch : function(fetchConfig) {
			this.fetch({
				async : fetchConfig.async,
				success : function(api) {
					// Assume the latestVersion if versionID is not specified
					if (!fetchConfig.objectVersionId) {
						versionID = api.attributes.LatestVersionID;
					}
					var apiVersion = api.versionInfo(fetchConfig.objectVersionId);
					apiVersion.deepFetch({
						async : fetchConfig.async,
						success : function(apiVersion) {
							api.attributes.APIVersion = apiVersion.attributes;
							fetchConfig.success.apply(api, [ api ]);
						}
					});

				}
			});

		},

		versionInfo : function(apiVersionId) {
			return new ApiVersion({
				APIVersionID : apiVersionId,
				APIID : this.id
			});
		},

		url : function() {
			return (this.isNew()) ? this.base_url() : this.base_url() + '/' + encodeURIComponent(this.id);
		},

		related : function(tags, callback) {
			if (tags && tags.forEach) {
				var params = [];
				tags.forEach(function(value, index, ar) {
					params.push('tags:' + value);
				});
				params = '(' + params.join(' OR ') + ')';
				var search = new SearchResultList({
					q : params,
					type : 'apiversion'
				});
				search.fetch({
					success : function() {
						callback(search);
					},
					error : function(args) {
						logger.error(args);
					}
				});
			}
		},

		groups_url : function() {
			return this.url() + "/groups";
		}
	});

	// APP --------------------------------------------------

	/**
	 * Defines an APP version. An APP version only exists within the context of
	 * an APP
	 */
	AppVersion = Backbone.Model.extend({
		type : 'app-version',
		idAttribute : 'APPVersionID',
		url : function() {
			if (this.get('AppID')) {
				return atmometadata.getAppsAPIEndpoint(new FDN(this.get('AppID'))) + '/' + encodeURIComponent(this.get('AppID')) + '/versions';
			} else {
				return atmometadata.getAppsAPIEndpoint(new FDN(this.get('APPVersionID'))) + '/versions/' + this.get('APPVersionID');
			}
		},

		groups_url : function() {
			return this.url() + '/viewers';
		}
	});

	/**
	 * Pass in the AppID to retrieve the secret key
	 * 
	 * var secret = new AppVersionSecret({AppID:
	 * '6cgjhjw4CwI8AxuHV5zqEi8Y.atmosphere'}); secret.fetch({ success:
	 * function() { alert(secret.id); } });
	 */
	AppVersionSecret = Backbone.Model.extend({
		idAttribute : 'SharedSecret',
		url : function() {
			return atmometadata.getAppsAPIEndpoint(new FDN(this.get('AppID'))) + '/versions/' + encodeURIComponent(this.get('AppID')) + '/secret';
		}
	});

	/**
	 * Defines an app
	 */
	App = AtmoResource.extend({
		type : 'app',
		idAttribute : 'AppID',

		versionInfo : function() {
			return new AppVersion({
				AppID : this.id
			});
		},

		groups_url : function() {
			return this.url() + "/groups";
		}
	});

	GroupVersion = Backbone.Model.extend({
		type : 'groupversion',
		idAttribute : 'GroupID',
		url : function() {
			if (this.get('GroupVersionID')) {
				return '/api/group/' + this.get('GroupVersionID');
			} else {
				return '/api/group/' + encodeURIComponent(this.id) + '/versions';
			}
		},

		groups_url : function() {
			return this.url() + '/viewers';
		}
	});
	
	/**
	 * List of apps
	 */
	Apps = Backbone.Collection.extend({

		model : App,

		initialize : function(args) {
			args = args ? args : {};
			this.resource = args.resource;
		},

		url : function() {
			return atmometadata.getUsersAPIEndpoint(new FDN(login.userFDN())) + "/" + login.userFDN() + "/apps";
		},

		parse : function(resp, xhr) {
			var entities = [];

			for (var object in resp.channel.item) {
				object = resp.channel.item[object];
				var type = getResourceTypeCategoryValue(object);
				var entity = new AtmoResource.factory(type, {
					id : object.guid.value,
					Created : object.pubDate,
					Name : object.title,
					Description : object.description,
					DefaultVersionID : getReferenceAppVersionDN(object)
				});
				entities.push(entity);
			}

			return entities;
		}
	});
	
	/**
	 * List of appversions
	 */
	AppVersions = Backbone.Collection.extend({

		model : AppVersion,

		initialize : function(args) {
			args = args ? args : {};
			this.resource = args.resource;
		},

		url : function() {
			return atmometadata.getAppsAPIEndpoint(new FDN(login.userFDN())) + "/" + this.resource.get('AppID') + "/versions";
		},

		parse : function(resp, xhr) {
			var entities = [];

			for (var object in resp.channel.item) {
				object = resp.channel.item[object];
				
				var pubDate = object.pubDate;
				var time = new Date(pubDate.substring(0, pubDate.length - 4)).getTime();
				var date = new Date(time);
				
				var type = getResourceTypeCategoryValue(object);
				var entity = new AtmoResource.factory(type, {
					id : object.guid.value,
					Created : ISODateString(date),
					Name : object.title,
					Description : object.description
				});
				entities.push(entity);
			}

			return entities;
		}
	});

	

	System = AtmoResource.extend({
		idAttribute : 'SystemID',
		type : "system",

		url : function() {
			return "";
		},
		isReadable : function() {
			return false;
		},
		versionInfo : function() {
			return null;
		}
	});

	Group = AtmoResource.extend({
		idAttribute : 'GroupID',
		type : 'group',
		url : function() {
			if (this.get("fedmember") == null) {
				this.set({
					fedmember : atmoconsolehomemetadata.federationMemberId
				});
			}

			var result;
			if (this.id != null) {
				result = atmometadata.getGroupAPIEndpoint(new FDN(this.id)) + "/" + encodeURIComponent(this.id);
			} else if (this.isNew()) {
				result = atmometadata.getGroupAPIEndpoint(this.get("fedmember"));
			} else {
				result = atmometadata.getGroupAPIEndpoint(this.get("fedmember")) + "/" + encodeURIComponent(this.id);
			}
			return result;
		},
		
		isIndependentGroup : function() {
			return this.GroupType == "com.soa.group.type.independent" || this.attributes.GroupType == "com.soa.group.type.independent";
		},
		isPrivateApiGroup : function() {
			return this.GroupType == "com.soa.group.type.private.apigroup" || this.attributes.GroupType == "com.soa.group.type.private.apigroup";
		},
		parse : function(resp, xhr) {
			// copy all properties of "resp" to "this"
			this.GroupType = resp.GroupType;
			if (resp.GroupType == "com.soa.group.type.private.apigroup") { // Api
				// Group
				resp.version = resp.ContextObjectID; // TODO:
				// contextObjectID
				// can be api
				// version, appID,
				// businessID,
				// tenantID. hence,
				// renam "version"
				// to
				// contextObjectID
			}
			return resp;
		},

		versionInfo : function() {
			return null;
		},

		applyFilter : function(menuEntryKey) {
			if (menuEntryKey == 'resource.menu.group.admins') {
				return (this.get("GroupType") == "com.soa.group.type.independent") || (this.UserRoles && this.UserRoles.isAuthorized("Admin"));
			}
			if (menuEntryKey == 'resource.menu.group.board' || menuEntryKey == 'resource.menu.group.followers') {
				return (this.get("GroupType") == "com.soa.group.type.independent");
			}
			return false;
		}
	});

	ApiGroup = Group.extend({
		idAttribute : 'ApiGroupID',
		toJSON : function() {
			var group = {
					Name : this.get("Name"),
					Description : this.get("description"),
					GroupType : this.get("type"),
					Visibility : this.get("Visibility"),
					ContextObjectID : this.get("version")
				}
				, picture = $.trim(this.get("picture")) || ""
				, tagsList = this.get("Tag")
				, tags = []
				, adminCollection, admins = [], attrs = {}
			;
			$(tagsList).each(function(i,tag) {
				tags.push(tag);
			});
			group.Tag = tags;
			if (picture != "null" && picture != "") {
				group.PictureID = this.get("picture");
			}
			if (this.isNew()) {
				if (this.get("type") == "com.soa.group.type.independent") {
					attrs.Group = group;
				} else {
					adminCollection = this.get("Admins").models || {};
					$.each(adminCollection, function(i, admin) {
						admins.push(admin.get("fdn"));
					});
					attrs.Administrators = admins;
					attrs.Group = group;
				}
				return attrs;
			}
			return group;
		}
	});

	Groups = Backbone.Collection.extend({

		model : Group,

		initialize : function(args) {
			args = args ? args : {};
			this.resource = args.resource;
		},

		url : function() {
			var url1 = (this.resource ? this.resource.groups_url() : nil);
			return url1;
		},

		parse : function(resp, xhr) {
			var entities = [];

			for (var object in resp.channel.item) {
				object = resp.channel.item[object];

				var entity = new Group({
					GroupID : object.guid.value,
					Name : object.title,
					description : object.description,
					GroupType : getCategoryValue(object, "com.soa.group.type")
				});

				entities.push(entity);
			}

			return entities;
		}
	});

	/**
	 * Defines a contract
	 */
	Contract = Backbone.Model.extend({

		idAttribute : 'ContractID',

		url : function() {
			var base = atmometadata.getContractsAPIEndpoint(login.homeFederationMemberId());
			return this.isNew() ? base : base + '/' + encodeURIComponent(this.id);
		}
	});

	/**
	 * How to use a Rating object
	 * 
	 * //To save a new rating: var rating = new Rating({resource: aResource,
	 * Rating: 1-5}) rating.save();
	 * 
	 * //tip: you can get a resource using the AtmoResource.factory method --
	 * see above
	 * 
	 * //To fetch an existing rating: var existingRating = new Rating({resource:
	 * aResource, id: login.userFDN());
	 * 
	 * //To edit: existingRating.attributes.Rating = 5; existingRating.save();
	 * 
	 * //To delete: existingRating.destroy();
	 * 
	 * //To check if a rating exists for the user: var existingRating = new
	 * Rating({resource: aResource, id: login.userFDN()); var is_there_a_rating =
	 * existingRating.hasRating();
	 * 
	 */
	Rating = Backbone.Model.extend({

		initialize : function(args) {
			args = args ? args : {};
			this.resource = args.resource;
			this.resourceVersion = args.resourceVersion;
			if (this.resource) {
				this.attributes.ID = this.resource.id;
			}
		},

		validate : function(attrs) {
			// return (attrs.Rating && this.resource);
		},

		url : function() {
			var rsc = this.resource;
			var rscVersion = this.resourceVersion;
			var base;
			if (rsc.type === 'group') {
				base = atmometadata.getRootEndpointByFedmember(new FDN(rsc.attributes.id)) + '/api/' + rsc.type + 's/' + rsc.attributes.id + '/ratings/' + this.attributes.id;
			} else {
				base = atmometadata.getRootEndpointByFedmember(new FDN(rscVersion.attributes.id)) + '/api/' + rsc.type + 's/versions/' + encodeURIComponent(rscVersion.attributes.id) + '/ratings/' + this.attributes.id;
			}
			return this.isNew() ? base : base;
		},

		parse : function(resp, xhr) {
			if (resp && resp.UserID) {
				resp.id = resp.UserID;
			}
			return resp;
		},

		toJSON : function() {
			// the API is *very* specific about what fields it will accept...
			// check this method if you get 400 errors about illegal method
			// calls
			var attrs = {
				ID : this.attributes.ID,
				UserID : this.attributes.UserID,
				Rating : this.attributes.Rating
			};

			return attrs;
		},

		hasRating : function() {
			return (this.attributes.Rating != null);
		}

	});

	Contracts = Backbone.Collection.extend({
		model : Contract,
		initialize : function(args) {
			args = args ? args : {};
			if (args.resource) {
				this.resource = args.resource;
				/*
				 * this.versionID = args.versionID; if (this.resource) {
				 * this.attributes.ID = this.resource.id; }
				 */
			}
		},

		parse : function(resp, xhr) {
			var entities = [];

			for (var object in resp.channel.item) {
				object = resp.channel.item[object];

				var entity = new Contract({
					ContractID : object.guid.value,
					Name : object.title,
					AppVersionID : getReferenceAppVersionDN(object),
					AppID : getReferenceAppDN(object),
					APIVersionID : getReferenceAPIVersionDN(object),
					APIID : getReferenceApiDN(object),
					Endpoint : object.Endpoint,
					APIVersionName : getReferenceAPIVersionNo(object),
					ApiName : getReferenceApiName(object),
					APPVersionName : getReferenceAppVersionNo(object),
					AppName : getReferenceAppName(object),
					WfState : getWorkflowState(object),
					Environment : getApiContractEnvironment(object)
				});

				entities.push(entity);
			}
			return entities;
		}
	});

	ApiContracts = Contracts.extend({

		url : function() {
			var rsc = this.resource;
			var base = atmometadata.getAPIsAPIEndpoint(new FDN(rsc.get('versionID')));
			var myUrl = base + '/versions/' + encodeURIComponent(rsc.get('versionID')) + '/connectedapps';
			return myUrl;
		}

	});

	AppContracts = Contracts.extend({

		url : function() {
			var rsc = this.resource;
			var base = atmometadata.getAppsAPIEndpoint(new FDN(rsc.get('versionID')));
			var myUrl = base + '/versions/' + encodeURIComponent(rsc.get('versionID')) + '/contracts';
			return myUrl;
		}

	});

	HostEndpoint = Backbone.Model.extend({

	});

	DeploymentZones = Backbone.Collection.extend({
		model : HostEndpoint,
		url : function() {
			return '/api/deploymentzones';
		},

		parse : function(resp) {
			var entities = [];
			for ( var i = 0; i < resp.channel.item.length; i++) {
				var object = resp.channel.item[i];
				object = resp.channel.item[i];
				var entity = new HostEndpoint({
					Endpoint : object.link,
					Name : object.title
				});
				if (object.guid && object.guid.value) {
					entity.id = object.guid.value;
				} else {
					entity.id = object.title;
				}

				var category = object.category;
				var environments = [];

				for ( var j = 0; j < category.length; j++) {
					environments.push(category[j].value);
				}
				entity.set({
					Environment : environments
				});
				entities.push(entity);
			}
			return entities;

		}
	});

	HostEndpoints = Backbone.Collection.extend({
		model : HostEndpoint,
		initialize : function(args) {
			args = args ? args : {};
			if (args.APIVersionID) {
				this.APIVersionID = args.APIVersionID;
			}
		},
		url : function() {
			var base = atmometadata.getAPIsAPIEndpoint(login.homeFederationMemberId());
			return base + '/hostendpoints' + (this.APIVersionID ? '?apiVersionID=' + this.APIVersionID : '');
		},

		parse : function(resp, xhr) {
			var entities = [];

			for (var object in resp.channel.item) {
				object = resp.channel.item[object];

				var entity = new HostEndpoint({
					Endpoint : object.link,
					Name : object.title,
					Description : object.description
				});

				entities.push(entity);
			}

			return entities;

		}
	});

	Review = Backbone.Model.extend({
		idAttribute : 'ReviewID',
		url : function() {
			var url = this.isNew() ? atmometadata.getReviewsAPIEndpoint(new FDN(this.attributes.ReviewSubjectID)) : atmometadata.getReviewsAPIEndpoint(new FDN(this.id)) + '/' + encodeURIComponent(this.id);
			return url;
		}
	});

	Reviews = Backbone.Collection.extend({
		model : Review,
		initialize : function(args) {
			args = args ? args : {};
			this.resource = args.resource;
			if (args.APIVersionID)
				this.APIVersionID = args.APIVersionID;
			if (args.RetrievingUserID)
				this.RetrievingUserID = args.RetrievingUserID;
			if (args.SortBy)
				this.SortBy = args.SortBy;
			if (args.Tag) {
				this.SearchByTag = args.Tag;
			}
		},
		url : function() {
			var rsc = this.resource;
			if (this.APIVersionID) {
				// fetch by version
				url = atmometadata.getRootEndpointByFedmember(new FDN(this.APIVersionID)) + '/api/' + rsc.type + 's/versions/' + this.APIVersionID + '/board?ItemType=Review';
			} else {
				url = atmometadata.getRootEndpointByFedmember(new FDN(rsc.id)) + '/api/' + rsc.type + 's/' + encodeURIComponent(rsc.id) + '/board?ItemType=Review';
			}
			if (this.RetrievingUserID)
				url += "&RetrievingUserID=" + this.RetrievingUserID;

			if (this.SortBy) {
				url += '&SortBy=' + this.SortBy;
			}
			if (this.SearchByTag) {
				url += "&Tag=" + this.SearchByTag;
			}
			return url;
		},
		parse : function(resp, xhr) {
			var entities = [];

			for (var object in resp.channel.item) {
				object = resp.channel.item[object];
				var entity = new Review({
					ReviewID : object.guid.value,
					Topic : object.title,
					ReviewSubjectID : object.EntityReference.Guid,
					Content : object.description,
					Created : object.pubDate,
					Comments : object.CommentsPreview.Count,
					Marks : object.Marks.Count,
					IsMarked : object.Marks.isMarkedByReader,
					UserID : object.AuthoringUser.ID,
					UserName : object.AuthoringUser.Name
				});

				entities.push(entity);
			}

			return entities;
		}
	});
});
