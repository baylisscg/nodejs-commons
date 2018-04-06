/**
 * commons.js
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
"use strict";

var commons = exports;

var cluster = require("cluster");
var child_process = require('child_process');
var util = require("util");
var uuid = require("node-uuid");
var log4js = require("log4js");

// Default values of properties (they are set in absence of
// values provided in the file)
var defaults = {};
defaults["nodejs.cluster.maxrssmemorymb"] = 1740;
defaults["nodejs.cluster.closewaitms"] = 20000;
defaults["nodejs.cluster.checkmemoryms"] = 1000;
defaults["log.level"] = "info";
defaults["maxage.default"] = 60;
defaults["aurin.processes"] = 2;
defaults["nodejs.cluster.forcegcfraction"] = 0.85;
defaults["nodejs.cluster.minfractiontorecover"] = 0.05;
defaults["contentype"] = "application/json";
defaults["objectlength"] = 0.;

require('enum').register();
var messages = new Enum(["MEMORYALARM", "UNABLETOGCALARM", "EXCEPTIONALARM",
  "COMMITSUICIDE"]);

/**
 * Returns the number of processes to spawn. If property aurin.<name>.processes
 * is 0 one per CPU is spawned, if that property is undefined, aurin.processes
 * is used instead
 *
 * @param name
 *          of process
 * @return number of to spawn
 */
commons.getNumberOfProcesses = function (name) {
  var propValue = (typeof commons.getProperty("aurin." + name + ".processes") === "undefined") ? defaults["aurin.processes"]
    : commons.getProperty("aurin." + name + ".processes");
  return (Number(propValue) === 0) ? require("os").cpus().length
    : Number(propValue);
};

/*
 * Spawns a new app and sets up a event handler on some events
 */
commons.spawnApp = function () {
  var worker = cluster.fork();

  worker.on("message", function (msg) {

    // If an alarm is raised, message is detected sends a commitsuicide to the
    // process given in msg
    if (messages.MEMORYALARM.is(msg.message)
      || messages.UNABLETOGCALARM.is(msg.message)
      || messages.EXCEPTIONALARM.is(msg.message)) {
      for (var i in cluster.workers) {
        var worker = cluster.workers[i];
        if (worker.process.pid === msg.pid) {
          worker.send({
            message: messages.COMMITSUICIDE
          });
        }
      }
    }
  });
};

/**
 * Starts a cluster of services
 *
 * @param propertiesFile
 *          properties file
 * @param name
 *          Process's name (the property "aurin." + name + ".processes" will be
 *          used to get the number of processes to spawn)
 * @param callback
 *          Function called back when the object is initialized, the object
 *          itself is passed as parameter
 */
commons.startCluster = function (propertiesFile, name, startServer) {

  // Loads properties
  commons
    .setup(
      propertiesFile,
      function (commons) {

        if (cluster.isMaster) {

          // Spawns processes
          var nProcesses = commons.getNumberOfProcesses(name);
          commons.logger.info(util.format(
            "Spawning %s processes for service %s", nProcesses, name));

          for (var i = 0; i < nProcesses; i++) {
            commons.spawnApp();
          }

          // On disconnection, spawns a new app
          cluster.on("disconnect", function () {
            commons.spawnApp();
          });

          /*
           * If the process is a worker
           */
        } else {
          // Starts server
          startServer(
            commons,
            function (commons, app) {

              // Catches uncaught exceptions
              app.use(app.router);
              app.use(function (err, req, res, next) {
                if (!err) {
                  return next()
                } else {
                  commons.logger.error("Uncaught exception detected: "
                    + err);
                  process.send({
                    message: messages.EXCEPTIONALARM,
                    pid: process.pid
                  });
                  return next();
                }
              });

              // If app is null, exists
              if (!app) {
                commons.logger
                  .error("Strangely enough, app is null, exiting");
                process.exit(1);
              }

              // Defines a isClosing property to avoid re-closing a
              // process that is shutting down
              app.isClosing = false;

              // Sets process's title
              process.title = name;

              // Process a message sent to the worked
              process.on("message", function (msg) {

                // If the message is commitsuicde, flags it for
                // shutdown
                if (messages.COMMITSUICIDE.is(msg.message)
                  && app.isClosing === false) {
                  commons.logger.info(util.format(
                    "Process %s slated for termination", +this.pid));

                  // On app closed, shuts the process down
                  app.on("close", function () {
                    commons.logger.info(util.format("Process %s closed",
                      process.pid));
                  });

                  // Prevents the app from accepting new connections
                  app.isClosing = true;
                  app.emit("close");

                  // After a timeout, forces the shutting down
                  setTimeout(
                    function () {
                      commons.logger.info(util.format(
                        "Forcing  process %s to terminate",
                        process.pid));
                      process.disconnect();
                    }, Number(commons
                      .getProperty("nodejs.cluster.closewaitms")));

                }

              });

              // Signals the disconnection
              process.on("disconnect", function () {
                commons.logger.info(util.format(
                  "Process %s is now disconnected", this.pid));
              });

              // Signals the shutting down
              process.on("exit", function (code, signal) {
                commons.logger.info(util.format("Process %s is now dead",
                  this.pid));
              });

              /*
               * Checks, at regular intervals, the memory consumption of
               * the worker. If it is above 80% of the threshold, forces a
               * GC, if it is above the threshold, send a signal to shut
               * it down and re-spawn.
               */
              var condvarGC = false; // This is to set avoid re-forcing a
              // GC while
              // one is still underway

              setInterval(
                function (app) {

                  var rssSize = commons.getRSSMemoryMB();
                  var maxRssSize = Number(commons
                    .getProperty("nodejs.cluster.maxrssmemorymb"));

                  if (!condvarGC && rssSize > maxRssSize) {
                    commons.logger.info(util.format(
                      "Process %s has consumed %sMBs", process.pid,
                      rssSize));
                    process.send({
                      message: messages.MEMORYALARM,
                      pid: process.pid
                    });
                    return;
                  }

                  if (!condvarGC
                    && rssSize > (maxRssSize * commons
                      .getProperty("nodejs.cluster.forcegcfraction"))) {
                    condvarGC = true;

                    commons.logger.info(util.format(
                      "Process %s has consumed %sMB, forcing GC",
                      process.pid, rssSize));
                    global.gc();
                    commons.logger.info(util.format(
                      "Process %s after forcing GC consumes %sMB",
                      process.pid, commons.getRSSMemoryMB()));
                    condvarGC = false;

                    // If the memory relased by GC is less than a
                    // gioven fraction of
                    // the max allowed RSS size, suicide is scheduled
                    var gcFreedRSS = rssSize - commons.getRSSMemoryMB();
                    var minFreedRSS = maxRssSize
                      * commons
                        .getProperty("nodejs.cluster.minfractiontorecover");
                    if (gcFreedRSS < minFreedRSS) {
                      commons.logger
                        .info(util
                          .format(
                            "The Garbage Collection was not able to bring down the amount of memory used by process "
                            + "%s, since only %sMB were recovered, which is less than the %sMB required",
                            process.pid, gcFreedRSS, minFreedRSS));
                      process.send({
                        message: messages.UNABLETOGCALARM,
                        pid: process.pid
                      });
                      return;
                    }
                  }
                }, commons.getProperty("nodejs.cluster.checkmemoryms"));

            });
        }
      });
};

/**
 * Setup of a component
 *
 * @param propertiesFile
 *          properties file
 * @param callback
 *          Function called back when the object is initialized, the object
 *          itself is passed as parameter
 */
commons.setup = function (propertiesFile, callback) {

  // Load properties file
  require("properties")
    .parse(
      propertiesFile,
      {
        path: true
      },
      function (err, properties) {
        if (err != null) {
          console.log(err);
          callback(null);
        }

        // Apply defaults
        commons.properties = properties;
        Object.keys(defaults).forEach(function (prop) {
          if (!commons.getProperty(prop)) {
            commons.setProperty(prop, defaults[prop]);
          }
        });

        // Sets the logger
        commons.logger = require("tracer")
          .console(
            {
              format: [
                "{{timestamp}} [LOG] {{message}} (in {{file}}:{{line}})",
                {
                  info: "{{timestamp}} [INFO] {{message}} (in {{file}}:{{line}})",
                  warn: "{{timestamp}} [WARN] {{message}} (in {{file}}:{{line}})",
                  debug: "{{timestamp}} [DEBUG] {{message}} (in {{file}}:{{line}})",
                  error: "{{timestamp}} [ERROR] {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}"
                }],
              dateformat: "yyyy-mm-dd HH:MM:ss.L",
              level: properties["log.level"]
            });
        callback(commons);
      });
};

/**
 * Returns a property value given its name
 *
 * @param propertyName
 */
commons.getProperty = function (propertyName) {
  return commons.properties[propertyName];
};

/**
 * Sets a property value given its name
 *
 * @param propertyName
 * @param propertyValue
 */
commons.setProperty = function (propertyName, propertyValue) {
  commons.properties[propertyName] = propertyValue;
};

/**
 * Sets the usual headers of the response
 *
 * @param args.response
 *          {Object} Response
 * @param args.status
 *          {Number} Status of the response (200 if parameter is missing)
 * @param args.contentType
 *          {String} Content type (application/json if parameter id missing)
 * @param args.maxAge
 *          {Number} Max age of cache (default value if parameter is missing)
 * @param noCache
 *          {Boolean} If true, does not add cache-control headers
 */
commons.setResponseHeaders = function (args) {
  args.response.header("Connection", "keep-alive");
  args.response.header("Transfer-Encoding", "chunked");
  args.response.header("Last-Modified", new Date());
  if (!args.noCache) {
    args.response.header("Cache-Control", "max-age="
      + ((args.maxAge !== undefined) ? args.maxAge : commons
        .getProperty("maxage.default")));
  }
  args.response.header("Content-Type", args.contentType ? args.contentType : defaults["contentype"]);
};

/**
 * Constructs a response for the return of a JSON object or, if the content-type
 * header is not application/json, of a string
 *
 * @param args.response
 *          {Object} Response
 * @param args.status
 *          {Number} Status of the response (200 if parameter is missing)
 * @param args.contentType
 *          {String} Content type (application/json if parameter id missing)
 * @param args.maxAge
 *          {Number} Max age of cache (default value if parameter is missing)
 * @param noCache
 *          {Boolean} If true, does not add cache-control headers
 * @param args.obj
 *          Object to be returned
 */
commons.setObjectResponse = function (args) {
  commons.setResponseHeaders(args);
  args.response.header("Content-Length", args.obj.length ? args.obj.length : defaults["objectlength"]);
  args.response.status((args.status !== undefined) ? args.status : 200);
  if (commons.isJSON(args.contentType)) {
    args.response.json(args.obj);
  } else {
    args.response.header("Content-Type", args.contentType ? args.contentType : defaults["contentype"]);
    args.response.send(args.obj);
  }
  args.response.end();
};

/**
 * Returns true if mimetype is JSON
 *
 * @param mime-type
 *          to test
 */
commons.isJSON = function (mimetype) {
  if (!mimetype) {
    return false;
  }
  return (mimetype.match(/.*application\/.*json.*/) !== null) ? true : false;
};

/**
 * Returns true if mimetype is GeoJSON
 *
 * @param mime-type
 *          to test
 */
commons.isGeoJSON = function (mimetype) {
  if (!mimetype) {
    return false;
  }
  return (mimetype.match(/.*application\/geo\+json.*/) !== null) ? true : false;
};

/**
 * Returns true if mimetype is JSONGraph
 *
 * @param mime-type
 *          to test
 */
commons.isJSONGraph = function (mimetype) {
  if (!mimetype) {
    return false;
  }
  return (mimetype.match(/.*application\/graph\+json.*/) !== null) ? true
    : false;
};

/**
 * Writes logs about req request
 */
commons.logRequest = function (req, res) {
  commons.logger.info("Process %s received request %s %s", process.pid,
    req.method, req.url);
  res.on("finish", function () {
    commons.logger.info("Process %s completed response %s %s", process.pid,
      req.method, req.url);
    commons.logger.debug(
      "Process %s memory status is: heap %s (MB), RSS %s (MB)", process.pid,
      commons.getUsedMemoryMB(), commons.getRSSMemoryMB());
  });
};

/*
 * Returns current usage of memory in MB
 */
commons.getUsedMemoryMB = function () {
  return Math.round(process.memoryUsage().heapUsed / (1024 * 1024));
};

/*
 * Returns total usage of memory in MB
 */
commons.getTotalMemoryMB = function () {
  return Math.round(process.memoryUsage().heapTotal / (1024 * 1024));
};

/*
 * Returns Resident-Set-Size in MB
 */
commons.getRSSMemoryMB = function () {
  return Math.round(process.memoryUsage().rss / (1024 * 1024));
};

/**
 * Injects the geoclassification endpoint into every Swagger's resource
 *
 * @param resources
 *          {Object} Resources repo. as loaded with Swagger
 */
commons.injectEndpoints = function (resources) {
  var resourceName;
  for (resourceName in resources) {
    if (resources.hasOwnProperty(resourceName)) {
      var res = resources[resourceName];
      if (res && typeof res.action === "function"
        && typeof res.spec !== "Object") {
        resources.swagger["add" + res.spec.method].apply(resources.swagger,
          [res]);
      }
    }
  }
};

/**
 * Prints out the given object on the debug log
 *
 * @param obj
 *          Object to print
 */
commons.debug = function (obj) {
  commons.logger.debug("-------------- {");
  commons.logger.debug(util.inspect(obj, {
    depth: null
  }));
  commons.logger.debug("} -------------");
};

/**
 * Returns true of an expression is safe to be eval-uated
 *
 * @param exprt
 *          Expression to check
 */
commons.isEvalSafe = function (expr) {

  var isWithinQuotes = false;
  var xChars = /[/(/)/{/}]/;
  var quoteChars = /["']/;

  if (!expr) {
    return true;
  }

  for (var i = 0; i < expr.length; i++) {
    var c = expr.substr(i, 1);

    if (quoteChars.test(c)) {
      isWithinQuotes = isWithinQuotes ? false : true;
    }

    if (xChars.test(c) && !isWithinQuotes) {
      return false;
    }
  }

  return true;
};

/**
 * Returns a CouchDB-like UUID
 *
 * @return {String} UUID as 32 hex digits
 */
commons.generateCouchDBUUID = function () {
  return uuid.v4().replace(/-/g, "");
};

/**
 * Returns a Boolean value out of an input that may be a Boolean or a String (if
 * unedfined or null, it is considered false)
 *
 * @param {String|Boolean}
 *          logi Logical value
 * @return {Boolean}
 */
commons.asBoolean = function (logi) {
  return (logi == true || logi == "true");
};

/**
 * Joins some fragments to make an URL
 *
 * @param {Object}
 *          json Body of JSON response
 * @return {String}
 */
commons.composeUrl = function () {
  var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null,
    arguments));
  return args.join("/").replace(/([^:]\/)\/+/g, "$1");
};

/**
 * Returns the value of a Consul key/value as a string
 *
 * @param {Object}
 *          json Body of JSON response
 * @return {String}
 */
commons.getConsulValue = function (json) {
  try {
    return (new Buffer(json[0].Value, "base64")).toString();
  } catch (e) {
    (new module.exports.Event("error", "getConsulValue", "error", [e.title,
      e.message].join(" "), e.stack)).toConsole();
    return null;
  }
};

/**
 * Check the presence of an OGC error in the data returned by a request
 *
 * @param data
 *          {Object} Data as returned by a Response object
 */
commons.isOGCInError = function (data) {
  var result = (typeof data === "string") ? data : JSON.stringify(data);
  return result && result.indexOf("exceptionCode") > 0
};

/**
 * Setup of the logger
 *
 * @param conf
 *          {Object} General configuration of the app
 */
commons.initLogger = function (conf) {
  log4js.configure({
    appenders: [{
      type: "file",
      filename: conf["log-file"],
      category: conf["log-category"],
      layout: {
        type: 'pattern',
        pattern: "[%d{yyyy-MM-dd hh:mm:ss.SSSO}] [%p] %c - %m"
      }
    }],
    replaceConsole: false
  });
  commons.Event.category = conf["log-category"];
};

/**
 * Handles the errors of a given request, raising an error if needed
 *
 * @param req
 *          {Object} The request to handle errors of
 * @param moduleName
 *          {String} Name of the module to log
 * @param done
 *          {Function} The callback to call, with an error parameter in case of
 *          error
 */
commons.handleRequestErrors = function (req, moduleName, done) {

  req.on("requestTimeout", function (req) {
    req.emit("error", new Error("Request has expired "));
  });

  req.on("responseTimeout", function (res) {
    req.emit("error", new Error("Response has expired "));
  });

  req.on("error", function (err) {
    (new module.exports.Event("error", moduleName, err.name, err.message,
      err.stack)).toConsole();
    done(err);
  });

};

/**
 * Class representing an event
 */
commons.Event = class {

  constructor(severity, module, code, message, stack) {
    this.severity = "info" && severity.toLowerCase();
    if (this.severity !== "info" && this.severity !== "error") {
      throw new Error(
        "Event severity can only be undefined, 'info', or 'error'");
    }
    this.module = module || "";
    this.code = code || 0;
    this.message = message || "";
    this.stack = stack || "";
  }

  toString() {
    return [this.code, this.module, "[", this.message, this.stack, "]"]
      .join(" ");
  }

  toConsole() {
    log4js.getLogger(commons.Event.category)[this.severity](this.toString());
  }
};
