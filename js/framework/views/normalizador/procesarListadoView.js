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
   
    var direccionAux = "";

    // ======= Variables que contabilizan los resultados de HERE y GOOGLE
    var totalHereOk = 0;
    var totalGoogleOk = 0;
    var totalHereNotFound = 0;
    var totalGoogleNotFound = 0;
    var totalHereCodPosErroneo = 0;
    var totalGoogleCodPosErroneo = 0;
    var totalMerlinOk = 0;
    var totolMerlinDudosos = 0;
    var totalMerlinNoEncontrados = 0;
    
    var googleAndHereOK = 0;
    var googleAndHereERROR = 0;
    var googleAndHereWARNING = 0;
    
    // ======= Configuración para recorrer cada dirección
    var delay = 2;
    var delayHere = 2;
    var nextAddressGoogle = 1;
    var nextAddressHere = 1;
    
    var hereMaps   = [];
    var googleMaps = [];
    var merlin     = [];
    
    //variable que contiene la lista completa.
    var resultados = [];
    
    var addresses = null;
    
    
    
    // ======= Funcion que carga los resultados de merlin para compararlos
    function merlinLoad(){
        for(var x = 1; x < addresses.length; x++){
            var column = addresses[x].split("\t");
            
            if(column.length > 0){
                var provincia   = column[5];
                var partido     = column[6];
                var localidad   = column[7];
                var barrio      = column[8];
                var calle       = column[9] + " " + column[10];
                var codpos      = column[11];
                var resolucion  = column[12];
                var motivo      = column[13];
                
                if(resolucion == 'CO')  totalMerlinOk++;
                else if(resolucion == 'DU')  totolMerlinDudosos++;
                else if(resolucion == 'NE')  totalMerlinNoEncontrados++;
                
                var obj = {
                    "id"            :   x,
                    "provincia"     :   provincia,
                    "partido"       :   partido,
                    "localidad"     :   localidad,
                    "barrio"        :   barrio,
                    "calle"         :   calle,
                    "codpos"        :   codpos,
                    "resolucion"    :   resolucion,
                    "motivo"        :   motivo
                };

                merlin.push(obj);
                
            }
        }
        
        console.log(merlin);
    }
    
    
    
    // ======= Funcion que busca las direcciones en Google Maps
    function googleSearch() {
        
        if (nextAddressGoogle < addresses.length) {
            
            var column = addresses[nextAddressGoogle].split("\t");
            
            if(column.length > 0){
                
                var calle = "";
                var localidad = "";
                var provincia = "";
                var codpos = "";
                    
                provincia = column[0];
                localidad = column[1];
                calle = corregirCalle(column[2]) + " " + verificarNroCero(column[3]);
                codpos = column[4];
                
                //asignamos un formato de direccion distinta para google sin el codigo postal.
                var direccionGoogle = calle + ", " + localidad + ", " + provincia + ", Argentina";
                
                setTimeout(function(){
                    new google.maps.Geocoder().geocode({address:direccionGoogle}, function (results,status){
            
                        if (status == google.maps.GeocoderStatus.OK) {
                            if(!hasCalle(results[0], "route")){
                                    
                                totalGoogleNotFound++;
                                
                                var resultadoGoogle = {
                                    "id"            :   (nextAddressGoogle - 1),
                                    "hasAddress"    :   false,
                                    "calleOri"      :   column[2] + " " + column[3],
                                    "localidadOri"  :   localidad,
                                    "provinciaOri"  :   provincia,
                                    "codposOri"     :   codpos
                                };
                                
                                googleMaps.push(resultadoGoogle);
                                
                            }
                            else{
                                
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
                                
                                var hasNotErrorCodPos = (codpos == codigoPostalRes.substr(1,5));
                                
                                if(hasNotErrorCodPos) totalGoogleOk++;  
                                else totalGoogleCodPosErroneo++;
                                    
                                var resultadoGoogle = {
                                    "id"            :   (nextAddressGoogle - 1),
                                    "hasAddress"    :   true,
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
                                
                                googleMaps.push(resultadoGoogle);
                            }
                            
                            //actualizamos la barra de progreso.
                            var totalDirecciones = addresses.length - 1;
                            var porcTotal = 100;
                            var cantNormalizados = nextAddressGoogle;
                            
                            var valNormalizado = (cantNormalizados * porcTotal) / totalDirecciones;
                            
                            var porcNormalizado = valNormalizado + "%";
                            $("#procesadosGoogle").text(nextAddressGoogle - 1);
                            $('#progressBarGoogle').attr('aria-valuenow', valNormalizado).css('width',porcNormalizado);
                        }
                        // ====== Decode the error status ======
                        else {
                            // === if we were sending the requests to fast, try this one again and increase the delay
                            if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                                console.log(nextAddressGoogle + " de " + addresses.length + " >>>> OVER_QUERY_LIMIT");
                                nextAddressGoogle--;
                                //delay++;
                            }
                            else{
                                totalGoogleNotFound++;
                                
                                var resultadoGoogle = {
                                    "id"            :   (nextAddressGoogle - 1),
                                    "hasAddress"    :   false,
                                    "calleOri"      :   column[2] + " " + column[3],
                                    "localidadOri"  :   localidad,
                                    "provinciaOri"  :   provincia,
                                    "codposOri"     :   codpos
                                };
                                
                                googleMaps.push(resultadoGoogle);
                                
                                //actualizamos la barra de progreso.
                                var totalDirecciones = addresses.length - 1;
                                var porcTotal = 100;
                                var cantNormalizados = nextAddressGoogle;
                                
                                var valNormalizado = (cantNormalizados * porcTotal) / totalDirecciones;
                                
                                var porcNormalizado = valNormalizado + "%";
                                $("#procesadosGoogle").text(nextAddressGoogle - 1);
                                $('#progressBarGoogle').attr('aria-valuenow', valNormalizado).css('width',porcNormalizado);
                            }   
                        }
                        googleSearch();
                    });
                    
                }, delay);
                nextAddressGoogle++;
            }
        }
        else{
            
            $("#progressBarGoogle").removeClass("progress-bar-danger");
            $("#progressBarGoogle").addClass("progress-bar-success");
            
            
            // completamos la lista con los resultados
            for(var x = 0; x < merlin.length; x++){
                
                for(var y = 0; y < hereMaps.length; y++){
                    
                    if(merlin[x].id == hereMaps[y].id){
                    
                        for(var j = 0; j < googleMaps.length; j++){
                        
                            if(merlin[x].id == googleMaps[j].id){
                                
                                if(!googleMaps[j].hasAddress && hereMaps[y].noResultHere == 0)
                                    googleAndHereERROR++;
                                else if(googleMaps[j].errorCodPos == 1 || hereMaps[y].errorCodPosHere == 1)
                                    googleAndHereOK++;
                                else
                                    googleAndHereWARNING++;
                                    
                                
                                var obj = {
                                    "noResultGoogle"    :   (googleMaps[j].hasAddress) ? 1 : 0,
                                    "noResultHere"      :   (hereMaps[y].noResultHere == 1) ? 1 : 0,
                                    "errorCodPosGoogle" :   googleMaps[j].errorCodPos,
                                    "errorCodPosHere"   :   hereMaps[y].errorCodPosHere,
                                    "calleGoogle"       :   googleMaps[j].calle,
                                    "numeroGoogle"      :   googleMaps[j].numero,
                                    "localidadGoogle"   :   googleMaps[j].localidad,
                                    "barrioGoogle"      :   googleMaps[j].barrio,
                                    "partidoGoogle"     :   googleMaps[j].partido,
                                    "provinciaGoogle"   :   googleMaps[j].provincia,
                                    "codposGoogle"      :   googleMaps[j].codpos,
                                    "calleHere"         :   hereMaps[y].calle,
                                    "numeroHere"        :   hereMaps[y].numero,
                                    "localidadHere"     :   hereMaps[y].localidad,
                                    "barrioHere"        :   hereMaps[y].barrio,
                                    "partidoHere"       :   hereMaps[y].partido,
                                    "provinciaHere"     :   hereMaps[y].provincia,
                                    "codposHere"        :   hereMaps[y].codpos,
                                    "calleMerlin"       :   merlin[x].calle,
                                    "localidadMerlin"   :   merlin[x].localidad,
                                    "partidoMerlin"     :   merlin[x].partido,
                                    "provinciaMerlin"   :   merlin[x].provincia,
                                    "barrioMerlin"      :   merlin[x].barrio,
                                    "codposMerlin"      :   merlin[x].codpos,
                                    "resolucion"        :   merlin[x].resolucion,
                                    "motivo"            :   merlin[x].motivo,
                                    "calleOri"          :   hereMaps[j].calleOri,
                                    "localidadOri"      :   hereMaps[j].localidadOri,
                                    "provinciaOri"      :   hereMaps[j].provinciaOri,
                                    "codposOri"         :   hereMaps[j].codposOri
                                };
                                
                                resultados.push(obj);
                                
                                break;
                                
                            }
                            
                        }
                        
                        break;
                    
                    }
                    
                }
                
                console.log(resultados);
                resultados
                
            }
            
            $("#tablaPrediccion").empty();
                            
            $("#tituloProceso").text("Fin de la Operación");
            
            var content = Handlebars.compile(TablaResultadoNormalizador);
            $('#tablaPrediccion').append (content({listadoResult: resultados, totalHereOk: totalHereOk, 
                                    totalGoogleOk: totalGoogleOk, totalHereNotFound: totalHereNotFound,
                                    totalGoogleNotFound: totalGoogleNotFound, totalHereCodPosErroneo: totalHereCodPosErroneo,
                                    totalGoogleCodPosErroneo: totalGoogleCodPosErroneo, googleAndHereOK: googleAndHereOK,
                                    googleAndHereERROR: googleAndHereERROR, googleAndHereWARNING: googleAndHereWARNING,
                                    totalMerlinOk: totalMerlinOk, totolMerlinDudosos: totolMerlinDudosos, 
                                    totalMerlinNoEncontrados: totalMerlinNoEncontrados}));
        }
    }
    
    
    
    // ======= Funcion que busca las direcciones en Here Maps
    function hereMapsSearch() {
        
        if (nextAddressHere < addresses.length) {
            
            var column = addresses[nextAddressHere].split("\t");
            
            if(column.length > 0){
                
                var calle = "";
                var localidad = "";
                var provincia = "";
                var codpos = "";
                    
                provincia = column[0];
                localidad = column[1];
                calle = corregirCalle(column[2]) + " " + verificarNroCero(column[3]);
                codpos = column[4];
                
                //asignamos un formato de direccion distinta para google sin el codigo postal.
                var direccion = calle + ", " + codpos + " " + localidad + ", " + provincia + ", Argentina";
                
                setTimeout(function(){
                    
                    // creamos la instancia plataform ingresando app_id y app_code
                    var platform = new H.service.Platform({
                      'app_id': '6MI2h9DgCYgIe3UqclbL',
                      'app_code': 'KqvGUE0wrf3A4zqT0X9JVA'
                    });
                    
                    // Create the parameters for the geocoding request:
                    var geocodingParams = {
                        searchText: direccion
                    };
                    console.log("Antes");
                    var geocoder = platform.getGeocodingService();
                    console.log("Despues");
                    
                    geocoder.geocode(geocodingParams, function(result) {
                        
                        console.log(result);
                        console.log("entontro algo!!")
                        
                        if(result.Response.View.length == 0 || 
                                result.Response.View[0].Result[0].Location.Address.Street == null){
                            
                            totalHereNotFound++;
                                var obj = {
                                "id"                :   (nextAddressHere - 1),
                                "noResultHere"      :   0,
                                "calleOri"          :   column[2] + " " + column[3],
                                "localidadOri"      :   localidad,
                                "provinciaOri"      :   provincia,
                                "codposOri"         :   codpos
                            };
                            
                            hereMaps.push(obj);
                            
                        }
                        else{
                            
                            var address = result.Response.View[0].Result[0].Location.Address;
                            
                            var calleRes = address.Street;
                            var numeroRes = address.HouseNumber;
                            var localidadRes = address.City;
                            var barrioRes = address.District;
                            var partidoRes = address.County;
                            var codigoPostalRes = address.PostalCode;
                            var provinciaRes = address.State;
                            
                            var hasNotErrorCodPos = (codpos == codigoPostalRes);
                            
                            if(hasNotErrorCodPos) totalHereOk++;  
                            else totalHereCodPosErroneo++;
                                
                            var obj = {
                                "id"                :   (nextAddressHere - 1),
                                "noResultHere"      :   1,
                                "errorCodPosHere"   :   (hasNotErrorCodPos) ? 1 : 0,
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
                                "codposOri"         :   codpos
                            };
                            
                            hereMaps.push(obj);
                        }
                        
                        //actualizamos la barra de progreso.
                        var totalDirecciones = addresses.length - 1;
                        var porcTotal = 100;
                        var cantNormalizados = nextAddressHere;
                        
                        var valNormalizado = (cantNormalizados * porcTotal) / totalDirecciones;
                        
                        var porcNormalizado = valNormalizado + "%";
                        $("#procesadosHere").text(nextAddressHere - 1);
                        $('#progressBarHere').attr('aria-valuenow', valNormalizado).css('width',porcNormalizado);
                        
                        hereMapsSearch();
                    
                    }, function(e){
                        console.log(e);
                        console.log("Fallo!");
                        hereMapsSearch();
                        //totalHereNotFound++;
                        
                    });
                    
                }, delayHere);
                nextAddressHere++;
            }
        }
        else{
            $("#progressBarHere").removeClass("progress-bar-warning");
            $("#progressBarHere").addClass("progress-bar-success");
            
            console.log("AQUI CARGAMOS EL HTML FINAL");
            
            console.log("ENCONTRADOS HERE: " + totalHereOk);
            console.log("DUDOSOS HERE: " + totalHereCodPosErroneo);
            console.log("NO ENCONTRADOS HERE: " + totalHereNotFound);
            console.log(hereMaps);
        }
    }
   
    var NormalizadorListado = Backbone.View.extend({
      
        render: function(){
            
            var self = this;
              
            var content = Handlebars.compile(NormalizadorListadosTemplate);
            self.$el.html(content());
            
            
            // obtener archivo original para normalizar con Here y Google
            $.get('/file/listado_nuevo_100.txt', function(data){
                var lines = data.split("\n");
                
                var resultadoHere = [];
                
                var calleFiltro = "";
                var nroFiltro = "";
                
                $("#total1").text(lines.length - 1);
                $("#total2").text(lines.length - 1);
                
                addresses = lines;
                
                
                merlinLoad();
                
                googleSearch();
                hereMapsSearch();
                 
            });
                
              
            return this;
        }
       
   });
   
   return NormalizadorListado;
});

// variable global para verificar que la direccion ya ha sido consultada en Google.


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