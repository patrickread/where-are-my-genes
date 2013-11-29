var familyMemberWidth = 320;
var familyMemberHeight = 180;
var familyMemberMargin = 60;
Meteor.subscribe("members");
Meteor.subscribe("unions");
var members;
var unions;
var treeLines = [];

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
            var member = Session.get("current_member");
            var memberUnions = findUnionsForMember(member._id);
            for (var i=0; i<memberUnions.length; i++) {
              Unions.remove(memberUnions[i]._id);
            }
            $("#" + member._id).remove();
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
    'click .add' : function() {
      addButtonClicked(this);
      return false;
    }
  });
  Template.addonDrillDown.events({
    'click #add-spouse' : function() {
      Session.set("relationships", {spouse: {member: Session.get("sourceMember")}});
      addAddEditDialog();
      return false;
    },
    'click #add-sibling' : function() {
      var member = Session.get("sourceMember");
      if (member !== undefined) {
        var unions = findUnionsForMemberAsChild(member._id);
        if (unions.length > 0) {
          Session.set("relationships", {childOfUnion: unions[0]});
        } else {
          Session.set("relationships", {siblings: [ Session.get("sourceMember") ]});
        }
        addAddEditDialog();
      }

      return false;
    },
    'click #add-parent' : function() {
      var member = Session.get("sourceMember");
      if (member !== undefined) {
        var unions = findUnionsForMemberAsChild(member._id);
        if (unions.length > 0) {
          Session.set("relationships", {union: unions[0]});
        } else {
          Session.set("relationships", {children: [ Session.get("sourceMember") ]});
        }
        addAddEditDialog();
      }

      return false;
    }
  });
}

function addButtonClicked(member) {
  if ($(".tree-main").find(".addon-box").length > 0) {
    removeAddOnBox();
  } else {
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
  var width = parseInt($("#" + memberID).css("width"));
  var height = parseInt($("#" + memberID).css("height"));
  $("#" + memberID).find(".addon-box").css("top", height + "px");
  $("#" + memberID).find(".addon-box").css("left", (width - 70) + "px");
}

Template.home.rendered = function () {
  $( ".datepicker" ).datepicker({
    startView: 2,
    todayBtn: true,
    autoclose: true
  });

  for (var i=0; i<members.length; i++) {
    if (members[i].x_pos !== undefined && members[i].y_pos !== undefined) {
      $("#" + members[i]._id).css("left", members[i].x_pos);
      $("#" + members[i]._id).css("top", members[i].y_pos);
    }
  }

  for (var i=0; i<treeLines.length; i++) {
    drawLine(treeLines[i]);
  }

  $( ".tree-main" ).scroll(function() {
    var left = $(".tree-main").scrollLeft();
    var top = $(".tree-main").scrollTop();
    //$("#tree-canvas").scrollTo(left, top);
    $("#tree-canvas").css("left", (-1 * left) + "px");
    $("#tree-canvas").css("top", (-1 * top) + "px");
  });
};

Template.home.showAddEditDialog = function () {
  return Session.get("showAddEditDialog");
}

Template.home.showAlertDialog = function () {
  return Session.get("showAlertDialog");
}

Template.alert.rendered = function () {
  var mainAlertText = Session.get("mainAlertText");
  $("#main-alert").text(mainAlertText);
}

Template.home.members = function () {
  members = Members.find().fetch();
  unions = Unions.find().fetch();
  for (var i=0; i<members.length; i++) {
    if (members[i].first_name === undefined) {
      // junk data, remove from list, and from DB
      Members.remove(members[i]._id);
      members.splice(i, 1);
      i--;
    }

    // add in unions for member
    members[i].memberOf = findUnionsForMember(members[i]._id);
    members[i].childOf = findUnionsForMemberAsChild(members[i]._id);

    members[i].date_of_birth_string = getDateString(members[i].date_of_birth);
    members[i].date_of_marriage = findLatestWeddingDateForMember(members[i]);
    members[i].date_of_marriage_string = getDateString(members[i].date_of_marriage);
    members[i].hasMarriage = (members[i].date_of_marriage !== undefined && 
                              members[i].date_of_marriage.getTime() 
                                !== 0);
  }
  placeMembers(members);
  return members;
}

function findLatestWeddingDateForMember(member) {
  var latestDate;
  for (var i=0; i<member.memberOf.length; i++) {
    if (latestDate === undefined || member.memberOf[i].date_of_marriage > latestDate) {
      latestDate = member.memberOf[i].date_of_marriage;
    }
  }

  return latestDate;
}

Template.addEditDialog.rendered = function () {
  if (Session.get("current_member") !== undefined) {
    if (Session.get("current_member").photo_url !== undefined) {
      $("#photo-upload").hide();
      $(".user-photo-container").show();
      $("#user_photo").attr('src', Session.get("current_member").photo_url);
    } else {
      $(".user-photo-container").hide();
    }
  } else {
    $(".user-photo-container").hide();
  }

  handleRelationships();
}

Template.addEditDialog.member = function () {
  // refresh the upload input
  var control = $("#photo-upload");
  control.replaceWith( control = control.clone( true ) );

  if (Session.get("current_member") !== undefined) {
    var member = Session.get("current_member");
    // find any current changes to this member
    member = Members.find(member._id).fetch()[0];
    if (member !== undefined) {
      member.date_of_birth_string = getDateString(member.date_of_birth);
      member.date_of_death_string = getDateString(member.date_of_death);

      if (member.photo_url !== undefined) {
        $(".user-photo-container").show();
        $("#user_photo").attr('src', member.photo_url);
      }
    }

    // add back into the session variable from the db
    Session.set("current_member", member);

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
    if (isOnFirstTier(members[i])) {
      positionMember(members, members[i], {xValue: x}, y);
      x += familyMemberWidth + familyMemberMargin;
    }
  }
}

function isOnFirstTier(member) {
  if (member.childOf === undefined || member.childOf.length === 0) {
    var spouseUnions = member.memberOf;
    for (var i=0; i<spouseUnions.length; i++) {
      for (var j=0; j<spouseUnions[i].members.length; j++) {
        if (spouseUnions[i].members[j] !== member._id) {
          var spouseMember = findMemberById(spouseUnions[i].members[j]);
          if (spouseMember !== undefined) {
            if (spouseMember.childOf !== undefined && spouseMember.childOf.length !== 0) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  return false;
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

  if (theMember.x_pos === undefined && theMember.y_pos === undefined) {
    var spouseIDs = [];
    var originalX = x.xValue;
    if (theMember.memberOf !== undefined) {
      for (var i=0; i<theMember.memberOf.length; i++) {
        for (var j=0; j<theMember.memberOf[i].members.length; j++) {
          if (theMember.memberOf[i].members[j] !== theMember._id) {
            //members = removeFromMembers(members, foundUnions[i].members[j]);
            spouseIDs.push(theMember.memberOf[i].members[j]);
          }
        }

        var children = theMember.memberOf[i].children;
        if (children !== undefined && children !== null) {
          for (var i=0; i<children.length; i++) {
            var child = findMemberById(children[i]);
            x.xValue = positionMember(members, 
              child,
              x,
              y + familyMemberHeight + familyMemberMargin);
          }
        }
      }
    }

    //theMember.x_pos = ((x.xValue - originalX) / 2) + originalX;
    //theMember.y_pos = y;
    var availableLength = x.xValue - originalX;
    var neededLength = (spouseIDs.length + 1) * (familyMemberWidth + familyMemberMargin);
    var startPos = originalX;
    if (availableLength > neededLength) {
      startPos = ((availableLength / 2) - (neededLength / 2)) + originalX;
    }
    theMember.x_pos = startPos;
    theMember.y_pos = y;
    var spouses = findMembersByIds(spouseIDs);
    members = removeFromMembers(members, spouseIDs);
    for (var i=0; i<spouses.length; i++) {
      spouses[i].x_pos = startPos + ((familyMemberWidth + familyMemberMargin) * (i+1));
      spouses[i].y_pos = y;
      createSpousalLine(theMember, spouses[i]);
    }

    return x.xValue + neededLength;
  }
}

function createSpousalLine(member1, member2) {
  var startX = member1.x_pos + familyMemberWidth;
  var startY = member1.y_pos + familyMemberHeight/2;
  var endX = member2.x_pos;
  var endY = member2.y_pos + familyMemberHeight/2;
  treeLines.push({
    start: {
      x: startX,
      y: startY
    },
    end: {
      x: endX,
      y: endY
    },
    type: "spouse"
  });
}

function drawLine(line) {
  var margin = 10;
  var c = document.getElementById("tree-canvas");
  if (c !== null) {
    var ctx = c.getContext("2d");
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (line.type === "spouse") {
      ctx.moveTo(line.start.x + margin, line.start.y - 5);
      ctx.lineTo(line.end.x + margin, line.end.y - 5);
      ctx.moveTo(line.start.x + margin, line.start.y + 5);
      ctx.lineTo(line.end.x + margin, line.end.y + 5);
    } else {
      ctx.moveTo(line.start.x + margin, line.start.y);
      ctx.lineTo(line.end.x + margin, line.end.y);
    }
    ctx.stroke();
  }
}

function removeFromMembers(members, memberIDs) {
  for (var i=0; i<members.length; i++) {
    for (var j=0; j<memberIDs.length; j++) {
      if (members[i]._id === memberIDs[j]) {
        members.splice(i, 1);
        break;
      }
    }
  }

  return members;
}

function findUnionsForMember(memberID) {
  var foundUnions = [];
  for (var i=0; i<unions.length; i++) {
    if (unions[i].members.indexOf(memberID) != -1) {
      foundUnions.push(unions[i]);
    }
  }
  return foundUnions;
}

function findUnionsForMemberAsChild(memberID) {
  var foundUnions = [];
  for (var i=0; i<unions.length; i++) {
    if (unions[i].children !== null && 
        unions[i].children.indexOf(memberID) != -1) {
      foundUnions.push(unions[i]);
    }
  }
  return foundUnions;
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

function findMembersByIds(memberIDs) {
  var foundMembers = [];
  for (var i=0; i<members.length; i++) {
    for (var j=0; j<memberIDs.length; j++) {
      if (members[i]._id === memberIDs[j]) {
        foundMembers.push(members[i]);
        memberIDs.splice(j, 1);
        j--;
      }
    }
  }

  return foundMembers;
}

function findMemberById(id) {
  for (var i=0; i<members.length; i++) {
    if (members[i]._id === id) {
      return members[i];
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

  // add relationship information from form fields
  var relationships = Session.get("relationships");
  if (relationships !== undefined && relationships.spouse !== undefined) {
    relationships.spouse.date_of_marriage = $("#date-of-marriage").val();
    relationships.spouse.status = $("#spouse-status").val();
    Session.set("relationships", relationships);
  }
  
  Meteor.call('addFamilyMember', member, Session.get("relationships"), function (error, result) {
    if (error === undefined) {
      if (result !== undefined) {
        var member = result.member;
        var relationships = result.relationships;
        if (relationships !== undefined) {
          if (relationships.spouse !== undefined) {
            var unionMembers = [];
            unionMembers.push(member._id);
            unionMembers.push(relationships.spouse.member._id);
            addOrEditUnion(unionMembers, null, 
              relationships.spouse.date_of_marriage, 
              relationships.spouse.status);
          }

          if (relationships.parents !== undefined) {
            var unionMembers = relationships.parents;
            var children = [ member ];
            addOrEditUnion(unionMembers, children, null, null);
          }

          if (relationships.siblings !== undefined) {
            var unionMembers = [];
            var children = [];
            for (var i=0; i<relationships.siblings.length; i++) {
              children.push(relationships.siblings[0]._id);
            }
            children.push(member._id);
            addOrEditUnion(unionMembers, children, null, null);
          }

          if (relationships.union !== undefined) {
            var unionMembers = [];
            unionMembers.push(member._id);
            addOrEditUnion(unionMembers, relationships.union.children,
              null, null);
          }
        }

        if (member.responseMessage !== undefined) {
          alert(member.responseMessage);
          Session.set("current_member", undefined);
          Session.set("parents", undefined);
        }
      }
    }
  });
}

function addOrEditUnion(members, children, dom, status) {
  var union = {
    "members": members,
    "children": children,
    "date_of_marriage": new Date(dom),
    "status": status
  }
  var memberUnions = Unions.find({"members": { $in : members } }).fetch();
  for (var i=0; i<memberUnions.length; i++) {
    if (memberUnions[i].members !== undefined && union.members !== undefined) {
      var membersInUnion = true;
      for (var j=0; j<union.members.length; j++) {
        if (memberUnions[i].members.indexOf(union.members[j]) == -1) {
          membersInUnion = false;
        }
      }

      if (membersInUnion) {
        if (memberUnions[i].children === undefined || memberUnions[i].children === null) {
          memberUnions[i].children = [];
        }
        for (var j=0; j<union.children.length; j++) {
          memberUnions[i].children.push(union.children[j]);
        }
        memberUnions[i].children = union.children;
        Meteor.call("addUnion", memberUnions[i], function (error, result) {
          if (error === undefined) {
            console.log("Union returned: " + result.responseMessage);
          } else {
            console.log("Error on union: " + error.toString());
          }
        });
        return memberUnions[i];
      }
    }
  }

  // create the new union
  Meteor.call("addUnion", union, function (error, result) {
    if (error === undefined) {
      console.log("Union returned: " + result.responseMessage);
    } else {
      console.log("Error on union: " + error.toString());
    }
  });
}

function editFamilyMember(member) {
  $(".add").hide();
  Session.set("showAddEditDialog", true);
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
  Session.set("mainAlertText", message);
  Session.set("showMainAlert", true);
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
  var member = {};
  Meteor.call('addFamilyMember', member, null, function (error, result) {
    if (error === undefined) {
      Session.set("current_member", result.member);
      $(".add").hide();
      Session.set("showAddEditDialog", true);
      $(".user-photo-edit").hide();
      $(".add-member-form").show();
      $(".user-photo-container").hide();
    }
  });
}

function handleRelationships() {
  // reset all relationship form fields
  hideSpousalFields();
  $(".add-member-form").find(".siblings-field").remove();
  $(".add-member-form").find(".parents-field").remove();
  $(".add-member-form").find(".children-field").remove();

  if (Session.get("relationships") !== undefined) {
    var relationships = Session.get("relationships");
    if (relationships.spouse !== undefined) {
      $(".add-member-form").find(".spouse-field").show();
      $(".add-member-form").find(".spouse-field").find("#spouse")
        .text(relationships.spouse.member.first_name + " " + 
              relationships.spouse.member.last_name);
      $(".add-member-form").find(".married-date-field").show();
      $(".add-member-form").find(".spouse-status-field").show();
    }

    // add parents or siblings field
    if (relationships.childOfUnion !== undefined) {
      var html = "<div class='form-field parents-field'>" +
                    "<label for='parents'>Parents</label>" + 
                    "<span id='parents'>";
      for (var i=0; i<relationships.childOfUnion.members.length; i++) {
        var member = findMemberById(relationships.childOfUnion.members[i]);
        html += member.first_name + " " + 
                member.last_name + ", ";
      }
      html = html.substring(0, html.length - 2);
      html += "</span>" + 
                "</div>";
      $(".add-member-form").find(".inner-form").prepend(html);
    } else if (relationships.siblings !== undefined) {
      var html = "<div class='form-field siblings-field'>" +
                    "<label for='siblings'>Siblings</label>" + 
                    "<span id='siblings'>";
      for (var i=0; i<relationships.siblings.length; i++) {
        html += relationships.siblings[i].first_name + " " + 
                relationships.siblings[i].last_name + ", ";
      }
      html = html.substring(0, html.length - 2);
      html += "</span>" + 
                "</div>";
      $(".add-member-form").find(".inner-form").prepend(html);
    }

    // add children field
    if (relationships.union !== undefined) {
      var html = "<div class='form-field children-field'>" +
                    "<label for='children'>Children</label>" + 
                    "<span id='children'>";
      for (var i=0; i<relationships.union.children.length; i++) {
        var member = findMemberById(relationships.union.children[i]);
        html += member.first_name + " " + 
                member.last_name + ", ";
      }
      html = html.substring(0, html.length - 2);
      html += "</span>" + 
                "</div>";
      $(".add-member-form").find(".inner-form").prepend(html);
    } else if (relationships.children !== undefined) {
      var html = "<div class='form-field children-field'>" +
                    "<label for='children'>Children</label>" + 
                    "<span id='children'>";
      for (var i=0; i<relationships.children.length; i++) {
        html += relationships.children[i].first_name + " " + 
                relationships.children[i].last_name + ", ";
      }
      html = html.substring(0, html.length - 2);
      html += "</span>" + 
                "</div>";
      $(".add-member-form").find(".inner-form").prepend(html);
    }
  }
}

function hideSpousalFields() {
  $(".spouse-field").hide();
  $(".add-member-form").find(".married-date-field").hide();
  $(".add-member-form").find(".spouse-status-field").hide();
}

function closeAddEditDialog() {
  $(".add").show();
  Session.set("showAddEditDialog", false);
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