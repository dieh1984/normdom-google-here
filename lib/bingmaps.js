define(
    [ "async!http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0!onscriptload"],
    function() {
    		
	    if (window.navigator.onLine) {
		  console.info("Online Bine Maps");
		  return true;
		} else {
		  console.info("Offline Bing Maps");
		  return false;
		}
    }
);