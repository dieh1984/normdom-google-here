require.config({
   shim: {
      underscore: {
         exports: '_'
      },
      backbone: {
         deps: [ 'underscore', 'jquery' ],
         exports: 'Backbone'
      },
      handlebars: {
          exports: 'Handlebars'
      },
      bootstrap: {
          deps: [ 'jquery' ]
      },
      raphael: {
          deps: [ 'jquery','bootstrap' ]
      },
      morris: {
          deps: [ 'jquery','bootstrap' ]
      },
      morrisData: {
          deps: [ 'jquery','bootstrap' ]
      },
      keys: {
         deps: [ 'jquery' ]
      },
      bingMaps: {
         deps: [ 'jquery' ]
      },
      handlebarsHelpers: {
      	deps: [ 'jquery', 'handlebars' ]
      },
      mapsHereService: {
         deps: [ 'jquery', 'mapsHereCore' ]
      },
      mapsHereCore: {
         deps: [ 'jquery' ]
      }
      
   },
   paths: {
      underscore               : '../lib/underscore/underscore.min',
      backbone                 : '../lib/backbone/backbone-min',
      jquery                   : '../lib/jquery/jquery',
      keys				          :	'../lib/backbone/backbone.keys',
      async		   			    : '../lib/require/async',
      text                     : '../lib/require/text',
      handlebars               : '../lib/handlebars/handlebars-v2.0.0',
      bootstrap                : '../lib/bootstrap.min',
      raphael                  : '../lib/plugins/morris/raphael.min',
      morris                   : '../lib/plugins/morris/morris.min',
      morrisData               : '../lib/plugins/morris/morris-data',
      gmap		   			    : '../lib/gmap',
      bingMaps		   			 : '../lib/bingmaps',
      handlebarsHelpers			 : '../lib/handlebars-helpers/handlebars-helpers',
      mapsHereService          : '../lib/mapsHere/mapsjs-service',   // maps HERE
      mapsHereCore             : '../lib/mapsHere/mapsjs-core'       // maps HERE
   }
});

require(['app'], function(App){
   App.initialize() 
});


