/*
 * commons.js
 * 
 * Library of common functions used by AURIN
 */

var Properties = require("properties");
var commons= exports;

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
	(new Properties()).load(propertiesFile, function(err) {
		if (err != null) {
			console.log(err);
			callback(null);
		}
		that.logger = require("tracer").console({
			format : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})",
			dateformat : "HH:MM:ss.L",
			level : this.get("log.level")
		});
		that.properties = this;
		callback(that);
	});
};

/**
 * Returns a property value given its name
 * 
 * @param propertyName
 */
commons.getProperty = function(propertyName) {
	return commons.properties.get(propertyName);
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
 * @param headers
 *          Headers to be used (response's headers will be used if parameter is
 *          missing)
 * @param contentType
 *          Content type (application/json if parameter id missing)
 * @param maxAge
 *          Max age of cache (default value if parameter is missing)
 */
commons.setObjectResponse = function(args) {
	var json = JSON.stringify(args.obj);
	var headers = (args.headers !== undefined) ? args.headers : response.headers;
	var status = (args.status !== undefined) ? args.status : 200;
	var maxAge = ((args.maxAge !== undefined) ? args.maxAge : commons.getProperty("maxage.default"));
	var contentType = (args.contentType !== undefined) ? args.contentType
			: "application/json";

	headers["status"] = args.status;
	headers["content-length"] = json.length;
	headers["content-type"] = contentType;
	headers["last-modified"] = new Date();
	headers["cache-control"] = "max-age=" + maxAge;
	args.response.writeHead(status, headers);
	args.response.end(json);
};

/**
 * Constructs a response from a set of documents returned by CouchDB
 * 
 * @param response
 * @param docs
 *          Docs to be returned (this object is expected to have headers)
 * @param response
 *          Response
 * @param contentType
 *          Content type (application/json if parameter id missing)
 * @param maxAge
 *          Max age of cache (default value if parameter is missing)
 */
commons.setRecordsetResponse = function(args) {
	var maxAge = ((args.maxAge !== undefined) ? args.maxAge : commons.getProperty("maxage.default"));
	var contentType = (args.contentType !== undefined) ? args.contentType
			: "application/json";

	args.response.writeHead(args.docs.headers.status, {
		"Connection" : "keep-alive",
		"Transfer-Encoding" : "chunked",
		"Content-Type" : contentType,
		"Last-Modified" : new Date(),
		"Cache-Control" : "max-age=" + maxAge
	});
	args.response.end(JSON.stringify(args.docs));
};

