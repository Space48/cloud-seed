#!/bin/bash


if [[ -z "${GCP_SERVICE_ACCOUNT}" ]]; then
  echo "GCP Service Account has not been configured. Set the GCP_SERVICE_ACCOUNT environment variable to a base64 encoded value of the keys."
  exit 1
fi

# Decode credentials file and output into json file.
echo -n $GCP_SERVICE_ACCOUNT | base64 -d > credentials.json
