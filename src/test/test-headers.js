var Properties = require("properties");
var chai = require("chai");
var assert = chai.assert;
var should = chai.should();
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

	describe("When a property is requested", function() {
		it("the property exists", function() {
			should.exist(commons.properties.get("maxage.default"),
					"max-age does not exist");
		});
	});

	describe("When commons methods are called", function() {
		it("the methods exist", function() {
			should.exist(commons.setObjectResponse,
					"setObjectResponse does not exist");
			should.exist(commons.setRecordsetResponse,
					"setRecordsetResponse does not exist");
		});
	});

});
