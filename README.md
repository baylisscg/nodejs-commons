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


Build instructions
------------------

To write the package description (package.json).
  `mvn compile -Ddeployment=<deployment type> -Dsystem=<system>`

  
To install the package one package.json has been set:
  `npm insall`

Test:
  `mvn test -Ddeployment=<deployment type> -Dsystem=<system>`

  

