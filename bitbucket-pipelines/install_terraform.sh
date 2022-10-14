#!/bin/bash

apt update && apt install -qq -y wget gpg
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor > /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(cat /etc/os-release | grep 'VERSION_CODENAME' | cut -d'=' -f2) main" | tee /etc/apt/sources.list.d/hashicorp.list
apt update && apt install -qq -y terraform
