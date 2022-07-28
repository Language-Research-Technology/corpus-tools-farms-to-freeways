const {Collector, generateArcpId} = require("oni-ocfl");
const {languageProfileURI, Languages, Vocab} = require("language-data-node-tools");
const _ = require("lodash");
const path = require('path');
const {DEFAULT_ECDH_CURVE} = require("tls");
const {fstat} = require("fs");
const fs = require("fs");
const { dir } = require("console");
const { file } = require("tmp");


async function main() {
  // BRing in the OLAC-derviced terms
  const vocab = new Vocab;

  await vocab.load();
  const languages = new Languages();
  await languages.fetch();
  const engLang = languages.getLanguage("English");

  const collector = new Collector(); // Get all the paths etc from commandline
  await collector.connect();
  // Make a base corpusRepo using template
  console.log("Making from template", collector.templateCrateDir)
  const corpusRepo = collector.newObject(collector.templateCrateDir);
  corpusRepo.mintArcpId("corpus", "root");
  const corpusCrate = corpusRepo.crate;
  corpusCrate.addContext(vocab.getContext());
  corpusCrate.rootId = generateArcpId(collector.namespace, "corpus", "root");
  const schemaFileName = 'csv_schema.json';
  const schemaFile = {
    '@id': schemaFileName,
    '@type': ['File'], // TODO: what is this other type
    'name': 'Frictionless Data Schema for CSV transcript files',
    'encodingFormat': 'application/json',
    'conformsTo': {"@id": "https://specs.frictionlessdata.io/table-schema/"}
  }
  corpusCrate.addValues(corpusCrate.rootDataset, 'hasPart', schemaFile);
  const schemaEntity = {
    "@id": generateArcpId(collector.namespace, "schema", "csv"), //"arcp://name,ausnc.ary/csv_schema", // REPOSITORY-UNIQUE NAME
    "@type": "CreativeWork",
    "Name": "Frictionless Table Schema for CSV transcription files in the Sydney Speaks corpus",
    "sameAs": schemaFileName, //Reference to the schema file above TODO: is this the best link?
    "conformsTo": {
      "@id": "https://specs.frictionlessdata.io/table-schema/"
    }
  }
  corpusCrate.addItem(schemaEntity);

  await corpusRepo.addFile(schemaEntity, "template", null, true);


  corpusCrate.addProfile(languageProfileURI("Collection"));
  // Headers are "time","speaker","text","notes"


  corpusCrate.rootDataset.name = 'Farms to Freeways Example Dataset';
  corpusCrate.rootDataset["@type"] = ["Dataset", "RepositoryCollection"];

  const root = corpusRepo.rootDataset;
  root.hasMember = [];

  const names = {};
  for (let item of corpusCrate.getFlatGraph()) {
    if (item["@type"].includes("Person")) {
      names[corpusCrate.utils.asArray(item.name.trim())[0]] = item;
    }
  }
  for (let item of corpusCrate.getFlatGraph()) {
    if (item["@type"].includes("RepositoryCollection")) {
      // Rename collections and give them nicer IDs

      if (item['@id'] !== corpusCrate.rootId) {
        delete item.license;
        const lowerNameId = item.name.toLowerCase().replace(/\W/g, "");
        corpusCrate.changeGraphId(
          item,
          generateArcpId(collector.namespace, "collection", lowerNameId)
        );
        //corpusCrate.pushValue(root, "hasMember", item);

      }
      
    } else if (item["@type"].includes("RepositoryObject")) {
      //item["@type"] = "RepositoryObject";
      // Rename Objects
      if (item['@id'] !== corpusCrate.rootId) {
        const lowerNameId = item.name.toLowerCase().replace(/\W/g, "");
        corpusCrate.changeGraphId(
          item,
          generateArcpId(collector.namespace, "collection", lowerNameId)
        );
      }
      item.hasPart = item.hasFile;
      delete item.hasFile;   
      delete item.license;
   
    } else if (item["@type"].includes("File")) {
      // Rename Objects
     
    
      delete item.fileOf; 
      delete item.license;
 
    }

  }
  
  // Make a new collection of items based on audiofiles
  /*
  const interviews = {
    "@id": generateArcpId(collector.namespace, "collection", "interviews"),
    "name": "Interviews",
    "@type": ["RepositoryCollection"],
    "description": "Interview items include audio and transcripts",
    "hasMember": []
  }
  corpusCrate.addItem(interviews);
  */

  for (let item of corpusCrate.getFlatGraph()) {
    if (item["@type"].includes("Interview Transcript")) {
      console.log(corpusCrate.utils.asArray(item.interviewee), names["Heather Corr"])

      const intervieweeID = names[corpusCrate.utils.asArray(item.interviewee)]['@id'];


      if (!intervieweeID) {
        console.log("Cant find", item.interviewee)
      }
      //console.log(item);
      const audio = corpusCrate.getItem(item.transcriptOf["@id"]);
      //console.log(audio.hasPart[0]["@id"])
      const audioFile = corpusCrate.getItem(_.first(audio.hasPart)["@id"]);
      // Copy stuff to audioFile
      corpusCrate.pushValue(audioFile, "@type", "PrimaryText");
      audioFile.name = `${item.name} recording (mp3)`;
      audioFile.originalTapeStock = audio.originalTapeStock;
      audioFile.originalFormat = audio.originalFormat;
      audioFile.cassetteLabelNotes = audio.cassetteLabelNotes;
      if(audio.ingestNotes) {
        audioFile.ingestNotes = audio.ingestNotes;
      }
      audioFile.duration = audio.duration;
      audioFile.bitrate = audio["bitRate/Frequency"];
      audioFile.encodingFormat = "audio/mpeg";
      const interviewerName = item.interviewer;
      const interviewerID = generateArcpId(collector.namespace, "interviewer", interviewerName.replace(/\s/g, ""));
      if (!corpusCrate.getItem(interviewerID)){
        corpusCrate.addItem({
          "@id": interviewerID,
          "name": interviewerName,
          "@type": "Person",
          "gender": "F"
      });
    }
    const intervieweeName = corpusCrate.getItem(intervieweeID).name[0]
    console.log("NAME ::::::::" , intervieweeName)
      let newRepoObject = {
        "@id": generateArcpId(collector.namespace, "interview-item", intervieweeName.replace(/\s/, "").toLowerCase()),
        "@type": ["RepositoryObject"],
        "name": [item.name.replace(/.*interview/, "Interview")],
        "speaker": {"@id": intervieweeID},
        "hasPart": [{"@id": audioFile["@id"]}],
        conformsTo: {"@id": languageProfileURI("Object")},
        dateCreated: item.dateCreated,
        interviewer: {"@id": interviewerID},
        publisher: item.publisher,
        contentLocation: item.contentLocation,
        description: item.description,
        language: {"@id": engLang["@id"]},
        encodingFormat: "audio/mpeg"
      }

      audioFile.name = `Recording of ${newRepoObject.name} (mp3)`
      corpusCrate.pushValue(audioFile, "language", engLang);
      corpusCrate.addItem(newRepoObject);
      corpusCrate.pushValue(corpusCrate.rootDataset, "hasMember", newRepoObject);
      console.log(corpusCrate.rootDataset.hasMember);
      corpusCrate.pushValue(newRepoObject, "linguisticGenre", vocab.getVocabItem("Interview"));
      console.log(vocab.getVocabItem("Speech"));
      corpusCrate.pushValue(audioFile, "modality", vocab.getVocabItem("Speech"));

      //await addCSV(collector, corpusRepo, corpusCrate, newItem);

      for (let f of item.hasPart) {
        const file = corpusCrate.getItem(f["@id"]);
        delete file.license;
        const filePath = f["@id"]

        if (filePath.endsWith(".pdf")) {
          file["@type"] = ["File", "Annotation"];

          corpusCrate.pushValue(file, "annotationType", vocab.getVocabItem("Transcription"));
          corpusCrate.pushValue(file, "annotationType", vocab.getVocabItem("TimeAligned"));
          corpusCrate.pushValue(file, "modality", vocab.getVocabItem("Orthography"));
          corpusCrate.pushValue(file, "language", engLang);

          //newItem.hasPart.push(file); 
          // File is PDF at this point
          file.name = `${item.name} full text transcription (PDF)`
          corpusCrate.pushValue(newRepoObject, "hasPart", file);
          corpusCrate.pushValue(audioFile, "hasAnnotation", file);
          corpusCrate.pushValue(file, "annotationOf", audioFile);
          corpusCrate.pushValue(file, "encodingFormat", "application/pdf");

          var csvPath = filePath.replace(/\.pdf$/, ".csv");
          var csvFile = corpusRepo.crate.getItem(csvPath);
          if (!csvFile) {
            csvFile = {
              "@id": csvPath,
              "@type": ["File"]
            }
            corpusRepo.crate.addItem(csvFile);
            corpusCrate.pushValue(csvFile, "name", `${item.name} full text transcription (CSV)`);
            corpusCrate.pushValue(csvFile, "encodingFormat", "text/csv");
            corpusCrate.pushValue(csvFile, "@type", "Annotation");
            corpusCrate.pushValue(csvFile, "annotationType", vocab.getVocabItem("Transcription"));
            corpusCrate.pushValue(csvFile, "annotationType", vocab.getVocabItem("TimeAligned"));
            corpusCrate.pushValue(csvFile, "modality", vocab.getVocabItem("Orthography"));
            corpusCrate.pushValue(audioFile, "hasAnnotation", csvFile);
            corpusCrate.pushValue(csvFile, "annotationOf", audioFile);
            corpusCrate.pushValue(csvFile, "language", engLang);
            corpusCrate.pushValue(csvFile, "conformsTo", {"@id": schemaFileName});


            corpusCrate.pushValue(newRepoObject, "hasPart", csvFile);
            corpusCrate.pushValue(newRepoObject, "indexableText", csvFile);

          }
          if (!collector.debug) {
            const csvActualPath = path.join(corpusRepo.collector.dataDir, path.basename(csvPath));
            let csvContents = fs.readFileSync(csvActualPath).toString();
            csvContents = csvContents.replace(/,"speaker",/,`,"speaker","speakerID",`);
            csvContents = csvContents.replace(/,"B",/g, `,"B","${intervieweeID}",`);
            csvContents = csvContents.replace(/,"A",/g, `,"A","${interviewerID}",`);
            fs.writeFileSync(path.join(corpusRepo.collector.tempDirPath, path.basename(csvPath)), csvContents);
            await corpusRepo.addFile(csvFile, corpusRepo.collector.tempDirPath, path.basename(csvPath));
          }
        }
      }
    }
    if (item["@type"].includes("RepositoryObject")) {
      item.type = "RepositoryObject";
    }
  }
  if (root.hasPart) {
    const newParts = [];
    for (let part of root.hasPart) {
      console.log(`root Part : ${part['@id']}`);
      if (part["@type"].includes["File"]) {
        newParts.push(part)
      }
   
    }
    root.hasPart = [];
    for (let part of newParts) {
      corpusCrate.pushValue(root, "hasPart", part);
    }

  }
  //root.hasPart = [];

  const filesDir = {
    "@type": "Dataset",
    "@id": "files",
    "name": "Files",
    "description": "Files downloaded from Omeka",
    "hasPart": []
  };
  //TODO: reinstate this when we have new RO-Crate Library!!
  //corpusCrate.pushValue(root, "hasPart", filesDir)

  //corpusCrate.addItem(filesDir)
  for (let item of corpusCrate.getFlatGraph()) {
    
    if (item["@type"].includes("File")) {
      if (!collector.debug && !item["@id"].endsWith(".csv")) {
        console.log(`Adding hasPart to 'Files' ${item['@id']}`);
        //corpusCrate.pushValue(filesDir, "hasPart", item);
        await corpusRepo.addFile(item, collector.templateCrateDir, null, true);
      }
    }
    if (corpusCrate.utils.asArray(item["@type"]).includes("Person")) {
      delete item.primaryTopicOf;
    }
    if (corpusCrate.utils.asArray(item["@type"]).includes("Interview Transcript") ||
      corpusCrate.utils.asArray(item["@type"]).includes("Sound")) {
      //console.log("deleting", item);
      // Deleting doesnt work which is why this is building a whole new graph
    }
  }

  //corpusCrate.pushValue(root, "hasMember", interviews);
  // Clean up crate - remove unwanted Repo Objects

  if (!collector.debug) {
    console.log('Adding corpus to repository');
    await corpusRepo.addToRepo();
  }

  const flatJson = corpusCrate.getJson();
  fs.writeFileSync("ro-crate_for_debug.json", JSON.stringify(flatJson, null, 2));
}

//Very efficient! no regex
function getExtension(filename) {
  const ext = filename.split('.').pop();
  if (ext === filename) return "";
  return ext;
}

main();
