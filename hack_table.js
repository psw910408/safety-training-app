const fs = require('fs');
const PizZip = require('pizzip');

try {
  const content = fs.readFileSync('..\\CHM-ST-산안-006-근로자 채용시 교육.docx');
  const zip = new PizZip(content);

  let xmlFile = zip.file("word/document.xml");
  if (xmlFile) {
    let xml = xmlFile.asText();

    // 1. 순번 하드코딩된 '1' 을 '{{순번}}' 으로 변경해야 하는데, 
    // 이건 조금 어려우니 유저에게 그냥 맡기거나 정규식으로 <w:t>1</w:t> 잡아서 바꾼다.
    // 더 쉬운 건 내가 유저 파일을 덮어쓰기 하는 대신 유저에게 알려주기!
    
    console.log("Analyzing file for table rows...");
    const rows = xml.split('<w:tr ');
    let tableRoot = false;
    let keepRows = [];
    for(let r of rows) {
      // Very naive, just keeping the rows that are header or contain 이름
      if (!tableRoot) keepRows.push(r);
    }
  }
} catch(e) {
  console.log(e);
}
