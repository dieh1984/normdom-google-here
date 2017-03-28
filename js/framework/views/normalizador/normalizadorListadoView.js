define([
    'jquery',
    'underscore',
    'backbone',
    'keys',
    'handlebars',
    'text!../../templates/normalizador/normalizadorListadoTemplate.html',
    'text!../../templates/normalizador/tablaListadoNormalizado.html',
    'gmap'
], function($, _, Backbone, keys, Handlebars, NormalizadorListadosTemplate, TablaListaNormalizado, Gmap){
   
   var NormalizadorListado = Backbone.View.extend({
      
        render: function(){
            var self = this;
              
            var content = Handlebars.compile(NormalizadorListadosTemplate);
            self.$el.html(content());
            
            var map = new google.maps.Map($('#mapListado'), {
                center: {lat: -33.866, lng: 151.196},
                zoom: 15
            });
            
            
            
            
            /*for(var x = 0; x < 2; x++){
                doSetTimeout(x,500*x);
            }*/
            
            $.get('../../file/listado_nuevo_1000.txt', function(data){
            //$.get('../../file/listado_original_1000.txt', function(data){
            //$.get('../../file/listado_original_prueba2.txt', function(data){
            //$.get('../../file/listado_original.txt', function(data){
                var lines = data.split("\n");
                var times = 2000;
                
                var original_resultado = [];
                
                var calleFiltro = "";
                var nroFiltro = "";
                
                $("#total").text(lines.length);
                
                //i = 1 ; Se evita la primer fila que son los titulos de las columnas.
                for (var i = 1; i < lines.length; i++) {
                    
                    doSetTimeout(lines, i, google, times*i, map, original_resultado, 
                                    calleFiltro, nroFiltro, Handlebars, TablaListaNormalizado);
                }
                
            });
              
            return this;
        }
       
   });
   
   return NormalizadorListado;
});

// variable global para verificar que la direccion ya ha sido consultada en Google.
var direccionAux = "";

var totalOk = 0;
var totalSinResultados = 0;

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

function hasCalle(place, tipo){
    array = place.address_components;
    
    for(x=0;x<array.length;x++){
        tipoArray = array[x].types[0];
        if(tipoArray == tipo)
            return true;
    }
    
    return false;
}

function doSetTimeout(lines, i, google, time, map, original_resultado, calleFiltro, nroFiltro, Handlebars, TablaListaNormalizado) {
    setTimeout(function(){
        
        $("#procesados").text(i + 1);
        
        console.log(lines[i] + " --------- " + i + " ( " + lines.length + ")");
        
        var column = lines[i].split("\t");
        
        var calle = "";
        var localidad = "";
        var provincia = "";
        var codpos = "";
        
        
        
        // y = 1 para eviar el codigo del cliente.
        for(var y = 0; y < column.length; y++){
            
            if(column[y] != ""){
                
                provincia = column[0];
                localidad = column[1];
                calle = corregirCalle(column[2]) + " " + verificarNroCero(column[3]);
                //calle = column[2] + " " + verificarNroCero(column[3]);
                codpos = column[4];
                
                //var direccion = (direccion == "") ? column[y] : direccion + " " + column[y];
                //var direccion = calle + ", " + localidad + ", " + provincia + ", Argentina";
                //var direccion = "Argentina " + provincia + " " + localidad + " " + calle;
                var direccion = calle + ", " + localidad + ", " + provincia;
                
                // si la direccion a consultar es diferente a la aux, se hace la consulta.
                if(direccionAux != direccion){
                    
                    direccionAux = direccion;
                    
                    new google.maps.Geocoder().geocode( { 'address': direccion}, function(results, status) {
                        if(status != google.maps.GeocoderStatus.OK){
                            
                            totalSinResultados++;
                            
                            var obj = {
                                "id"            :   i,
                                "noResult"      :   0,
                                "calleOri"      :   column[2] + " " + column[3],
                                "localidadOri"  :   localidad,
                                "provinciaOri"  :   provincia,
                                "codposOri"     :   codpos,
                            };
                            
                            original_resultado.push(obj);
                            
                            console.log("Sin resultado");
                        }
                        else{
                            // si se encontro una direccion sin calle.
                            if(!hasCalle(results[0], "route")){
                                
                                totalSinResultados++;
                                
                                var obj = {
                                    "id"            :   i,
                                    "noResult"      :   0,
                                    "calleOri"      :   column[2] + " " + column[3],
                                    "localidadOri"  :   localidad,
                                    "provinciaOri"  :   provincia,
                                    "codposOri"     :   codpos,
                                };
                                
                                original_resultado.push(obj);
                                
                                console.log("Sin resultado - Sin Calle");
                            }
                            else{
                                
                                console.log(results)
                                
                                var calleRes = returnValueOfTypes(results[0],"route");
                                var numeroRes = returnValueOfTypes(results[0],"street_number");
                                var localidadRes = returnValueOfTypes(results[0],"locality");
                                var barrioRes = returnValueOfTypes(results[0],"sublocality_level_1");
                                if(barrioRes == "") barrioRes = returnValueOfTypes(results[0],"neighborhood");
                                var partidoRes = returnValueOfTypes(results[0],"administrative_area_level_2");
                                if(partidoRes == "") partidoRes = returnValueOfTypes(results[0],"locality");
                                var codigoPostalRes = returnValueOfTypes(results[0],"postal_code");
                                var provinciaRes = (localidad == "CABA") ? "Buenos Aires" : returnValueOfTypes(results[0],"administrative_area_level_1");
                            
                                if(numeroRes == "")
                                    numeroRes = "0";
                                    
                                totalOk++;
                                
                                /*console.log(calleRes + " " + numeroRes + " - " + localidadRes + " - " + barrioRes + " - " + partidoRes + " - " + 
                                            provinciaRes + " - C.P: " + codigoPostalRes);*/
                                    
                                var obj = {
                                    "id"            :   i,
                                    "calle"         :   calleRes,
                                    "numero"        :   numeroRes,
                                    "localidad"     :   localidadRes,
                                    "barrio"        :   barrioRes,
                                    "partido"       :   partidoRes,
                                    "provincia"     :   provinciaRes,
                                    "codpos"        :   codigoPostalRes,
                                    "calleOri"      :   column[2] + " " + column[3],
                                    "localidadOri"  :   localidad,
                                    "provinciaOri"  :   provincia,
                                    "codposOri"     :   codpos
                                };
                                
                                original_resultado.push(obj);
                            }
                        }
                    });
                    
                
                    /*var service = new google.maps.places.AutocompleteService();
                    
                    service.getQueryPredictions({ input: direccion }, function(predictions, status) {
                        if (status != google.maps.places.PlacesServiceStatus.OK) {
                            
                            var obj = {
                                "id"            :   i,
                                "noResult"      :   0,
                                "calleOri"      :   column[2] + " " + column[3],
                                "localidadOri"  :   localidad,
                                "provinciaOri"  :   provincia,
                                "codposOri"     :   codpos,
                            };
                            
                            original_resultado.push(obj);
                            
                            console.log("Sin resultado");
                            return;
                        }
                        
                        var request = {
                          placeId: predictions[0].place_id
                        };
                        
                        var serviceDetail = new google.maps.places.PlacesService(map);
                        
                        serviceDetail.getDetails(request, function (place, status) {
                            if (status == google.maps.places.PlacesServiceStatus.OK) {
                                
                                //console.log(place);
                            
                                var calleRes = returnValueOfTypes(place,"route");
                                var numeroRes = returnValueOfTypes(place,"street_number");
                                var localidadRes = returnValueOfTypes(place,"locality");
                                var barrioRes = returnValueOfTypes(place,"sublocality_level_1");
                                if(barrioRes == "") barrioRes = returnValueOfTypes(place,"neighborhood");
                                var partidoRes = returnValueOfTypes(place,"administrative_area_level_2");
                                if(partidoRes == "") partidoRes = returnValueOfTypes(place,"locality");
                                var codigoPostalRes = returnValueOfTypes(place,"postal_code");
                                var provinciaRes = (localidad == "CABA") ? "Buenos Aires" : returnValueOfTypes(place,"administrative_area_level_1");
                            
                                if(numeroRes == "") numeroRes = "0";
                            
                                console.log(calleRes + " " + numeroRes + " - " + localidadRes + " - " + barrioRes + " - " + partidoRes + " - " + 
                                            provinciaRes + " - C.P: " + codigoPostalRes);
                                
                                    
                                    //console.log("FILTRAMOS LA CALLE Y EL NRO PARA EVITAR QUE CARGUE MÁS DE UNA VEZ");
                                    
                                    var obj = {
                                        "id"            :   i,
                                        "calle"         :   calleRes,
                                        "numero"        :   numeroRes,
                                        "localidad"     :   localidadRes,
                                        "barrio"        :   barrioRes,
                                        "partido"       :   partidoRes,
                                        "provincia"     :   provinciaRes,
                                        "codpos"        :   codigoPostalRes,
                                        "calleOri"      :   column[2] + " " + column[3],
                                        "localidadOri"  :   localidad,
                                        "provinciaOri"  :   provincia,
                                        "codposOri"     :   codpos
                                    };
                                    
                                    original_resultado.push(obj);
                        
                            }
                        });
                        
                        //console.log(predictions);
                        
                        //console.log(predictions[0].description);
                        
                    });*/
                }
                
            }
        }
        
        //console.log("INDICE .................. " + i + " ( " + lines.length + ")");
        
        if(i == (lines.length - 1)){
            console.log("FIN");
            //console.log(original_resultado);
            $("#tablaPrediccion").empty();
            
            $("#tituloProceso").text("Fin de la Operación - GOOGLE Maps");
            $("#progressBarNormalizador").removeClass("progress-bar-danger");
            $("#progressBarNormalizador").addClass("progress-bar-success");
            
            var content = Handlebars.compile(TablaListaNormalizado);
            $('#tablaPrediccion').append (content({listadoResult: original_resultado, totalOk: totalOk, 
                                    totalSinResultados: totalSinResultados}));
        }
        
        //actualizamos la barra de progreso.
        var totalDirecciones = lines.length;
        var porcTotal = 100;
        var cantNormalizados = i + 1;
        
        var valNormalizado = (cantNormalizados * porcTotal) / totalDirecciones;
        
        var porcNormalizado = valNormalizado + "%";
        $('#progressBarNormalizador').attr('aria-valuenow', valNormalizado).css('width',porcNormalizado);

    },time);
}


function corregirCalle(calle){
    
    calle.replace('-', '');
    
    // INI - SI TIENE PARENTESIS, SE ELIMINA
    if(calle.indexOf("(") != -1){
        var parentesisIni = calle.indexOf("(");
        
        if(calle.indexOf(")") != -1){
            
            var parentesisFin = calle.indexOf(")");
            
            var calleAux = calle;
            
            calle = calleAux.substr(0,parentesisIni);
            calle += calleAux.substr((parentesisFin + 1), calleAux.length);
        }
    }
    //FIN - PARENTESIS
    
    /*var calleCorregida = "";
    var calleArray = calle.split(" ");
    
    if(calleArray.length == 1) return calle;
    
    for(var x = 0; x < calleArray.length; x++){
    
        if(calleArray[x].toLowerCase().indexOf("avda.") != -1 ||
            calleArray[x].toLowerCase().indexOf("av.") != -1 ||
            calleArray[x].toLowerCase().indexOf("avda") != -1 ||
            //calleArray[x].toLowerCase().indexOf("av") != -1 ||
            calleArray[x].toLowerCase().indexOf("avenida") != -1){
                calleCorregida = "Av. ";
                break;
        }
    
    }
    
    for(var x = 0; x < calleArray.length; x++){
        if( calleArray[x].toLowerCase().indexOf("avda.") == -1 && 
            calleArray[x].toLowerCase().indexOf("av.") == -1 &&
            calleArray[x].toLowerCase().indexOf("avda") == -1 &&
            //calleArray[x].toLowerCase().indexOf("av") == -1 &&
            calleArray[x].toLowerCase().indexOf("avenida") == -1)
            
                (calleCorregida == "") ? calleCorregida += calleArray[x] : calleCorregida += " " + calleArray[x];
        
    }*/
    
    return calle;
}

function verificarNroCero(numero){
    return (numero == 0) ? "" : numero;
}