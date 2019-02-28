#!/usr/bin/env bash

set -e
set -u
set -o pipefail

DEPENDENCY_CHECK="$(which dependency-check)"
SONAR_SCANNER="$(which sonar-scanner)"

#"./build.sh"
#"npm install"
#      - "npm coverage"
#      - "dependency-check --project \"AURIN NodeJS Commons\" --format=ALL --scan \"commons.js\" --scan=package.json  --enableExperimental --out=dependency-check --log=./dependency-check.log --scan=package-lock.json"
#      - "sonar-scanner -Dsonar.host.url=${SONAR_HOST} -Dsonar.login=${SONAR_SECRET} -Dsonar.projectVersion=0.6.3"

function doSonar {
  ${SONAR_SCANNER} -Dsonar.host.url="${SONAR_URL}" -Dsonar.login="${SONAR_TOKEN}" -Dsonar.projectVersion=0.6.3
}

function doDependencyCheck {
    ${DEPENDENCY_CHECK} --project "AURIN NodeJS Commons" --format=ALL --scan "commons.js" --scan=package.json  --enableExperimental --out=dependency-check --log=./dependency-check.log --scan=package-lock.json
}

function main {
  local location="$(dirname $0)"
  ${location}/../build.sh
  npm install
  npm run coverage
  doDependencyCheck
  doSonar
}

main
