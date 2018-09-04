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
var fs = require("fs");
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var commons = require("../commons");
var _ = require("underscore");

describe("test-unit.js", function () {

  before(function (done) {
    console.log("Start of testing...");
    // XXX This is a temporary hack to overcome a race
    // condition due to the tests below sometimes trying
    // to access commons before it has initialised.
    // We need a better solution than this.
    setTimeout(done, 1000);
    commons.setup("./test/test.properties", function (lib) {
      done();
    });
    // done(); // This is what we should do.
  });

  describe("commons", function () {

    it("the property exists", function (done) {
      should.exist(commons.getProperty("maxage.default"),
        "max-age does not exist");
      done();
    });

    it("the property is undefined", function (done) {
      expect("undefined").equal(typeof commons.getProperty("xxx"));
      done();
    });

    it("the property is really changed", function (done) {
      commons.setProperty("maxage.default", 1234);
      expect(commons.getProperty("maxage.default")).to.equal(1234);
      done();
    });

    it("the property has the value defined in the file", function (done) {
      expect(3000).equal(Number(commons.getProperty("nodejs.cluster.closewaitms")));
      done();
    });

    it("the property has the default value", function (done) {
      expect(1000).equal(Number(commons.getProperty("nodejs.cluster.checkmemoryms")));
      done();
    });

    it("the methods exist", function (done) {
      should.exist(commons.setObjectResponse,
        "setObjectResponse does not exist");
      done();
    });

    it("test getNumberOfProcesses function", function (done) {
      // NOTE: Should be to defaults["aurin.processes"]
      expect(2).equal(commons.getNumberOfProcesses("xxx"));
      expect(12).equal(commons.getNumberOfProcesses("proc1"));
      expect(require("os").cpus().length).equal(commons.getNumberOfProcesses("proc2"));
      expect(require("os").cpus().length).equal(commons.getNumberOfProcesses("proc3"));
      done();
    });

    it("When a mime-type is GeoJSON", function (done) {
      expect(commons.isGeoJSON(null)).to.be.false;
      expect(commons.isGeoJSON(undefined)).to.be.false;
      expect(commons.isGeoJSON("application/json")).to.be.false;
      expect(commons.isGeoJSON("application/graph+json")).to.be.false;
      expect(commons.isGeoJSON("application/geo+json")).to.be.true;
      expect(commons.isGeoJSON("application/text; application/geo+json; text/html")).to.be.true;
      done();
    });

    it("When a MIME type is JSONGraph", function (done) {
      expect(commons.isJSONGraph(null)).to.be.false;
      expect(commons.isJSONGraph(undefined)).to.be.false;
      expect(commons.isJSONGraph("application/json")).to.be.false;
      expect(commons.isJSONGraph("application/graph+json")).to.be.true;
      expect(commons.isJSONGraph("application/geo+json")).to.be.false;
      expect(commons.isJSONGraph("application/text; application/graph+json; text/html")).to.be.true;
      done();
    });

    it("When a MIME type is JSON", function (done) {
      expect(commons.isJSON(null)).to.be.false;
      expect(commons.isJSON(undefined)).to.be.false;
      expect(commons.isJSON("application/json")).to.be.true;
      expect(commons.isJSON("application/geo+json")).to.be.true;
      expect(commons.isJSON("application/text; application/graph+json; text/html")).to.be.true;
      done();
    });

    it("Test safeness of a JavaScript expression", function (done) {
      expect(commons.isEvalSafe(null)).to.be.true;
      expect(commons.isEvalSafe("{")).to.be.false;
      expect(commons.isEvalSafe("}")).to.be.false;
      expect(commons.isEvalSafe("(")).to.be.false;
      expect(commons.isEvalSafe(")")).to.be.false;
      expect(commons.isEvalSafe("a=='Hospital (emergency)'")).to.be.true;
      expect(commons.isEvalSafe("a=='Hospital {emergency}'")).to.be.true;
      expect(commons.isEvalSafe("a=='Hospital [emergency]'")).to.be.true;
      expect(commons.isEvalSafe("a==\"Hospital (emergency)\"")).to.be.true;
      expect(commons.isEvalSafe("a==\"Hospital {emergency}\"")).to.be.true;
      expect(commons.isEvalSafe("a==\"Hospital [emergency]\"")).to.be.true;
      expect(commons.isEvalSafe("a==eval(\"Hospital [emergency]\")")).to.be.false;
      expect(commons.isEvalSafe("a==new Object(\"Hospital\")")).to.be.false;
      expect(commons.isEvalSafe("eval(\"shell('rm *')\")")).to.be.false;
      expect(commons.isEvalSafe("eval('shell(\"rm *\")')")).to.be.false;
      expect(commons.isEvalSafe("'\"'+eval('shell(\"rm *\")')")).to.be.false;
      done();
    });

    it("Test geneation of UUID", function (done) {
      expect(commons.generateCouchDBUUID().length).equal(32);
      expect(commons.generateCouchDBUUID().match("-")).equal(null);
      done();
    });
  });

  describe("getConsulValue", function () {
    it("should return an ASCII value", function (done) {
      expect(commons.getConsulValue([{
        CreateIndex: 4,
        ModifyIndex: 127,
        LockIndex: 0,
        Key: "dataregistry/url",
        Flags: 0,
        Value: "aHR0cHM6Ly9sb2NhbGhvc3Q6MTAwODMvZGF0YV9yZWdpc3RyeQ=="
      }])).equal("https://localhost:10083/data_registry");
      done();
    });
  });

  describe("composeUrl", function () {
    it("should return a URL", function (done) {
      expect(commons.composeUrl("https://localhost:10083", "data_registry"))
        .equal("https://localhost:10083/data_registry");
      expect(commons.composeUrl("https://localhost:10083/", "data_registry"))
        .equal("https://localhost:10083/data_registry");
      expect(commons.composeUrl("https://localhost:10083/", "/data_registry"))
        .equal("https://localhost:10083/data_registry");
      expect(
        commons.composeUrl("https://localhost:10083/", "data_registry",
          "workspace", "index.html")).equal(
        "https://localhost:10083/data_registry/workspace/index.html");
      done();
    });
  });

  describe("initLooger", function () {
    it("should just work", function (done) {
      try {
        commons.initLogger({category: "logcategory", "log-file": "/tmp/a.log"});
      } catch (e) {
        expect(true).equal(false);
      }
      expect(true).equal(true);
      done();
    });
  });

  describe("Event class", function () {
    it("should return a valid object when parsing from the toJSON method", function (
      done) {
      var e = new commons.Event("ERROR", "module", 200, "message", "stack");
      expect(e.severity).equals("error");
      expect(e.severity).equals("error");
      expect(e.module).equals("module");
      expect(e.message).equals("message");
      expect(e.code).equals(200);
      expect(e.stack).equals("stack");
      done();
    });

    it("should throw an error when the severity is incorrect", function (done) {
      try {
        var e = new commons.Event("xxx", "module", 200,
          "message", "stack");
      } catch (e) {
        expect(e.message).equals(
          "Event severity can only be undefined, 'info', or 'error'");
      }
      done();
    });

    it("should write to the log file", function (
      done) {
      var logFile = "/tmp/test.log";
      fs.unlink(logFile, function (err) {
        commons.initLogger({"log-category": "logcategory", "log-file": logFile});
        var e = new commons.Event("ERROR", "module", 200, "message", "stack");
        e.toConsole();
        fs.readFile(logFile, function (err, txt) {
          expect(txt.toString().indexOf("[ERROR] logcategory - 200 module [ message stack ]")).above(0);
          done();
        });
      });
    });

  });

  describe("asBoolan function", function () {
    it("should return a valid boolean", function (
      done) {
      expect(commons.asBoolean(true)).equals(true);
      expect(commons.asBoolean("true")).equals(true);
      expect(commons.asBoolean(false)).equals(false);
      expect(commons.asBoolean("false")).equals(false);
      expect(commons.asBoolean(undefined)).equals(false);
      expect(commons.asBoolean(null)).equals(false);
      done();
    });
  });

  after(function (done) {
    console.log("...end of testing");
    done();
  });
});
