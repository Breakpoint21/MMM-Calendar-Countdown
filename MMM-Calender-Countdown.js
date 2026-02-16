/* global Module */

/* MMM-Calender-Countdown.js
 *
 * Magic Mirror
 * Module: MMM-Calender-Countdown
 *
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 *
 * Module MMM-Slideshow By Pascal Schumann
 * MIT Licensed.
 */
// const Log = console;
const LOG_PREFIX = 'MMM-Calender-Countdown ';

Module.register('MMM-Calender-Countdown', {
  // Min version of MM2 required
  requiresVersion: "2.1.0",

  defaultConfig: {
    calendarSet: []
  },

  // Default module config.
  defaults: {
    calendarSet: []
  },

  // load function
  start: function () {
    Log.debug(
      LOG_PREFIX + 'starting...'
    );
    
    this.eventPool = new Map();    
  },

  getScripts: function () {
    return [
      'moment.js'
    ];
  },

  getStyles: function () {
    // the css contains the make grayscale code
    return ['MMM-Calendar-Countdown.css'];
  },

  // generic notification handler
  notificationReceived: function (notification, payload, sender) {
    if (notification === 'CALENDAR_EVENTS') {
      this.eventPool.set(sender.identifier, JSON.parse(JSON.stringify(payload)));
      this.updateDom();
    } 
  },
  
  /**
   * Filter events by calendarSet
   * @param {array} events
   * @param {array} calendarSet
   * @returns array filtered events
   */
  calendarFilter: function(events, calendarSet) {
    const result = []
    for (const ev of events) {
      if (calendarSet.length === 0 || calendarSet.includes(ev.calendarName)) {
        ev.calendarSeq = calendarSet.findIndex((name) => name === ev.calendarName) + 1
        ev.duration = +ev.endDate - +ev.startDate
        result.push(ev)
      }
    }
    return result
  },

  /**
	 * converts the given timestamp to a moment with a timezone
	 * @param {number} timestamp timestamp from an event
	 * @returns {moment.Moment} moment with a timezone
	 */
	timestampToMoment (timestamp) {
		return moment(timestamp, "x").tz(moment.tz.guess());
	},

  createEventList: function (sortByDate = false) {
    let events = []
    for (const eventSet of this.eventPool.values()) {
      events = events.concat(this.calendarFilter(eventSet, this.config.calendarSet))
    }
    if (sortByDate) {
      events.sort((a, b) => {
        const aStartDateMoment = this.timestampToMoment(a.startDate);
        const bStartDateMoment = this.timestampToMoment(b.startDate);
        return aStartDateMoment - bStartDateMoment
      })
    }
    return events
  },

  // Override dom generator.
  getDom: function () {
    const events = this.createEventList(true);
		const wrapper = document.createElement("table");
		wrapper.className = this.config.tableClass;

		if (this.error) {
			wrapper.innerHTML = this.error;
			wrapper.className = `${this.config.tableClass} dimmed`;
			return wrapper;
		}

		if (events.length === 0) {
			wrapper.innerHTML = this.loaded ? this.translate("EMPTY") : this.translate("LOADING");
			wrapper.className = `${this.config.tableClass} dimmed`;
			return wrapper;
		}

		events.forEach((event, index) => {
			const eventStartDateMoment = this.timestampToMoment(event.startDate);
			const eventEndDateMoment = this.timestampToMoment(event.endDate);
			
			const eventWrapper = document.createElement("tr");

			eventWrapper.className = "event-wrapper normal event";

			const titleWrapper = document.createElement("td");

			titleWrapper.innerHTML = event.title;
			eventWrapper.appendChild(titleWrapper);
      const timeWrapper = document.createElement("td");

				
      const now = moment();
      const nowDayOfYear = now.dayOfYear();
      const eventDayOfYear = eventEndDateMoment.dayOfYear();

      if (nowDayOfYear > eventDayOfYear) {
        timeWrapper.innerHTML += eventDayOfYear - nowDayOfYear + 365 + "days ";
      } else {
        timeWrapper.innerHTML += eventDayOfYear - nowDayOfYear + "days ";
      }
				
      timeWrapper.className = `time light`;
      eventWrapper.appendChild(timeWrapper);
			
			wrapper.appendChild(eventWrapper);

		});

		return wrapper;
  },
});
