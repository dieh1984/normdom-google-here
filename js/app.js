define ([
      'jquery',
      'underscore',
      'backbone',
      'bootstrap',
      'framework/routers/router',
      'handlebarsHelpers'

], function ($, _, Backbone, bootstrap, Router, HandlebarsHelpers) {
    
    var initialize = function(){
         Router.initialize();
    }
    
    return{
        initialize: initialize
    }
});
