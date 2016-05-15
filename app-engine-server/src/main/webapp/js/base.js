/**
 * @fileoverview
 * Web client for Guard Dog server-side code
 *
 * @author Dave Snowdon
 */

/** namespace for Dave Snowdon */
var davesnowdon = davesnowdon || {};

/** namespace for this application */
davesnowdon.guard = davesnowdon.guard || {};


/**
 * Scopes used by the application.
 * @type {string}
 */
davesnowdon.guard.SCOPES =
    'https://www.googleapis.com/auth/userinfo.email';


davesnowdon.guard.getAlarmState = function(id) {
  gapi.client.guarddog.greetings.getAlarmState().execute(
      function(resp) {
        if (!resp.code) {
        	davesnowdon.guard.showAlarmState(resp);
        }
      });
};

davesnowdon.guard.showAlarmState = function(state) {
	if (state.armed) {
		alert("Alarm ON");
	} else {
		alert("Alarm OFF");
	}
}


davesnowdon.guard.setAlarmState = function(
    greeting, times) {
  gapi.client.guarddog.greetings.setAlarmState({
      'armed': true,
    }).execute(function(resp) {
      if (!resp.code) {
    	  davesnowdon.guard.showAlarmState(resp);
      }
    });
};


/**
 * Enables the button callbacks in the UI.
 */
davesnowdon.guard.enableButtons = function() {
  document.getElementById('getAlarmState').onclick = function() {
	  davesnowdon.guard.getAlarmState();
  }

  document.getElementById('setAlarmState').onclick = function() {
	  davesnowdon.guard.setAlarmState();
  }
};

/**
 * Initializes the application.
 * @param {string} apiRoot Root of the API's path.
 */
davesnowdon.guard.init = function(apiRoot) {
  // Loads the OAuth and guarddog APIs asynchronously, and triggers login
  // when they have completed.
  var apisToLoad;
  var callback = function() {
    if (--apisToLoad == 0) {
      davesnowdon.guard.enableButtons();
    }
  }

  apisToLoad = 1; // must match number of calls to gapi.client.load()
  gapi.client.load('guarddog', 'v1', callback, apiRoot);
};
