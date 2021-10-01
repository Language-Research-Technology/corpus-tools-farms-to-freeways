
const fs = require("fs");
const path = require("path");

var csv = `"time","speaker","text", "notes`;

var lineNum = 0;
var started = false;
async function main(){
    for (let f of fs.readdirSync("./svgfiles")) {
        if (f.match("\.svg")) {
            const text = fs.readFileSync(path.join("svgfiles", f)).toString();
            var lastSpeaker

            for (let line of text.split("\n")) {
                //console.log(line)
                var speaker
                var timecode

                if (line.match(`font-weight="700"`)) {
                    speaker = "A"
                } else if (lineNum)  {
                    speaker = "B"
                }
                line = line.replace(/<.*?>/g, "");
                line = line.replace(/\s*/, "");
                line = line.replace(/^\d+$/);
                line = line.replace(/&apos;/, "'");
                line = line.replace(/&apos;/, "'");
                line = line.replace(/"/, `""`);


                

                if (!line) {speaker = lastSpeaker}
                if (line.match(/^\d*\.\d*\s+$/)) {
                    timecode = line.replace(/\s+/, "");
                    started = true;
                    line = "";
                    csv += `"\n"${timecode}","${speaker}","`
                } else if (!(speaker === lastSpeaker)) {
                    if (started) {
                        csv += `"\n"","${speaker}","${line}`;
                    } else {
                        csv += `"\n"","","", "${line}`;
                    }

                } else if (line) {
                    csv += line
                }
                lastSpeaker = speaker;         

        }
        csv += `"`;
    }
    console.log(csv)
   fs.writeFileSync(path.join("csvfiles", f.replace(".svg",".csv")), csv)
}

}


main();