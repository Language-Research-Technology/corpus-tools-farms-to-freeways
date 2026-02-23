

svg:
	@echo "Converting PDF files to SVG format..."
	find omeka-ro-crate-tools/f2f-out/ -name "*transcript*.pdf" -exec bash -c '/Applications/LibreOffice.app/Contents/MacOS/soffice --headless --convert-to svg --outdir "$$(dirname "$$1")" "$$1"' _ {} \;
	@echo "Conversion complete. SVG files created in the same directory as the original PDFs."

csv: 
	@echo "Converting SVG files to CSV format..."
	find omeka-ro-crate-tools/f2f-out/ -name "*.svg" -exec node svg2csv.js {} \;
	find omeka-ro-crate-tools/f2f-out/ -name "*.svg" -delete
	@echo "Conversion complete. CSV files created and original SVG files deleted."

omeka-ro-crate-tools:
	@echo "Cloning the omeka-ro-crate-tools repository and running the get-f2f target..."
	git clone git@github.com:Language-Research-Technology/omeka-ro-crate-tools.git
	cd omeka-ro-crate-tools && uv sync && make get-f2f
	@echo "Done. Metadata located in omeka-ro-crate-tools/f2f-out/ro-crate-metadata.json"

zip:
	@echo "Creating archive with default exclusions..."
	zip -r archive.zip . \
		-x "node_modules/*" ".git/*" "*.swp" ".DS_Store" "Thumbs.db" ".env" ".venv/*" ".gitattributes" ".gitignore" "omeka-ro-crate-tools/.venv/*" "omeka-ro-crate-tools/.git/*" "oni/*" "csvs/*" \
		$(EXCLUDE)
	@echo "Archive created: archive.zip"
