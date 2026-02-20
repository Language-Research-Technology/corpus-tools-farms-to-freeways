

svg:
	find omeka-ro-crate-tools/f2f-out/ -name "*transcript*.pdf" -exec bash -c '/Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to svg --outdir "$$(dirname "$$1")" "$$1"' _ {} \;
    
csv: 
	find omeka-ro-crate-tools/f2f-out/ -name "*.svg" -exec node svg2csv.js {} \;
	find omeka-ro-crate-tools/f2f-out/ -name "*.svg" -delete

omeka-ro-crate-tools:
	git clone git@github.com:Language-Research-Technology/omeka-ro-crate-tools.git
	cd omeka-ro-crate-tools && uv sync && make get-f2f


