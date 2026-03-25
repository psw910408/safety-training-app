import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export async function POST(req: Request) {
  try {
    const {
      site, jobType, name, gender, birthDate, trainingDate,
      photoBase64, workerSigBase64, managerSigBase64
    } = await req.json();

    // 템플릿 파일 경로 (Next.js serverless 환경에서 접근을 위해 public 에디렉토리 사용)
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'recruit_training_template.docx');
    
    if (!fs.existsSync(templatePath)) {
      console.error('Template not found at:', templatePath);
      return NextResponse.json({ error: 'Template file not found' }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);

    // Load ImageModule dynamically to avoid issues with some environments
    const ImageModule = require('docxtemplater-image-module-free');
    
    const opts = {
      centered: false,
      getImage: (tagValue: string, tagName: string) => {
        // tagValue is base64 string
        const base64Regex = /^data:image\/(png|jpg|jpeg|svg|svg\+xml);base64,/;
        if (!base64Regex.test(tagValue)) {
          return Buffer.from(tagValue, 'binary');
        }
        const stringBase64 = tagValue.replace(base64Regex, "");
        return Buffer.from(stringBase64, 'base64');
      },
      getSize: (img: any, tagValue: string, tagName: string) => {
        // Return fixed sizes depending on the tag
        if (tagName === '사진') return [150, 200];      // 150x200 픽셀 (증명사진 비율)
        if (tagName === '근로자서명') return [100, 50]; // 100x50 픽셀
        if (tagName === '담당자서명') return [100, 50]; // 100x50 픽셀
        return [150, 150];
      }
    };

    const imageModule = new ImageModule(opts);

    // 사용자가 워드에 {%사진%} 등 괄호를 1개만 친 경우를 대비하여 2개로 강제 변환 ({{%사진%}})
    const xmlFile = zip.file("word/document.xml");
    if (xmlFile) {
      let xml = xmlFile.asText();
      xml = xml.replace(/\{%([^}]+)%\}/g, '{{%$1%}}');
      zip.file("word/document.xml", xml);
    }

    const doc = new Docxtemplater(zip, {
      modules: [imageModule],
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' }
    });

    // 템플릿에 들어갈 데이터 (괄호 태그명과 100% 일치해야 함)
    // { {{이름}}, {{직군}}, {{현장명}}, {%사진%}, {%근로자서명%} ... }
    const templateData = {
      현장명: site || '',
      직군: jobType || '',
      이름: name || '',
      생년월일: birthDate || '',
      교육일자: trainingDate || '',
      
      // 인원수 통계 자동 배정
      대상계: 1,
      대상남: gender === '남' ? 1 : 0,
      대상여: gender === '여' ? 1 : 0,
      
      참석계: 1,
      참석남: gender === '남' ? 1 : 0,
      참석여: gender === '여' ? 1 : 0,
      
      불참계: 0,
      불참남: 0,
      불참여: 0,

      // 이미지 베이스64 데이터
      사진: photoBase64,
      근로자서명: workerSigBase64,
      담당자서명: managerSigBase64,
    };

    doc.render(templateData);

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // Vercel 등에 배포할 때는 Cloud Storage를 써야 하지만, 
    // 여기서는 화면에서 즉시 다운로드 되도록 파일 스트림 응답
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=recruit_training.docx`,
      },
    });
  } catch (error) {
    console.error('Error generating docx:', error);
    return NextResponse.json({ error: 'Generation failed', details: String(error) }, { status: 500 });
  }
}
