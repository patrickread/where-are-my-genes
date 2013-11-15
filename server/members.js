Meteor.publish("members", function () {
  return Members.find(
    {user_id: this.userId});
});

if (Meteor.isServer) {
  Meteor.startup(function () {

  });
}

Meteor.methods({
  addFamilyMember: function (member) {
  	console.log("member! " + member);
  	if (Meteor.userId()) {
	  	member.user_id = Meteor.userId();
	  	member._id = Random.id();
	    Members.insert(member);

	    member.responseMessage = "Member created!";
	    return member;
	} else {
		return null;
	}
  },
});