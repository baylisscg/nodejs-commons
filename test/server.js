/**
 * server.js
 * 
 * Library of common Node.js functions
 * 
 * Copyright 2011-2014 The AURIN Project
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * [apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

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
