var members;

function SubscribeToMembers() {
    var userEmail = GetUserEmail();

    if (userEmail != undefined) {
      Meteor.subscribe('members', userEmail);

      Members = new Meteor.Collection("members");
      members = Members.find();
    }
}

function GetUserEmail() {
  var user = Meteor.users.findOne(Meteor.userId());
  var userEmail;
  if (user != undefined && user.emails != undefined && user.emails.length > 0 && user.emails[0].address != undefined)
    userEmail = user.emails[0].address;
  return userEmail;
}