Unions = new Meteor.Collection("unions", {idGeneration: 'STRING'});

Unions.allow({
	insert: function (userId, union) {
		members = Members.find({_id: {$in: union.members}});
		var allMembersWithUser = true;
		for (var i=0; i<members.length; i++) {
			if (members[i].user_id !== userId) {
				allMembersWithUser = false;
				break;
			}
		}
		return userId === union.user_id && allMembersWithUser;
	},
	update: function (userId, unions, fields, modifier) {
		return _.all(unions, function (union) {
			members = Members.find({_id: {$in: union.members}});
			var allMembersWithUser = true;
			for (var i=0; i<members.length; i++) {
				if (members[i].user_id !== userId) {
					allMembersWithUser = false;
					break;
				}
			}
			if (!allMembersWithUser) {
				return false; // trying to update a union with an unauthorized user
			}

			for (var i=0; i<unions.length; i++) {
				if (userId !== unions[i].user_id) {
					return false;
				}
			}

			return true;
		});
	},
	remove: function (userId, unions) {
		members = Members.find({_id: {$in: union.members}});
		var allMembersWithUser = true;
		for (var i=0; i<members.length; i++) {
			if (members[i].user_id !== userId) {
				allMembersWithUser = false;
				break;
			}
		}
		if (!allMembersWithUser) {
			return false; // trying to remove a union with an unauthorized user
		}

		for (var i=0; i<unions.length; i++) {
			if (userId !== unions[i].user_id) {
				return false;
			}
		}

		return true;
	}
});