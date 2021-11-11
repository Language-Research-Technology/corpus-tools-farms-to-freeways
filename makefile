#! /bin/bash
# MakeFile for creating Farms To Freeways corpus repo
BASE_DIR=~/cloudstor/Shared
REPO_OUT_DIR=./ocfl-repo

REPO_NAME=ATAP
NAMESPACE=farms-to-freeways
TEMP_DIR=${BASE_TEMP_DIR}/temp
DATA_DIR=${BASE_DIR}/atap-repo-misc/farms_to_freeways

.DEFAULT_GOAL := repo

repo:
	node convert -r "${REPO_OUT_DIR}/" \
	-t {DATA_DIR} -n ${REPO_NAME} \
	-s ${NAMESPACE} -d ${BASE_DIR}/atap-repo-misc/farms_to_freeways_csv_files

clean:
	rm -rf "${TEMP_DIR}"
