import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import ExcelJS from 'exceljs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const site = searchParams.get('site');
    const part = searchParams.get('part');
    const yearMonth = searchParams.get('month');
    
    if (!site || !part || !yearMonth) {
      return new NextResponse('site, part, month 파라미터가 필요합니다.', { status: 400 });
    }

    // 1. DB에서 데이터 불러오기
    let records: any[] = await kv.lrange('material_records', 0, -1);
    
    // 필터링 적용
    records = records.filter(r => 
      r.site === site && 
      r.part === part && 
      r.receiveDate && r.receiveDate.startsWith(yearMonth)
    );

    if (records.length === 0) {
      return new NextResponse('해당 조건의 자재검수 기록이 없습니다.', { status: 404 });
    }

    // 2. 엑셀 템플릿 로드
    const templatePath = path.join(process.cwd(), 'public/templates/CHM-JT-자재-002-자재검수.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    const templateSheet = workbook.worksheets[0];
    
    // 3. 6개 단위로 쪼개기
    const chunkSize = 6;
    const chunks = [];
    for (let i = 0; i < records.length; i += chunkSize) {
      chunks.push(records.slice(i, i + chunkSize));
    }

    // 4. 각 청크마다 새로운 시트로 만들기
    chunks.forEach((chunk, chunkIndex) => {
      // 첫 번째 청크는 기본 시트(templateSheet) 사용, 그 다음부터는 복제본 사용
      // (현재 exceljs는 시트 완전 복제 API가 없으므로 첫 시트를 그대로 사용하거나 약간의 제약이 있습니다.
      // 완벽한 다중 시트 복제를 위해 우선 첫 시트를 기반으로 데이터 삽입)
      
      const sheetName = `${chunkIndex + 1}페이지`;
      // exceljs 폰트/스타일 복사는 까다롭지만, 단순화를 위해 첫페이지에 1~6번째 항목을 넣습니다.
      // TODO: 추후 완벽한 다중 시트 복제 로직 보완
      const ws = chunkIndex === 0 ? templateSheet : workbook.addWorksheet(sheetName);
      ws.name = sheetName;

      chunk.forEach((record, idx) => {
        const itemNumber = idx + 1; // 1 ~ 6
        
        // 엑셀 내 특정 키워드를 찾아서 데이터를 치환하는 로직 구현
        ws.eachRow((row) => {
          row.eachCell((cell) => {
            let val = cell.text;
            if (!val) return;
            
            // 텍스트 교체 (예: {{순번}} {{입고 물품}} {{개수}})
            if (val.includes(`{{순번}}`) || val.includes(`{{입고 물품}}`)) {
               // 이 부분은 엑셀 템플릿의 정확한 배치에 따라 로직 고도화 필요
               // 현재는 데모/뼈대 로직으로 텍스트를 대체합니다.
               if (val.includes(`Note :`)) {
                 // Note 영역 텍스트 교체 (예시)
               }
            }

            // 사진 교체: {%사진1%} ~ {%사진6%}
            if (val.includes(`{%사진${itemNumber}%}`)) {
               cell.value = ''; // 텍스트 지우기
               if (record.photoBase64) {
                 const base64Data = record.photoBase64.replace(/^data:image\/\w+;base64,/, "");
                 const imageId = workbook.addImage({
                   base64: base64Data,
                   extension: 'png',
                 });
                 // 셀 크기에 맞춰 이미지 삽입
                 ws.addImage(imageId, {
                   tl: { col: cell.col - 1, row: cell.row - 1 },
                   ext: { width: 150, height: 150 } // 적절한 크기로 고정 또는 계산
                 });
               }
            }
          });
        });
      });
    });

    // 템플릿 처리 완료 후 버퍼로 변환
    const buffer = await workbook.xlsx.writeBuffer();
    
    // 파일명 인코딩
    const fileName = encodeURIComponent(`${yearMonth}_${site}_${part}_자재검수.xlsx`);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Excel Generation Error:', error);
    return new NextResponse('엑셀 생성 중 오류가 발생했습니다.', { status: 500 });
  }
}
