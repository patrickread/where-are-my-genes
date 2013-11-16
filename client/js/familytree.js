var showAddEditDialog = false;
var showMainAlert = false;
Meteor.subscribe("members");

if (Meteor.isClient) {
  Template.layout.events({
    'click .add-new-member' : function () {
      Session.set("current_member", undefined);
      $(".add").hide();
      showAddEditDialog = true;
      $(".add-member-form").show();
      return false;
    },
    'click .add-yourself' : function() {
      $(".add").hide();
      $(".add-member-form").show();
      fillInUsername();
      return false;
    }
  });
  Template.addEditDialog.events({
    'click .add-family-submit' : function () {
      $(".add").show();
      showAddEditDialog = false;
      $(".add-member-form").hide();
      addFamilyMember();
      return false;
    },
    'click .cancel-button' : function () {
      $(".add").show();
      showAddEditDialog = false;
      $(".add-member-form").hide();
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
        Members.remove(member._id);
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
  }
};

Template.home.members = function () {
  var members = Members.find().fetch();
  for (var i=0; i<members.length; i++) {
    var memberDate = getMemberDateInfo(members[i]);
    members[i].dateInfo = memberDate;
  }
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

function addFamilyMember() {
  var member = {
                  first_name: $("#first-name").val(), 
                  middle_name: $("#middle-name").val(), 
                  last_name: $("#last-name").val(),
                  date_of_birth: new Date($("#date-of-birth").val()),
                  photo_url: $(".user_photo").attr("src")
                };
  if (Session.get("current_member") !== undefined) {
    member._id = Session.get("current_member")._id;
  }
  Meteor.call('addFamilyMember', member, function (error, result) {
    if (error === undefined) {
      if (result.responseMessage !== undefined) {
        alert(result.responseMessage);
        Session.set("current_member", undefined);
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