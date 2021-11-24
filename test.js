const fs = require('fs')
const pdf2md = require('@opendocsg/pdf2md')

const pdfBuffer = fs.readFileSync("test.pdf")

pdf2md(pdfBuffer, callbacks)
  .then(text => {
    let outputFile = 'test.md'
    console.log(`Writing to ${ outputFile }...`)
    fs.writeFileSync(path.resolve(outputFile), text)
    console.log('Done.')
  })
  .catch(err => {
    console.error(err)
  })
