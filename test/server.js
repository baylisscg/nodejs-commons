/**
 * Service
 */
"use strict"

var buf = new Buffer(30000000);

exports.startServer = function(commons, callback) {
	var app=require("express")();
	app.id = 1;

	app.get("/hogmemory", function(req, res) {
		res.send("about to hog too mucn memory...\n");
		buf.fill("x");
	});

	app.get("/throwuncaught", function(req, res) {
		throw (new Error("this is uncaught"));
	});

	require("http").request(
			"http://www.google.com",
			function(res) {
				app.listen(commons.getProperty("aurin.test.port"));
				commons.logger.info("Service test listening on http://localhost:"
						+ commons.getProperty("aurin.test.port") + " started as process "
						+ process.pid);
				callback(commons, app);
			}).end();

};
