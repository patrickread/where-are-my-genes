Members = new Meteor.Collection("members", {idGeneration: 'STRING'});

Members.allow({
	insert: function (userId, member) {
		return userId && member.user_id === userId;
	},
	update: function (userId, members, fields, modifier) {
		return _.all(members, function (member) {
			if (userId !== member.user_id) {
				return false; // not the owner user
			}

			return true;
		});
	},
	remove: function (userId, members) {
		var canDelete = true;
		for (var i=0; i<members.length; i++) {
			if (userId == undefined || members[i].user_id !== userId) {
				return false;
			}
		}
		return true;
	}
});