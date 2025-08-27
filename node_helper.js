var NodeHelper = require("node_helper");
const request = require('request');

var authToken = null;

const authUrl = "https://api.tronity.tech/authentication"
const vehicleDataUrl = "https://api.tronity.tech/tronity/vehicles/VEHICLE_ID/last_record"

module.exports = NodeHelper.create({

  defaults: {
    debug: false
  },
  config: {
	  clientId: '',
	  clientSecret: '',
	  vehicleId: ''
  },

  start: function () {
    console.log('Starting node_helper for MMM-Tronity');
  },


  getAuth: function (vehicleId) {
   var self = this;
	  
	  console.log('Authenticating via url ' + authUrl);
	  console.log('Using client ID ' + this.config.clientId);
	  console.log('and client secret ' + this.config.clientSecret);
	  
      const options = {
        url: authUrl,
        method: 'POST',
		json: true,
        body: {
			'client_id': self.config.clientId,
			'client_secret': self.config.clientSecret,
			'grant_type': 'app'
        }
      };

      request(options, function (error, response, body) {
        if (!error) {
			console.log('Response status code ' + response.statusCode);
			//self.debug('Received response ' + JSON.stringify(response));
          if (response.statusCode == 201) {
			//const obj = JSON.parse(response);
            authToken = response.body.access_token;
            console.log('Got auth token ' + authToken);
			self.getVehicleData(vehicleId);
          }
          else {
            console.log(response.statusCode + ' - ' + response.statusMessage);
          }
        } else if (error) {
          console.log(error);
        }
      });
	  console.log('Completed auth token request');
	  return;
  },

  socketNotificationReceived: function (notification, payload) {
    var self = this;
	console.log('Socket notification received ' + notification);
	
	if (notification == 'SET_CONFIG') {
      this.config = Object.assign(this.defaults, payload);
      self.sendSocketNotification('MMM_TRONITY_READY');
	  return;
    }
	
	if (self.config.clientId.length < 2) {
		console.log('Config info missing!')
        self.sendSocketNotification('GET_CONFIG');
        return;
    }

    else if (notification == 'GET_CAR_DATA') {
	  if (authToken == null) {
		  console.log('No auth token!');
		  self.getAuth(payload);
	  } else {
		  self.getVehicleData(payload);
	  }
	  return;
    }
  },

  getVehicleDataUrl: function (config) {
	console.log('vehicle ID' + this.config.vehicleId);
    if (this.config && !this.config.vehicleId) return '';
    if (!config) return '';
    var url = vehicleDataUrl.replace('VEHICLE_ID', this.config.vehicleId);
    return url;
  },
  
  getVehicleData: function (vehicleId) {
	  var self = this;
	  var apiUrl = this.getVehicleDataUrl(vehicleId);
      console.log('Vehicle data url ' + apiUrl);
      if (apiUrl.length == 0) {
        self.sendSocketNotification('GET_CONFIG');
        return;
      }
      const options = {
        url: apiUrl,
        method: 'GET',
		json: true,
        headers: {
          'Authorization': 'Bearer ' + authToken
        }
      };
		console.log('Sending GET request with auth token: ' + authToken);
      request(options, function (error, response, body) {
        if (!error) {
			console.log('Response status code ' + response.statusCode);
          if (response.statusCode == 200) {
            self.sendSocketNotification('UPDATE_CAR_DATA', response);
			//self.debug('Received response: ' + JSON.stringify(response));
          }
		  else if (response.statusCode == 401) {
			  console.log('Unauthorised! Renewing auth token.');
			  self.getAuth();
			  return;
          } else {
            console.log(response.statusCode + ' - ' + response.statusMessage);
          }
        } else if (error) {
          console.log(error);
        }
      });
	  
  },

  debug: function (msg) {
    var shouldLog = true;
    if (this.config && typeof this.config.debug !== 'undefined') shouldLog = this.config.debug;
    if (shouldLog) console.log(msg);
  }
});
