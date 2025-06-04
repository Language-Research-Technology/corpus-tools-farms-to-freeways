#! /bin/bash
# MakeFile for creating Farms To Freeways corpus repo
# Override BASE_DATA_DIR, REPO_OUT_DIR, BASE_TMP_DIR to point to the location of your datasets

BASE_DATA_DIR=./farms-to-freeways
REPO_SCRATCH_DIR=scratch

REPO_OUT_DIR=./ocfl-repo
BASE_TMP_DIR=temp

REPO_NAME=LDaCA
NAMESPACE=farms-to-freeways-example-dataset
DATA_DIR=${BASE_DATA_DIR}/farms_to_freeways
TEMP_DIR=${BASE_TMP_DIR}/temp

.DEFAULT_GOAL := repo

repo:
	node index.js -r "${REPO_OUT_DIR}/" \
	-s ${NAMESPACE} -d "${DATA_DIR}" \
	-z "${REPO_SCRATCH_DIR}"

clean:
	rm -rf "${TEMP_DIR}"
