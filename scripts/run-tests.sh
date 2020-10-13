#!/usr/bin/env bash

set -o errexit
trap cleanup EXIT

cleanup() {
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    echo "Killing ganache."
    kill -9 $ganache_pid
  fi

  if [ -n "$buidlerevm_pid" ] && ps -p $buidlerevm_pid > /dev/null; then
    echo "Killing buidlerevm."
    kill -9 $buidlerevm_pid
  fi
}

start_ganache() {
  echo "Launching ganache..."
  node_modules/.bin/ganache-cli > /dev/null &
  ganache_pid=$!
  sleep 4
}

start_buidlerevm() {
  echo "Launching buidlerevm..."
  node_modules/.bin/buidler node > /dev/null &
  buidlerevm_pid=$!
  sleep 4
}


# Truffle + BuidlerEVM
npx mocha test/truffle.ts --timeout 100000 --exit

# Ethers + BuidlerEVM
npx mocha test/ethers.ts --timeout 100000 --exit

# Ethers + Buidler Node
start_buidlerevm
npx mocha test/buidlerevm.node.ts --timeout 100000 --exit
cleanup

# Truffle + Ganache
start_ganache
npx mocha test/ganache.node.ts --timeout 100000 --exit
