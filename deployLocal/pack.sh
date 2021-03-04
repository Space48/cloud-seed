#!/bin/sh

pack build \
  --path .build/functions/$1 \
  --builder gcr.io/buildpacks/builder:v1 \
  --env GOOGLE_FUNCTION_SIGNATURE_TYPE=$2 \
  --env GOOGLE_FUNCTION_TARGET=default \
  function

docker run --rm -d -p 5000:8080 function
