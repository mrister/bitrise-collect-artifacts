#!/bin/bash

set -e
TMP_CURRENT_DIR="$( pwd )"
THIS_SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# shellcheck disable=SC2154
envman add --key BITRISE_ARTIFACTS_SAVE_PATH --value $save_path

cd $THIS_SCRIPT_DIR

echo '$' "npm i"
npm i

echo '$' "node "$THIS_SCRIPT_DIR/index.js""
node "$THIS_SCRIPT_DIR/index.js"

cd $TMP_CURRENT_DIR
