var Properties = require("properties");
var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var commons = require("../lib/commons");

describe("Headers", function() {

	before(function(done) {
			commons.setup(process.env.AURIN_DIR + "/nodejs-commons-combined.properties", 
					function (obj) {
						commons= obj;
						done();
					}
			);
	});

	describe("When a property is requested", function() {
		it("the property exists", function() {
			should.exist(commons.getProperty("maxage.default"),
					"max-age does not exist");
		});
	});

	describe("When a property is set", function() {
		it("the property is really changed", function() {
			commons.setProperty("maxage.default", 1234);
			expect(commons.getProperty("maxage.default")).to.equal("1234");
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
