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
# Tasks
########
npx mocha test/tasks/merge.ts

################################
# Hardhat EVM (Default Network)
################################
npx mocha test/integration/truffle.ts --timeout 100000 --exit
npx mocha test/integration/options.ts --timeout 100000 --exit
npx mocha test/integration/ethers.ts --timeout 100000 --exit
npx mocha test/integration/waffle.ts --timeout 100000 --exit
npx mocha test/integration/forked.ts --timeout 100000 --exit

##########################
# Hardhat Node (Localhost)
##########################
start_hardhat_node
npx mocha test/integration/node.ts --timeout 100000 --exit

cleanup
