import { NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import ExcelJS from 'exceljs';
import path from 'path';

const redis = new Redis(process.env.REDIS_URL || '');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const site = searchParams.get('site');
    const part = searchParams.get('part');
    const dateParam = searchParams.get('date'); // YYYY-MM-DD or YYYY-MM
    const exactId = searchParams.get('id'); // 단건 다운로드용 ID
    
    if (!site) {
      return new NextResponse('site 파라미터가 필요합니다.', { status: 400 });
    }

    // 1. DB에서 데이터 불러오기
    const rawRecords = await redis.lrange('material_records', 0, -1);
    let records = rawRecords.map(r => JSON.parse(r));
    
    // 과거(단일 아이템) 호환성 보정을 위해 items가 없는 경우 강제로 items 배열 스키마로 래핑
    records = records.map(r => {
      if (!r.items) {
        return {
          id: r.id,
          site: r.site,
          part: r.part,
          receiveDate: r.receiveDate,
          items: [{
            id: r.id + '_sub',
            materialName: r.materialName,
            specification: r.specification,
            quantity: r.quantity,
            supplier: r.supplier,
            photoBase64: r.photoBase64
          }]
        };
      }
      return r;
    });

    // 필터링 적용
    if (exactId) {
       records = records.filter(r => r.id === exactId);
    } else if (part && dateParam) {
       records = records.filter(r => 
         r.site === site && 
         r.part === part && 
         r.receiveDate && r.receiveDate.startsWith(dateParam)
       );
    } else {
       return new NextResponse('단건 id 이거나 part, date 파라미터가 필요합니다.', { status: 400 });
    }
    
    // 시간 순으로 오래된 것부터
    records.reverse();

    if (records.length === 0) {
      return new NextResponse('해당 조건의 자재검수 기록이 없습니다.', { status: 404 });
    }

    // Export 대상을 배열로 추출 (하나의 파일 내에 모든 서브 items 전개)
    // 단건 모드일 경우 exactId에 해당하는 배치의 items 전체 나열
    let exportItems: any[] = [];
    records.forEach(batch => {
      batch.items.forEach((item: any) => {
         exportItems.push({
           receiveDate: batch.receiveDate,
           part: batch.part,
           ...item
         });
      });
    });

    // 2. 엑셀 템플릿 로드
    const templatePath = path.join(process.cwd(), 'public/templates/CHM-JT-자재-002-자재검수.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    const templateSheet = workbook.worksheets[0];
    
    // 3. 6개 단위로 쪼개기
    const chunkSize = 6;
    const chunks = [];
    for (let i = 0; i < exportItems.length; i += chunkSize) {
      chunks.push(exportItems.slice(i, i + chunkSize));
    }

    // 4. 각 청크마다 새로운 시트로 만들기
    chunks.forEach((chunk, chunkIndex) => {
      const sheetName = `${chunkIndex + 1}페이지`;
      const ws = chunkIndex === 0 ? templateSheet : workbook.addWorksheet(sheetName);
      if (chunkIndex > 0) ws.name = sheetName; 

      // 전체 페이지에 공통 값 세팅
      ws.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          let val = '';
          if (cell.value) {
            if (typeof cell.value === 'string') val = cell.value;
            else if (typeof cell.value === 'object' && (cell.value as any).richText) {
              val = (cell.value as any).richText.map((rt: any) => rt.text).join('');
            } else {
              try { val = cell.value.toString(); } catch(e) {}
            }
          }
          if (!val) return;

          // 공통 변수 치환
          if (val.includes(`{{입고일자}}`) || val.includes(`{{작업내용}}`) || val.includes(`{{직군}}`) || val.includes(`{{페이지}}`)) {
            let replaced = val;
            replaced = replaced.replace(/{{입고일자}}/g, records[0].receiveDate);
            replaced = replaced.replace(/{{작업내용}}/g, ''); // 사용자가 직접 쓰도록 공란 처리
            replaced = replaced.replace(/{{직군}}/g, (records[0].part === 'facility' ? '시설' : '미화'));
            replaced = replaced.replace(/{{페이지}}/g, `${chunkIndex + 1}/${chunks.length}`);
            cell.value = replaced;
            val = replaced; 
          }

          // Note 등 데이터 치환: 순번, 입고물품, 개수
          // 원본 템플릿의 {{순번}}, {{입고 물품}} 등이 여러 항목(1~6)에 매핑되므로, 각 사진 인덱스와 동일하게 매칭
          // 하지만 엑셀에서 셀 값이 동일(예: "{{순번}} {{입고물품}}...")하게 설정되어 있다면,
          // 열 위치(col)를 보고 어떤 항목인지 판단해야 합니다.
          // 사진1(col:1~14), 사진2(col:16~29), 사진3, 사진4 등...
          // 여기서는 단순히 chunk 내의 특정 항목을 매핑하는 단순화 로직을 쓰거나, 텍스트 교체 시 1번부터 차례대로 지우는 방법을 사용합니다.

          let itemIndex = -1;
          const colNum = Number(cell.col);
          const rowNum = Number(cell.row);

          if (colNum >= 1 && colNum <= 14) {
             if (rowNum < 35) itemIndex = 0; // 아이템 1
             else if (rowNum < 45) itemIndex = 2; // 아이템 3
             else itemIndex = 4; // 아이템 5
          } else if (colNum >= 16) {
             if (rowNum < 35) itemIndex = 1; // 아이템 2
             else if (rowNum < 45) itemIndex = 3; // 아이템 4
             else itemIndex = 5; // 아이템 6
          }

          if (itemIndex >= 0 && itemIndex < chunk.length) {
             const rec = chunk[itemIndex];
             if (val.includes(`{{순번}}`)) {
                let replaced = val;
                replaced = replaced.replace(/{{순번}}/g, String(itemIndex + 1));
                replaced = replaced.replace(/{{입고 물품}}/g, rec.materialName);
                replaced = replaced.replace(/{{개수}}/g, rec.quantity + '개');
                cell.value = replaced;
             }
          } else if (itemIndex >= 0 && itemIndex >= chunk.length) {
             // 아이템이 없는 빈 자리라면 텍스트 삭제
             if (val.includes(`{{순번}}`)) cell.value = '';
          }

          // 사진 데이터 삽입
          chunk.forEach((record, idx) => {
            const itemNum = idx + 1; 
            if (val.includes(`{%사진${itemNum}%}`)) {
               cell.value = ''; 
               if (record.photoBase64) {
                 try {
                   const base64Data = record.photoBase64.replace(/^data:image\/\w+;base64,/, "");
                   const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
                   ws.addImage(imageId, {
                     tl: { col: Number(cell.col) - 1, row: Number(cell.row) - 1 },
                     ext: { width: 140, height: 140 }
                   });
                 } catch(e) {
                   console.log('Image add err', e);
                 }
               }
            }
          });
          
          // 사용하지 않는 사진 태그 제거
          for(let k = chunk.length + 1; k <= 6; k++) {
             if (val.includes(`{%사진${k}%}`)) cell.value = '';
          }
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    
    // 파일명 인코딩
    const baseName = exactId ? `${records[0].receiveDate}_${records[0].materialName}` : `${dateParam}_${part}`;
    const fileName = encodeURIComponent(`${baseName}_자재검수.xlsx`);

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
