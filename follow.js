Follower = Backbone.Model.extend({
	idAttribute : 'FollowerID'
});

Followers = Backbone.Collection.extend({
	model : Follower,
	initialize : function(args) {
		this.id = args.APIID;
	},
	url : function() {
		return '/api/apis/' + this.id + '/followers';
	},
	parse : function(resp, xhr) {
		var entities = [];

		for (object in resp.channel.item) {
			object = resp.channel.item[object];
			var entity = new Follower({
				FollowerID : object.guid.value,
				Name : object.title,
				UserID : getReferenceUserDN(object),
				AvatarURL : object.Image.Url
			});

			entities.push(entity);
		}

		return entities;
	}
});

Following = Backbone.Model.extend({
	idAttribute : 'FollowingID'
});

Followings = Backbone.Collection.extend({
	model : Following,
	initialize : function(args) {
		this.id = args.UserID;
	},
	url : function() {
		return atmometadata.getUsersAPIEndpoint(new FDN(this.id)) + '/' + this.id + '/followings';
	},
	parse : function(resp, xhr) {
		var entities = [];

		for (object in resp.channel.item) {
			object = resp.channel.item[object];
			var entity = new Follower({
				FollowingID : object.guid.value,
				FollowedID : getReferenceFollowedResourceDN(object),
				Name : object.title
			});

			entities.push(entity);
		}

		return entities;
	}
});
