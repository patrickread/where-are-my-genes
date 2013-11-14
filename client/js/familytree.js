if (Meteor.isClient) {
  Template.fulltree.events({
    'click .add' : function () {
      // template data, if any, is available in 'this'
      $(".add").hide();
      $(".add-member-form").show();
    }
  });
  Template.add.events({
    'click .add-family-submit' : function () {
      $(".add").show();
      $(".add-member-form").hide();
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
