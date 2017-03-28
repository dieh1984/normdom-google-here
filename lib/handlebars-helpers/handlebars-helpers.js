define ([
	     'underscore',
	     'backbone',
	     'handlebars'
], function ( _, Backbone, Handlebars) {
	
    Handlebars.registerHelper ('ifCond', function (v1, v2, options) {
		
    	if (v1 === v2) {
		    return options.fn (this);
		}
    	
		return options.inverse (this);
	});   
	
    Handlebars.registerHelper ('ifNotCond', function (v1, v2, options) {
	
    	if (v1 !== v2) {
		    return options.fn (this);
		}
    	
		return options.inverse (this);
	});
	
	Handlebars.registerHelper ('ifNotNull', function (v1, options) {
	
    	if (v1 != null) {
		    return options.fn (this);
		}
    	
		return options.inverse (this);
	});
	
	Handlebars.registerHelper ('ifNull', function (v1, options) {
	
    	if (v1 == null) {
		    return options.fn (this);
		}
    	
		return options.inverse (this);
	});
	
	/*Handlebars.registerHelper ('ifNotRouteNumber', function (v1, options) {
	
    	if (v1 == '0') {
		    return options.fn (this);
		}
    	
		return options.inverse (this);
	});
	
	Handlebars.registerHelper ('ifHasRouteNumber', function (v1, options) {
	
    	if (v1 != '0') {
		    return options.fn (this);
		}
    	
		return options.inverse (this);
	});*/
	
});