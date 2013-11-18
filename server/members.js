Meteor.publish("members", function () {
  return Members.find(
    {user_id: this.userId});
});

Meteor.publish("photos", function () {
  return Photos.find(
    {user_id: this.userId});
})

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.call("S3config",{
      key: 'AKIAJNMWAJRYWKMKRQIQ',
      secret: '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',
      bucket: 'jameskpolk'
    });
  });
}

Meteor.methods({
  addFamilyMember: function (member) {
    console.log("member! " + (member._id || ""));
    if (Meteor.userId()) {
      member.user_id = Meteor.userId();
      if (member._id === undefined) {
        member._id = Random.id();
      }
      Members.upsert(member._id, member);
      if (member._id === undefined) {
        member.responseMessage = "Member created!";
      } else {
        member.responseMessage = member.first_name + " " + member.last_name + " was edited!";
      }

      return member;
  } else {
    return null;
  }
  },
  waitingForPhoto: function(memberId) {
    console.log("waiting for photo!");
    if (Meteor.userId()) {
      Photos.insert({
        user_id: Meteor.userId(),
        member_id: memberId,
        upload_time: Date.now()
      });
    }
  },
  s3UploadFinished:function(url,context) {
      console.log('Add ' + url + ' to the id of ' + context);
      var photos = Photos.find({user_id: Meteor.userId()}, {sort: {upload_time: -1}}).fetch();
      console.log("photos count: " + photos.length);
      if (photos !== undefined && photos.length > 0) {
        console.log("getting member with ID: " + photos[0].member_id);
        var members = Members.find({_id: photos[0].member_id}).fetch();
        if (members !== undefined && members.length > 0) {
          console.log("got member: id: " + members[0]._id + " name: " + members[0].first_name + " url: " + url);
          members[0].photo_url = url;
          Members.update(members[0]._id, members[0]);
        }
      }
    }
});