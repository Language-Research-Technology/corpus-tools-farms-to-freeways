#! /bin/bash
# MakeFile for creating Farms To Freeways corpus repo
BASE_DATA_DIR=/Users/moises/cloudstor/Shared/atap-repo-misc

REPO_OUT_DIR=/Users/moises/Library/Mobile Documents/com~apple~CloudDocs/source/github/Language-Research-Technology/oni/api/.dev.nosync/ocfl
BASE_TMP_DIR=/Users/moises/dump/atap-ocfl/tools-temp

REPO_NAME=ATAP
NAMESPACE=farms-to-freeways
TEMPLATE_DIR=${BASE_DATA_DIR}/farms_to_freeways
DATA_DIR=${BASE_DATA_DIR}/farms_to_freeways_csv_files
TEMP_DIR=${BASE_TMP_DIR}/temp

.DEFAULT_GOAL := repo

repo:
	node convert -r "${REPO_OUT_DIR}/" \
	-t "${TEMPLATE_DIR}" -n ${REPO_NAME} \
	-s ${NAMESPACE} -d "${DATA_DIR}"

clean:
	rm -rf "${TEMP_DIR}"
