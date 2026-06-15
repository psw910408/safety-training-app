import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { formData, siteText, eqText } = data;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('전기식냉동기 성능점검', {
      views: [{ showGridLines: false }],
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true }
    });

    // Helper: apply border and center alignment
    const applyStyle = (cell: ExcelJS.Cell, bgColor?: string) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      if (bgColor) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    };

    // Row 1: Title
    sheet.mergeCells('A1:O1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = '냉동기 성능측정(전기식)';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Column Widths
    sheet.columns = [
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 }
    ];

    // Row 3: Info 1
    sheet.mergeCells('A3:B3'); sheet.getCell('A3').value = '사옥명'; applyStyle(sheet.getCell('A3'), 'E2EFDA');
    sheet.mergeCells('C3:D3'); sheet.getCell('C3').value = siteText; applyStyle(sheet.getCell('C3'));
    sheet.mergeCells('E3:F3'); sheet.getCell('E3').value = '일  시'; applyStyle(sheet.getCell('E3'), 'E2EFDA');
    sheet.mergeCells('G3:H3'); sheet.getCell('G3').value = formData.inspDate; applyStyle(sheet.getCell('G3'));
    sheet.mergeCells('I3:J3'); sheet.getCell('I3').value = '외기조건'; applyStyle(sheet.getCell('I3'), 'E2EFDA');
    sheet.mergeCells('K3:O3'); sheet.getCell('K3').value = `${formData.outTemp}℃ / ${formData.outHumid}%`; applyStyle(sheet.getCell('K3'));
    applyStyle(sheet.getCell('B3'), 'E2EFDA'); applyStyle(sheet.getCell('D3')); applyStyle(sheet.getCell('F3'), 'E2EFDA'); applyStyle(sheet.getCell('H3')); applyStyle(sheet.getCell('J3'), 'E2EFDA');

    // Row 4: Info 2
    sheet.mergeCells('A4:B4'); sheet.getCell('A4').value = '장비명'; applyStyle(sheet.getCell('A4'), 'E2EFDA');
    sheet.mergeCells('C4:D4'); sheet.getCell('C4').value = eqText; applyStyle(sheet.getCell('C4'));
    sheet.mergeCells('E4:F4'); sheet.getCell('E4').value = '형  식'; applyStyle(sheet.getCell('E4'), 'E2EFDA');
    sheet.mergeCells('G4:H4'); sheet.getCell('G4').value = formData.eqType; applyStyle(sheet.getCell('G4'));
    sheet.mergeCells('I4:J4'); sheet.getCell('I4').value = '용량 / 전력 / 전류'; applyStyle(sheet.getCell('I4'), 'E2EFDA');
    sheet.getCell('K4').value = formData.eqCapacity + ' RT'; applyStyle(sheet.getCell('K4'));
    sheet.getCell('L4').value = formData.eqPower + ' KW'; applyStyle(sheet.getCell('L4'));
    sheet.mergeCells('M4:O4'); sheet.getCell('M4').value = `${formData.eqVolt}V / ${formData.eqCurrent}A`; applyStyle(sheet.getCell('M4'));
    applyStyle(sheet.getCell('B4'), 'E2EFDA'); applyStyle(sheet.getCell('D4')); applyStyle(sheet.getCell('F4'), 'E2EFDA'); applyStyle(sheet.getCell('H4')); applyStyle(sheet.getCell('J4'), 'E2EFDA');

    // Row 6: 1. 효율 지표
    sheet.mergeCells('A6:O6'); sheet.getCell('A6').value = '1. 점검결과 (부하율 및 COP)'; sheet.getCell('A6').font = { bold: true };
    const resHeaders = ['구 분', '부하율(%)', 'COP(정격)', 'COP(측정)', '', '', '', '', '', '', '', '', '', '', ''];
    resHeaders.forEach((h, i) => { const c = sheet.getCell(7, i+1); c.value = h; applyStyle(c, 'D9E1F2'); });
    
    // calc measured RT
    const calcDiff = (v1: string, v2: string) => (parseFloat(v1) - parseFloat(v2)) || 0;
    const measuredRt = ((parseFloat(formData.chilledFlowMeasure) * 60 * Math.abs(calcDiff(formData.chilledTempInMeasure, formData.chilledTempOutMeasure))) / 3024).toFixed(1);
    const loadFactor = (!isNaN(parseFloat(measuredRt)) && !isNaN(parseFloat(formData.eqCapacity))) ? ((parseFloat(measuredRt) / parseFloat(formData.eqCapacity)) * 100).toFixed(1) : '-';
    const panelKvaM = ((1.732 * parseFloat(formData.panelVoltM) * parseFloat(formData.panelCurM)) / 1000).toFixed(1);
    const panelKwM = (parseFloat(panelKvaM) * parseFloat(formData.panelPfM)).toFixed(1);
    const panelRtM = (parseFloat(panelKwM) * 860 / 3024).toFixed(1);
    const copD = (!isNaN(parseFloat(formData.eqCapacity)) && !isNaN(parseFloat(formData.eqPower))) ? (parseFloat(formData.eqCapacity) / (parseFloat(formData.eqPower) * 860 / 3024)).toFixed(2) : '-';
    const copM = (!isNaN(parseFloat(measuredRt)) && !isNaN(parseFloat(panelRtM))) ? (parseFloat(measuredRt) / parseFloat(panelRtM)).toFixed(2) : '-';

    const resVals = ['결 과', loadFactor, copD, copM, '', '', '', '', '', '', '', '', '', '', ''];
    resVals.forEach((v, i) => { const c = sheet.getCell(8, i+1); c.value = v; applyStyle(c); });

    // Row 10: 3. 냉각열량 측정
    sheet.mergeCells('A10:O10'); sheet.getCell('A10').value = '2. 냉각열량 측정 (유량 및 온도)'; sheet.getCell('A10').font = { bold: true };
    const heatH1 = ['구분', '냉수', '', '', '', '', '냉각수', '', '', '', '', ''];
    heatH1.forEach((h, i) => { const c = sheet.getCell(11, i+1); c.value = h; applyStyle(c, 'D9E1F2'); });
    sheet.mergeCells('B11:F11'); sheet.mergeCells('G11:K11');
    const heatH2 = ['비고', '배관(mm)', '입구(℃)', '출구(℃)', '▲T', '냉방열량(RT)', '배관(mm)', '입구(℃)', '출구(℃)', '▲T', '냉각열량(RT)'];
    heatH2.forEach((h, i) => { const c = sheet.getCell(12, i+1); c.value = h; applyStyle(c, 'D9E1F2'); });
    
    const calcRtExcel = (flow: string, tIn: string, tOut: string) => {
      const diff = calcDiff(tIn, tOut);
      if (!diff || isNaN(parseFloat(flow))) return '-';
      return ((parseFloat(flow) * 60 * Math.abs(diff)) / 3024).toFixed(1);
    };

    const heatD = ['정격', `${formData.chilledPipeSize}A`, formData.chilledTempInDesign, formData.chilledTempOutDesign, Math.abs(calcDiff(formData.chilledTempInDesign, formData.chilledTempOutDesign)).toFixed(1), calcRtExcel(formData.chilledFlowDesign, formData.chilledTempInDesign, formData.chilledTempOutDesign),
      `${formData.coolingPipeSize}A`, formData.coolingTempInDesign, formData.coolingTempOutDesign, Math.abs(calcDiff(formData.coolingTempInDesign, formData.coolingTempOutDesign)).toFixed(1), calcRtExcel(formData.coolingFlowDesign, formData.coolingTempInDesign, formData.coolingTempOutDesign)
    ];
    heatD.forEach((v, i) => { const c = sheet.getCell(13, i+1); c.value = v; applyStyle(c); });

    const heatM = ['측정', '', formData.chilledTempInMeasure, formData.chilledTempOutMeasure, Math.abs(calcDiff(formData.chilledTempInMeasure, formData.chilledTempOutMeasure)).toFixed(1), measuredRt,
      '', formData.coolingTempInMeasure, formData.coolingTempOutMeasure, Math.abs(calcDiff(formData.coolingTempInMeasure, formData.coolingTempOutMeasure)).toFixed(1), calcRtExcel(formData.coolingFlowMeasure, formData.coolingTempInMeasure, formData.coolingTempOutMeasure)
    ];
    heatM.forEach((v, i) => { const c = sheet.getCell(14, i+1); c.value = v; applyStyle(c); });

    // Row 16: 4. 전력량 측정
    sheet.mergeCells('A16:O16'); sheet.getCell('A16').value = '3. 전력량 측정 (판넬)'; sheet.getCell('A16').font = { bold: true };
    const pwrH = ['구 분', '전압(V)', '전류(A)', '평균(KVA)', '역율', '운전전력(KW)', '환산(RT)', '', '', '', '', '', '', '', ''];
    pwrH.forEach((h, i) => { const c = sheet.getCell(17, i+1); c.value = h; applyStyle(c, 'FCE4D6'); });
    
    const panelKvaD = ((1.732 * parseFloat(formData.panelVoltD) * parseFloat(formData.panelCurD)) / 1000).toFixed(1);
    const panelKwD = (parseFloat(panelKvaD) * parseFloat(formData.panelPfD)).toFixed(1);
    const panelRtD = (parseFloat(panelKwD) * 860 / 3024).toFixed(1);

    const pwrD = ['정격', formData.panelVoltD, formData.panelCurD, panelKvaD, formData.panelPfD, panelKwD, panelRtD, '', '', '', '', '', '', '', ''];
    pwrD.forEach((v, i) => { const c = sheet.getCell(18, i+1); c.value = v; applyStyle(c); });
    const pwrM = ['측정', formData.panelVoltM, formData.panelCurM, panelKvaM, formData.panelPfM, panelKwM, panelRtM, '', '', '', '', '', '', '', ''];
    pwrM.forEach((v, i) => { const c = sheet.getCell(19, i+1); c.value = v; applyStyle(c); });

    // Row 21: 5. 냉동기 운전상태
    sheet.mergeCells('A21:O21'); sheet.getCell('A21').value = '4. 냉동기 운전상태 [Control 판넬 상태값]'; sheet.getCell('A21').font = { bold: true };
    const cpMap = [
      ['냉수입구온도(℃)', formData.cpChilledIn, '냉수출구온도(℃)', formData.cpChilledOut, '용량제어(%)', formData.cpCapCtrl],
      ['냉각수입구온도(℃)', formData.cpCoolingIn, '냉각수출구온도(℃)', formData.cpCoolingOut, '전류(A)', formData.cpCurrent],
      ['증발기냉매온도(℃)', formData.cpEvapRefTemp, '응축기냉매온도(℃)', formData.cpCondRefTemp, '오일온도(℃)', formData.cpOilTemp],
      ['증발기압력', formData.cpEvapPress, '응축기압력', formData.cpCondPress, '오일압력', formData.cpOilPress],
      ['오일차압', formData.cpOilDiffPress, '', '', '', '']
    ];
    let cpRow = 22;
    cpMap.forEach(row => {
      for(let i=0; i<3; i++) {
        sheet.mergeCells(cpRow, i*3 + 1, cpRow, i*3 + 2);
        const lCell = sheet.getCell(cpRow, i*3 + 1); lCell.value = row[i*2]; applyStyle(lCell, 'E2EFDA');
        applyStyle(sheet.getCell(cpRow, i*3 + 2), 'E2EFDA');
        const vCell = sheet.getCell(cpRow, i*3 + 3); vCell.value = row[i*2+1]; applyStyle(vCell);
      }
      cpRow++;
    });

    // Row 27: 펌프 현황
    let pumpRow = cpRow + 2;
    sheet.mergeCells(`A${pumpRow}:O${pumpRow}`); sheet.getCell(`A${pumpRow}`).value = '5. 펌프 및 냉각탑 운전현황'; sheet.getCell(`A${pumpRow}`).font = { bold: true };
    pumpRow++;
    const pumpH = ['설비명', '구분', '인버터(Hz)', '전류(A)', '유량', '양정', '입구압력', '출구압력', 'ΔP', '', '', '', '', '', ''];
    pumpH.forEach((h, i) => { const c = sheet.getCell(pumpRow, i+1); c.value = h; applyStyle(c, 'D9E1F2'); });
    pumpRow++;
    sheet.mergeCells(`A${pumpRow}:A${pumpRow+1}`); sheet.getCell(`A${pumpRow}`).value = '냉수펌프'; applyStyle(sheet.getCell(`A${pumpRow}`), 'E2EFDA'); applyStyle(sheet.getCell(`A${pumpRow+1}`), 'E2EFDA');
    const cPumpD = ['정격', formData.pumpChilledInvD, formData.pumpChilledCurD, formData.pumpChilledFlowD, formData.pumpChilledHeadD, formData.pumpChilledInPressD, formData.pumpChilledOutPressD, calcDiff(formData.pumpChilledOutPressD, formData.pumpChilledInPressD)];
    cPumpD.forEach((v, i) => { const c = sheet.getCell(pumpRow, i+2); c.value = v; applyStyle(c); });
    pumpRow++;
    const cPumpM = ['측정', formData.pumpChilledInvM, formData.pumpChilledCurM, formData.pumpChilledFlowM, formData.pumpChilledHeadM, formData.pumpChilledInPressM, formData.pumpChilledOutPressM, calcDiff(formData.pumpChilledOutPressM, formData.pumpChilledInPressM)];
    cPumpM.forEach((v, i) => { const c = sheet.getCell(pumpRow, i+2); c.value = v; applyStyle(c); });
    pumpRow++;
    sheet.mergeCells(`A${pumpRow}:A${pumpRow+1}`); sheet.getCell(`A${pumpRow}`).value = '냉각수펌프'; applyStyle(sheet.getCell(`A${pumpRow}`), 'E2EFDA'); applyStyle(sheet.getCell(`A${pumpRow+1}`), 'E2EFDA');
    const wPumpD = ['정격', formData.pumpCoolingInvD, formData.pumpCoolingCurD, formData.pumpCoolingFlowD, formData.pumpCoolingHeadD, formData.pumpCoolingInPressD, formData.pumpCoolingOutPressD, calcDiff(formData.pumpCoolingOutPressD, formData.pumpCoolingInPressD)];
    wPumpD.forEach((v, i) => { const c = sheet.getCell(pumpRow, i+2); c.value = v; applyStyle(c); });
    pumpRow++;
    const wPumpM = ['측정', formData.pumpCoolingInvM, formData.pumpCoolingCurM, formData.pumpCoolingFlowM, formData.pumpCoolingHeadM, formData.pumpCoolingInPressM, formData.pumpCoolingOutPressM, calcDiff(formData.pumpCoolingOutPressM, formData.pumpCoolingInPressM)];
    wPumpM.forEach((v, i) => { const c = sheet.getCell(pumpRow, i+2); c.value = v; applyStyle(c); });
    
    pumpRow += 2;
    const tH = ['설비명', '구분', '풍량(m3/h)', '입구T', '입구RH', '입구WB', '입구H(kcal)', '출구T', '출구RH', '출구WB', '출구H(kcal)', 'CRT', '', '', ''];
    tH.forEach((h, i) => { const c = sheet.getCell(pumpRow, i+1); c.value = h; applyStyle(c, 'E2EFDA'); });
    pumpRow++;
    
    // Tower calcs
    const calcWetBulb = (tStr: string, rhStr: string) => {
      const T = parseFloat(tStr); const RH = parseFloat(rhStr);
      if (isNaN(T) || isNaN(RH)) return '-';
      const Tw = T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) + Math.atan(T + RH) - Math.atan(RH - 1.676331) + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;
      return Tw.toFixed(2);
    };
    const calcEnthalpy = (tStr: string, rhStr: string) => {
      const T = parseFloat(tStr); const RH = parseFloat(rhStr);
      if (isNaN(T) || isNaN(RH)) return '-';
      const Pws = 6.112 * Math.exp((17.67 * T) / (T + 243.5));
      const Pw = Pws * (RH / 100);
      const W = 0.622 * Pw / (1013.25 - Pw);
      const h_kJ = 1.006 * T + W * (2501 + 1.84 * T);
      return (h_kJ / 4.186).toFixed(2);
    };
    const calcCRT = (flowStr: string, hIn: string, hOut: string) => {
      const flow = parseFloat(flowStr); const hin = parseFloat(hIn); const hout = parseFloat(hOut);
      if (isNaN(flow) || isNaN(hin) || isNaN(hout)) return '-';
      return ((flow * 1.2 * Math.abs(hout - hin)) / 3900).toFixed(1);
    };
    
    sheet.mergeCells(`A${pumpRow}:A${pumpRow+1}`); sheet.getCell(`A${pumpRow}`).value = '냉각탑'; applyStyle(sheet.getCell(`A${pumpRow}`), 'E2EFDA'); applyStyle(sheet.getCell(`A${pumpRow+1}`), 'E2EFDA');
    const tD = ['정격', formData.towerFlowD, formData.towerInTempD, formData.towerInHumidD, calcWetBulb(formData.towerInTempD, formData.towerInHumidD), calcEnthalpy(formData.towerInTempD, formData.towerInHumidD),
      formData.towerOutTempD, formData.towerOutHumidD, calcWetBulb(formData.towerOutTempD, formData.towerOutHumidD), calcEnthalpy(formData.towerOutTempD, formData.towerOutHumidD),
      calcCRT(formData.towerFlowD, calcEnthalpy(formData.towerInTempD, formData.towerInHumidD), calcEnthalpy(formData.towerOutTempD, formData.towerOutHumidD))];
    tD.forEach((v, i) => { const c = sheet.getCell(pumpRow, i+2); c.value = v; applyStyle(c); });
    pumpRow++;
    const tM = ['측정', formData.towerFlowM, formData.towerInTempM, formData.towerInHumidM, calcWetBulb(formData.towerInTempM, formData.towerInHumidM), calcEnthalpy(formData.towerInTempM, formData.towerInHumidM),
      formData.towerOutTempM, formData.towerOutHumidM, calcWetBulb(formData.towerOutTempM, formData.towerOutHumidM), calcEnthalpy(formData.towerOutTempM, formData.towerOutHumidM),
      calcCRT(formData.towerFlowM, calcEnthalpy(formData.towerInTempM, formData.towerInHumidM), calcEnthalpy(formData.towerOutTempM, formData.towerOutHumidM))];
    tM.forEach((v, i) => { const c = sheet.getCell(pumpRow, i+2); c.value = v; applyStyle(c); });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Cooling_Inspection_${eqText}.xlsx"`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 });
  }
}
