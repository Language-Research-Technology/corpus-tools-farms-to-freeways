
const fs = require("fs");
const path = require("path");

var csv = "time\tspeaker\ttext"

var lineNum = 0;
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


                

                if (!line) {speaker = lastSpeaker}
                if (line.match(/^\d*\.\d*\s+$/)) {
                    timecode = line;
                    line = "";
                    csv += `\n${timecode}\t${speaker}\t`
                } else if (!(speaker === lastSpeaker)) {
                    csv += `\n\t${speaker}\t${line}`

                } else if (line) {
                    csv += line
                }
                lastSpeaker = speaker;

            

        }
    }
   fs.writeFileSync(path.join("csvfiles", f.replace(".svg",".csv")), csv)
}

}


main();