define([
    'jquery',
    'underscore',
    'backbone',
    'keys',
    'handlebars',
    'text!../../templates/normalizador/normalizadorTemplate.html',
    'gmap',
    'text!../../templates/normalizador/tablaPrediccion.html',
    'text!../../templates/normalizador/placeDetails.html',
    'bingMaps'
], function($, _, Backbone, keys, Handlebars, NormalizadorTemplate, Gmap, TablaPrediccion, PlaceDetails, bingMaps){
   
   var Normalizador = Backbone.View.extend({
      
        events : {
            'click #buscar'             : "buscar",
            'click #placeSelectButton'  : "placeSelect"
        },
        
        keys:{
			'enter'  : 'buscar'
		},
        
        placeSelect: function(event){
        
            $('#placeDetails').empty();
        
            var map = new google.maps.Map(document.getElementById('map'), {
                center: {lat: -33.866, lng: 151.196},
                zoom: 15
            });
            
            var request = {
              placeId: $(event.target).closest('td').data("place")
            };
            
            var obtenerDireccionCompleta = function (place, status) {
              if (status == google.maps.places.PlacesServiceStatus.OK) {
                console.log(place);
                
                var calle = returnValueOfTypes(place,"route");
                var numero = returnValueOfTypes(place,"street_number");
                var localidad = returnValueOfTypes(place,"locality");
                var barrio = returnValueOfTypes(place,"sublocality_level_1");
                var partido = returnValueOfTypes(place,"administrative_area_level_2");
                
                //Si localidad = CABA, la provincia siempre va a ser Buenos Aires
                var provincia = (localidad == "CABA") ? "Buenos Aires" : returnValueOfTypes(place,"administrative_area_level_1");
                var codigoPostal = returnValueOfTypes(place,"postal_code");
                
                
                
                /* INI - SERVICIO MICROSOFT - BINGMAPS - 28/10/2015 */
                //Si el codigo postal no se puede obtener de Google Maps, se obtiene del servicio de Bing Maps (MICROSOFT)
                if(codigoPostal == ""){
                    map = new Microsoft.Maps.Map(document.getElementById("mapBing"),{credentials:bingMapsKey, mapTypeId:Microsoft.Maps.MapTypeId.road}); 
                    map.getCredentials(MakeGeocodeRequest);
                    var geocodeRequest = "http://dev.virtualearth.net/REST/v1/Locations?query=" + encodeURI(calle + " " + numero + "," + localidad + "," + barrio + "," + partido + "," + provincia + ", AR") + "&key=" + bingMapsKey;
                    $.ajax({
                        async:false,
                        url: geocodeRequest,
                        dataType: "jsonp",
                        jsonp: "jsonp",
                        success: function (r) {
                            console.log(r);
                            codigoPostal = GeocodeCallback(r);
                            console.log("codigo postal: " + codigoPostal);
                    
                            var content = Handlebars.compile(PlaceDetails);
                            $('#placeDetails').append (content({calle: calle, numero: numero, localidad: localidad, barrio: barrio,
                                                                partido: partido, provincia: provincia, codPos: codigoPostal, urlMaps: place.url}));
                        },
                        error: function (e) {
                            alert(e.statusText);
                        }
                    });
                }
                else{
                    var content = Handlebars.compile(PlaceDetails);
                    $('#placeDetails').append (content({calle: calle, numero: numero, localidad: localidad, barrio: barrio,
                                                        partido: partido, provincia: provincia, codPos: codigoPostal, urlMaps: place.url}));
                }
                /* FIN - SERVICIO MICROSOFT - BINGMAPS - 28/10/2015 */
                
                
                
                //SE COMENTO ESTE CODIGO PARA EL CAMBIO CON EL SERVICIO DE BINGMAPS.
                /*var content = Handlebars.compile(PlaceDetails);
                $('#placeDetails').append (content({calle: calle, numero: numero, localidad: localidad, barrio: barrio,
                                                    partido: partido, provincia: provincia, codPos: codigoPostal, urlMaps: place.url}));
                */
                
                
              }
            }
            
            var service = new google.maps.places.PlacesService(map);
            service.getDetails(request, obtenerDireccionCompleta);
            
            $('#modalPlace').modal('show'); 
        },
      
        buscar: function(){
            
            if(($("#calle").val() != null && $("#calle").val() != "") &&
                ($("#numero").val() != null && $("#numero").val() != "")){
                    
                $('#tablaPrediccion').empty();
            
                var input = "";
                input += ($("#calle").val() != null && $("#calle").val() != "") ? $("#calle").val() : "";
                input += ($("#numero").val() != null && $("#numero").val() != "") ? " " + $("#numero").val() : "";
                input += ($("#provincia").val() != null && $("#provincia").val() != "") ? " " + $("#provincia").val() : "";
                input += ($("#localidad").val() != null && $("#localidad").val() != "") ? " " + $("#localidad").val() : "";
                input += ($("#partido").val() != null && $("#partido").val() != "") ? " " + $("#partido").val() : "";
                input += ($("#barrio").val() != null && $("#barrio").val() != "") ? " " + $("#barrio").val() : "";
                
                
                /* ejemplo para obtener datos completos de google */
                
                var direccionGoogle = $("#calle").val() + " " + $("#numero").val();
                direccionGoogle += ($("#barrio").val() != "") ? ", " + $("#barrio").val() : "";
                direccionGoogle += ", " + $("#localidad").val();
                direccionGoogle += ($("#partido").val() != "") ? ", " + $("#partido").val() : "";
                direccionGoogle += ($("#provincia").val() != "") ? ", " + $("#provincia").val() : "";
                direccionGoogle += ($("#cp").val() != "") ? ", " + $("#cp").val() : "";
                direccionGoogle += ", Argentina";
                
                new google.maps.Geocoder().geocode( { 'address': direccionGoogle}, function(results, status) {
                    
                    if(status == google.maps.GeocoderStatus.OK){
                        console.log(results);
                    }
                    
                });
                
                /* fin */
                
                
                
                //console.log(input);
    
                var mostrarPredicciones = function(predictions, status) {
                    if (status != google.maps.places.PlacesServiceStatus.OK) {
                        alert("No hay resultados");
                        return;
                    }
                
                    /*predictions.forEach(function(prediction) {
                        console.log(prediction);
                        
                        
                        //var li = document.createElement('li');
                        //li.appendChild(document.createTextNode(prediction.description));
                        //document.getElementById('results').appendChild(li);
                    });*/
                        
                    var content = Handlebars.compile(TablaPrediccion);
                    $('#tablaPrediccion').append (content({prediction: predictions}));
                    
                    //console.log(predictions[0].description);
                    
                };
                
                //for(x = 0; x < 1000; x++){
                
                    var service = new google.maps.places.AutocompleteService();
                    service.getQueryPredictions({ input: input }, mostrarPredicciones);
                    
                    //console.log("ciclo" + x);
                    
                //}
                
            }
            else{
                alert("Debe cargar al menos la CALLE y NÚMERO");
            }
            
        },
      
        render: function(){
            var self = this;
              
            var content = Handlebars.compile(NormalizadorTemplate);
            self.$el.html(content());
            
            return this;
        }
       
   });
   
   return Normalizador;
});


// este metodo retorna el valor del tipo de dato requerido
// EJ: provincia -> devuelve la provincia dentro del array
function returnValueOfTypes(place, tipo){
    array = place.address_components;
    
    for(x=0;x<array.length;x++){
        tipoArray = array[x].types[0];
        if(tipoArray == tipo)
            return array[x].short_name;
    }
    
    return "";
}


var map = null;
var codPos = "";
var bingMapsKey = "AiBHq0YoNrMfZKIiA1-ElHPbGD2MkJqji5x059qtwojGOWaY67dzvsogbhYvr3lQ";
 
 function GetMap()
 {
    // Initialize the map
    console.log("init bing maps");
    map = new Microsoft.Maps.Map(document.getElementById("mapBing"),{credentials:bingMapsKey, mapTypeId:Microsoft.Maps.MapTypeId.road}); 

 }

 function ClickGeocode()
 {
     console.log("call Geocode");
     map.getCredentials(MakeGeocodeRequest);
 }

 function MakeGeocodeRequest(bingMapsKey)
 {
    console.log("call MakeGeocode");
    var geocodeRequest = "http://dev.virtualearth.net/REST/v1/Locations?query=" + encodeURI("Catamarca 235, Lomas de Zamora, Buenos Aires, AR") + "&key=" + bingMapsKey;
    $.ajax({
        url: geocodeRequest,
        dataType: "jsonp",
        jsonp: "jsonp",
        success: function (r) {
            codPos = GeocodeCallback(r);
        },
        error: function (e) {
            alert(e.statusText);
        }
    });

 }
 
 function returnValueOfTypes(place, tipo){
    array = place.address_components;
    
    for(x=0;x<array.length;x++){
        tipoArray = array[x].types[0];
        if(tipoArray == tipo)
            return array[x].short_name;
    }
    
    return "";
}

 function GeocodeCallback(result) 
 {
    console.log("call GeocodeCallback");
    
    //retorna el codigo postal
    return result.resourceSets[0].resources[0].address.postalCode;
 }
