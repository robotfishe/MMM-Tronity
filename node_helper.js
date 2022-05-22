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
	  clientId: 'clientId',
	  clientSecret: 'clientSecret',
	  vehicleId: 'vehicleId'
  },

  start: function () {
    console.log('Starting node_helper for MMM-Tronity');
  },


  getAuth: function () {
   var self = this;
	  
	  this.debug('Authenticating via url ' + authUrl);
	  this.debug('Using client ID ' + this.config.clientId);
	  this.debug('and client secret ' + this.config.clientSecret);
	  
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
			self.debug('Response status code ' + response.statusCode);
			//self.debug('Received response ' + JSON.stringify(response));
          if (response.statusCode == 201) {
			//const obj = JSON.parse(response);
            authToken = response.body.access_token;
            self.debug('Got auth token ' + authToken);
          }
          else {
            console.log(response.statusCode + ' - ' + response.statusMessage);
          }
        } else if (error) {
		  self.debug(error);
          console.log(error);
        }
      });

  },

  socketNotificationReceived: function (notification, payload) {
    var self = this;
	this.debug('Socket notification received ' + notification);
	
	if (self.config.clientId == "clientID") {
		self.debug('Config info missing!')
        self.sendSocketNotification('GET_CONFIG');
        return;
    }
	
    if (notification === 'SET_CONFIG') {
      this.config = Object.assign(this.defaults, payload);
      self.sendSocketNotification('MMM_TRONITY_READY');
    }
    else if (notification === 'GET_CAR_DATA') {
	  if (authToken == null) {
		  self.debug('No auth token!');
		  self.getAuth();
		  return;
	  }
      var apiUrl = this.getVehicleDataUrl(payload);
      self.debug('Vehicle data url ' + apiUrl);
      if (apiUrl.length === 0) {
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
		self.debug('Sending GET request with auth token: ' + authToken);
      request(options, function (error, response, body) {
        if (!error) {
			self.debug('Response status code ' + response.statusCode);
          if (response.statusCode == 200) {
            self.sendSocketNotification('UPDATE_CAR_DATA', response);
			//self.debug('Received response: ' + JSON.stringify(response));
          }
		  else if (response.statusCode == 401) {
			  self.debug('Unauthorised! Renewing auth token.');
			  self.getAuth();
			  return;
          } else {
            console.log(response.statusCode + ' - ' + response.statusMessage);
          }
        } else if (error) {
          console.log(error);
        }
      });
    }
  },


  getVehicleDataUrl: function (config) {
	this.debug('vehicle ID' + this.config.vehicleId);
    if (this.config && !this.config.vehicleId) return '';
    if (!config) return '';
    var url = vehicleDataUrl.replace('VEHICLE_ID', this.config.vehicleId);
    return url;
  },


  debug: function (msg) {
    var shouldLog = true;
    if (this.config && typeof this.config.debug !== 'undefined') shouldLog = this.config.debug;
    if (shouldLog) console.log(msg);
  }
});