#!/bin/bash

cd `dirname $0`

cd ../../build
FILE_PATH_MERGED_CONFIG=`pwd`"/merged-config.js"
FILE_PATH_MERGED_SCRIPT=`pwd`"/merged-script.js"

: > ${FILE_PATH_MERGED_CONFIG}
: > ${FILE_PATH_MERGED_SCRIPT}

cd ../src/js

find config -type f | while read -r f; do
  cat "$f" >> ${FILE_PATH_MERGED_CONFIG}
  echo "" >> ${FILE_PATH_MERGED_CONFIG}
done

find script -type f | while read -r f; do
  cat "$f" >> ${FILE_PATH_MERGED_SCRIPT}
  echo "" >> ${FILE_PATH_MERGED_SCRIPT}
done

