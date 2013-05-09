/**
 * commons.js
 * 
 * Library of common functions used by AURIN
 */
"use strict";
var commons = exports;

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
	require("properties").load(propertiesFile, function(err, properties) {
		if (err != null) {
			console.log(err);
			callback(null);
		}
		that.logger = require("tracer").console({
			format : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})",
			dateformat : "HH:MM:ss.L",
			level : properties["log.level"]
		});
		that.properties = properties;
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
 * Constructs a response for the reutrn of a JSON object
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
 */
commons.setObjectResponse = function(args) {
	var status = (args.status !== undefined) ? args.status : 200;
	var maxAge = ((args.maxAge !== undefined) ? args.maxAge : commons
			.getProperty("maxage.default"));

	args.response.header("Connection", "keep-alive");
	args.response.header("Content-Length", args.obj.length);
	args.response.header("Transfer-Encoding", "chunked");
	args.response.header("Last-Modified", new Date());
	args.response.header("Cache-Control", "max-age=" + maxAge);
	args.response.status(status);
	args.response.json(args.obj);
	args.response.end();
};

/**
 * Returns true if mimetype is JSON
 * @param mime-type to test
 */
commons.isJSON = function(mimetype) {
	return (mimetype.match(/.*application\/.*json.*/) !== null) ? true : false; 	
};

/**
 * Returns true if mimetype is GeoJSON
 * @param mime-type to test
 */
commons.isGeoJSON = function(mimetype) {
	return (mimetype.match(/.*application\/geo\+json.*/) !== null) ? true : false; 	
};

/**
 * Returns true if mimetype is JSONGraph
 * @param mime-type to test
 */
commons.isJSONGraph = function(mimetype) {
	return (mimetype.match(/.*application\/graph\+json.*/) !== null) ? true : false; 	
};


