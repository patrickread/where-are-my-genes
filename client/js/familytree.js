var showAddEditDialog = false;
var showUserPhotoEdit = false;
var showMainAlert = false;
var mainAlertText = "";
var familyMemberWidth = 250;
var familyMemberHeight = 200;
var familyMemberMargin = 60;
Meteor.subscribe("members");
Meteor.subscribe("unions");
var members;

if (Meteor.isClient) {
  Template.layout.events({
    'click .add-new-member' : function () {
      //addAddEditDialog();
      //Session.set("relationships", undefined);
      return false;
    },
    'click .add-yourself' : function() {
      $(".add").hide();
      $(".add-member-form").show();
      Session.set("relationships", undefined);
      fillInUsername();
      return false;
    }
  });
  Template.addEditDialog.events({
    'click .add-family-submit' : function () {
      addFamilyMember();
      closeAddEditDialog();
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
    },
    'mouseover .user_photo' : function () {
      $(".user-photo-edit").show();
    },
    'mouseout .user_photo' : function () {
      if ($(".user-photo-edit:hover").length <= 0) {
        $(".user-photo-edit").hide();
      }
    },
    'click .user_photo' : function () {
      $("#photo-upload").trigger("click");
    },
    'click .user-photo-edit' : function () {
      $("#photo-upload").trigger("click");
    }
  });
  Template.member.events({
    'click .edit' : function() {
      editFamilyMember(this);
      return false;
    },
    'click .addon-right' : function() {
      directionalAddClicked(this, "right");
      return false;
    },
    'click .addon-left' : function() {
      directionalAddClicked(this, "left");
      return false;
    },
    'click .addon-top' : function() {
      directionalAddClicked(this, "top");
      return false;
    },
    'click .addon-bottom' : function() {
      directionalAddClicked(this, "bottom");
      return false;
    }
  });
  Template.addonDrillDown.events({
    'click #add-spouse' : function() {
      Session.set("relationships", {spouse: Session.get("sourceMember")});
      addAddEditDialog();
      return false;
    },
    'click #add-sibling' : function() {
      var parents = Session.get("sourceMember").parents;
      if (parents !== undefined) {
        Session.set("relationships", {parents: parents});
      } else {
        Session.set("relationships", {sibling: Session.get("sourceMember")});
      }
      addAddEditDialog();
      return false;
    },
  });
}

function directionalAddClicked(member, direction) {
  if ($(".tree-main").find(".addon-box").length > 0 && 
    Session.get("addon-direction") === direction) {
    removeAddOnBox();
    Session.set("addon-direction", undefined);
  } else {
    Session.set("addon-direction", direction);
    Session.set("sourceMember", member);
    // add in the box for the member at this position
    addInAddOnBox(member._id, member.x_pos, member.y_pos);
  }
}

function removeAddOnBox() {
  // check if there is already an add on box
  if ($(".tree-main").find(".addon-box").length > 0) {
    // first, lower the z-index of the parent element back to regular
    var zIndex = parseInt($(".tree-main").find(".addon-box").parent().css("z-index"));
    $(".tree-main").find(".addon-box").parent().css("z-index", zIndex-1);
    // then, remove the box
    $(".tree-main").find(".addon-box").remove();
  }
}

function addInAddOnBox(memberID, x_pos, y_pos) {
  removeAddOnBox();

  // first, raise the z-index of the parent, so the add on box will be above
  // any other family member boxes
  var zIndex = parseInt($("#" + memberID).css("z-index"));
  $("#" + memberID).css("z-index", zIndex+1);

  var outerHTML = "<div class='addon-box'></div>";
  $("#" + memberID).append(outerHTML);
  var fullBox = Meteor.render(Template["addonDrillDown"]);
  $("#" + memberID).find(".addon-box").append(fullBox);

  // adjust the position
  repositionAddOnBox(memberID, x_pos, y_pos);
}

function repositionAddOnBox(memberID, x_pos, y_pos) {
  var width = parseInt($("#" + memberID).css("width"));
  var height = parseInt($("#" + memberID).css("height"));

  if (Session.get("addon-direction") !== undefined) {
    if (Session.get("addon-direction") === "right") {
      var boxHeight = parseInt($("#" + memberID).find(".addon-box").css("height"));
      $("#" + memberID).find(".addon-box").css("top", height/2 - boxHeight/2);
      $("#" + memberID).find(".addon-box").css("left", 20 + width);
    } else if (Session.get("addon-direction") === "left") {
      var boxWidth = parseInt($(".tree-main").find(".addon-box").css("width"));
      $(".tree-main").find(".addon-box").css("top", 20 + y_pos + height/2);
      $(".tree-main").find(".addon-box").css("left", x_pos - boxWidth - 20);
    } else if (Session.get("addon-direction") === "top") {
      var boxHeight = parseInt($(".tree-main").find(".addon-box").css("height"));
      $(".tree-main").find(".addon-box").css("top", y_pos - boxHeight - 20);
      $(".tree-main").find(".addon-box").css("left", 20 + x_pos + width/2);
    } else if (Session.get("addon-direction") === "bottom") {
      var boxWidth = parseInt($(".tree-main").find(".addon-box").css("width"));
      $(".tree-main").find(".addon-box").css("top", 30 + y_pos + height);
      $(".tree-main").find(".addon-box").css("left", 10 + x_pos + width/2 - boxWidth/2);
    }
  }
}

Template.addonDrillDown.directionLeftOrRight = function () {
  return Session.get("addon-direction") !== undefined && 
      (Session.get("addon-direction") === "left" || 
      Session.get("addon-direction") === "right");
}

Template.addonDrillDown.directionTop = function () {
  return Session.get("addon-direction") !== undefined && 
      Session.get("addon-direction") === "top";
}

Template.addonDrillDown.directionBottom = function () {
  return Session.get("addon-direction") !== undefined && 
      Session.get("addon-direction") === "bottom";
}

Template.home.rendered = function () {
  $( ".datepicker" ).datepicker({
    startView: 2,
    todayBtn: true,
    autoclose: true
  });

  if (!showAddEditDialog) {
    $(".add-member-form").hide();
  } else {
    if (Session.get("current_member") !== undefined) {
      if (Session.get("current_member").photo_url !== undefined) {
        $("#photo-upload").hide();
        $("#user_photo").attr('src', Session.get("current_member").photo_url);
      }
    } else {
      $(".user-photo-container").hide();
    }
  }

  if (!showMainAlert) {
    $("#main-alert").hide();
  } else {
    $("#main-alert").text(mainAlertText);
  }

  if (!showUserPhotoEdit) {
    $(".user-photo-edit").hide();
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
  // refresh the upload input
  var control = $("#photo-upload");
  control.replaceWith( control = control.clone( true ) );

  if (Session.get("current_member") !== undefined) {
    var member = Session.get("current_member");
    // find any current changes to this member
    member = Members.find(member._id).fetch()[0];
    member.date_of_birth_string = getDateString(member.date_of_birth);
    member.date_of_death_string = getDateString(member.date_of_death);
    return member;
  }

  return {};
}

function placeMembers(members) {
  var firstMember;
  var templateName = "member";
  var x = 10;
  var y = 10;
  for (var i=0; i<members.length; i++) {
    if (members[i].parents === null || members[i].parents === undefined) {
      positionMember(members, members[i], {xValue: x}, y);
      x += familyMemberWidth + familyMemberMargin;
    }
  }
}

// The x value needs to be passed by reference, so I'm using 
// literal object notation to make simple object. you access the int via
// x.xValue. Y can't be by reference since each each call through the stack
// needs a different y, so that's separate
function positionMember(members, theMember, x, y) {

  //theMember.x_pos = x;
  //theMember.y_pos = y;
  //var childrenWidth = children.length * (familyMemberWidth + familyMemberMargin);
  //var startX = x - childrenWidth / 2;
  var spouses = [];
  if (theMember.spouses !== undefined) {
    spouses = findMemberSpouses(members, theMember.spouses);
  }
  var children = findMemberChildren(members, theMember._id);
  var originalX = x.xValue;
  for(var i=0; i<children.length; i++) {
    x = {xValue: x.xValue + familyMemberWidth + familyMemberMargin};
    positionMember(members, 
      children[i],
      x.xValue,
      y + familyMemberHeight + familyMemberMargin);
  }

  theMember.x_pos = ((x.xValue - originalX) / 2) + originalX;
  theMember.y_pos = y;

  // add the spouses
  
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

function findMemberSpouses(members, spouseIDs) {
  var spouses = [];
  var spouseIndices = [];
  for (var i=0; i<members.length; i++) {
    for (var j=0; j<spouseIDs.length; j++) {
      if (members[i]._id === spouseIDs[j]) {
        spouses.push(members[i]);
        spouseIDs.splice(j, 1);
        j--;

        // also remove from members so we don't separately add the spouse again
        members.splice(i, 1);
        i--;
      }
    }
  }

  return spouses;
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
                  photo_url: $(".form-field").find(".user_photo").attr("src"),
                };
  if (Session.get("current_member") !== undefined) {
    var currentMember = Session.get("current_member");
    member._id = currentMember._id;
    member.spouses = currentMember.spouses;
    member.parents = currentMember.parents;
  }
  if (Session.get("relationships") !== undefined) {
    var relationships = Session.get("relationships");
    if (relationships.spouse !== undefined) {
      if (member.spouses === undefined) {
        member.spouses = [];
      }

      if (member.parents === undefined) {
        member.parents = [];
      }
      member.spouses.push(relationships.spouse._id);
      member.parents = relationships.parents;
    }
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

  if (Session.get("current_member") !== undefined) {
    if (Session.get("current_member").photo_url !== undefined) {
      $("#photo-upload").hide();
    }
  }
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

function addAddEditDialog() {
  Session.set("current_member", undefined);
  $(".add").hide();
  showAddEditDialog = true;
  showUserPhotoEdit = false;
  $(".add-member-form").show();
  $(".user-photo-container").hide();
  handleRelationships();
}

function handleRelationships() {
  if (Session.get("relationships") !== undefined) {
    var relationships = Session.get("relationships");
    if (relationships.spouse !== undefined) {
      var html = "<div class='form-field'>" +
                    "<label for='spouse'>Spouse</label>" + 
                    "<span id='spouse'>" + relationships.spouse.first_name + " " + relationships.spouse.last_name + "</span>" + 
                "</div>";
      $(".add-member-form").find(".inner-form").prepend(html);
    }

    if (relationships.parents !== undefined && relationships.parents.length > 0) {
      var html = "<div class='form-field'>" +
                    "<label for='parents'>Parents</label>" + 
                    "<span id='parents'>";
      for (var i=0; i<relationships.parents.length; i++) {
        html += relationships.parents[i].first_name + " " + 
                relationships.parents[i].last_name + ", ";
      }
      html = html.substring(0, html.length - 2);
      html += "</span>" + 
                "</div>";
      $(".add-member-form").find(".inner-form").prepend(html);
    }

    if (relationships.sibling !== undefined) {
      var html = "<div class='form-field'>" +
                    "<label for='sibling'>Sibling</label>" + 
                    "<span id='sibling'>" + relationships.sibling.first_name + " " + relationships.sibling.last_name + "</span>" + 
                "</div>";
      $(".add-member-form").find(".inner-form").prepend(html);
    }
  }
}

function closeAddEditDialog() {
  $(".add").show();
  showAddEditDialog = false;
  $(".add-member-form").hide();
  Session.set("relationships", undefined);
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