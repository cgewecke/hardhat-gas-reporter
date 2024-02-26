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
npx mocha test/unit/*.ts

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
npx mocha test/integration/default.ts --timeout 100000 --exit
npx mocha test/integration/options.a.ts --timeout 100000 --exit
npx mocha test/integration/options.b.ts --timeout 100000 --exit
npx mocha test/integration/options.c.ts --timeout 100000 --exit
npx mocha test/integration/options.e.ts --timeout 100000 --exit
npx mocha test/integration/forked.ts --timeout 100000 --exit
npx mocha test/integration/viem.ts --timeout 100000 --exit

# Temporarily skipping waffle test - simple txs error with internal ethers error:
# `this.provider.getFeeData is not a function`
# Not sure if this is a problem here or because hardhat-waffle is deprecated
# Also see: https://github.com/NomicFoundation/hardhat/issues/1866
# npx mocha test/integration/waffle.ts --timeout 100000 --exit

##########################
# Hardhat Node (Localhost)
##########################
start_hardhat_node
npx mocha test/integration/node.ts --timeout 100000 --exit

cleanup
