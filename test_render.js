const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

try {
  const content = fs.readFileSync(path.join('public', 'templates', 'recruit_training_template.docx'));
  const zip = new PizZip(content);

  const opts = {
    centered: false,
    getImage: (tagValue, tagName) => {
      console.log('Fetching image for:', tagName);
      if (!tagValue) return Buffer.from('');
      const base64Regex = /^data:image\/(png|jpg|jpeg|svg|svg\+xml);base64,/;
      const stringBase64 = tagValue.replace(base64Regex, "");
      return Buffer.from(stringBase64, 'base64');
    },
    getSize: (img, tagValue, tagName) => {
      return [100, 100];
    }
  };

  const imageModule = new ImageModule(opts);

  let xmlFile = zip.file("word/document.xml");
  if (xmlFile) {
    let xml = xmlFile.asText();
    
    // Fix image tags {%사진%} -> {{%사진%}}
    xml = xml.replace(/\{%([^}]+)%\}/g, '{{%$1%}}');
    
    // Auto-inject row loops for docxtemplater
    const rows = xml.split('<w:tr ');
    for (let i = 0; i < rows.length; i++) {
        // If the row doesn't have loop but has 이름
        if (rows[i].includes('이름') && !rows[i].includes('#근로자')) {
            let firstTcIndex = rows[i].indexOf('<w:tc>');
            if (firstTcIndex !== -1) {
                rows[i] = rows[i].slice(0, firstTcIndex + 6) + '<w:p><w:r><w:t>{{#근로자}}</w:t></w:r></w:p>' + rows[i].slice(firstTcIndex + 6);
            }
            let lastTcCloseIndex = rows[i].lastIndexOf('</w:tc>');
            if (lastTcCloseIndex !== -1) {
                rows[i] = rows[i].slice(0, lastTcCloseIndex) + '<w:p><w:r><w:t>{{/근로자}}</w:t></w:r></w:p>' + rows[i].slice(lastTcCloseIndex);
            }
        }
    }
    xml = rows.join('<w:tr ');

    zip.file("word/document.xml", xml);
  }

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    nullGetter: () => ""
  });

  const emptyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  doc.render({
    현장명: '로봇수정본',
    담당서명: emptyBase64,
    소장서명: emptyBase64,
    사진1: emptyBase64,
    근로자: [{ 
      이름: '홍길동', 
      직군: '미화', 
      본인서명: emptyBase64 
    },
    { 
      이름: '아무개', 
      직군: '보안', 
      본인서명: emptyBase64 
    }]
  });

  const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync('output_test.docx', buf);
  console.log("Render successful!");
} catch (error) {
  if (error.properties && error.properties.errors) {
    console.log(error.properties.errors);
  } else {
    console.log(error);
  }
}
