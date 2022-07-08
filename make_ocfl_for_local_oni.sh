#!/usr/bin/env bash

FARMS_TO_FREEWAYS_TEMPLATE_DIR=/Users/moises/cloudstor/Shared/atap-repo-misc/farms_to_freeways
FARMS_TO_FREEWAYS_DATA_DIR=/Users/moises/cloudstor/Shared/atap-repo-misc/farms_to_freeways_csv_files
FARMS_TO_FREEWAYS_BASE_DATA_DIR=/Users/moises/cloudstor/Shared/atap-repo-misc

make BASE_DATA_DIR=${FARMS_TO_FREEWAYS_BASE_DATA_DIR} \
 REPO_OUT_DIR=oni/data/ocfl \
 REPO_SCRATCH_DIR=oni/data/scratch-ocfl \
 BASE_TMP_DIR=oni/data/temp \
 TEMPLATE_DIR=${FARMS_TO_FREEWAYS_TEMPLATE_DIR}\
 DATA_DIR=${FARMS_TO_FREEWAYS_DATA_DIR} \

