const ROCrate = require("ro-crate").ROCrate;
const {program} = require('commander');
program.version('0.0.1');
const fs = require("fs");
const _ = require("lodash");
const inputFile = "./input/ro-crate-metadata.json"
const outputFile = "./output/ro-crate-metadata.json"
const csvdir = "./csvfiles"


async function main(){

    program.option('-c, --crate-path <type>', 'Path to RO-crate ')
    .option('-d, --csv-dir <type>', 'Path to directory of CSV files')
    program.parse(process.argv);
    const opts = program.opts();
    inputfile - 
    const input = new ROCrate(JSON.parse(fs.readFileSync(inputFile)));
    input.index();
    const root = input.getRootDataset();
    root["@type"] = input.utils.asArray(root["@type"]);
    root["@type"].push("Corpus");

 
    // Add profile stuff

    // TODO - get these from a repository so they are, you know, correct!
   

    // Add provenance info



    // Index by title
    const names = {};
    for (let item of input.getGraph()) {
        if (item.name) {
            names[item.name] = item["@id"];
        }
    }



    // Make a new collection of items based on audiofiles
    interviews = {
        "@id": '#interviews',
        "name": "Interviews",
        "@type": "SubCorpus",
        "description": "Interview items include audio and transripts",
       
        "hasMember": []
    }
    for (let item of _.clone(input.getGraph())) {
        if (item["@type"].includes("Interview Transcript") ) {
            console.log(item.name[0])

            intervieweeID = names[item.interviewee[0]];
            if (!intervieweeID) {
                console.log("Cant find", item.interviewee)
            }
            
            const newItem = {
                "@id": `#interview-${item["@id"]}`,
                "@type": "CorpusItem",
                "name": item.name[0].replace(/.*interview/,"Interview"),
                "interviewee": {"@id": intervieweeID},
    
                "hasPart": [{"@id": item["@id"]},{"@id": item.transcriptOf["@id"]}]
            }
            input.addItem(newItem)
            interviews.hasMember.push({"@id": newItem["@id"]});
            console.log(newItem);


        }
    }
    const newParts = [];
    for (let item of root.hasPart) {
        const part = input.getItem(item["@id"]);
        //console.log(part)
        if (!part.name[0].match(/Interview/) ){
            newParts.push(item);
        }
    }
    root.hasMember = [{"@id": interviews["@id"]}];
    root.hasPart = newParts;
    input.addItem(interviews)
    console.log(root.hasPart);
 
    fs.writeFileSync(outputFile, JSON.stringify(input.getJson(), null, 2))

    // Make a new structure


}

main();