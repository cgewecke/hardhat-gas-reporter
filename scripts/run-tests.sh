#!/usr/bin/env bash

set -o errexit
trap cleanup EXIT

cleanup() {
  # Github actions kills the process
  if [ -n "$CI" ]; then
   echo "Exiting without killing Hardhat Node in CI"
   return
  fi

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
npx mocha test/tasks/merge.ts --timeout 10000

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
