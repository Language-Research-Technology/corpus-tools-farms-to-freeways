const {Collector, generateArcpId} = require("oni-ocfl");
const {languageProfileURI, Languages, Vocab} = require("language-data-commons-vocabs");
const {DataPack} = require('@ldac/data-packs');
const _ = require("lodash");
const path = require('path');
const {DEFAULT_ECDH_CURVE} = require("tls");
const {fstat} = require("fs");
const fs = require("fs");
const {dir} = require("console");
const {file} = require("tmp");


async function main() {
  // BRing in the OLAC-derviced terms
  const vocab = new Vocab;

  await vocab.load();
  let datapack = new DataPack({dataPacks: ['Glottolog'], indexFields: ['name']});
  await datapack.load();
  let engLang = datapack.get({
    field: "name",
    value: "English",
  });

  const collector = new Collector(); // Get all the paths etc from commandline
  await collector.connect();
  // Make a base corpusRepo using template
  console.log("Making from template", collector.templateCrateDir)
  const corpusRepo = collector.newObject(collector.templateCrateDir);
  corpusRepo.mintArcpId();
  const corpusCrate = corpusRepo.crate;
  corpusCrate.addContext(vocab.getContext());
  corpusCrate.rootId = generateArcpId(collector.namespace);
  const schemaFileName = 'csv_schema.json';
  const schemaFile = {
    '@id': schemaFileName,
    '@type': ['File'], // TODO: what is this other type
    'name': 'Frictionless Data Schema for CSV transcript files',
    'encodingFormat': 'application/json'
  }
  corpusCrate.addValues(corpusCrate.rootDataset, 'hasPart', schemaFile);
  corpusCrate.addValues(schemaFile, 'conformsTo', {"@id": "https://specs.frictionlessdata.io/table-schema/"})
  const schemaEntity = {
    "@id": generateArcpId(collector.namespace, "schema/csv"), //"arcp://name,ausnc.ary/csv_schema", // REPOSITORY-UNIQUE NAME
    "@type": ["CreativeWork"],
    "Name": "Frictionless Table Schema for CSV transcription files in the Farms to Freeways corpus",
    "sameAs": schemaFileName, //Reference to the schema file above TODO: is this the best link?
  }
  corpusCrate.addItem(schemaEntity);
  corpusCrate.addValues(schemaEntity, 'conformsTo', {"@id": "https://specs.frictionlessdata.io/table-schema/"})
  corpusCrate.addValues(schemaEntity, 'conformsTo', {"@id": "https://purl.archive.org/textcommons/schemas/conversation"})

  await corpusRepo.addFile(schemaEntity, collector.templateCrateDir, null, true);

  corpusCrate.addProfile(languageProfileURI("Collection"));
  // Headers are "time","speaker","text","notes"

  corpusCrate.rootDataset.name = 'Farms to Freeways Example Dataset';
  corpusCrate.rootDataset["@type"] = ["Dataset", "RepositoryCollection"];

  const root = corpusRepo.rootDataset;
  root.hasMember = [];
  // Build a look-up table of names so we can use them later on to link things together
  const names = {};
  const jsonCrate = corpusCrate.toJSON();

  for (let item of corpusCrate.getGraph()) {
    const itemType = item["@type"];
    console.log(itemType);
    //TODO: Ask Alvin why some are undefined. Some nodes in the ro-crate seem to not have types.
    if (!itemType) {
      console.log(item);
      continue;
    }
    if (itemType.includes("Person")) {
      // Some of the names have trailing spaces
      names[item.name[0].trim()] = item;
    }
  }
  for (let item of corpusCrate.getFlatGraph()) {
    const itemType = item["@type"];
    console.log(itemType);
    if (!itemType) {
      console.log(item);
      continue;
    }
    if (itemType.includes("RepositoryCollection")) {
      // Rename collections and give them nicer IDs

      if (item['@id'] !== corpusCrate.rootId) {
        delete item.license;
        const lowerNameId = item.name.toLowerCase().replace(/\W/g, "");
        corpusCrate.changeGraphId(
          item,
          generateArcpId(collector.namespace, `collection/${lowerNameId}`)
        );
        //corpusCrate.pushValue(root, "hasMember", item);

      }

    } else if (itemType.includes("RepositoryObject")) {
      //item["@type"] = "RepositoryObject";
      // Rename Objects
      if (item['@id'] !== corpusCrate.rootId) {
        const lowerNameId = item.name.toLowerCase().replace(/\W/g, "");
        corpusCrate.changeGraphId(
          item,
          generateArcpId(collector.namespace, `collection/${lowerNameId}`)
        );
      }
      item.hasPart = item.hasFile;
      delete item.hasFile;
      delete item.license;

    } else if (itemType.includes("File")) {
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
    const itemType = item["@type"];
    console.log(itemType);
    if (!itemType) {
      console.log(item);
      continue;
    }
    if (itemType.includes("Interview Transcript")) {
      console.log(corpusCrate.utils.asArray(item.interviewee), names["Heather Corr"])
      const intervieweeID = names[corpusCrate.utils.asArray(item.interviewee)]['@id'];
      if (!intervieweeID) {
        console.log("Cant find", item.interviewee)
      }
      //console.log(item);
      item.hasPart = item.hasFile;

      const audio = corpusCrate.getItem(item.transcriptOf["@id"]);
      // It had hasPart before!!
      console.log("audio.hasPart ===");
      console.log(audio.hasPart)
      if (audio.hasFile) {
        const audioFile = corpusCrate.getItem(_.first(audio.hasFile)["@id"]);
        // Copy stuff to audioFile
        corpusCrate.pushValue(audioFile, "@type", "CreativeWork");
        corpusCrate.pushValue(audioFile, "materialType", vocab.getVocabItem("PrimaryMaterial"));
        
        audioFile.name = `${item.name} recording (mp3)`;
        audioFile.originalTapeStock = audio.originalTapeStock;
        audioFile.originalFormat = audio.originalFormat;
        audioFile.cassetteLabelNotes = audio.cassetteLabelNotes;
        if (audio.ingestNotes) {
          audioFile.ingestNotes = audio.ingestNotes;
        }
        audioFile.duration = audio.duration;
        audioFile.bitrate = audio["bitRate/Frequency"];
        audioFile.encodingFormat = "audio/mpeg";
        const interviewerName = item.interviewer;
        const interviewerID = generateArcpId(collector.namespace, `interviewer/${interviewerName.replace(/\s/g, "")}`);
        if (!corpusCrate.getItem(interviewerID)) {
          corpusCrate.addItem({
            "@id": interviewerID,
            "name": interviewerName,
            "@type": "Person",
            "gender": "F"
          });
        }
        const intervieweeName = corpusCrate.getItem(intervieweeID).name[0]
        console.log("NAME ::::::::", intervieweeName)
        let newRepoObject = {
          "@id": generateArcpId(collector.namespace, `interview-object/${intervieweeName.replace(/\s/, "").toLowerCase()}`),
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
          inLanguage: {"@id": engLang["@id"]},
          encodingFormat: "audio/mpeg"
        }

        audioFile.name = `Recording of ${newRepoObject.name} (mp3)`
        corpusCrate.pushValue(audioFile, "inLanguage", engLang);
        corpusCrate.addItem(newRepoObject);
        corpusCrate.pushValue(corpusCrate.rootDataset, "hasMember", newRepoObject);
        corpusCrate.pushValue(newRepoObject, "linguisticGenre", vocab.getVocabItem("Interview"));
        corpusCrate.pushValue(audioFile, "communicationMode", vocab.getVocabItem("SpokenLanguage"));

        //await addCSV(collector, corpusRepo, corpusCrate, newItem);

        for (let f of item.hasPart) {
          const file = corpusCrate.getItem(f["@id"]);
          delete file.license;
          const filePath = f["@id"]

          if (filePath.endsWith(".pdf")) {
            file["@type"] = ["File"];
            file["materialType"] = vocab.getVocabItem("Annotation");

            corpusCrate.pushValue(file, "annotationType", vocab.getVocabItem("Transcription"));
            corpusCrate.pushValue(file, "annotationType", vocab.getVocabItem("TimeAligned"));
            corpusCrate.pushValue(file, "communicationMode", vocab.getVocabItem("WrittenLanguage"));
            corpusCrate.pushValue(file, "inLanguage", engLang);

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
              corpusCrate.pushValue(csvFile, "@type", "File");
              corpusCrate.pushValue(csvFile, "materialType", vocab.getVocabItem("Annotation"))
              corpusCrate.pushValue(csvFile, "annotationType", vocab.getVocabItem("Transcription"));
              corpusCrate.pushValue(csvFile, "annotationType", vocab.getVocabItem("TimeAligned"));
              corpusCrate.pushValue(csvFile, "communicationMode", vocab.getVocabItem("SpokenLanguage"));
              corpusCrate.pushValue(audioFile, "hasAnnotation", csvFile);
              corpusCrate.pushValue(csvFile, "annotationOf", audioFile);
              corpusCrate.pushValue(csvFile, "inLanguage", engLang);
              corpusCrate.pushValue(csvFile, "conformsTo", {"@id": schemaFileName});

              corpusCrate.pushValue(newRepoObject, "hasPart", csvFile);
              corpusCrate.pushValue(newRepoObject, "indexableText", csvFile);

            }
            if (!collector.debug) {
              const csvActualPath = path.join(corpusRepo.collector.dataDir, path.basename(csvPath));
              let csvContents = fs.readFileSync(csvActualPath).toString();
              csvContents = csvContents.replace(/,"speaker",/, `,"speaker","speakerID",`);
              csvContents = csvContents.replace(/,"B",/g, `,"B","${intervieweeID}",`);
              csvContents = csvContents.replace(/,"A",/g, `,"A","${interviewerID}",`);
              fs.writeFileSync(path.join(corpusRepo.collector.tempDirPath, path.basename(csvPath)), csvContents);
              await corpusRepo.addFile(csvFile, corpusRepo.collector.tempDirPath, path.basename(csvPath));
            }
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
    const itemType = item["@type"];
    if (!itemType) {
      continue;
    }
    if (itemType.includes("File")) {
      if (!collector.debug && !item["@id"].endsWith(".csv")) {
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
      delete item;
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

main();
