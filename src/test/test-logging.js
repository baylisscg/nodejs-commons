var Properties = require("properties");
var assert = require("chai").assert;
var commons = require("../lib/commons");

describe("Logging", function() {

	before(function(done) {
		(new Properties()).load(process.env.AURIN_DIR
				+ "/nodejs-commons-combined.properties", function(err) {
			if (err != null) {
				console.log(err);
				done(err);
				return;
			}
			commons.setup(this);
			done();
		});
	});

	describe("When logging", function() {
		it("should not raise an exception", function() {
			try {
				commons.logger.info("Test %d", 1);
				assert.equal(true, true, "no exception is raised");
			} catch (e) {
				assert.equal(true, false, "an exception is raised");
			}
		});
	});
});


