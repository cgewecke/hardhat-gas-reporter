#!/usr/bin/env bash

set -o errexit

# Truffle tests
npx mocha test/truffle.ts --timeout 100000 --exit

# Ethers tests
npx mocha test/ethers.ts --timeout 100000 --exit
