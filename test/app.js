var commons = require("../commons");

var server = commons.startCluster("./test/test.properties", "test", function(
		commons, callback) {
	require("./server.js").startServer(commons, function(commons, app) {
		callback(commons, app);
		console.log(app); // XXX
	});
});
