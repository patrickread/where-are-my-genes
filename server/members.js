Meteor.publish("members", function () {
  return Members.find(
    {user_id: this.userId});
});

if (Meteor.isServer) {
  Meteor.startup(function () {

    Members = new Meteor.Collection("members");
    
    // Publish complete set of patients to all clients.
    Meteor.publish('members', function (user) {
      	return Members.find({"userid": user});
    });
  });
}