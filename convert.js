const {Collector} = require("oni-ocfl");
const {languageProfileURI} = require("language-data-node-tools");
const _ = require("lodash");
const oniOcfl = require("oni-ocfl");
const tmp = require('tmp');
const path = require('path');



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
          await object.addFile(newFile, path.join(object.collector.dataDir, path.basename(csvPath)));

          break;
        }
      }
    }
  }
}


async function main() {

  const coll = new Collector(); // Get all the paths etc from commandline
  await coll.connect();
  // Make a base corpus using template
  console.log("Making from template", coll.templateCrateDir)
  const corpus = coll.newObject(coll.templateCrateDir);
  const corpusCrate = corpus.crate;
  corpusCrate.addProfile(languageProfileURI("Collection"));
  // Headers are "time","speaker","text","notes"
  corpus.addDialogueSchema({"columns": ["#speaker", "#transcript", "#start_time", "#notes"]});
  // Local name in csv colums is different from the built in one
  const t = corpusCrate.getItem("#transcript").name = "text";
  corpusCrate.getItem("#speaker").name = "speaker";
  corpusCrate.getItem("#start_time").name = "time";
  corpusCrate.getItem("#notes").name = "notes";



  const root = corpus.rootDataset;
  // Make a new collection of items based on audiofiles
  interviews = {
    "@id": '#interviews',
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
  for (let item of _.clone(corpusCrate.getGraph())) {
    if (item["@type"].includes("Interview Transcript")) {
      intervieweeID = names[item.interviewee[0]];
      if (!intervieweeID) {
        console.log("Cant find", item.interviewee)
      }

      const audio = corpusCrate.getItem(item.transcriptOf["@id"]);
      console.log(audio.hasFile[0]["@id"])

      const audioFile = corpusCrate.getItem(audio.hasFile[0]["@id"]);
      // Copy stuff to audioFile
      audioFile.originalTapeStock = audio.originalTapeStock;
      audioFile.originalFormat = audio.originalFormat;
      audioFile.cassetteLabelNotes = audio.cassetteLabelNotes;
      audioFile.ingestNotes = audio.ingestNotes;
      audioFile.duration = audio.duration;
      audioFile.bitrate = audio["bitRate/Frequency"];

      const newItem = {
        "@id": `#interview-${ item["@id"] }`,
        "@type": [ "RepositoryObject", "TextDialogue" ],
        "name": item.name[0].replace(/.*interview/, "Interview"),
        "speaker": { "@id": intervieweeID },
        "hasFile": [ { "@id": audioFile["@id"] } ],
        dateCreated: item.dateCreated,
        interviewer: item.interviewer,
        publisher: item.publisher,
        license: item.licence,
        contentLocation: item.contentLocation,
        description: item.description
      }
      for (let f of item.hasFile) {
        const file = corpusCrate.getItem(f["@id"]);
        if (f["@id"].endsWith(".pdf") || f["@id"].endsWith(".csv")) {
          file["@type"] = [ "File", "OrthographicTranscription" ]
        }
        newItem.hasFile.push({ "@id": f["@id"] });

      }
      corpusCrate.addItem(newItem)
      interviews.hasMember.push({ "@id": newItem["@id"] });
    }
  }
  const newParts = [];
  for (let item of root.hasPart) {
    const part = corpusCrate.getItem(item["@id"]);
    //console.log(part)
    if (!part.name[0].match(/Interview/)) {
      newParts.push(item);
    }
  }

  root.hasMember = newParts;
  const filesDir = {
    "@type": "Dataset",
    "@id": "files",
    "name": "Files",
    "description": "Files downloaded from Omeka",
    "hasPart": []
  };
  root.hasPart = [ { "@id": filesDir["@id"] } ];
  const newGraph = [];
  corpusCrate.addItem(filesDir)
  corpusCrate.addItem(interviews)
  for (let item of corpusCrate.getGraph()) {
    if (item["@type"] === "File") {
      filesDir.hasPart.push({ "@id": item["@id"] })
      corpus.addFile(item, path.join(coll.templateCrateDir, item["@id"]))
    }
    if (corpusCrate.utils.asArray(item["@type"]).includes("Person")) {
      delete item.primaryTopicOf;
    }
    if (corpusCrate.utils.asArray(item["@type"]).includes("Interview Transcript") ||
      corpusCrate.utils.asArray(item["@type"]).includes("Sound")) {
      //console.log("deleting", item);
      // Deleting doesnt work which is why this is building a whole new graph
    } else {
      newGraph.push(item);
    }
  }

  // EW!!!! NO! TODO:
  corpusCrate.json_ld["@graph"] = newGraph;
  corpusCrate.index();


  root.hasMember.push({ "@id": interviews["@id"] });
  root.hasPart = [ { "@id": filesDir["@id"] } ];
  // Clean up crate - remove unwanted Repo Objects

 

  await addCSV(corpus);

  corpus.mintArcpId("corpus","root")
 
  corpus.addToRepo();

}

//Very efficient! no regex
function getExtension(filename) {
  const ext = filename.split('.').pop();
  if (ext === filename) return "";
  return ext;
}

main();
