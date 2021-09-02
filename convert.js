const ROCrate = require("ro-crate").ROCrate;
const fs = require("fs");
const _ = require("lodash");
const inputFile = "./input/ro-crate-metadata.json"
const outputFile = "./output/ro-crate-metadata.json"

async function main(){
    const input = new ROCrate(JSON.parse(fs.readFileSync(inputFile)));
    input.index();
    const root = input.getRootDataset();

    root.conformsTo = {
                "@id": "https://w3id.org/ro/profile/LanguageResearchTechnlogy/draft#Corpus"
            };
    // Add profile stuff

    // TODO - get these from a repository so they are, you know, correct!
    input.addItem(
        {
            "@id": "https://w3id.org/ro/profile/LanguageResearchTechnlogy/draft#Corpus",
            "@type": "CreativeWork",
            "description": "A corpus is the highest level unit of organization",
            "name": "Language Corpus",
            "version": "0.1"
          }
    );
    input.addItem(
        {
            "@id": "https://w3id.org/ro/profile/LanguageResearchTechnlogy/draft#Item",
            "@type": "CreativeWork",
            "description": "A language data item is a communicative event such as a conversation, a research session, a play, an article, a book",
            "name": "Language Data Item",
            "version": "0.1"
          }
    )

    input.addItem(
            {
                "@id": "https://w3id.org/ro/profile/LanguageResearchTechnlogy/draft#Collection",
                "@type": "CreativeWork",
                "description": "A language collection is a set of collections or items belong together for some reason",
                "name": "Language Data Collection",
                "version": "0.1"
              },
    )

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
        "@type": "RepositoryCollection",
        "description": "Interview items include audio and transripts",
        "conformsTo": {
            "@id": "https://w3id.org/ro/profile/LanguageResearchTechnlogy/draft#Collection"
          },
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
                "name": item.name[0].replace(/.*interview/,"Interview"),
                "interviewee": {"@id": intervieweeID},
                "conformsTo": {
                    "@id": "https://w3id.org/ro/profile/LanguageResearchTechnlogy/draft#Item"
                  },
                "hasPart": [{"@id": item["@id"]},{"@id": item.transcriptOf["@id"]}]
            }
            input.addItem(newItem)
            interviews.hasMember.push({"@id": newItem["@id"]});
            console.log(newItem);


        }
    }
    const newParts = [{"@id": interviews["@id"]}];
    for (let item of root.hasPart) {
        const part = input.getItem(item["@id"]);
        //console.log(part)
        if (!part.name[0].match(/Interview/) ){
            newParts.push(item);
        }
    }

    root.hasPart = newParts;
    input.addItem(interviews)
    console.log(root.hasPart);
 
    fs.writeFileSync(outputFile, JSON.stringify(input.getJson(), null, 2))

    // Make a new structure


}

main();