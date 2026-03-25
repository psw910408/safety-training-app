const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const templatePath = path.join(__dirname, 'public', 'templates', 'recruit_training_template.docx');
const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);
const xmlFile = zip.file("word/document.xml");

if (xmlFile) {
  let xml = xmlFile.asText();

  // 1. 순차적으로 태그 변경을 위한 카운터
  let gc = 1, nc = 1, sc = 1;

  // {{직군}} 또는 {{</w:t></w:r>...<w:t>직군}} 등을 변경
  // XML 복잡성 때문에 단순 글자 치환 사용: 정규식으로 찾아서 숫자를 붙임
  xml = xml.replace(/(직군|소속)/g, (match) => {
    if (gc <= 50) return `직군${gc++}`;
    return match;
  });

  // {{#이름}} 또는 {{이름}} 찾아서 {{이름1}} 이런식으로 교체
  xml = xml.replace(/(#이름|이름)(?!서명)/g, (match, p1) => {
    if (nc <= 50) return `이름${nc++}`;
    return match;
  });

  // {%근로자서명%} -> {%본인서명1%} 교체
  // 주의: % 기호는 이미 있거나 나중에 처리할 수 있으므로, 텍스트(근로자서명)만 추출해서 본인서명1로 변경
  xml = xml.replace(/(근로자서명|본인서명)/g, (match) => {
    if (sc <= 50) return `본인서명${sc++}`;
    return match;
  });

  zip.file("word/document.xml", xml);
  const outContent = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(templatePath, outContent);
  console.log(`Successfully indexed tags! (직군: ${gc-1}, 이름: ${nc-1}, 서명: ${sc-1})`);
}
