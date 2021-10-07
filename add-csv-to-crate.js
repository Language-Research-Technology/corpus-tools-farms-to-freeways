/* 

Add CSV files made with soffice (OpenOffice / LibreOffice binary) svg2cvs.js into an existing crate

This is a one-off script that should not need to be run more than once but leaving it here for future reference

*/

const path = require('path');
const fs = require('fs-extra');
const {program} = require('commander');
const { ROCrate} = require('ro-crate');

program.version('0.0.1');




const schemaStuff = [
     
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
        "name": "Speaker"
      },
      {
        "@id": "#time",
        "@type": "csvw:Column",
        "csvw:datatype": "",
        "description": "Start time of the utterance.",
        "name": "startTime",
        "sameAs": {"@id": "https://schema.org/startTime"}
      },
     
 
      {
        "@id": "#OrthographicTranscription",
        "@type": "csvw:Column",
        "csvw:datatype": "",
        "description": "Utternance number",
        "name": "Transcript",
        "sameAs": {"@id": "http://www.language-archives.org/REC/type-20020628.html#transcription/orthographic"}
    
      }
      
    ]
    
    
    // "","Transcript","start_time","end_time","speaker","IU"
    
    const schemaTemplate = {
        "@id": "",
        "@type": "csvw:Schema",
        "columns": [
          {
            "@id": "#time"
          },
          {
            "@id": "#speaker"
          },
         
          {
            "@id": "#OrthographicTranscription"
          } 
        ],
        "name": "Schema for ..."
      }
        



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
    for (let extra of schemaStuff) {
        crate.addItem(extra);
      }

    const schema = JSON.parse(JSON.stringify(schemaTemplate));
    schema["@id"] = `#$table_schema`;
    const root = crate.getRootDataset();

    schema["name"] = `Table schema for ${root.name} `;
    for (let item of crate.getGraph()) {
        if (item["@type"] === "CorpusItem") {
            for (let part of item.hasPart) {
                partItem = crate.getItem(part["@id"])
                partItem.hasFile = crate.utils.asArray(partItem.hasFile);
            

                for (let f of partItem.hasFile) {
                    filePath = f["@id"];
                    if (filePath.match(/\.pdf/)) {
                        csvPath = filePath.replace(/\.pdf$/, ".csv")
                        var newFile = crate.getItem(csvPath);
                        if (!newFile) {
                            newFile = {
                                "@id": csvPath,
                                "name": `${item.name} full text transcription`,
                            }
                            crate.addItem(newFile);
                            partItem.hasFile.push({"@id": newFile["@id"]});


                        }

                        csv = path.join(csvDir, path.basename(csvPath));
                        newFile["@type"] =  ["File", "OrthographicTranscription"]

                        try {
                            await fs.copyFile(csv, path.join(cratePath, csvPath));
                            console.log(`Copied ${csvPath} into crate`);
                        } catch(err) {
                            console.log(err);
                        }

                       
                        newFile["csvw:tableSchema"] = {"@id": schema["@id"]};

                        var existingSchema = crate.getItem(schema["@id"]);
                        if (existingSchema) {
                            for (let prop of Object.keys(schema)) {
                                existingSchema[prop] = schema[prop];
                            }
                            console.log("Updatin' schema", schema)

                        } else {
                            console.log("Addin' schema", schema)
                            crate.addItem(schema);

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