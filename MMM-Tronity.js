/* Magic Mirror
 * Module: MMM-Tronity
 * 
 * by robotfishe https://github.com/robotfishe
 * 
 * MIT license
 */
 
 var range = 0;
 var plugged = false;
 var level = 0;
 var kW = 0;
 
Module.register("MMM-Tronity", {
  
  requiresVersion: '2.14.0',
  defaults: {
    text: 'Tronity',
    updateInterval: 5 * 60 * 1000,
    metricRange: true,
	map: true,
	mapboxStyle: "satellite-streets-v11"
  },

  carData: {},


  init: function () {
    Log.log("MMM-Tronity is initialising");
  },

  /**
   * Starts the module
   */
  start: function () {
    Log.info(this.name + ' is starting');
    this.sendSocketNotification('SET_CONFIG', this.config);
    this.idSuffix = 'fuelLevel' + this.identifier;
  },

  /**
   * Module loaded event
   */
  loaded: function (callback) {
    this.finishLoading();
    Log.info(this.name + ' is loaded!');
    callback();
  },

  /**
   * Returns css style, below css classes can be overridden in custom.css
   */
  getStyles: function () {
    return [
      'MMM-Tronity.css',
    ]
  },

  /**
   * Returns header to be shown on module
   */
  getHeader: function () {
    return this.data.header || "Vehicle Status";
  },

  getDom: function () {
	  var self = this;
	  if (this.config.metricRange == true) {
		  range = this.carData.body.range;
	  } else {
		  range = Math.round(this.carData.body.range * 0.62);
	  };
	  level = this.carData.body.level;
	  plugged = this.carData.body.plugged;
	  kW = this.carData.body.charging;
	  
	  var blue = '#009BF3';
	  var green = '#07D800';
	  var yellow = '#F1E300';
	  var red = '#E00000';
	  
	console.log("Creating Tronity div");
	const wrapper = document.createElement("div");
	const can = document.createElement("canvas");
	can.id = "can";
	const dialText = document.createElement("div");
	const leftText = document.createElement("div");
	const rightText = document.createElement("div");
	var c = can.getContext('2d');
	
	  var posX = can.width / 2,
      posY = can.height / 2,
      percent = level,
      onePercent = 360 / 100,
      degrees = onePercent * level;
  
  c.lineCap = 'round';
      c.clearRect( 0, 0, can.width, can.height );
      percent = degrees / onePercent;

      dialText.innerHTML = `<span class="centred">` + level + `%</span>`;

      c.beginPath();
      c.arc( posX, posY, 70, (Math.PI/180) * 270, (Math.PI/180) * (270 + 360) );
      c.strokeStyle = '#444444';
      c.lineWidth = '10';
      c.stroke();

      c.beginPath();
	  if (plugged == true) {
		c.strokeStyle = blue;
	  } else if (level >= 80) {
		  c.strokeStyle = green;
	  } else if (level >= 30) {
		  c.strokeStyle = yellow;
	  } else {
		  c.strokeStyle = red;
	  };
      c.lineWidth = '10';
      c.arc( posX, posY, 70, (Math.PI/180) * 270, (Math.PI/180) * (270 + degrees) );
      c.stroke();
	
	if (this.config.metricRange == true) {
		leftText.innerHTML = `<span class="centred"><span class = "fa fa-fw fa-arrow-right" style="font-size:70%;margin-bottom:9px"></span><span class = "fa fa-fw fa-charging-station" style="font-size:70%;margin-bottom:9px"></span><br>` + range + `<br><span style="font-size:70%">km</span></span>`;
	} else {
		leftText.innerHTML = `<span class="centred"><span class = "fa fa-fw fa-arrow-right" style="font-size:70%;margin-bottom:9px"></span><span class = "fa fa-fw fa-charging-station" style="font-size:70%;margin-bottom:9px"></span><br>` + range + `<br><span style="font-size:70%">miles</span></span>`;
	};
	
	if (plugged == true) {
		rightText.innerHTML = `<span class="centred"><span class="fa fa-fw fa-bolt"></span><br><span style="font-size:70%">` + kW + ` kW</span></span>`;
		
	} else {
		rightText.innerHTML = `<span class="centred"><span class="fa fa-fw fa-bolt" style="color:#333333"></span></span>`;
	}
	
	wrapper.appendChild(can);
	wrapper.appendChild(leftText);
	wrapper.appendChild(dialText);
	wrapper.appendChild(rightText);
	wrapper.id = "wrapper";
	dialText.setAttribute("class","dialText");
	leftText.setAttribute("class","leftText");
	rightText.setAttribute("class","rightText");
	
	if (this.config.map == true) {
		
		var latitude = self.carData.body.latitude;
		var longitude = self.carData.body.longitude;
	
		const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/` + self.config.mapboxStyle + `/static/geojson(%7B%22type%22:%22Feature%22,%22properties%22:%7B%22marker-color%22:%222e7ebb%22,%22marker-size%22:%22medium%22,%22marker-symbol%22:%22car%22%7D,%22geometry%22:%7B%22type%22:%22Point%22,%22coordinates%22:[` + longitude + `,` + latitude + `]%7D%7D)/` + longitude + `,` + latitude + `,17/400x200?access_token=` + self.config.mapboxApiKey;

		const mapDiv = document.createElement("div");
		
		mapDiv.innerHTML = `<img src = "` + mapUrl + `" style="border-radius:16px;margin-top:10px;"/>`
		
		wrapper.appendChild(mapDiv);
		
	}

	return wrapper;
  },


  /**
   * Notification received event
   * @param {string} notification Notification name
   * @param {Object} payload Payload object
   * @param {Module} sender MM Module which sent notification
   */
  notificationReceived: function (notification, payload, sender) {
    if (notification === 'UPDATE_CAR_DATA') {
      this.sendSocketNotification('GET_CAR_DATA');
    }
    else if (notification === 'MODULE_DOM_CREATED') {
      this.initTicks();
    }
  },

  /**
   * Socket notification received event
   * @param {string} notification Notification name
   * @param {Object} payload Payload object
   */
  socketNotificationReceived: function (notification, payload) {
    let self = this;
	console.log('Notification from helper: ' + notification);
	console.log('Payload received from helper: ' + JSON.stringify(payload));
	//console.log('Payload identifier: ' + payload.identifier);
	//console.log('Payload identifier  match: ' + this.identifier);
	
    //if (payload && payload.identifier !== this.identifier) return;

    if (notification === 'GET_CONFIG') {
      Log.debug('Get config received');
      this.sendSocketNotification('SET_CONFIG', this.config);
    }
    else if (notification === 'MMM_TRONITY_READY') {
      Log.debug('MMM-Tronity is Ready');
      document.querySelectorAll('.two-dial-wrapper').forEach(function (e) {
        e.style.display = 'block';
      });
      self.updateData();
      self.startLoop();
    }
    else if (notification === 'UPDATE_CAR_DATA') {
      Log.debug('Update car data');
      self.carData = payload;
      //if (self.config.displayStyle.toLowerCase() === 'singledial') {
      //  if (!self.ticksInitilized) {
      //    self.initTicks();
      //  }
      //  else
      self.updateDom();
      //}
      //else {
      //  document.getElementById('fuelpath' + self.idSuffix).setAttribute("stroke-dasharray", payload.level.value + ", 100");
      //  document.getElementById('percent' + self.idSuffix).innerHTML = '&nbsp;' + payload.level.value + '%';
      //  document.getElementById('range' + self.idSuffix).innerHTML = payload.range.value;
      //  var rangePercent = (payload.range.value * 100 / self.config.maxRange);
      //  document.getElementById('rangepath' + self.idSuffix).setAttribute("stroke-dasharray", rangePercent + ", 100");
      //}
    }
  },

  /**
   * Starts the update loop
   */
  startLoop: function () {
    let self = this;
    if (self.intervalId != 0) return;
    self.intervalId = window.setInterval(() => {
      self.updateData();
    }, this.config.updateInterval);
  },

  /**
   * Updates vehicle data
   */
  updateData() {
    Log.debug('Update data');
    this.sendSocketNotification('GET_CAR_DATA', { vehicleId: this.config.vehicleId });
  },

  /**
   * Shows startup sequence in singleDial display style
   */
  initTicks() {
    var time = 0;
    for (var i = 0; i <= document.getElementsByClassName('tick').length; i++) {
      window.setTimeout(function displayTicks(tick, i, ctx) {
        if (tick) tick.style.display = 'block';
        if (i === 50) {
          ctx.ticksInitilized = true;
          ctx.updateData();
        }
      }, time, document.getElementsByClassName('tick')[50 - i], i, this);
      time += 50;
    }
  }

});
