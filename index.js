const fs = require('fs');
const Mustache = require('mustache');
const htmlPdf = require('html-pdf');

class pdfGenerate {

  constructor(data, mustacheFile) {
    this.data = data;
    this.mustacheFile = mustacheFile;
  }

  _mustacheDefault() {
    return "No mustache file found!";
  }

  _generateHTML() {
    return new Promise((resolve, reject) => {

      if (!this.mustacheFile) 
        resolve(this._mustacheDefault())

      fs.readFile(this.mustacheFile, 'utf8', 
        (err, html) => err ? 
          reject(err) :
          resolve(html))
    })
  }

  async _concatMustache() {
    const html = await this._generateHTML();
    return Mustache.render(html, this.data);
  }

  async _createFile() {
    const html = await this._concatMustache();
    return htmlPdf.create(html);
  }

  async toFile(name) {
    const pdf = await this._createFile();

    pdf.toFile(`${name || 'file'}.pdf`, (err, { filename }) => 
        console.log(err || filename));
  }

  async toBuffer() {
    const pdf = await this._createFile();

    return new Promise((resolve, reject) => {
      pdf.toBuffer((err, buffer) => err ? 
        reject(err) :
        resolve({
          buffer,
          size: Buffer.byteLength(buffer)
        })
      );
    })
  }
}

module.exports = pdfGenerate;