#!/usr/bin/env bash

set -o errexit
trap cleanup EXIT

cleanup() {
  if [ -n "$hardhat_node_pid" ] && ps -p $hardhat_node_pid > /dev/null; then
    echo "Killing Hardhat Node."
    kill -9 $hardhat_node_pid
  fi
}

start_hardhat_node() {
  echo "Launching Hardhat Node..."
  node_modules/.bin/hardhat node > /dev/null &
  hardhat_node_pid=$!
  sleep 4
}

########
# Units
########
npx mocha test/unit/*.ts --timeout 10000

########
# Tasks
########
# Temporarily Skipping
# Need to go through this and regenerate files when options and
# data format are finalized
# npx mocha test/tasks/merge.ts

################################
# Hardhat EVM (Default Network)
################################
npx mocha test/integration/*.ts --timeout 100000 --exit

##########################
# Hardhat Node (Localhost)
##########################
start_hardhat_node
STAND_ALONE=true npx mocha test/integration/node.ts --timeout 100000 --exit

cleanup
