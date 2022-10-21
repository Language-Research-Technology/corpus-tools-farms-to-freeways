# Farms to Freeways Arkisto corpus ingest tools

This repository documents how to build a language corpus from the Farms to Freeways history project data.

The data are [archived at Western Sydney University]

And are [available in an Omeka Repository](https://omeka.westernsydney.edu.au/farmstofreeways/)

Peter Sefton exported the data into an RO-Crate, using [this process](https://github.com/UTS-eResearch/omeka-datacrate-tools).

These tools work on the resulting RO-Crate.

## Install

Then install
```bash
npm install
```

## Making CSV files from PDF transcripts


This work has all been done and is not automated but here are notes about how it was done.

The transcripts in the Omeka repository are in PDF format and speaker turns are only indicated using bold-face text.

There are some [plain text versions available](https://research-data.westernsydney.edu.au/redbox/verNum1.9/published/detail/97a58f4bfca2c074c2d0e357c1b5d28c/ftf_transcripts_plaintext.zip?preview=true) but they don't have speaker turns indicated.

To extract text from the PDF files in the repo first use open office:

On a mac, this command will create a bunch of SVG files in the working directory.

```bash
find farms-to-freeways/ -name "*.pdf" -exec /Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to svg {} \;
```

Move these into an svgfiles directory:

```bash
mv *.svg svgfiles/
```

Run `svg2csv` to create csv files in `csvfiles/`

```bash
node svg2csv.js
```

copy the CSV files to cloudstor

 ```bash
rsync csvfiles/*  ~/cloudstor/atap-repo-misc/farms_to_freeways_csv_files/ -ruvi
 ```

## Convert the metadata file from a plain-old crate to being a corpus

Assuming there is a copy of the Farms to Freeways data as exported from Omeka in cloudstor.

-  Run the script.

```bash
make BASE_DATA_DIR=/farms-to-freeways/data REPO_OUT_DIR=/your/ocfl-repo BASE_TMP_DIR=/your/temp
```

### How to run your own oni

See [oni/README.md](./oni/README.md) for instructions

## Running with the `ldaca-portal`
To use this data corpus with the [ldaca-portal] (https://github.com/Language-Research-Technology/ldaca-portal) 
    1. Update the script `make_ocfl_for_local_oni.sh` to point to your local path for the farms-to-freeways data and to the expected path for the `ldaca-portal`
    
    ```bash
        FARMS_TO_FREEWAYS_TEMPLATE_DIR=/LOCAL-PATH/farms_to_freeways
        FARMS_TO_FREEWAYS_DATA_DIR=/LOCAL-PATH/farms_to_freeways_csv_files
        FARMS_TO_FREEWAYS_BASE_DATA_DIR=/LOCAL-PATH

        make BASE_DATA_DIR=${FARMS_TO_FREEWAYS_BASE_DATA_DIR} \
        REPO_OUT_DIR=/opt/storage/oni/ocfl \
        REPO_SCRATCH_DIR=/opt/storage/oni/scratch-ocfl \
        BASE_TMP_DIR=/opt/storage/oni/temp \
        TEMPLATE_DIR=${FARMS_TO_FREEWAYS_TEMPLATE_DIR}\
        DATA_DIR=${FARMS_TO_FREEWAYS_DATA_DIR} \
        ```
        
    2. Run the script `make_ocfl_for_local_oni.sh`
    3. Follow the directions in the `ldaca-portal` code to set up the portal
