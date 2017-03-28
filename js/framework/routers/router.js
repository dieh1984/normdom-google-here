define ([
      'jquery',
      'underscore',
      'backbone',
      '../views/normalizador/normalizadorView',
      /*'../views/normalizador/normalizadorListadoView',
      '../views/normalizador/normalizadorListadoViewHereMaps',*/
      '../views/normalizador/procesoNormalizadorView',
      '../views/normalizador/procesarListadoView'
], function ($, _, Backbone, NormalizadorView, /*NormalizadorListadoView, NormalizadorListadoViewHereMaps,*/
            ProcesoNormalizadorView, ProcesarListadoView) {
 
    var Router = Backbone.Router.extend({
        
        routes: {
            ''                      :       'doHome',
            'details'               :       'doDetails',
            /*'listado'               :       'doNormalizadorListado',
            'listadoMapsHere'       :       'doNormalizadorListadoHereMaps',*/
            'proceso'               :       'doBatch',
            'procesar'               :      'doProcesar',
        },
        
        doBatch: function(){
            var procesoNormalizadorView = new ProcesoNormalizadorView();
           
            $("#content").empty();
            $("#content").append(procesoNormalizadorView.render().el);
        },
        
        doProcesar: function(){
            var procesarListadoView = new ProcesarListadoView();
           
            $("#content").empty();
            $("#content").append(procesarListadoView.render().el);
        },
                
        doHome: function(){
           var normalizador = new NormalizadorView();
           
           $("#content").empty();
           $("#content").append(normalizador.render().el);
           
           $( "#calle" ).focus();
           
        },        
        
        doDetails: function(){
           alert("Detalle del lugar");
        },
        
        /*doNormalizadorListado: function(){
            var normalizadorListado = new NormalizadorListadoView();
           
            $("#content").empty();
            $("#content").append(normalizadorListado.render().el);
        },
        
        doNormalizadorListadoHereMaps: function(){
            var normalizadorListado = new NormalizadorListadoViewHereMaps();
           
            $("#content").empty();
            $("#content").append(normalizadorListado.render().el);
        }*/

        
    });
    
    var initialize = function(){
        new Router;
        Backbone.history.start();
    }
    
    return {
        initialize: initialize
    }
});
