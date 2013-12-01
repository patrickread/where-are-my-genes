var familyMemberWidth = 320;
var familyMemberHeight = 180;
var familyMemberMargin = 60;
var unions;

Meteor.publish("members", function () {
  return Members.find({user_id: this.userId});
});

Meteor.publish("unions", function () {
  return Unions.find(
    {user_id: this.userId});
});

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
  addFamilyMember: function (member, relationships) {
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

      return {"member": member, "relationships": relationships};
    } else {
      return null;
    }
  },
  deleteMember: function (member) {
    if (Meteor.userId()) {
      Members.remove(member);
    }
  },
  addUnion: function (union) {
    if (Meteor.userId()) {
      union.user_id = Meteor.userId();
      if (union._id === undefined) {
        union._id = Random.id();
      }
      Unions.upsert(union._id, union);
      if (union._id === undefined) {
        union.responseMessage = "Union created!";
      } else {
        union.responseMessage = "Union edited!";
      }

      return union;
    } else {
      return null;
    }
  },
  findUnionsByMember: function (memberID) {
    var unionsAll = Unions.find().fetch();
    console.log("memberID: " + memberID + " id: " + "oEaBXPhjk2RoYLqXZ");
    var fuck = Unions.find({"members": {$elemMatch: {"_id":"oEaBXPhjk2RoYLqXZ"}}}).fetch();
    console.log("mongo query: " + fuck.length);
    var unions = Unions.find({"members" : 
                            { $elemMatch: 
                              {"_id" : memberID} 
                            }
                          }).fetch();
    console.log("my query: " + unions.length);
    return "tits!";
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