#!/usr/bin/env bash

# Node 
if [[ -z $(which node 2>/dev/null) ]]; then
  echo " 🛑  Please install node and try again"
  exit 1
fi
# NPM
if [[ -z $(which npm 2>/dev/null) ]]; then
  echo " 🛑  Please install npm and try again"
  exit 1
fi
if [ -z $(which git-lfs 2>/dev/null) ]; then
  echo " 🛑  Please install git-lfs and retry..."
  exit 1
fi

# Install yarn globally if it doesn't exist
if [[ -z $(which yarn 2>/dev/null) ]]; then
  npm install -g yarn
fi

# Setup submodules
git submodule update --init
git submodule foreach --recursive git checkout .

# Pull the large git files
git lfs pull

# Install the dependencies
yarn
