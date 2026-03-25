const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

try {
  const content = fs.readFileSync(path.join(__dirname, 'public', 'templates', 'recruit_training_template.docx'));
  const zip = new PizZip(content);

  const opts = {
    centered: false,
    getImage: (tagValue, tagName) => {
      return Buffer.from('');
    },
    getSize: () => [100, 100]
  };

  const imageModule = new ImageModule(opts);

  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' }
  });

  const templateData = {
    현장명: '테스트현장',
    직군: '미화',
    이름: '홍길동',
    생년월일: '1990-01-01',
    교육일자: '2026-03-25',
    대상계: 1, 대상남: 1, 대상여: 0,
    참석계: 1, 참석남: 1, 참석여: 0,
    불참계: 0, 불참남: 0, 불참여: 0,
    사진: Buffer.from('abc', 'base64'),
    근로자서명: Buffer.from('abc', 'base64'),
    담당자서명: Buffer.from('abc', 'base64'),
  };

  doc.render(templateData);
  console.log("Success!");
} catch (error) {
  if (error.properties && error.properties.errors) {
    error.properties.errors.forEach(function(e) {
      console.log(e.properties);
    });
  } else {
    console.log(error);
  }
}
