# MMM-Tronity
Pull charging and range data from your EV via Tronity Platform.

Installation:

Run git clone https://github.com/robotfishe/MMM-Tronity.git
<br>Run npm install

Configuration:

Add the following section to your config.js:

{
<br>  module: "MMM-Tronity",
<br>  position: "",
<br>  config: {
<br>    clientId: "",
<br>    clientSecret: "",
<br>    vehicleId: "",
<br>    mapboxApiKey: "",
<br>  }
<br>},

You will need a Tronity account and a vehicle set up for API access via Tronity Platform. Input your client ID, client secret, and vehicle ID in the config lines. Fill in the "position" variable based on where you want the panel on your MagicMirror.

You will also need a Mapbox api (available at https://account.mapbox.com/auth/signup/) UNLESS you turn the maps feature off (see below).

Additional optional config variables are:
<br>metricRange (default is TRUE): set this to false if you want your range displayed in miles.
<br>updateInterval (default is 5 minutes): changes frequency of updates; expressed in milliseconds.
<br>map (default is TRUE): set this to false if you don't want a map of your car's current location displayed.
<br>mapboxStyle (default is "satellite-streets-v11"): use this to change the map style; see the options at https://docs.mapbox.com/api/maps/styles/
