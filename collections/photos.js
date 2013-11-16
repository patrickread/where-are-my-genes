Photos = new Meteor.Collection("photos");

Photos.allow({
	insert: function (userId, photo) {
		return userId && photo.user_id === userId;
	},
	update: function (userId, photo, fields, modifier) {
		return _.all(members, function (member) {
			if (userId !== photo.user_id) {
				return false; // not the owner user
			}

			return true;
		});
	},
	remove: function (userId, photos) {
		var canDelete = true;
		for (var i=0; i<photos.length; i++) {
			if (userId == undefined || photos[i].user_id !== userId) {
				return false;
			}
		}
		return true;
	}
});