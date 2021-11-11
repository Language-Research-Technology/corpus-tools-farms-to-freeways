const fs = require("fs");
const path = require("path");


async function main() {
  for (let f of fs.readdirSync("./svgfiles")) {
    if (f.match("\.svg")) {
      var rows = [];
      var currentRow = { text: "", speaker: "", notes: "", timecode: "" };
      const text = fs.readFileSync(path.join("svgfiles", f)).toString();
      var started = false;
      var lastSpeaker
      for (let line of text.split("\n")) {
        //console.log(line)
        var speaker
        var timecode

        if (line.match(`font-weight="700"`)) {
          speaker = "A"
        } else {
          speaker = "B"
        }
        line = line.replace(/<.*?>/g, "");
        line = line.replace(/\s*/, "");
        line = line.replace(/^\d+$/);
        line = line.replace(/&apos;/, "'");
        line = line.replace(/&apos;/, "'");
        line = line.replace(/"/, `""`);


        if (!line) {
          speaker = lastSpeaker
        }

        if (line.match(/^\d+\.\d+\s+$/)) {
          timecode = line.replace(/\s+/, "");
          started = true;
          line = "";
          rows.push(currentRow);
          currentRow = { text: "", speaker: "", notes: "", timecode: "" };

          currentRow.timecode = timecode
          currentRow.speaker = speaker
          //csv += `"\n"${timecode}","${speaker}","`
        } else if (!(speaker === lastSpeaker)) {
          if (currentRow.text) {
            rows.push(currentRow);
            currentRow = { text: "", speaker: "", notes: "", timecode: "" };

          }
          if (started) {
            currentRow.speaker = speaker
            currentRow.text = line
            //csv += `"\n"","${speaker}","${line}`;
          } else {
            currentRow.notes = line
            //csv += `"\n"","","", "${line}`;
          }

        } else if (line) {
          if (started) {
            currentRow.text += line
          } else {
            currentRow.notes += line
          }

          //csv += line
        }
        lastSpeaker = speaker;

      }
      //csv += `"`;
      rows.push(currentRow)
    }
    var csv = `"time","speaker","text","notes"\n`;
    for (let row of rows) {
      if (row.timecode || row.speaker || row.notes || row.text) {
        csv += `"${ row.timecode }","${ row.speaker }","${ row.text }","${ row.notes }"\n`;
      }
    }
    fs.writeFileSync(path.join("csvfiles", f.replace(".svg", ".csv")), csv)
  }

}


main();
