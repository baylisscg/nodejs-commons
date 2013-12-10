/**
 * commons.js
 * 
 * Library of common functions used by AURIN
 */
"use strict";
var commons = exports;

// Default values of properties (they are set in absence of
// values provided in the file)
var defaults = {};
defaults["nodejs.cluster.maxrssmemorymb"] = 1500;
defaults["nodejs.cluster.closewaitms"] = 20000;
defaults["nodejs.cluster.checkmemoryms"] = 1000;
defaults["log.level"]= "info";
defaults["maxage.default"]= 60;

/**
 * Setup of component
 * 
 * @param propertiesFile
 *          properties file
 * @param callback
 *          Function called back when the object is initialized, the object
 *          itself is passed as parameter
 */
commons.setup = function(propertiesFile, callback) {
	var that = this;
	
	// Load properties file
	require("properties").load(propertiesFile, function(err, properties) {
		if (err != null) {
			console.log(err);
			callback(null);
		}
		
		// Apply defaults
		that.properties = properties;
		Object.keys(defaults).forEach(function(prop) {
			if (!commons.getProperty(prop)) {
				commons.setProperty(prop, defaults[prop]);
			}
		});
		
		// Sets the logger
		that.logger = require("tracer").console({
			format : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})",
			dateformat : "HH:MM:ss.L",
			level : properties["log.level"]
		});
		callback(that);
	});
};

/**
 * Returns a property value given its name
 * 
 * @param propertyName
 */
commons.getProperty = function(propertyName) {
	return commons.properties[propertyName];
};

/**
 * Sets a property value given its name
 * 
 * @param propertyName
 * @param propertyValue
 */
commons.setProperty = function(propertyName, propertyValue) {
	commons.properties[propertyName] = propertyValue;
};

/**
 * Constructs a response for the return of a JSON object or, if the content-type
 * header is not application/json, of a string
 * 
 * @param obj
 *          Object to be returned
 * @param response
 *          Response
 * @param status
 *          Status of the response (200 if parameter is missing)
 * @param contentType
 *          Content type (application/json if parameter id missing)
 * @param maxAge
 *          Max age of cache (default value if parameter is missing)
 * @param noCache
 *          If true, does not add cache-control headers
 */
commons.setObjectResponse = function(args) {
	var status = (args.status !== undefined) ? args.status : 200;
	var maxAge = ((args.maxAge !== undefined) ? args.maxAge : commons
			.getProperty("maxage.default"));

	args.response.header("Connection", "keep-alive");
	args.response.header("Content-Length", args.obj.length);
	args.response.header("Transfer-Encoding", "chunked");
	args.response.header("Last-Modified", new Date());
	if (!args.noCache) {
		args.response.header("Cache-Control", "max-age=" + maxAge);
	}
	args.response.status(status);
	if (commons.isJSON(args.contentType)) {
		args.response.json(args.obj);
	} else {
		args.response.header("Content-Type", args.contentType);
		args.response.send(args.obj);
	}
	args.response.end();
};

/**
 * Returns true if mimetype is JSON
 * 
 * @param mime-type
 *          to test
 */
commons.isJSON = function(mimetype) {
	if (!mimetype) {
		return false;
	}
	return (mimetype.match(/.*application\/.*json.*/) !== null) ? true : false;
};

/**
 * Returns true if mimetype is GeoJSON
 * 
 * @param mime-type
 *          to test
 */
commons.isGeoJSON = function(mimetype) {
	if (!mimetype) {
		return false;
	}
	return (mimetype.match(/.*application\/geo\+json.*/) !== null) ? true : false;
};

/**
 * Returns true if mimetype is JSONGraph
 * 
 * @param mime-type
 *          to test
 */
commons.isJSONGraph = function(mimetype) {
	if (!mimetype) {
		return false;
	}
	return (mimetype.match(/.*application\/graph\+json.*/) !== null) ? true
			: false;
};

/**
 * Writes logs about req request
 */
commons.logRequest = function(req) {
	var util = require('util');
	var mem = util.inspect(process.memoryUsage());

	commons.logger.debug("Process %s started request method: %s url: %s",
			process.pid, req.method, req.url);
	req.on("end", function() {
		commons.logger.debug("Heap: %s (MB), RSS (MB): %s", commons
				.getUsedMemoryMB(), commons.getRSSMemoryMB());
		commons.logger.debug("Process %s completed request url: %s", process.pid,
				req.method, req.url);
	});
};

/*
 * Returns current usage of memory in MB
 */
commons.getUsedMemoryMB = function() {
	return Math.round(process.memoryUsage().heapUsed / (1024 * 1024));
};

/*
 * Returns total usage of memory in MB
 */
commons.getTotalMemoryMB = function() {
	return Math.round(process.memoryUsage().heapTotal / (1024 * 1024));
};

/*
 * Returns Resident-Set-Size in MB
 */
commons.getRSSMemoryMB = function() {
	return Math.round(process.memoryUsage().rss / (1024 * 1024));
};
