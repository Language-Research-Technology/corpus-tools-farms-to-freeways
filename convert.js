const ROCrate = require("ro-crate").ROCrate;
const {program} = require('commander');
program.version('0.0.1');
const fs = require("fs");
const _ = require("lodash");
const inputFile = "./input/ro-crate-metadata.json"
const outputFile = "./output/ro-crate-metadata.json"



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
    
    

async function main(){

    program.option('-c, --crate-path <type>', 'Path to RO-crate ')
    .option('-d, --csv-dir <type>', 'Path to directory of CSV files')
    program.parse(process.argv);
    const opts = program.opts();
    
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
        "description": "Interview items include audio and transcripts", 
        "hasMember": []
    }
    for (let item of _.clone(input.getGraph())) {
        if (item["@type"].includes("Interview Transcript") ) {
            console.log(item.name[0])
            intervieweeID = names[item.interviewee[0]];
            if (!intervieweeID) {
                console.log("Cant find", item.interviewee)
            }
            
            const audio = input.getItem(item.transcriptOf["@id"]);
            console.log(audio.hasFile[0]["@id"])

            const audioFile = input.getItem(audio.hasFile[0]["@id"]);
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
            const file = input.getItem(f["@id"]);
            if (f["@id"].endsWith(".pdf") || f["@id"].endsWith(".csv")) {
              file["@type"] = ["File", "OrthographicTranscription"]
            }
            newItem.hasFile.push({"@id": f["@id"]});

          }
            input.addItem(newItem)
            interviews.hasMember.push({"@id": newItem["@id"]});
            

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

    root.hasMember = newParts;
    const filesDir = {"@type": "Dataset", "@id": "files", "name": "Files", "description": "Files downloaded from Omeka", "hasPart": []};
    root.hasPart =  [{"@id": filesDir["@id"]}];
    const newGraph = [];
    input.addItem(filesDir)
    input.addItem(interviews)
    for (let item of input.getGraph()) {
      if (item["@type"] === "File") {
        filesDir.hasPart.push({"@id": item["@id"]})
      }
      if (input.utils.asArray(item["@type"]).includes("Person") ) {
        delete item.primaryTopicOf;
      } 
      if ( input.utils.asArray(item["@type"]).includes("Interview Transcript") ||
                 input.utils.asArray(item["@type"]).includes("Sound") ) {
                   console.log("deleting", item)
        } else {
          newGraph.push(item);
        }
        
    
      
    }
    input.json_ld["@graph"]= newGraph;


    root.hasMember.push({"@id": interviews["@id"]});
    root.hasPart = [{"@id": filesDir["@id"]}];
    // Clean up crate - remove unwanted Repo Objects

    
 
    fs.writeFileSync(outputFile, JSON.stringify(input.getJson(), null, 2))

    // Make a new structure


}

main();