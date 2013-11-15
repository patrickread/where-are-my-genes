Meteor.subscribe("members");

if (Meteor.isClient) {
  Template.layout.events({
    'click .add-new-member' : function () {
      $(".add").hide();
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
  Template.add.events({
    'click .add-family-submit' : function () {
      $(".add").show();
      $(".add-member-form").hide();
      addFamilyMember();
      return false;
    },
    'click .cancel-button' : function () {
      $(".add").show();
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
    }
  });
  Template.member.events({
    'click .delete' : function () {
      Members.remove(this._id);
    },
    'click .edit' : function() {
      editFamilyMember(this);
    },
  });
}

Template.home.rendered = function () {
  $( ".datepicker" ).datepicker({
    startView: 2,
    todayBtn: true,
    autoclose: true
  });
  members = Members.find().fetch();
};

Template.home.members = function () {
  var members = Members.find().fetch();
  for (var i=0; i<members.length; i++) {
    var memberDate = getMemberDateInfo(members[i]);
    members[i].dateInfo = getDateString(memberDate);
  }
  return members;
}

function addFamilyMember() {
  var member = {
                  first_name: $("#first-name").val(), 
                  middle_name: $("#middle-name").val(), 
                  last_name: $("#last-name").val(),
                  date_of_birth: new Date($("#date-of-birth").val())
                };
  Meteor.call('addFamilyMember', member, function (error, result) {
    if (error === undefined) {
      if (result.responseMessage !== undefined) {
        alert(result.responseMessage);
      }
    }
  });
}

function editFamilyMember(member) {
  $(".add").hide();
  $(".add-member-form").show();
  $(".add-member-form").find("legend").text("Edit a family member");
  $("#first-name").val(member.first_name);
  $("#middle-name").val(member.middle_name);
  $("#last-name").val(member.last_name);
  $("#date-of-birth").val(getDateString(member.date_of_birth));
  $("#chk-alive").prop('checked', member.date_of_death === undefined);
  if (member.date_of_death !== undefined) {
    $("#date-of-death").val(getDateString(member.date_of_death));
  }
  Session.set("current_member", member);
}

function getMemberDateInfo(member) {
  if (member.date_of_death != undefined) {
    if (member.date_of_birth != undefined) {
      return member.date_of_birth + " - " + member.date_of_death;
    } else {
      return member.date_of_death;
    }
  } else if (member.date_of_birth != undefined) {
    return member.date_of_birth;
  }

  return "";
}

function alert(message) {
  $("#main-alert").text(message);
  $("#main-alert").show();
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

function getDateString(date) {
  return pad((date.getMonth()+1), 2) + "/" 
                + pad(date.getDate(), 2) + "/" 
                + date.getFullYear();
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}