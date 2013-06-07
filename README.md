nodejs-commons
==============

Common NodeJS functions library.

Introduction
------------

This module contains all Node.js functions that can possiibly be re-used across other modules.


API
---

Functions:
* setup
* setObjectResponse
* setRecordsetResponse

Objects:
* logger: tracer logging object


Pre-requirements
----------------

* Node.js v0.10.10
* Mocha 1.10.x should be installed (globally):
  `npm -g update mocha@1.10.0`


Installation
------------

To write the package description (package.json).
  `mvn compile -Ddeployment=<deployment type> -Dsystem=<system>`
  
To install the package one package.json has been set:
  `npm install`

Test:
  `mvn test -Ddeployment=<deployment type> -Dsystem=<system>`

  

