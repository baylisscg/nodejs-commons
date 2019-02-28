#!/usr/bin/env bash


set -euo pipefail

NVM_DIR="${NVM_DIR:-${HOME}/.nvm}"
source "$NVM_DIR/nvm.sh"

export DIR="${BUILDKITE_BUILD_CHECKOUT_PATH:-${PWD}}"
export AURIN_DEPLOYMENT="ci"

function nvm_init {
    if ! nvm use; then
      nvm install
      nvm use
    fi
}

function setUp {
  echo "--- Set up :nodejs:"
  nvm_init
}

setUp
