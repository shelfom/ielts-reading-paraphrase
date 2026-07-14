#!/usr/bin/env bash
set -e
exec npx serve dist -l "${DEPLOY_RUN_PORT}" -s
