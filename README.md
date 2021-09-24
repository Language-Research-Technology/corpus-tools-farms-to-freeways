# Farms to Freeways Arkisto corpus ingest tools

This repository documents how to build a language corpus from the Farms to Freeways history project data.

The data are [archived at Western Sydney University]

And are [available in an Omeka Repository](https://omeka.westernsydney.edu.au/farmstofreeways/)

Peter Sefton exported the data into an RO-Crate, using [this process](https://github.com/UTS-eResearch/omeka-datacrate-tools).

These tools work on the resulting RO-Crate.

## Convert the metadata file from a plain-old crate to being a corpus

-  Copy the `ro-crate-metadata.json` file from the Farms to Freeways crate into `input`.

-  Run the script.

    ```
    node convert.js
    ```

-  Copy the resulting new file back into the farms to freeways crate.



## OPTIONAL / Add CSV files with the conversation data

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

Finally add the CSV files into the crate where farms_to_freeways/ is the RO-Crate directory for the data downloaded from Omeka.

```
node add-csv-to-crate.js -c farms_to_freeways/  -d csvfiles 
```

