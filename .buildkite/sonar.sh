#!/usr/bin/env bash

set -e
set -u
set -o pipefail

DEPENDENCY_CHECK="$(which dependency-check)"
SONAR_SCANNER="$(which sonar-scanner)"

function doSonar {
  ${SONAR_SCANNER} -Dsonar.host.url="${SONAR_URL}" \
                   -Dsonar.login="${SONAR_TOKEN}" \
                   s-Dsonar.projectVersion=0.6.3
}

function doDependencyCheck {
    ${DEPENDENCY_CHECK} --project "AURIN NodeJS Commons" \
                        --format=ALL \
                        --scan "commons.js" --scan=package.json --scan=package-lock.json \
                        --enableExperimental \
                        --out=dependency-check \
                        --log=dependency-check/dependency-check.log \
                        --data="${HOME}/.dependency-check/"
}

function setUp {
  local location="$(dirname $0)"
  ${location}/../build.sh
  mkdir -p dependecy-check
}

function runTestsWithCoverage {
  npm install
  npm run coverage
}

function main {
  setUp
  runTestsWithCoverage
  doDependencyCheck
  doSonar
}

main
