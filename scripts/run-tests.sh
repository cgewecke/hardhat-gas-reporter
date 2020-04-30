#!/usr/bin/env bash

set -o errexit
trap cleanup EXIT

cleanup() {
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi

  if [ -n "$buidlerevm_pid" ] && ps -p $buidlerevm_pid > /dev/null; then
    kill -9 $buidlerevm_pid
  fi
}

start_ganache() {
  node_modules/.bin/ganache-cli > /dev/null &
  ganache_pid=$!
  sleep 4
}

start_buidlerevm() {
  node_modules/.bin/buidler node > /dev/null &
  buidlerevm_pid=$!
  sleep 4
}

# Ganache tests
start_ganache
npx mocha test/truffle.ts --timeout 100000 --exit
cleanup

# BuidlerEVM
start_buidlerevm
npx mocha test/ethers.ts --timeout 100000 --exit
