const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

try {
  const content = fs.readFileSync(path.join('..', 'CHM-ST-산안-006-근로자 채용시 교육.docx'));
  const zip = new PizZip(content);

  const opts = {
    centered: false,
    getImage: () => Buffer.from(''),
    getSize: () => [100, 100]
  };

  const imageModule = new ImageModule(opts);

  let xmlFile = zip.file("word/document.xml");
  if (xmlFile) {
    let xml = xmlFile.asText();
    xml = xml.replace(/\{%([^}]+)%\}/g, '{{%$1%}}');
    zip.file("word/document.xml", xml);
  }

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    nullGetter: () => ""
  });

  console.log("Template parsed successfully!");
} catch (error) {
  if (error.properties && error.properties.errors) {
    error.properties.errors.forEach(e => console.log('Docx Error:', e.properties));
  } else {
    console.log('General Error:', error);
  }
}
