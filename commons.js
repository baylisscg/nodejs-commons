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
var commons = {};

var cluster = require("cluster");
var child_process = require('child_process');
var util = require("util");

// Default values of properties (they are set in absence of
// values provided in the file)
var defaults = {};
defaults["nodejs.cluster.maxrssmemorymb"] = 1500;
defaults["nodejs.cluster.closewaitms"] = 20000;
defaults["nodejs.cluster.checkmemoryms"] = 1000;
defaults["log.level"] = "info";
defaults["maxage.default"] = 60;
defaults["aurin.processes"] = 2;

require('enum').register();
var messages = new Enum([ "MEMORYALARM", "EXCEPTIONALARM", "COMMITSUICIDE" ]);

/**
 * Returns the number of processes to spawn. If property aurin.<name>.processes
 * is 0 one per CPU is spawned, if that property is undefined, aurin.processes
 * is used instead
 * 
 * @param name
 *          of process
 * @return number of to spawn
 */
commons.getNumberOfProcesses = function(name) {
  var propValue = (typeof commons.getProperty("aurin." + name + ".processes") === "undefined") ? defaults["aurin.processes"]
      : commons.getProperty("aurin." + name + ".processes");
  return (Number(propValue) === 0) ? require("os").cpus().length
      : Number(propValue);
};

/*
 * Spawns a new app and sets up a event handler on some events
 */
commons.spawnApp = function() {
  var worker = cluster.fork();

  worker.on("message", function(msg) {

    // If an alarm is raised, message is detected sends a commitsuicide to the
    // process given in msg
    if (messages.MEMORYALARM.is(msg.message)
        || messages.EXCEPTIONALARM.is(msg.message)) {
      for ( var i in cluster.workers) {
        var worker = cluster.workers[i];
        if (worker.process.pid === msg.pid) {
          worker.send({
            message : messages.COMMITSUICIDE
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
commons.startCluster = function(propertiesFile, name, startServer) {

  // Loads properties
  commons.setup(propertiesFile, function(commons) {

    if (cluster.isMaster) {

      // Spawns processes
      var nProcesses = commons.getNumberOfProcesses(name);
      commons.logger.info("Spawning " + nProcesses + " processes for service "
          + name);

      for (var i = 0; i < nProcesses; i++) {
        commons.spawnApp();
      }

      // On disconnection, spawns a new app
      cluster.on("disconnect", function() {
        commons.spawnApp();
      });

      /*
       * If the process is a worker
       */
    } else {
      // Starts server
      startServer(commons, function(commons, app) {

        // Catches uncaught exceptions
        app.use(app.router);
        app.use(function(err, req, res, next) {
          if (!err) {
            return next()
          } else {
            commons.logger.error("Uncaught exception detected: " + err);
            process.send({
              message : messages.EXCEPTIONALARM,
              pid : process.pid
            });
            return next();
          }
        });

        // If app is null, exists
        if (!app) {
          commons.logger.error("Strangely enogouh, app is null, exiting");
          process.exit(1);
        }

        // Defines a isClosing property to avoid re-closing a
        // process that is shutting down
        app.isClosing = false;

        // Sets process's title
        process.title = name;

        // Process a message sent to the worked
        process.on("message",
            function(msg) {

              // If the message is commitsuicde, flags it for
              // shutdown
              if (messages.COMMITSUICIDE.is(msg.message)
                  && app.isClosing === false) {
                commons.logger.error("Process " + this.pid
                    + " slated for termination");

                // On app closed, shuts the process down
                app.on("close", function() {
                  commons.logger.error("Process " + process.pid + " closed");
                });

                // Prevents the app from accepting new connections
                app.isClosing = true;
                app.emit("close");

                // After a timeout, forces the shutting down
                setTimeout(function() {
                  commons.logger.error("Forcing  process " + process.pid
                      + " to terminate");
                  process.disconnect();
                }, Number(commons.getProperty("nodejs.cluster.closewaitms")));

              }

            });

        // Signals the disconnection
        process.on("disconnect", function() {
          commons.logger.error("Process " + this.pid + " is now disconnected");
        });

        // Signals the shutting down
        process.on("exit", function(code, signal) {
          commons.logger.error("Process " + this.pid + " is now dead");
        });

        /*
         * Checks, at regular intervals, the memory consumption of the worker
         */
        setInterval(function(app) {
          if (commons.getRSSMemoryMB() > Number(commons
              .getProperty("nodejs.cluster.maxrssmemorymb"))) {
            commons.logger.error("Process " + process.pid
                + " has consumed more than " + commons.getRSSMemoryMB()
                + " MBs");
            process.send({
              message : messages.MEMORYALARM,
              pid : process.pid
            });
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
commons.setup = function(propertiesFile, callback) {

  // Load properties file
  require("properties").load(propertiesFile, function(err, properties) {
    if (err != null) {
      console.log(err);
      callback(null);
    }

    // Apply defaults
    commons.properties = properties;
    Object.keys(defaults).forEach(function(prop) {
      if (!commons.getProperty(prop)) {
        commons.setProperty(prop, defaults[prop]);
      }
    });

    // Sets the logger
    commons.logger = require("tracer").console({
      format : "{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})",
      dateformat : "yyyy-mm-dd HH:MM:ss.L",
      level : properties["log.level"]
    });
    callback(commons);
  });
};

/**
 * Returns a property value given its name
 * 
 * @param propertyName
 */
commons.getProperty = function(propertyName) {
  return commons.properties[propertyName];
};

/**
 * Sets a property value given its name
 * 
 * @param propertyName
 * @param propertyValue
 */
commons.setProperty = function(propertyName, propertyValue) {
  commons.properties[propertyName] = propertyValue;
};

/**
 * Constructs a response for the return of a JSON object or, if the content-type
 * header is not application/json, of a string
 * 
 * @param obj
 *          Object to be returned
 * @param response
 *          Response
 * @param status
 *          Status of the response (200 if parameter is missing)
 * @param contentType
 *          Content type (application/json if parameter id missing)
 * @param maxAge
 *          Max age of cache (default value if parameter is missing)
 * @param noCache
 *          If true, does not add cache-control headers
 */
commons.setObjectResponse = function(args) {
  var status = (args.status !== undefined) ? args.status : 200;
  var maxAge = ((args.maxAge !== undefined) ? args.maxAge : commons
      .getProperty("maxage.default"));

  args.response.header("Connection", "keep-alive");
  args.response.header("Content-Length", args.obj.length);
  args.response.header("Transfer-Encoding", "chunked");
  args.response.header("Last-Modified", new Date());
  if (!args.noCache) {
    args.response.header("Cache-Control", "max-age=" + maxAge);
  }
  args.response.status(status);
  if (commons.isJSON(args.contentType)) {
    args.response.json(args.obj);
  } else {
    args.response.header("Content-Type", args.contentType);
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
commons.isJSON = function(mimetype) {
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
commons.isGeoJSON = function(mimetype) {
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
commons.isJSONGraph = function(mimetype) {
  if (!mimetype) {
    return false;
  }
  return (mimetype.match(/.*application\/graph\+json.*/) !== null) ? true
      : false;
};

/**
 * Writes logs about req request
 */
commons.logRequest = function(req) {
  var mem = util.inspect(process.memoryUsage());
  commons.logger.debug("Process %s received request %s %s", process.pid,
      req.method, req.url);
  req.on("end", function() {
    commons.logger.debug("Process %s completed request %s %s", process.pid,
        req.method, req.url);
    commons.logger.debug(
        "Process %s memory status is: heap %s (MB), RSS %s (MB)", process.pid,
        commons.getUsedMemoryMB(), commons.getRSSMemoryMB());
  });
};

/*
 * Returns current usage of memory in MB
 */
commons.getUsedMemoryMB = function() {
  return Math.round(process.memoryUsage().heapUsed / (1024 * 1024));
};

/*
 * Returns total usage of memory in MB
 */
commons.getTotalMemoryMB = function() {
  return Math.round(process.memoryUsage().heapTotal / (1024 * 1024));
};

/*
 * Returns Resident-Set-Size in MB
 */
commons.getRSSMemoryMB = function() {
  return Math.round(process.memoryUsage().rss / (1024 * 1024));
};

/**
 * Injects the geoclassification endpoint into every Swagger's resource
 * 
 * @param resources
 *          {Object} Resources repo. as loaded with Swagger
 */
commons.injectEndpoints = function(resources) {
  var resourceName;
  for (resourceName in resources) {
    if (resources.hasOwnProperty(resourceName)) {
      var res = resources[resourceName];
      if (res && typeof res.action === "function"
          && typeof res.spec !== "Object") {
        resources.swagger["add" + res.spec.method].apply(null, [ res ]);
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
commons.debug = function(obj) {
  commons.logger.debug("-------------- {");
  commons.logger.debug(util.inspect(obj, {
    depth : null
  }));
  commons.logger.debug("} -------------");
};

/**
 * Function/objects to export
 */
exports.setup = commons.setup;
exports.getNumberOfProcesses = commons.getNumberOfProcesses;
exports.startCluster = commons.startCluster;
exports.getProperty = commons.getProperty;
exports.setProperty = commons.setProperty;
exports.setObjectResponse = commons.setObjectResponse;
exports.isJSON = commons.isJSON;
exports.isGeoJSON = commons.isGeoJSON;
exports.isJSONGraph = commons.isJSONGraph;
exports.logRequest = commons.logRequest;
exports.logger = commons.logger;
exports.getUsedMemoryMB = commons.getUsedMemoryMB;
exports.getTotalMemoryMB = commons.getTotalMemoryMB;
exports.getRSSMemoryMB = commons.getRSSMemoryMB;
exports.debug = commons.debug;