const {Collector} = require("oni-ocfl");
const {languageProfileURI, Languages} = require("language-data-node-tools");
const _ = require("lodash");
const path = require('path');
const { DEFAULT_ECDH_CURVE } = require("tls");
const { fstat } = require("fs");
const fs = require("fs");


async function addCSV(object) {
  
  for (let item of object.crate.getGraph()) {
    if (object.crate.utils.asArray(item["@type"]).includes("TextDialogue")) {
      for (let f of item.hasFile) {
        filePath = f["@id"];
        if (filePath.match(/\.pdf/)) {
          var csvPath = filePath.replace(/\.pdf$/, ".csv")
          var newFile = object.crate.getItem(csvPath);
          if (!newFile) {
            newFile = {
              "@id": csvPath,
              "name": `${ item.name } full text transcription`,
              "@type": [ "File", "OrthographicTranscription" ]
            }
            object.linkDialogueSchema(newFile);
            object.crate.addItem(newFile);
            item.hasFile.push({ "@id": newFile["@id"] });
          }
          await object.addFile(newFile, object.collector.dataDir, path.basename(csvPath));

          break;
        }
      }
    }
  }
}

async function main() {
  const languages = new Languages();
  await languages.fetch();
  const engLang = languages.getLanguage("English");

  const coll = new Collector(); // Get all the paths etc from commandline
  await coll.connect();
  // Make a base corpus using template
  console.log("Making from template", coll.templateCrateDir)
  const corpus = coll.newObject(coll.templateCrateDir);
  corpus.mintArcpId("root", "collection")
  const corpusCrate = corpus.crate;
  corpusCrate.toGraph();
  

  corpusCrate.addProfile(languageProfileURI("Collection"));
  // Headers are "time","speaker","text","notes"
  corpus.addDialogueSchema({"columns": ["#speaker", "#transcript", "#start_time", "#notes"]});
  // Local name in csv colums is different from the built in one
  const t = corpusCrate.getItem("#transcript").name = "text";
  corpusCrate.getItem("#speaker").name = "speaker";
  corpusCrate.getItem("#start_time").name = "time";
  corpusCrate.getItem("#notes").name = "notes";

  const root = corpus.rootDataset;
  root.hasMember = [];
  // Make a new collection of items based on audiofiles
  interviews = {
    "@id": corpusCrate.arcpId(coll.namespace, "collection", "interviews"),
    "name": "Interviews",
    "@type": "RepositoryCollection",
    "description": "Interview items include audio and transcripts",
    "hasMember": []
  }
  const names = {};
  for (let item of corpusCrate.getGraph()){
    if (item["@type"].includes("Person")) {
      names[item.name[0]] = item;
    }
  }

  var newItem;
  for (let item of corpusCrate.getGraph()) {
    if (item["@type"].includes("RepositoryCollection")) {

      corpusCrate.changeGraphId(item, corpusCrate.arcpId(coll.namespace, "collection", item.name[0].toLowerCase().replace(/\W/g,"")));

    } 
  }
  
  for (let item of corpusCrate.getGraph()) {
    if (item["@type"].includes("Interview Transcript")) {
      intervieweeID = names[item.interviewee[0]];
      if (!intervieweeID) {
        console.log("Cant find", item.interviewee)
      }
      console.log(item);
      const audio = corpusCrate.getItem(item.transcriptOf[0]["@id"]);
      //console.log(audio.hasFile[0]["@id"])

      const audioFile = corpusCrate.getItem(audio.hasFile[0]["@id"]);
      // Copy stuff to audioFile
      audioFile.originalTapeStock = audio.originalTapeStock;
      audioFile.originalFormat = audio.originalFormat;
      audioFile.cassetteLabelNotes = audio.cassetteLabelNotes;
      audioFile.ingestNotes = audio.ingestNotes;
      audioFile.duration = audio.duration;
      audioFile.bitrate = audio["bitRate/Frequency"];
      console.log(item)
      newItem = {
        "@id": corpusCrate.arcpId(coll.namespace, "interview-item", item["@id"]),
        "@type": [ "RepositoryObject", "TextDialogue" ],
        "name": [item.name[0].replace(/.*interview/, "Interview")],
        "speaker": { "@id": intervieweeID },
        "hasFile": [ { "@id": audioFile["@id"] } ],
        dateCreated: item.dateCreated[0],
        interviewer: item.interviewer[0],
        publisher: item.publisher[0],
        license: item.license[0],
        contentLocation: item.contentLocation[0],
        description: item.description[0],
        language: {"@id": engLang["@id"]} 
      }
      for (let f of item.hasFile) {
        const file = corpusCrate.getItem(f["@id"]);
        if (f["@id"].endsWith(".pdf") || f["@id"].endsWith(".csv")) {
          file["@type"] = [ "File", "OrthographicTranscription" ]
        }
        newItem.hasFile.push(file);

      }
      corpusCrate.pushValue(interviews, "hasMember", newItem);

    }
  }
  
  for (let item of root.hasPart) {
    const part = corpusCrate.getItem(item["@id"]);
    //console.log(part)
    if (!part.name[0].match(/Interview/)) {
      corpusCrate.pushValue(root, "hasMember", item);
    }
  }
  root.hasPart = [];

  const filesDir = {
    "@type": "Dataset",
    "@id": "files",
    "name": "Files",
    "description": "Files downloaded from Omeka",
    "hasPart": []
  };
  corpusCrate.pushValue(root, "hasPart", filesDir)

  //corpusCrate.addItem(filesDir)
  //corpusCrate.addItem(interviews)
  for (let item of corpusCrate.getGraph()) {
    if (item["@type"].includes("File")) {
      corpusCrate.pushValue(filesDir, "hasPart", item)
      corpus.addFile(item, coll.templateCrateDir, null, false)
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



  corpusCrate.pushValue(root, "hasMember", interviews);
  // Clean up crate - remove unwanted Repo Objects

 

  await addCSV(corpus);

  corpus.mintArcpId("corpus","root");

  fs.writeFileSync("test.json", JSON.stringify(corpusCrate.getJson(), null, 2));
  corpus.addToRepo();

}

//Very efficient! no regex
function getExtension(filename) {
  const ext = filename.split('.').pop();
  if (ext === filename) return "";
  return ext;
}

main();
