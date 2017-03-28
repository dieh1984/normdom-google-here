define([
    'jquery',
    'underscore',
    'backbone',
    'keys',
    'handlebars',
    'text!../../templates/normalizador/normalizadorListadoTemplate.html',
    'text!../../templates/normalizador/tablaResultadoNormalizador.html',
    'gmap',
    'mapsHereService',
    'mapsHereCore'
], function($, _, Backbone, keys, Handlebars, NormalizadorListadosTemplate, TablaResultadoNormalizador, Gmap, 
            MapsHereService, MapsHereCore){
   
   var NormalizadorListado = Backbone.View.extend({
      
        render: function(){
            
            var self = this;
              
            var content = Handlebars.compile(NormalizadorListadosTemplate);
            self.$el.html(content());
            
            console.log("nuevo normalizador de Here & Google");
            
            
            
            
            // INI - obtener el resultado de merlin
            var resultadoMerlin = [];
            
            $.get('../../file/resultado_merlin_1000.txt', function(data){
                var lines = data.split("\n");
                
                //i = 1 ; Se evita la primer fila que son los titulos de las columnas.
                for (var i = 1; i < lines.length; i++) {
                    
                    var column = lines[i].split("\t");
                    
                    var obj = {
                        "id"            :   i,
                        "calle"         :   column[4],
                        "numero"        :   column[5],
                        "localidad"     :   column[2],
                        "barrio"        :   column[3],
                        "partido"       :   column[1],
                        "provincia"     :   column[0],
                        "codpos"        :   column[6]
                    };
                    
                    resultadoMerlin.push(obj);
                }
                
                console.log(resultadoMerlin);
                
                
                // obtener archivo original para normalizar con Here y Google
                $.get('../../file/listado_nuevo_100.txt', function(data){
                    var lines = data.split("\n");
                    var times = 2000;
                    
                    var resultadoHere = [];
                    
                    var calleFiltro = "";
                    var nroFiltro = "";
                    
                    $("#total").text(lines.length - 1);
                    
                    //i = 1 ; Se evita la primer fila que son los titulos de las columnas.
                    for (var i = 1; i < lines.length; i++) {
                        
                        getMapsHereAddress(lines, google, i, times*i, resultadoHere, 
                                        calleFiltro, nroFiltro, Handlebars, TablaResultadoNormalizador, resultadoMerlin[i-1]);
                        
                    }
                    
                });
                
            });
            
            // FIN - obtener el resultado de merlin
              
            return this;
        }
       
   });
   
   return NormalizadorListado;
});

// variable global para verificar que la direccion ya ha sido consultada en Google.
var direccionAux = "";

var totalHereOk = 0;
var totalGoogleOk = 0;
var totalHereNotFound = 0;
var totalGoogleNotFound = 0;
var totalHereCodPosErroneo = 0;
var totalGoogleCodPosErroneo = 0;

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



function getMapsHereAddress(lines, google, i, time, resultadoHere, calleFiltro, nroFiltro, 
            Handlebars, TablaResultadoNormalizador,resultadoMerlin) {
    setTimeout(function(){
        
        $("#procesados").text(i);
        
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
                codpos = column[4];
                
                var direccion = calle + ", " + codpos + " " + localidad + ", " + provincia + ", Argentina";
                
                //asignamos un formato de direccion distinta para google sin el codigo postal.
                var direccionGoogle = calle + ", " + localidad + ", " + provincia + ", Argentina";
                
                // si la direccion a consultar es diferente a la aux, se hace la consulta.
                if(direccionAux != direccion){
                    
                    direccionAux = direccion;
                    
                    // creamos la instancia plataform ingresando app_id y app_code
                    var platform = new H.service.Platform({
                      'app_id': 'eJKOL5CGkY5GCrfy7nCM',
                      'app_code': 'Fc7BWcCyW9cXOPHH7A7OqA'
                    });
                    
                    // Create the parameters for the geocoding request:
                    var geocodingParams = {
                        searchText: direccion
                    };
                    
                    var geocoder = platform.getGeocodingService();
                    
                    geocoder.geocode(geocodingParams, function(result) {
                        
                        var respuestaGoogle = null;
                        
                        new google.maps.Geocoder().geocode( { 'address': direccionGoogle}, function(results, status) {
                            
                            console.log("CONSULTA GOOGLE...");
                            
                            if(status != google.maps.GeocoderStatus.OK){
                                
                                totalGoogleNotFound++;
                                
                                var respuestaGoogle = {
                                    "id"            :   i,
                                    "noResultGoogle":   0
                                };
                            }
                            else{
                                // si se encontro una direccion sin calle.
                                if(!hasCalle(results[0], "route")){
                                    
                                    totalGoogleNotFound++;
                                    
                                    var respuestaGoogle = {
                                        "id"            :   i,
                                        "noResultGoogle":   0
                                    };
                                    
                                }
                                else{
                                    
                                    console.log(results);
                                    
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
                                    
                                    var hasNotErrorCodPos = (parseInt(resultadoMerlin.codpos) == parseInt(codigoPostalRes.substr(1,5)));
                                    
                                    if(hasNotErrorCodPos) totalGoogleOk++;  
                                    else totalGoogleCodPosErroneo++;
                                        
                                    var respuestaGoogle = {
                                        "id"            :   i,
                                        "noResultGoogle":   1,
                                        "errorCodPos"   :   (hasNotErrorCodPos) ? 1 : 0,
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
                                    
                                    
                                }
                            }
                            
                            console.log("CONSULTA HERE...");
                        
                            if(result.Response.View.length == 0 || 
                                    result.Response.View[0].Result[0].Location.Address.Street == null){
                                
                                totalHereNotFound++;
                                
                                var obj = {
                                    "id"                :   i,
                                    "noResultHere"      :   0,
                                    "noResultGoogle"    :   respuestaGoogle.noResultGoogle,
                                    "errorCodPosHere"   :   0,
                                    "errorCodPosGoogle" :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.errorCodPos : 0,
                                    "calleOri"          :   column[2] + " " + column[3],
                                    "localidadOri"      :   localidad,
                                    "provinciaOri"      :   provincia,
                                    "codposOri"         :   codpos,
                                    "calleMerlin"       :   resultadoMerlin.calle + " " + resultadoMerlin.numero,
                                    "localidadMerlin"   :   resultadoMerlin.localidad,
                                    "provinciaMerlin"   :   resultadoMerlin.provincia,
                                    "codposMerlin"      :   resultadoMerlin.codpos,
                                    "partidoMerlin"     :   resultadoMerlin.partido,
                                    "barrioMerlin"      :   resultadoMerlin.barrio,
                                    "calleGoogle"       :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.calle + " " + respuestaGoogle.numero : null,
                                    "localidadGoogle"   :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.localidad : null,
                                    "barrioGoogle"      :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.barrio : null,
                                    "partidoGoogle"     :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.partido : null,
                                    "provinciaGoogle"   :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.provincia : null,
                                    "codposGoogle"      :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.codpos : null
                                };
                                
                                resultadoHere.push(obj);
                                
                                console.log("Sin resultado");
                            }
                            else{
                                
                                var address = result.Response.View[0].Result[0].Location.Address;
                                
                                var calleRes = address.Street;
                                var numeroRes = address.HouseNumber;
                                var localidadRes = address.City;
                                var barrioRes = address.District;
                                //if(barrioRes == "") barrioRes = returnValueOfTypes(results[0],"neighborhood");
                                var partidoRes = address.County;
                                //if(partidoRes == "") partidoRes = returnValueOfTypes(results[0],"locality");
                                var codigoPostalRes = address.PostalCode;
                                var provinciaRes = address.State;
                            
                                /*if(numeroRes == "")
                                    numeroRes = "0";*/
                                
                                console.log(calleRes);
                                
                                var hasNotErrorCodPos = (parseInt(resultadoMerlin.codpos) == parseInt(codigoPostalRes));
                                
                                if(hasNotErrorCodPos) totalHereOk++;  
                                else totalHereCodPosErroneo++;
                                    
                                var obj = {
                                    "id"                :   i,
                                    "noResultHere"      :   1,
                                    "errorCodPosHere"   :   (hasNotErrorCodPos) ? 1 : 0,
                                    "errorCodPosGoogle" :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.errorCodPos : 0,
                                    "noResultGoogle"    :   respuestaGoogle.noResultGoogle,
                                    "calle"             :   calleRes,
                                    "numero"            :   numeroRes,
                                    "localidad"         :   localidadRes,
                                    "barrio"            :   barrioRes,
                                    "partido"           :   partidoRes,
                                    "provincia"         :   provinciaRes,
                                    "codpos"            :   codigoPostalRes,
                                    "calleOri"          :   column[2] + " " + column[3],
                                    "localidadOri"      :   localidad,
                                    "provinciaOri"      :   provincia,
                                    "codposOri"         :   codpos,
                                    "calleMerlin"       :   resultadoMerlin.calle + " " + resultadoMerlin.numero,
                                    "localidadMerlin"   :   resultadoMerlin.localidad,
                                    "provinciaMerlin"   :   resultadoMerlin.provincia,
                                    "codposMerlin"      :   resultadoMerlin.codpos,
                                    "partidoMerlin"     :   resultadoMerlin.partido,
                                    "barrioMerlin"      :   resultadoMerlin.barrio,
                                    "calleGoogle"       :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.calle + " " + respuestaGoogle.numero : null,
                                    "localidadGoogle"   :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.localidad : null,
                                    "barrioGoogle"      :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.barrio : null,
                                    "partidoGoogle"     :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.partido : null,
                                    "provinciaGoogle"   :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.provincia : null,
                                    "codposGoogle"      :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.codpos : null
                                };
                                
                                resultadoHere.push(obj);
                                
                                //console.log(result);
                                console.log(result.Response.View[0].Result[0].Location.Address);
                            }
                            
                            
                            // SI ES EL ULTIMO REGISTRO, IMPRIME EL RESULTADO EN LA PANTALLA
                            if(i == (lines.length - 1)){
                                console.log("FIN !!!");
                                console.log(resultadoHere);
                                //console.log(original_resultado);
                                $("#tablaPrediccion").empty();
                                
                                $("#tituloProceso").text("Fin de la Operación - HERE Maps");
                                $("#progressBarNormalizador").removeClass("progress-bar-danger");
                                $("#progressBarNormalizador").addClass("progress-bar-success");
                                
                                var content = Handlebars.compile(TablaResultadoNormalizador);
                                $('#tablaPrediccion').append (content({listadoResult: resultadoHere, totalHereOk: totalHereOk, 
                                                        totalGoogleOk: totalGoogleOk, totalHereNotFound: totalHereNotFound,
                                                        totalGoogleNotFound: totalGoogleNotFound, totalHereCodPosErroneo: totalHereCodPosErroneo,
                                                        totalGoogleCodPosErroneo: totalGoogleCodPosErroneo}));
                            }
                            
                            
                            
                        });
                    
                    }, function(e){
                        
                        totalHereNotFound++;
                        
                        new google.maps.Geocoder().geocode( { 'address': direccionGoogle}, function(results, status) {
                            
                            console.log("CONSULTA GOOGLE...");
                            
                            if(status != google.maps.GeocoderStatus.OK){
                                
                                totalGoogleNotFound++;
                                
                                var respuestaGoogle = {
                                    "id"            :   i,
                                    "noResultGoogle":   0
                                };
                            }
                            else{
                                // si se encontro una direccion sin calle.
                                if(!hasCalle(results[0], "route")){
                                    
                                    totalGoogleNotFound++;
                                    
                                    var respuestaGoogle = {
                                        "id"            :   i,
                                        "noResultGoogle":   0
                                    };
                                    
                                }
                                else{
                                    
                                    console.log(results);
                                    
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
                                    
                                    var hasNotErrorCodPos = (parseInt(resultadoMerlin.codpos) == parseInt(codigoPostalRes.substr(1,5)));
                                    
                                    if(hasNotErrorCodPos) totalGoogleOk++;  
                                    else totalGoogleCodPosErroneo++;
                                    
                                    var respuestaGoogle = {
                                        "id"            :   i,
                                        "noResultGoogle":   1,
                                        "errorCodPos"   :   (hasNotErrorCodPos) ? 1 : 0,
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
                                    
                                }
                            }
                            
                            var obj = {
                                "id"                :   i,
                                "noResultHere"      :   0,
                                "noResultGoogle"    :   respuestaGoogle.noResultGoogle,
                                "errorCodPosHere"   :   0,
                                "errorCodPosGoogle" :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.errorCodPos : 0,
                                "calleOri"          :   column[2] + " " + column[3],
                                "localidadOri"      :   localidad,
                                "provinciaOri"      :   provincia,
                                "codposOri"         :   codpos,
                                "calleMerlin"       :   resultadoMerlin.calle + " " + resultadoMerlin.numero,
                                "localidadMerlin"   :   resultadoMerlin.localidad,
                                "provinciaMerlin"   :   resultadoMerlin.provincia,
                                "codposMerlin"      :   resultadoMerlin.codpos,
                                "partidoMerlin"     :   resultadoMerlin.partido,
                                "barrioMerlin"      :   resultadoMerlin.barrio,
                                "calleGoogle"       :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.calle + " " + respuestaGoogle.numero : null,
                                "localidadGoogle"   :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.localidad : null,
                                "barrioGoogle"      :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.barrio : null,
                                "partidoGoogle"     :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.partido : null,
                                "provinciaGoogle"   :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.provincia : null,
                                "codposGoogle"      :   (respuestaGoogle.noResultGoogle == 1) ? respuestaGoogle.codpos : null
                            };
                            
                            resultadoHere.push(obj);
                            
                            // SI ES EL ULTIMO REGISTRO, IMPRIME EL RESULTADO EN LA PANTALLA
                            if(i == (lines.length - 1)){
                                console.log("FIN !!!");
                                console.log(resultadoHere);
                                //console.log(original_resultado);
                                $("#tablaPrediccion").empty();
                                
                                $("#tituloProceso").text("Fin de la Operación - HERE Maps");
                                $("#progressBarNormalizador").removeClass("progress-bar-danger");
                                $("#progressBarNormalizador").addClass("progress-bar-success");
                                
                                var content = Handlebars.compile(TablaResultadoNormalizador);
                                $('#tablaPrediccion').append (content({listadoResult: resultadoHere, totalHereOk: totalHereOk, 
                                                        totalGoogleOk: totalGoogleOk, totalHereNotFound: totalHereNotFound,
                                                        totalGoogleNotFound: totalGoogleNotFound, totalHereCodPosErroneo: totalHereCodPosErroneo,
                                                        totalGoogleCodPosErroneo: totalGoogleCodPosErroneo}));
                            }

                        });
                        
                    });
                }
            }
        }
        
        
        
        //actualizamos la barra de progreso.
        var totalDirecciones = lines.length - 1;
        var porcTotal = 100;
        var cantNormalizados = i;
        
        var valNormalizado = (cantNormalizados * porcTotal) / totalDirecciones;
        
        var porcNormalizado = valNormalizado + "%";
        $('#progressBarNormalizador').attr('aria-valuenow', valNormalizado).css('width',porcNormalizado);

    },time);
}


function corregirCalle(calle){
    
    calle.replace('-', '');
    calle.replace(' y ', ' @ ');
    calle.replace(' Y ', ' @ ');
    
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
    
    return calle;
}

function verificarNroCero(numero){
    return (numero == 0) ? "" : numero;
}