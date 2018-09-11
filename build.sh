#!/usr/bin/env bash


set -euo pipefail

source "$NVM_DIR/nvm.sh"

export DIR=${BUILDKITE_BUILD_CHECKOUT_PATH:-${PWD}}
export AURIN_DEPLOYMENT="ci"

MVN=$(which mvn)
MVN_OPTS="--settings=.ci.settings.xml"

NPM="$(which npm)"
NPM_OPTS="--debug"

function maven_op {
    ${MVN} "${MVN_OPTS}" "${@}"
}

function nvm_init {
    nvm use
}

function npm_op {
    ${NPM} "${NPM_OPTS}" "${@}"
}


function setUp {
  echo "--- Set up :nodejs:"
  nvm_init

  echo "--- Build properties :maven:"
  maven_op generate-sources

  echo "--- Install dependencies :npm:"
  npm_op install
}

function lint {
  echo "--- Linting :npm:"
  npm_op run lint
}

function run_tests {
    echo "--- Running tests :npm:"
}


function run {
    setUp
#    lint
    run_tests
}

run