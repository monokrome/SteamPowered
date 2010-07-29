(function(){
	/***
	 * DISCLAIMER:
	 *     This software is distributed under the MIT license. If you
	 *     have not read it, you can read it in the main project's
	 *     LICENSE.txt file - or you can also view the license that our
	 *     license is based on here:
	 *         http://www.opensource.org/licenses/mit-license.php
	 *
	 *     By using this software, you have agreed to following the license
	 *     as contained in LICENSE.txt.
	 *
	 *     If you accept, read on.
	 *
	 *********************
	 *
	 *     You are using an library that accesses a free API containg
	 *     data that is rightfully owned by Valve Software. With that
	 *     said, you MUST RESPECT THEM AND FOLLOW THEIR POLICY. This
	 *     document explains a few privacy and security concerns in
	 *     relation to this fact - as well as other information.
	 *
	 *     By using this library, you have agreed that you are liable
	 *     for any action that it performs due to your use of it. I
	 *     am providing it in a method that is respectful to Valve,
	 *     just as I am expecting developers to respect them with it.
	 *     You have been warned, and you will be warned plenty in this
	 *     document. So be prepared, and respect the work of others. I
	 *     can not reiterate enough how important this is.
	 *
	 *********************
	 *
	 *     You are attempting to modify this script. That is great, but
	 *     NEVER use the api key functions unless Valve lifts their
	 *     policy on sharing API keys. You must use a proxy until this
	 *     happens. Valve could potentially ban your API key or domain
	 *     or anything else they decide in the event that you don't
	 *     listen to this disclaimer. You can't use the API key directly
	 *     without a proxy anyway, because Valve doesn't support jsonp.
	 *
	 *     Hopefully this changes soon, but for now we're going to have
	 *     to use a proxy. With that said, I have set up a proxy on my
	 *     own that will hopefully do everything that this API will need.
	 *     You will need to do some setup to make it work properly.
	 *
	 *     Also, if my proxy ever becomes an issue with Valve, ends up
	 *     being against the rules of the privacy policy, or anything else
	 *     that happens which makes me decide to do so, I reserve the right
	 *     to close down my proxy server. If this occurs, there is more than
	 *     enough documentation here to help you get started with setting up
	 *     your own. If you want to set up your own proxy, you need to follow
	 *     these steps as a minimum requirement:
	 *
	 *     a) Install a proxy of some sort that will usually take a GET
	 *        parameter as the URL to proxy.
	 *
	 *     b) It is essential that your proxy makes sure that only specific
	 *        domains are allowed. For this script, you need to make sure
	 *        that the destination value is a URL to the following domain:
	 *            api.steampowered.com
	 *
	 *        IGNORING THIS PROVIDES HUGE SECURITY RISKS TO YOUR USERS. YOU
	 *        MUST PREVENT XSS ATTACKS VIA THIS MEASURE ALONE.
	 *
	 *     c) Your proxy does not receive the API key from the Javascript,
	 *        as this would be against Valve's policies. You must modify
	 *        your destination value to contain your API key after receiving
	 *        the original destination. This keeps your API key completely
	 *        hidden and allows you to use the API from Javascript without
	 *        ignoring Valve's policy.
	 *
	 *     d) Modify the proxy_url variable in this script, so that your
	 *        application is able to make use of your newly set up proxy.
	 ***/

	// http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0001/?gameid=550&format=xml
	// http://api.steampowered.com/ISteamUserAuth/AuthenticateUser/v0001/

	// Private members
	var use_https = false;
	var default_version = '0001';
	var current_version = default_version;
	var verbose_callbacks = false;

	// Since Valve doesn't support JavaScript, this is completely useless
	// to set false unless their privacy statement changes.
	var useProxy = true;

	/***
	 * This a URL to a proxy application that will be sent a URL to
	 * request data from Steam. This is required, because Valve have
	 * opted to use a privacy policy that disallows sharing of your
	 * key. Since Javascript isn't compiled, we are unabled to put
	 * the key into our script.
	 *
	 * This API currently only supports the SetKey variable in hopes
	 * that Valve remove the privacy restriction required by their
	 * privacy policy. Until that happens, you will have to use a
	 * server-side proxy (which uses unneeded bandwidth) in order
	 * to retreive the JSON data and send it back to here.
	 ***/
	var proxyUrl = 'http://steampowered.monokro.me/p/?destination=';

	// This is useless since Valve privacy statement disallows Javascript
	// AJAX directly requesting data from their API due to private API keys.
	var api_key = null;

	function APIURL(iface, method)
	{
		var protocol = 'http';
		if (use_https) protocol = protocol + 's';

		var api_url = protocol + '://api.steampowered.com/' + iface +
		              '/' + method + '/v' + current_version + '/?format=json';

	/**
	 * Do not uncomment this line unless Valve's privacy policy allows you to
	 * share the API key. Period.
	 **/
	//	if (!useProxy) return api_url + '&key=' + api_key; else
		return proxyUrl + api_url 
	}

	function RequiredOptions(opts, reqs)
	{
		reqs = reqs || {};

		for (var i = 0; i < reqs.length; ++i)
			if (!jQuery(opts).attr(reqs[i])) return false;

		return opts;
	}

	// Centralize our AJAX requests so that they all work alike
	function MakeRequest(request_url, opts, callback, errorCallback)
	{
		requestInfo = {
			url: request_url,
			dataType: 'json',
			success: callback,
			error: errorCallback
		}

		if (useProxy)
		{
           	requestInfo['url'] = request_url + escape('&' + jQuery.param(opts));
		}
		else
		{
			requestInfo['dataType'] = 'jsonp';
			requestInfo['data'] = opts;
		}

		jQuery.ajax(requestInfo);
	}

	var steam = {
		// Initializes the library
		Init: function(e) {},

		// Get news about a specific app
		News: function(opts, callback, errorCallback)
		{
			errorCallback = errorCallback || function(){};
			default_opts = {'count': 3, 'maxlength': 300};

			opts = RequiredOptions(opts, ['appid']) || MakeException("invalid_object");
			opts = jQuery.extend({}, default_opts, opts);

			MakeRequest(APIURL('ISteamNews', 'GetNewsForApp'), opts, callback, errorCallback);
		},

		AchievementPercentages: function(opts, callback, errorCallback)
		{
			errorCallback = errorCallback || function(){};

				// Why does Steam use appid in some places, and gameid in others?
			opts = RequiredOptions(opts, ['gameid']) || MakeException("invalid_object");

			MakeRequest(APIURL('ISteamUserStats', 'GetGlobalAchievementPercentagesForApp'),
			            opts, callback, errorCallback);
		},

		// Send a raw request (mainly for supporting unsupported requests)
		Raw: function(iface, method, opts, callback, errorCallback)
		{
			iface = iface || MakeException('argument_required');
			method = method || MakeException('argument_required');

			errorCallback = errorCallback || function(){};
			opts = jQuery.extend({}, default_opts, opts);

			jQuery.ajax({
				url: APIURL(iface, method, opts),
				type: 'jsonp',
				callback_type: callback,
				error: errorCallback
			});
		},

		// Setter and getter for the API key
		SetKey: function(key) { api_key = key; },
		GetKey: function(key) { return api_key; },

		// Setter and getter for the API version
		SetVersion: function(version)
		{
			if (!version) version = default_version;
			else current_version = version;
		},
		GetVersion: function()
		{
			return current_version;
		},

		// Setter and getter for verbose callbacks
		SetVerboseCallbacks: function(enabled)
		{
			if (typeof enabled == 'undefined')
				enabled = true;

			if (enabled)
				callback_type = 'complete';
			else
				callback_type = 'success';
		},
		GetVerboseCallbacks: function()
		{
			if (callback_type == 'success')
				return false;

			return true;
		}
	};

	jQuery.steam = steam;

	/***
	 * Exception stuff
	 ***/
	function MakeException(exception_id)
	{
		if (!exception_id in exceptions)
			exception_id = 'unknown_error';

		exception = jQuery.extend({}, exceptions[exception_id]);
		exception['method'] = this.caller;

		throw exception;
		return exception;
	}

	exceptions = {
		'invalid_object': {
			name: 'Invalid Object',
			message: 'An invalid object was provided.'
		},
		'unknown_error': {
			name: 'Unknown Error',
			message: 'An unknown error has occured.'
		},
		'argument_required': {
			name: 'Argument Required',
			message: 'A required argument was missing from a function call.'
		}
	};

	jQuery(function(){steam.Init});

})();
