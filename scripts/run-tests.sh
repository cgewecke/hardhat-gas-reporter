#!/usr/bin/env bash

set -o errexit
trap cleanup EXIT

cleanup() {
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    echo "Killing ganache."
    kill -9 $ganache_pid
  fi

  if [ -n "$hardhatevm_pid" ] && ps -p $hardhatevm_pid > /dev/null; then
    echo "Killing hardhatevm."
    kill -9 $hardhatevm_pid
  fi
}

start_ganache() {
  echo "Launching ganache..."
  node_modules/.bin/ganache-cli > /dev/null &
  ganache_pid=$!
  sleep 4
}

start_hardhatevm() {
  echo "Launching hardhatevm..."
  node_modules/.bin/hardhat node > /dev/null &
  hardhatevm_pid=$!
  sleep 4
}

# Merge gasRerpoterOutput.json files task
npx mocha test/merge.ts

# Truffle + HardhatEVM
npx mocha test/truffle.ts --timeout 100000 --exit

# Truffle + HardhatEVM + misc reporterOptions
npx mocha test/truffle.options.ts --timeout 100000 --exit

# Ethers + HardhatEVM
npx mocha test/ethers.ts --timeout 100000 --exit

# Waffle + HardhatEVM
npx mocha test/waffle.ts --timeout 100000 --exit

# Forked Network + HardhatEVM
npx mocha test/forked.ts --timeout 100000 --exit

# Ethers + Hardhat Node
start_hardhatevm
npx mocha test/hardhatevm.node.ts --timeout 100000 --exit

# Waffle + Hardhat Node
npx mocha test/waffle.ts --timeout 100000 --exit
cleanup
