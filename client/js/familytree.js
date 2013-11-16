var showAddEditDialog = false;
var showMainAlert = false;
var mainAlertText = "";
var familyMemberWidth = 250;
var familyMemberHeight = 200;
var familyMemberMargin = 10;
Meteor.subscribe("members");
var members;

if (Meteor.isClient) {
  Template.layout.events({
    'click .add-new-member' : function () {
      Session.set("current_member", undefined);
      $(".add").hide();
      showAddEditDialog = true;
      $(".add-member-form").show();
      Session.set("parents", null);
      return false;
    },
    'click .add-yourself' : function() {
      $(".add").hide();
      $(".add-member-form").show();
      Session.set("parents", null);
      fillInUsername();
      return false;
    }
  });
  Template.addEditDialog.events({
    'click .add-family-submit' : function () {
      closeAddEditDialog();
      addFamilyMember();
      return false;
    },
    'click .cancel-button' : function () {
      closeAddEditDialog();
      return false;
    },
    'click #chk-alive' : function () {
      if ($("#chk-alive").prop('checked')) {
        $(".date-of-death-field").hide();
      } else {
        $(".date-of-death-field").show();
      }
    },
    'click .delete' : function () {
      var member = Session.get("current_member");
      if (member !== undefined) {
        Members.remove(member._id, function (error) {
          if (error === undefined) {
            closeAddEditDialog();
          } else {
            alert("Error while deleting! " + error.toString());
          }
        });
      }
      return false;
    },
    'click #photo-upload' : function () {
      var member = Session.get("current_member");
      Meteor.call('waitingForPhoto', member._id);
    }
  });
  Template.member.events({
    'click .edit' : function() {
      editFamilyMember(this);
      return false;
    },
  });
}

Template.home.rendered = function () {
  $( ".datepicker" ).datepicker({
    startView: 2,
    todayBtn: true,
    autoclose: true
  });

  if (!showAddEditDialog) {
    $(".add-member-form").hide();
  }

  if (!showMainAlert) {
    $("#main-alert").hide();
  } else {
    $("#main-alert").text(mainAlertText);
  }

  for (var i=0; i<members.length; i++) {
    if (members[i].x_pos !== undefined && members[i].y_pos !== undefined) {
      $("#" + members[i]._id).css("left", members[i].x_pos);
      $("#" + members[i]._id).css("top", members[i].y_pos);
    }
  }
};

Template.home.members = function () {
  members = Members.find().fetch();
  placeMembers(members);
  return members;
}

Template.addEditDialog.member = function () {
  if (Session.get("current_member") !== undefined) {
    var member = Session.get("current_member");
    member.date_of_birth_string = getDateString(member.date_of_birth);
    member.date_of_death_string = getDateString(member.date_of_death);
    return member;
  }

  return {};
}

function placeMembers(members) {
  var firstMember;
  var templateName = "member";
  var x = 0;
  for (var i=0; i<members.length; i++) {
    if (members[i].parents === null || members[i].parents === undefined) {
      positionMember(members, members[i], x, 0);
      x += familyMemberWidth + familyMemberMargin;
    }
  }
}

function positionMember(members, theMember, x, y) {
  theMember.x_pos = x;
  theMember.y_pos = y;
  var children = findMemberChildren(members, theMember._id);
  var childrenWidth = children.length * (familyMemberWidth + familyMemberMargin);
  var startX = x - childrenWidth / 2;
  for(var i=0; i<children.length; i++) {
    positionMember(members, 
                  children[i],
                  startX + i*(familyMemberWidth + familyMemberMargin),
                  y + familyMemberHeight + familyMemberMargin);
  }
}

function findMemberChildren(members, memberID) {
  var children = [];
  for (var i=0; i<members.length; i++) {
    if (members[i].parents !== undefined) {
      if (members[i].parents.indexOf(memberID) !== -1) {
        children.push(members[i]);
      }
    }
  }

  return children;
}

function findMemberById(members, id) {
  for (member in members) {
    if (member._id === id) {
      return member;
    }
  }

  return undefined;
}

function addFamilyMember(parent_ids) {
  var member = {
                  first_name: $("#first-name").val(), 
                  middle_name: $("#middle-name").val(), 
                  last_name: $("#last-name").val(),
                  date_of_birth: new Date($("#date-of-birth").val()),
                  date_of_death: new Date($("#date-of-death").val()),
                  photo_url: $(".user_photo").attr("src"),
                  parents: Session.get("parents")
                };
  if (Session.get("current_member") !== undefined) {
    member._id = Session.get("current_member")._id;
  }
  Meteor.call('addFamilyMember', member, function (error, result) {
    if (error === undefined) {
      if (result.responseMessage !== undefined) {
        alert(result.responseMessage);
        Session.set("current_member", undefined);
        Session.set("parents", undefined);
      }
    }
  });
}

function editFamilyMember(member) {
  $(".add").hide();
  showAddEditDialog = true;
  $(".add-member-form").show();
  $(".add-member-form").find("legend").text("Edit a family member");
  Session.set("current_member", member);
}

function alert(message) {
  $("#main-alert").show();
  $("#main-alert").text(message);
  mainAlertText = message;
  showMainAlert = true;
}

function fillInUsername() {
  var user = Meteor.user();
  if (user.profile != null && user.profile.name != null) {
    var names = user.profile.name.split(" ");
    if (names.length > 0) {
      $("#first-name").val(names[0]);
    }

    if (names.length > 2) {
      $("#middle-name").val(names[1]);
      $("#last-name").val(names[2]);
    } else if (names.length == 2) {
      $("#last-name").val(names[1]);
    }
  }
}

function closeAddEditDialog() {
  $(".add").show();
  showAddEditDialog = false;
  $(".add-member-form").hide();
}

/* HELPER METHODS */

function getMemberDateInfo(member) {
  if (member.date_of_death != undefined) {
    if (member.date_of_birth != undefined) {
      return getDateString(member.date_of_birth) + " - " + getDateString(member.date_of_death);
    } else {
      return getDateString(member.date_of_death);
    }
  } else if (member.date_of_birth != undefined) {
    return getDateString(member.date_of_birth);
  }

  return "";
}

function getDateString(date) {
  if (date !== undefined) {
    return pad((date.getMonth()+1), 2) + "/" 
                + pad(date.getDate(), 2) + "/" 
                + date.getFullYear();
  }

  return "";
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}