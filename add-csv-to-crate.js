/* 

Add CSV files made with soffice (OpenOffice / LibreOffice binary) svg2cvs.js into an existing crate

This is a one-off script that should not need to be run more than once but leaving it here for future reference

*/

const path = require('path');
const fs = require('fs-extra');
const {program} = require('commander');
const { ROCrate} = require('ro-crate');

program.version('0.0.1');


async function main() {
    
    program.option('-c, --crate-path <type>', 'Path to RO-crate ')
    .option('-d, --csv-dir <type>', 'Path to directory of CSV files')
    program.parse(process.argv);
    const opts = program.opts();

    const cratePath = opts.cratePath;
    const csvDir = opts.csvDir;
    const metadataPath = path.join(cratePath,"ro-crate-metadata.json" )
    const crate = new ROCrate(JSON.parse(await fs.readFile(metadataPath)));
    crate.index();
    for (let item of crate.getGraph()) {
        if (item["@type"] === "CorpusItem") {
            for (let part of item.hasPart) {
                partItem = crate.getItem(part["@id"])
                partItem.hasFile = crate.utils.asArray(partItem.hasFile);
                for (f of partItem.hasFile) {
                    filePath = f["@id"];
                    if (filePath.match(/\.pdf/)) {
                        csvPath = filePath.replace(/\.pdf$/, ".csv")
                        const newFile = {
                            "@id": csvPath,
                            "name": `${item.name} full text transcription`,
                            "@type": "File"
                        }
                        csv = path.join(csvDir, path.basename(csvPath));
                        try {
                            await fs.copyFile(csv, path.join(cratePath, csvPath));
                            console.log(`Copied ${csvPath} into crate`);
                        } catch(err) {
                            console.log(err);
                        }
                        if (!crate.getItem(newFile["@id"])) {
                            console.log("Added file to crate");
                            crate.addItem(newFile);
                            partItem.hasFile.push(newFile)
                        }
                        
                        break;
                    }
                }
                
            }
        }
    }
    await fs.writeFile(metadataPath, JSON.stringify(crate.getJson(), null, 2));

}

main();