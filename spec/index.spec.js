const pdfGenerate = require('../index')
const fs = require('fs')
const htmlPdf = require('html-pdf');

let isError = false;

jest.mock('fs')
fs.readFile = (path, encode, callback) => {
  const html = isError ? null : "<html><body>{{name}}</body></html>"
  callback(isError, html);
}

jest.mock('html-pdf');
const toFile = jest.fn((filename, mockCallback) => {
  mockCallback(isError, { filename })
})

htmlPdf.create = () => ({
  toBuffer: (callback) => { 
    callback(false, Buffer.alloc(1)) 
  },
  toFile,
})

const dataMock = {
  config: { border: "fake" }, 
  data: { name: "fake mock" }, 
  mustacheFile: "fake.mustache" 
}

describe('pdfGenerate test', () => {
  
  it('should pdf tobe instance of class pdfGenerate', () => {
    const pdf = new pdfGenerate({})

    expect(pdf instanceof pdfGenerate).toBeTruthy()
  })

  it('should return data with undefined when called empty', () => {
    const empty = {config: undefined, data: undefined, mustacheFile: undefined}

    const pdf = new pdfGenerate({})

    expect(pdf).toEqual(empty)
  })

  it('should return data with info when called with info', () => {
    const pdf = new pdfGenerate(dataMock)

    expect(pdf).toEqual(dataMock)
  })

  it('should return message mustache default when called _mustacheDefault', () => {
    const pdf = new pdfGenerate({})

    expect(pdf._mustacheDefault()).toBe("No mustache file found!")
  })

  describe('When called _generateHTML', () => {

    it('should return default msg mustache when not send data', async () => {
      const pdf = new pdfGenerate({});

      const html = await pdf._generateHTML();

      expect(html).toBe("No mustache file found!");
    })

    it('should return html when send data', async () => {
      isError = false;
      const readFileMock = jest.spyOn(fs, 'readFile')
      const pdf = new pdfGenerate(dataMock)
      const html = await pdf._generateHTML()

      expect(readFileMock).toHaveBeenCalledWith("fake.mustache", "utf8", expect.any(Function))
      expect(html).toBe("<html><body>{{name}}</body></html>")
    })

    it('should return error when function return error', async () => {
      isError = true;
      const pdf = new pdfGenerate(dataMock);

      pdf._generateHTML()
      .catch(err => {

        expect(err).toBeTruthy();

      });
      isError = false;
    })
  })

  describe('When called _concatMustache', () => {
    it('shoud return mustache not found when not set data', async () => {
      const pdf = new pdfGenerate({});

      const data = await pdf._concatMustache();

      expect(data).toBe("No mustache file found!");
    })

    it('should return html with mustache when set data', async () => {
      const pdf = new pdfGenerate(dataMock);

      const data = await pdf._concatMustache();

      expect(data).toBe("<html><body>fake mock</body></html>");
    })
  })

  describe('When called _createFile', () => {
    it('should return html copiled when called method and set data', async () => {
      const pdf = new pdfGenerate(dataMock);
      const mockFunction = jest.spyOn(htmlPdf, 'create');

      await pdf._createFile();

      expect(mockFunction)
      .toHaveBeenCalledWith(
        "<html><body>fake mock</body></html>", 
        { border: "fake"}
      );
    })

    it('should return html default when called method and not set data', async () => {
      const pdf = new pdfGenerate({});
      const mockFunction = jest.spyOn(htmlPdf, 'create');
  
      await pdf._createFile();

      expect(mockFunction)
        .toHaveBeenCalledWith(
          "No mustache file found!", undefined
        );
    })

  })

  describe('When called toBuffer', () => {
    it('should return buffer file when called method', async () => {
      const pdf = new pdfGenerate(dataMock);
      const { buffer } = await pdf.toBuffer();
      const mockBuffer = Buffer.alloc(1);

      expect(buffer).toMatchObject(mockBuffer)
    })
  })

  describe('When called toFile', () => {
    it('should return pdf fake when called method toFile', async () => {
      const pdf = new pdfGenerate(dataMock);
      const mock_createFile = jest.spyOn(pdf, '_createFile');
      const mockLog = jest.spyOn(console, 'log');

      await pdf.toFile('fake');

      expect(mockLog).toHaveBeenCalledWith('fake.pdf');
      expect(mock_createFile).toHaveBeenCalled();
      expect(toFile).toHaveBeenCalledWith("fake.pdf", expect.any(Function));
    })

    it('should return pdf fake with name default when called method toFile less name', async () => {
      const pdf = new pdfGenerate(dataMock);
  
      await pdf.toFile()
  
      expect(toFile).toHaveBeenCalledWith("file.pdf", expect.any(Function));
    })
  })
})