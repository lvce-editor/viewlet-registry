#!/bin/bash

cd $(dirname "$0")
cd ..

command_exists(){
  command -v "$1" &> /dev/null
}

if ! command_exists "ncu"; then
    echo "npm-check-updates is not installed"
    npm i -g npm-check-updates
else
    echo "ncu is installed"
fi

function updateDependencies {
  echo "updating dependencies..."
  OUTPUT=`ncu -u -x @types/node -x @babel/preset-typescript -x typescript`
  SUB='All dependencies match the latest package versions'
  if [[ "$OUTPUT" == *"$SUB"* ]]; then
    echo "$OUTPUT"
  fi
}

updateDependencies &&
for package in packages/*; do
  cd "$package" || exit
  updateDependencies
  cd ../.. || exit
done &&
npm install &&

echo "Great Success!"

sleep 2
