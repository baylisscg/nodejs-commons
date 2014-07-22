# nodejs-commons

Common NodeJS functions library used by the AURIN project. However, the functions it provides may be 
of more general use.


## Introduction

This module contains Node.js functions that can be re-used by other components.


API
---

Functions:
* setup
* startCluster
* setObjectResponse
* getProperty
* setProperty
* isJSON
* isGeoJSON
* isJSONGraph
* logRequest
* getNumberOfProcesses
* getUsedMemoryMB;
* getTotalMemoryMB;
* getRSSMemoryMB;
* debug


Objects:
* logger: tracer logging object

## Pre-requirements

* Node.js v0.10.x
* Mocha 1.14.x should be installed (globally):
  `npm -g update mocha@1.14.0`


## Installation

Install from GitHub:
  `npm install git+ssh://git@github.com/AURIN/nodejs-commons.git#<version>`


## AURIN-specific installation (NOTE: do not do it unless you are deploying as parte of AURIN)

To update the package.json from the Maven pom.xml file, the following command has to be performed before test and deployment:

  `mvn compile -Ddeployment=<deployment type> -Dsystem=<system>`
  

## Tests

To run these test, following module have to be installed (versions are detailed in the devDependencies section of the package.json).

* Chai
* Express
  

# Unit tests:

  `mocha`
  
# Cluster tests (for the cluster test to work, http://www.google.com must be reachable):

* start the cluster `node ./test/app.js` (it should return two welcome messages, 
with two different PIDs);
* kill, from another shell, one of the processes (it should be re-spawn immediately with a different PID); 
* execute 'curl -X GET "http://localhost:8080/hogmemory"' from another shell (it should signal too much
memory used, wait 3s, commit suicide, and another process re-spawned immediately);
* execute 'curl -X GET "http://localhost:8080/throwuncaught"' from another shell (it should signal an uncaught 
exception, wait 3s, commit suicide, and another process re-spawned immediately);
* execute 'ps -ef | grep test', it should show two, and only two, processes. 


# License

Apache License, Version 2.0, see the LICENSE file  

  

