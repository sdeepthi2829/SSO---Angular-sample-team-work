$(function() {
	Administrator = Backbone.Model.extend({
		idAttribute : 'AdministratorID',
		destinationRole : ""
	});

	Administrators = Backbone.Collection.extend({
		model : Administrator,
		idAttribute : 'AdministratorID',
		canToggle : false,

		url : function() {
			var federationMemberIDOrFDN = new FDN(this.id);
			return atmometadata.getAPIsAPIEndpoint(federationMemberIDOrFDN) + '/' + encodeURIComponent(this.id) + '/admins';
		},

		parse : function(resp, xhr) {
			var entities = [];

			for (var object in resp.channel.item) {
				object = resp.channel.item[object];

				var stateCategory = getCategory(object, 'uddi:soa.com:status');
				stateCategory = this.mapStatus(stateCategory.value);

				var entity = new Administrator({
					fdn : object.guid.value,
					Name : object.title,
					Email : object.description,
					State : stateCategory,
					role : "com.soa.group.membership.role.admin",
					roleLabel : "Administrator"
				});
				entity.id = object.guid.value;
				entities.push(entity);
			}

			return entities;
		},

		mapRole : function(category) {
			if (category != null) {
				if (category == "com.soa.group.membership.role.admin") {
					return "Administrator";
				} else if (category == "com.soa.group.membership.role.member") {
					return "Member";
				} else if (category == "com.soa.group.membership.role.leader") {
					return "Leader";
				} else {
					return category;
				}
			}
			return null;
		},

		mapStatus : function(category) {
			if (category != null) {
				if (category == "com.soa.group.membership.state.approved") {
					return "approved";
				} else if (category == "com.soa.group.membership.state.pending") {
					return "pending";
				} else if (category == "com.soa.group.membership.state.disapproved") {
					return "declined";
				} else if (category == "com.soa.group.membership.state.removed") {
					return "removed";
				} else {
					return category;
				}
			}
			return null;
		}
	});

	Viewer = Backbone.Model.extend({
		idAttribute : 'ViewerID',
		url : function() {
			return atmometadata.getAPIsAPIEndpoint(new FDN(this.get("version"))) + '/versions/' + this.get("version") + '/viewers/' + this.get("groupid");
		},
		sync : function(method, model, options) {
			options.dataType = 'text';
			return Backbone.sync(method, model, options);
		}
	});

	Membership = Backbone.Model.extend({

		idAttribute : 'MemberID',
		destinationRole : "",

		url : function() {
			if (this.resource) {
				console.log("has resource");
				// Get the admins for this resource
				var rsc = this.resource;
				if (rsc.type === 'app') {
					return '/api/' + rsc.type + 's/' + encodeURIComponent(rsc.id) + '/members/' + this.id;
				} else {
					return '/api/' + rsc.type + 's/' + encodeURIComponent(rsc.id) + '/admins/' + this.id;
				}
			} else {
				// Get the group members
				return atmometadata.getGroupAPIEndpoint(new FDN(this.get("GroupID"))) + '/' + this.get("GroupID") + '/members/' + this.id;
			}
		},

		updateRole : function(options) {
			this.destinationRole = options.currentRole;
			options.dataType = 'text';
			options.url = this.url() + "/role";
			options.contentType = "application/json";
			options.dataType = 'text';
			options.data = options.currentRole;
			return Backbone.sync("update", this, options);
		},

		sync : function(method, model, options) {
			if (method == 'delete') {
				options.url = this.url() + "?Comment=" + model.get("comment");
			}
			return Backbone.sync(method, model, options);
		}
	});

	Memberships = Backbone.Collection.extend({
		administrator : null,
		model : Membership,
		canToggle : true,

		initialize : function(args) {
			args = args ? args : {};
			this.resource = args.resource;
		},

		url : function() {
			if (this.resource) {
				// Get the admins for this resource
				var rsc = this.resource;
				if (rsc.type === 'app') {
					return '/api/' + rsc.type + 's/' + encodeURIComponent(rsc.id) + '/members';
				} else {
					return '/api/' + rsc.type + 's/' + encodeURIComponent(rsc.id) + '/admins';
				}
			} else {
				// Get the group members
				return atmometadata.getGroupAPIEndpoint(new FDN(this.id)) + '/' + this.id + '/members';
			}

		},

		parse : function(resp, xhr) {
			var entities = [];

			for (var x in resp.channel.item) {
				object = resp.channel.item[x];
				var role = getCategory(object, 'uddi:soa.com:role');
				var roleValue = role ? role.value : null;
				var roleLabel = role ? this.mapRole(role.value) : null;

				var stateCategory = getCategory(object, 'uddi:soa.com:status');
				var stateLabel = stateCategory ? this.mapStatus(stateCategory.value) : null;

				var entity = new Membership({
					fdn : object.guid.value,
					Name : object.title,
					Email : object.description,
					State : stateLabel,
					role : roleValue,
					roleLabel : roleLabel,
					AvatarURL : object.Image.Url
				});

				entity.id = object.guid.value;
				if (roleLabel == "Administrator") {
					this.administrator = object.guid.value;
				}
				entities.push(entity);
			}

			return entities;
		},

		mapRole : function(category) {
			if (category != null) {
				if (category == "com.soa.group.membership.role.admin") {
					return "Administrator";
				} else if (category == "com.soa.group.membership.role.member") {
					return "Member";
				} else if (category == "com.soa.group.membership.role.leader") {
					return "Leader";
				} else {
					return category;
				}
			}
			return null;
		},

		mapStatus : function(category) {
			if (category != null) {
				if (category == "com.soa.group.membership.state.approved") {
					return "approved";
				} else if (category == "com.soa.group.membership.state.pending") {
					return "pending";
				} else if (category == "com.soa.group.membership.state.disapproved") {
					return "declined";
				} else if (category == "com.soa.group.membership.state.removed") {
					return "removed";
				} else {
					return category;
				}
			}
			return null;
		}
	});

});
