var Properties = require("properties");
var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var commons = require("../commons");

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
			expect(commons.getProperty("maxage.default")).to.equal(1234);
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

	describe("When a MIME type is GeoJSON", function() {
		it("GeoJSON is recognised", function() {
			expect(commons.isGeoJSON("application/json")).to.be.false;
			expect(commons.isGeoJSON("application/graph+json")).to.be.false;
			expect(commons.isGeoJSON("application/geo+json")).to.be.true;
			expect(commons.isGeoJSON("application/text; application/geo+json; text/html")).to.be.true;
		});
	});

	describe("When a MIME type is JSONGraph", function() {
		it("GeoJSON is recognised", function() {
			expect(commons.isJSONGraph("application/json")).to.be.false;
			expect(commons.isJSONGraph("application/graph+json")).to.be.true;
			expect(commons.isJSONGraph("application/geo+json")).to.be.false;
			expect(commons.isJSONGraph("application/text; application/graph+json; text/html")).to.be.true;
		});
	});

	describe("When a MIME type is JSON", function() {
		it("JSON is recognised", function() {
			expect(commons.isJSON("application/json")).to.be.true;
			expect(commons.isJSON("application/geo+json")).to.be.true;
			expect(commons.isJSON("application/text; application/graph+json; text/html")).to.be.true;
		});
	});

});
