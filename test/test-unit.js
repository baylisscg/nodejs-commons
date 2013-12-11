var Properties = require("properties");
var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var commons = require("../commons");

describe("test-unit.js", function() {

	before(function(done) {
		console.log("Start of testing...");
			commons.setup("./test/test.properties", 
					function (obj) {
						commons= obj;
						done();
					}
			);
	});

		it("the property exists", function(done) {
			should.exist(commons.getProperty("maxage.default"),
					"max-age does not exist");
			done();
		});

		it("the property is undefine", function(done) {
			expect("undefined").equal(typeof commons.getProperty("xxx"));
			done();
		});

		it("the property is really changed", function(done) {
			commons.setProperty("maxage.default", 1234);
			expect(commons.getProperty("maxage.default")).to.equal(1234);
			done();
		});

		it("the property has the value defined in the file", function(done) {
			expect(10000).equal(Number(commons.getProperty("nodejs.cluster.closewaitms")));
			done();
		});

		it("the property has the default value", function(done) {
		  expect(1000).equal(Number(commons.getProperty("nodejs.cluster.checkmemoryms")));
			done();
		});
		
		it("the methods exist", function(done) {
			should.exist(commons.setObjectResponse,
					"setObjectResponse does not exist");
			done();
		});

		it("test getNumberOfProcesses function", function(done) {
      // NOTE: Should be to defaults["aurin.processes"]
		  expect(2).equal(commons.getNumberOfProcesses("xxx"));
			expect(12).equal(commons.getNumberOfProcesses("proc1"));
		  expect(require("os").cpus().length).equal(commons.getNumberOfProcesses("proc2"));
		  expect(require("os").cpus().length).equal(commons.getNumberOfProcesses("proc3"));
			done();
		});

		it("When a mime-type is GeoJSON", function(done) {
			expect(commons.isGeoJSON(null)).to.be.false;
			expect(commons.isGeoJSON(undefined)).to.be.false;
			expect(commons.isGeoJSON("application/json")).to.be.false;
			expect(commons.isGeoJSON("application/graph+json")).to.be.false;
			expect(commons.isGeoJSON("application/geo+json")).to.be.true;
			expect(commons.isGeoJSON("application/text; application/geo+json; text/html")).to.be.true;
			done();
		});

		it("When a MIME type is JSONGraph", function(done) {
			expect(commons.isJSONGraph(null)).to.be.false;
			expect(commons.isJSONGraph(undefined)).to.be.false;
			expect(commons.isJSONGraph("application/json")).to.be.false;
			expect(commons.isJSONGraph("application/graph+json")).to.be.true;
			expect(commons.isJSONGraph("application/geo+json")).to.be.false;
			expect(commons.isJSONGraph("application/text; application/graph+json; text/html")).to.be.true;
			done();
		});

		it("When a MIME type is JSON", function(done) {
			expect(commons.isJSON(null)).to.be.false;
			expect(commons.isJSON(undefined)).to.be.false;
			expect(commons.isJSON("application/json")).to.be.true;
			expect(commons.isJSON("application/geo+json")).to.be.true;
			expect(commons.isJSON("application/text; application/graph+json; text/html")).to.be.true;
			done();
		});

		it("should not raise an exception", function(done) {
			try {
				commons.logger.info("Test %d", 1);
				assert.equal(true, true, "no exception is raised");
			} catch (e) {
				assert.equal(true, false, "an exception is raised");
			}
			done();
		});

		after(function(done) {
			console.log("...end of testing");
			done();
		});
});
