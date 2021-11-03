const {ROCrate, Provenance} = require('language-data-node-tools');
const {program} = require('commander');
program.version('0.0.1');
const fs = require("fs-extra");
const _ = require("lodash");
const oniOcfl = require("oni-ocfl");
const tmp = require('tmp');
const path = require('path');


const prov = new Provenance();


const schemaStuff = [
 

    // PUT IN TRANSCRIPT ETC ETC
    
    {   
      "@id": "schema:startTime",
      "@type": "rdf:Property",
      "rdfs:comment": "The startTime of something. For a reserved event or service (e.g. FoodEstablishmentReservation), the time that it is expected to start. For actions that span a period of time, when the action was performed. e.g. John wrote a book from *January* to December. For media, including audio and video, it's the time offset of the start of a clip within a larger file.\\n\\nNote that Event uses startDate/endDate instead of startTime/endTime, even when describing dates with times. This situation may be clarified in future revisions.",
      "rdfs:label": "startTime",
      "schema:domainIncludes": [
        {
          "@id": "schema:InteractionCounter"
        },
        {
          "@id": "schema:Action"
        },
        {
          "@id": "schema:Schedule"
        },
        {
          "@id": "schema:FoodEstablishmentReservation"
        },
        {
          "@id": "schema:MediaObject"
        }
      ],
      "schema:rangeIncludes": [
        {
          "@id": "schema:Time"
        },
        {
          "@id": "schema:DateTime"
        }
      ],
      "schema:source": {
        "@id": "https://github.com/schemaorg/schemaorg/issues/2493"
      }
    },
    {
      "@id": "schema:endTime",
      "@type": "rdf:Property",
      "rdfs:comment": "The endTime of something. For a reserved event or service (e.g. FoodEstablishmentReservation), the time that it is expected to end. For actions that span a period of time, when the action was performed. e.g. John wrote a book from January to *December*. For media, including audio and video, it's the time offset of the end of a clip within a larger file.\\n\\nNote that Event uses startDate/endDate instead of startTime/endTime, even when describing dates with times. This situation may be clarified in future revisions.",
      "rdfs:label": "endTime",
      "schema:domainIncludes": [
        {
          "@id": "schema:Action"
        },
        {
          "@id": "schema:InteractionCounter"
        },
        {
          "@id": "schema:FoodEstablishmentReservation"
        },
        {
          "@id": "schema:Schedule"
        },
        {
          "@id": "schema:MediaObject"
        }
      ],
      "schema:rangeIncludes": [
        {
          "@id": "schema:DateTime"
        },
        {
          "@id": "schema:Time"
        }
      ],
      "schema:source": {
        "@id": "https://github.com/schemaorg/schemaorg/issues/2493"
      }
    },
    {
      "@id": "http://www.language-archives.org/REC/role.html#speaker",
      "@type": "rdf:Property",
      "description": "Speakers are those whose voices predominate in a recorded or filmed resource. (This resource may be a transcription of that recording.)",
      "example": "Participants in a recorded conversation, elicitation session, or informal narration would be termed Speakers. Audience members who do not participate beyond the occasional backchannel would be termed Responders.",
      "name": "Speaker",
      "rdfs:comment": "The participant was a principal speaker in a resource that consists of a recording, a film, or a transcription of a recorded resource.",
      "rdfs:label": "speaker",
      "rdfs:subPropertyOf": {
        "@id": "schema:contributor"
      }
    },
    
    {
      "@id": "http://www.language-archives.org/REC/type-20020628.html#transcription/orthographic",
      "@type": "rdfs:Class",
      "description": "An orthographic transcription uses a standard or conventional orthography.",
      "name": "Orthographic transcription",
      "rdfs:SubclassOf": {
        "@id": "http://www.language-archives.org/REC/type-20020628.html#transcription"
      },
      "rdfs:comment": "Orthographic transcriptions differ from phonemic transcriptions that use a practical orthography in that they include orthographic conventions for punctuation, capitalization, etc.",
      "rdfs:label": "OrthographicTranscription"
    },
    
      {
        "@id": "#speaker",
        "@type": "csvw:Column",
        "csvw:datatype": "string",
        "description": "Which of the participants is talking in that particular utterance. ",
        "name": "Role"
      },
      {
        "@id": "#start_time",
        "@type": "csvw:Column",
        "csvw:datatype": "",
        "description": "Start time of the utterance.",
        "name": "start_time",
        "sameAs": {"@id": "https://schema.org/startTime"}
      },
      {
        "@id": "#stop_time",
        "@type": "csvw:Column",
        "csvw:datatype": "",
        "description": "End time of the utterance.",
        "name": "stop_time",
        "sameAs": {"@id": "https://schema.org/endTime"}
      },
      {
        "@id": "#count",
        "@type": "csvw:Column",
        "csvw:datatype": "",
        "description": "Utternance number",
        "name": "",
      },
      {
        "@id": "#OrthographicTranscription",
        "@type": "csvw:Column",
        "csvw:datatype": "csvw:Column",
        "description": "Utternance number",
        "name": "OrthographicTranscription",
        "sameAs": {"@id": "http://www.language-archives.org/REC/type-20020628.html#transcription/orthographic"}
      }
      
    ]
    
    
    // "","Transcript","start_time","end_time","speaker","IU"
    
    const schemaTemplate = {
        "@id": "",
        "@type": "csvw:Schema",
        "columns": [
          {
            "@id": "#start_time"
          },
          {
            "@id": "#stop_time"
          },
          {
            "@id": "#speaker"
          },
         
          {
            "@id": "#Transcript"
          },
          {
            "@id": "#count"
          }
        ],
        "name": "Schema for ..."
      }
  

  async function addCSV(opts, crate, corpusCrateDir) {
        const csvDir = opts.dataDir;
        const root = crate.getRootDataset();
        for (let extra of schemaStuff) {
            crate.addItem(extra);
          }
    
        const schema = JSON.parse(JSON.stringify(schemaTemplate));
        schema["@id"] = `#$table_schema`;
    
        schema["name"] = `Table schema for ${root.name} `;
        var existingSchema = crate.getItem(schema["@id"]);
        if (existingSchema) {
            for (let prop of Object.keys(schema)) {
                existingSchema[prop] = schema[prop];
            }
    
        } else {
            crate.addItem(schema);
    
        }
        for (let item of crate.getGraph()) {
            if (crate.utils.asArray(item["@type"]).includes("TextDialogue")) {
                    for (let f of item.hasFile) {
                        filePath = f["@id"];
                        if (filePath.match(/\.pdf/)) {
                            csvPath = filePath.replace(/\.pdf$/, ".csv")
                            var newFile = crate.getItem(csvPath);
                            if (!newFile) {
                                newFile = {
                                    "@id": csvPath,
                                    "name": `${item.name} full text transcription`,
                                    "@type": ["File", "OrthographicTranscription"]
                                }
                                crate.addItem(newFile);
                                item.hasFile.push({"@id": newFile["@id"]});
                            }
    
                            csv = path.join(csvDir, path.basename(csvPath));
                            console.log(`Copying ${csv} to crate ${path.join(corpusCrateDir, csvPath)} `);

                            try {
                                const newFile = path.join(corpusCrateDir, csvPath);
                                fs.ensureFileSync(newFile);
                                await fs.copyFile(csv, newFile);
                                console.log(`Copied ${csv} to crate ${path.join(corpusCrateDir, csvPath)} `);
                            } catch(err) {
                                console.log(err);
                            }
    
                           
                            newFile["csvw:tableSchema"] = {"@id": schema["@id"]};
    
                          
                            
                            
                            
                            break;
                        }
                    }
                    
                
            }
        }
    
    }

  async function connectRepo(repoPath) {
      const repo = await oniOcfl.connectRepo(repoPath);
      return repo;
    
    }

async function main(){

  program.option('-r, --repo-path <type>', 'Path to OCFL repository')
  .option('-n, --repo-name <type>', 'Name of OCFL repository')
  .option('-s, --namespace <ns>', 'namespace for ARCP IDs')
  .option('-c, --corpus-name <ns>', 'Name of this corpus/collection (if not in template)')
  .option('-t, --template <dirs>', 'RO-Crate directory on which to base this the RO-Crate metadata file will be used as a base and any files copied in to the new collection crate')
  .option('-d --data-dir <dirs>', "Directory of data files")
  .option('-p --temp-path <dirs>', 'Temporary Directory Path')
    program.parse(process.argv);
    const opts = program.opts();
    const repoPath = opts.repoPath;
    const repoName = opts.repoName;
    const dataDir = opts.dataDir;
    const namespace = opts.namespace; 
    const corpusName = opts.corpusName; // Not used here
    const templateDir = opts.template; 
    const tempDirPath = opts.tempPath || 'temp';


    const repo = await connectRepo(repoPath);



    if (!fs.existsSync(tempDirPath)) {
      fs.mkdirSync(tempDirPath);
    }
    console.log(`Writing temp output in: ${tempDirPath} it may not be gracefully deleted`);
    const tmpobj = tmp.dirSync({tmpdir: tempDirPath});
    const corpusCrateDir = tmpobj.name;

    
 
    const inputFile = path.join(templateDir, "ro-crate-metadata.json");
    const corpusCrate = new ROCrate(JSON.parse(fs.readFileSync(inputFile)));
    corpusCrate.index();
    const root = corpusCrate.getRootDataset();
    root["@type"] = corpusCrate.utils.asArray(root["@type"]);
    root["@type"].push("RepositoryCollection");

 
    // Add profile stuff

    // TODO - get these from a repository so they are, you know, correct!
   

    // Add provenance info



    // Index by title
    const names = {};
    for (let item of corpusCrate.getGraph()) {
        if (item.name) {
            names[item.name] = item["@id"];
        }
    }



    // Make a new collection of items based on audiofiles
    interviews = {
        "@id": '#interviews',
        "name": "Interviews",
        "@type": "SubCorpus",
        "description": "Interview items include audio and transcripts", 
        "hasMember": []
    }
    for (let item of _.clone(corpusCrate.getGraph())) {
        if (item["@type"].includes("Interview Transcript") ) {
            console.log(item.name[0])
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
              "@id": `#interview-${item["@id"]}`,
              "@type": ["RepositoryObject", "TextDialogue"],
              "name": item.name[0].replace(/.*interview/,"Interview"),
              "speaker": {"@id": intervieweeID},
              "hasFile": [{"@id": audioFile["@id"]}],
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
              file["@type"] = ["File", "OrthographicTranscription"]
            }
            newItem.hasFile.push({"@id": f["@id"]});

          }
            corpusCrate.addItem(newItem)
            interviews.hasMember.push({"@id": newItem["@id"]});
            

        }
    }
    const newParts = [];
    for (let item of root.hasPart) {
        const part = corpusCrate.getItem(item["@id"]);
        //console.log(part)
        if (!part.name[0].match(/Interview/) ){
            newParts.push(item);
        }
    }

    root.hasMember = newParts;
    const filesDir = {"@type": "Dataset", "@id": "files", "name": "Files", "description": "Files downloaded from Omeka", "hasPart": []};
    root.hasPart =  [{"@id": filesDir["@id"]}];
    const newGraph = [];
    corpusCrate.addItem(filesDir)
    corpusCrate.addItem(interviews)
    for (let item of corpusCrate.getGraph()) {
      if (item["@type"] === "File") {
        filesDir.hasPart.push({"@id": item["@id"]})
      }
      if (corpusCrate.utils.asArray(item["@type"]).includes("Person") ) {
        delete item.primaryTopicOf;
      } 
      if ( corpusCrate.utils.asArray(item["@type"]).includes("Interview Transcript") ||
                 corpusCrate.utils.asArray(item["@type"]).includes("Sound") ) {
                   console.log("deleting", item)
        } else {
          newGraph.push(item);
        }
        
    
      
    }

    // EW!!!! NO! TODO:
    corpusCrate.json_ld["@graph"]= newGraph;
    corpusCrate.index();


    root.hasMember.push({"@id": interviews["@id"]});
    root.hasPart = [{"@id": filesDir["@id"]}];
    // Clean up crate - remove unwanted Repo Objects

    // Copy files across
    for (let item of corpusCrate.getGraph()) {
      if (corpusCrate.utils.asArray(item["@type"]).includes("File")) {

        filePath = path.join(templateDir, item["@id"]);
        const newFile = path.join(corpusCrateDir, item["@id"]);

        console.log(`Copying ${filePath} to crate ${newFile} `);

        try {
            fs.ensureFileSync(newFile);
            await fs.copyFile(filePath, newFile);
            console.log(`Copied ${filePath} to crate ${newFile} `);
        } catch(err) {
            console.log(err);
        }

      }
    }

    await addCSV(opts, corpusCrate, corpusCrateDir);


    const  corpusID = corpusCrate.arcpId(namespace, "root", "description");
    root.identifier = corpusID;
    corpusCrate.addIdentifier({name: repoName, identifier: root.identifier});
    corpusCrate.addProvenance(prov);
    corpusCrate.addLgProfile("Collection");
    const outputFile = path.join(corpusCrateDir, "ro-crate-metadata.json");
    fs.writeFileSync(outputFile, JSON.stringify(corpusCrate.getJson(), null, 2));
    await oniOcfl.checkin(repo, repoName, corpusCrateDir, corpusCrate, "md5", "ro-crate-metadata.json");

    // Make a new structure


}

main();