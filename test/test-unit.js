/**
 * test-unit.js
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

var Properties = require("properties");
var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var commons = require("../commons");

describe("test-unit.js", function() {

  before(function(done) {
    console.log("Start of testing...");
    // XXX This is a temporary hack to overcome a race
    // condition due to the tests below sometimes trying
    // to access commons before it has initialised.
    // We need a better solution than this.
    setTimeout(done, 1000);
    // done(); // This is what we should do.
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
      expect(3000).equal(Number(commons.getProperty("nodejs.cluster.closewaitms")));
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

    it("Test safeness of a JavaScript expression", function(done) {
      expect(commons.isEvalSafe(null)).to.be.true;
      expect(commons.isEvalSafe("{")).to.be.false;
      expect(commons.isEvalSafe("}")).to.be.false;
      expect(commons.isEvalSafe("(")).to.be.false;
      expect(commons.isEvalSafe(")")).to.be.false;
      expect(commons.isEvalSafe("a=='Hospital (emergency)'")).to.be.true;
      expect(commons.isEvalSafe("a=='Hospital {emergency}'")).to.be.true;
      expect(commons.isEvalSafe("a=='Hospital [emergency]'")).to.be.true;
      expect(commons.isEvalSafe('a=="Hospital (emergency)"')).to.be.true;
      expect(commons.isEvalSafe('a=="Hospital {emergency}"')).to.be.true;
      expect(commons.isEvalSafe('a=="Hospital [emergency]"')).to.be.true;
      expect(commons.isEvalSafe('a==eval("Hospital [emergency]")')).to.be.false;
      expect(commons.isEvalSafe('a==new Object("Hospital")')).to.be.false;
      expect(commons.isEvalSafe('eval("shell(\'rm *\')")')).to.be.false;
      expect(commons.isEvalSafe("eval('shell(\"rm *\")')")).to.be.false;
      expect(commons.isEvalSafe("'\"'+eval('shell(\"rm *\")')")).to.be.false;
      done();
    });

    it("Test geneation of UUID", function(done) {
      expect(commons.generateCouchDBUUID().length).equal(32);
      expect(commons.generateCouchDBUUID().match("-")).equal(null);
      done();
    });

    after(function(done) {
      console.log("...end of testing");
      done();
    });
  });
