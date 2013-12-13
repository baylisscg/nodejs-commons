# nodejs-commons

Common NodeJS functions library.

## Introduction

This module contains all Node.js functions that can possiibly be re-used across other modules.


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


Objects:
* logger: tracer logging object

## Pre-requirements

* Node.js v0.10.x
* Mocha 1.14.x should be installed (globally):
  `npm -g update mocha@1.14.0`


## Installation

Install from GitHub:
  `npm install git+ssh://git@github.com/AURIN/nodejs-commons.git#<version>`

Write the package description (package.json) and the properties file.
  `mvn compile -Ddeployment=<deployment type> -Dsystem=<system>`
  
To install the package one package.json has been set:
  `npm install`


## Test (after executing 'mvn compile', as described above)

Unit tests:

  `mocha`
  
Cluster tests (for the cluster test to work, http://www.google.com must be reachable):

* start the cluster `node ./test/app.js` (it should return two welcome messages, 
with two different PIDs);
* kill, from another shell, one of the processes (it should be re-spawn immediately with a different PID); 
* execute 'curl -X GET "http://localhost:8080/hogmemory"' from another shell (it should signal too much
memory used, its suicide, and another process re-spawned immediately);
* execute 'ps -ef | grep test', it should show two, and only two, processes. 
  

  

