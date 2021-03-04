#!/bin/sh

if ! which pack > /dev/null 2>&1; then
  echo "Please install pack using the command: brew install buildpacks/tap/pack"
  exit 1
fi

pack build \
  --path .build/functions/$1 \
  --builder gcr.io/buildpacks/builder:v1 \
  --env GOOGLE_FUNCTION_SIGNATURE_TYPE=$2 \
  --env GOOGLE_FUNCTION_TARGET=default \
  function

docker run --rm -d -p 5000:8080 function
