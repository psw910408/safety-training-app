import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export async function POST(req: Request) {
  try {
    const {
      site, trainingDate, startTime, endTime,
      workers, photos, managerSigBase64, directorSigBase64
    } = await req.json();

    // 템플릿 파일 경로 (Next.js serverless 환경에서 접근을 위해 public 디렉토리 사용)
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'recruit_training_template.docx');
    
    if (!fs.existsSync(templatePath)) {
      console.error('Template not found at:', templatePath);
      return NextResponse.json({ error: 'Template file not found' }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);

    // Load ImageModule dynamically
    const ImageModule = require('docxtemplater-image-module-free');
    
    const opts = {
      centered: false,
      getImage: (tagValue: string, tagName: string) => {
        if (!tagValue) return Buffer.from('');
        const base64Regex = /^data:image\/(png|jpg|jpeg|svg|svg\+xml);base64,/;
        if (!base64Regex.test(tagValue)) {
          return Buffer.from(tagValue, 'binary');
        }
        const stringBase64 = tagValue.replace(base64Regex, "");
        return Buffer.from(stringBase64, 'base64');
      },
      getSize: (img: any, tagValue: string, tagName: string) => {
        if (tagName.includes('사진')) return [150, 200];
        if (tagName.includes('서명')) return [80, 40]; // 서명 크기 고정
        return [100, 100];
      }
    };

    const imageModule = new ImageModule(opts);

    // 사용자가 워드에 {%사진%} 처럼 닫는 %가 들어간 태그를 교정 ({{%사진}} 형태여야 함)
    const xmlFile = zip.file("word/document.xml");
    if (xmlFile) {
      let xml = xmlFile.asText();
      // {%태그%} -> {{%태그}} 로 변환하여 docxtemplater 모듈 충돌 해결
      xml = xml.replace(/\{%([^%{}]+)%\}/g, '{{%$1}}');
      
      // 자동 루프 추가: 표의 "이름" 칸을 감싸는 row에 {{#근로자}} 자동 주입
      const rows = xml.split('<w:tr ');
      for (let i = 0; i < rows.length; i++) {
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
      delimiters: { start: '{{', end: '}}' }, // 겹괄호를 인식하도록 변경
      nullGetter: (part: any) => { return ""; } // 값이 없어도 에러 대신 빈칸 표시
    });

    // 남/여 통계 계산
    const totalCount = workers.length;
    const maleCount = workers.filter((w: any) => w.gender === '남').length;
    const femaleCount = workers.filter((w: any) => w.gender === '여').length;

    // 근로자 배열 정리 (서명 이름 매칭)
    const 근로자 = workers.map((w: any) => ({
      순번: w.index,
      직군: w.jobType,
      직종: w.role || '',
      이름: w.name,
      성별: w.gender,
      본인서명: w.workerSigBase64 || ''
    }));

    // 사진 매칭 (최대 6장)
    const 사진1 = photos && photos[0] ? photos[0] : '';
    const 사진2 = photos && photos[1] ? photos[1] : '';
    const 사진3 = photos && photos[2] ? photos[2] : '';
    const 사진4 = photos && photos[3] ? photos[3] : '';
    const 사진5 = photos && photos[4] ? photos[4] : '';
    const 사진6 = photos && photos[5] ? photos[5] : '';

    // 템플릿 데이터 매핑
    const templateData: Record<string, any> = {
      현장명: site || '',
      교육일자: trainingDate || '',
      교육시간: `${startTime}~${endTime}`,
      
      대상계: totalCount,
      대상남: maleCount,
      대상여: femaleCount,
      참석계: totalCount,
      참석남: maleCount,
      참석여: femaleCount,
      불참계: 0,
      불참남: 0,
      불참여: 0,

      담당서명: managerSigBase64 || '',
      소장서명: directorSigBase64 || '',

      근로자, // 배열 데이터 (표 마법용)

      사진1, 사진2, 사진3, 사진4, 사진5, 사진6
    };

    doc.render(templateData);

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=recruit_training_batch.docx`,
      },
    });
  } catch (error: any) {
    let details = String(error);
    if (error.properties && error.properties.errors instanceof Array) {
      details += "\n" + error.properties.errors.map((e: any) => e.properties.explanation).join("\n");
    }
    console.error('Error generating docx:', details);
    return NextResponse.json({ error: 'Generation failed', details }, { status: 500 });
  }
}
