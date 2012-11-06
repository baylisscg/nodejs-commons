var Properties = require("properties");
var chai = require("chai");
var assert = chai.assert;
var should = chai.should();
var commons = require("../lib/commons");

describe("Logging", function() {

	before(function(done) {
		commons.setup(
				process.env.AURIN_DIR + "/nodejs-commons-combined.properties",
				function(obj) {
					commons = obj;
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
