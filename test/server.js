"use strict"

exports.startServer = function(commons, callback) {
	var app = {
		id : 1
	};
	commons.logger.info("Service listening on http://localhost:"
			+ commons.getProperty("aurin.test.port") + " started as process "
			+ process.pid);
	callback(commons, app);
};