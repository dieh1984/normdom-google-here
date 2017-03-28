define(
    [ "async!http://maps.google.com/maps/api/js?sensor=false&key=AIzaSyCzTnEnjjbwz_IMwU0SCI77pljcr61A5Bo&signed_in=true&libraries=places"],
    function() {
    		
	    if (window.navigator.onLine) {
		  console.info("Online");
		  return true;
		} else {
		  console.info("Offline");
		  return false;
		}
    }
);