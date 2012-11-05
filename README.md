nodejs-commons
==============

Common NodeJS functions library.

Introduction
------------

This module contains all Node.js functions that can possiibly be re-used across other modules.


Build instructions
------------------

To write the package description (package.json).

  mvn compile -Ddeployment=<deployment type> -Dsystem=<system>

  
To install the package one package.json has been set:

  cd ./src
  sudo npm link
  cd ..
  

Test:
  
  mvn test -Ddeployment=<deployment type> -Dsystem=<system>

  

