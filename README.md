# Farms to Freeways Arkisto corpus ingest tools

This repository documents how to build a language corpus from the Farms to Freeways history project data.

The data are [archived at Western Sydney University]

And are [available in an Omeka Repository](https://omeka.westernsydney.edu.au/farmstofreeways/)

Peter Sefton exported the data into an RO-Crate, using [this process](https://github.com/UTS-eResearch/omeka-datacrate-tools).

These tools work on the resulting RO-Crate.

## Install

Then install
```
npm install
```
Then add language-data-node-tools

Assuming you have [this](https://github.com/Language-Research-Technology/language-data-node-tools) checked out and done npm link inside its directory
```
npm link language-data-node-tools 
```


## Making CSV files from PDF transcripts


This work has all been done and is not automated but here are notes about how it was done.

The transcripts in the Omeka repository are in PDF format and speaker turns are only indicated using bold-face text.

There are some [plain text versions available](https://research-data.westernsydney.edu.au/redbox/verNum1.9/published/detail/97a58f4bfca2c074c2d0e357c1b5d28c/ftf_transcripts_plaintext.zip?preview=true) but they don't have speaker turns indicated.

To extract text from the PDF files in the repo first use open office:

On a mac, this command will create a bunch of SVG files in the working directory.

```
find farms-to-freeways/ -name "*.pdf" -exec /Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to svg {} \;
```

Move these into an svgfiles directory:

```
mv *.svg svgfiles/
```

Run `svg2csv` to create csv files in `csvfiles/`

```
node svg2csv.js
```

copy the CSV files to cloudstor

 ```
rsync csvfiles/*  ~/cloudstor/atap-repo-misc/farms_to_freeways_csv_files/ -ruvi
 ```

## Convert the metadata file from a plain-old crate to being a corpus

Assuming there is a copy of the Farms to Freeways data as exported from Omeka in cloudstor.

-  Run the script.

```bash
make BASE_DATA_DIR=/multilingual/repo REPO_OUT_DIR=/your/ocfl-repo BASE_TMP_DIR=/your/temp
```

