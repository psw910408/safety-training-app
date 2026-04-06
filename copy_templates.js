const fs = require('fs');
const path = require('path');

const pathsToCopy = {
  'recruit_worker.docx': 'D:\\1. 현장관리팀\\5. Regularly Report\\0. 종로타워\\53. 보안 감시적 승인서 자료\\CHM-공통-산안-006-채용 시 교육(근로자).docx',
  'recruit_supervisor.docx': 'D:\\1. 현장관리팀\\5. Regularly Report\\0. 종로타워\\53. 보안 감시적 승인서 자료\\CHM-공통-산안-006-채용 시 교육(관리감독자).docx',
  'change_worker.docx': 'D:\\1. 현장관리팀\\5. Regularly Report\\0. 종로타워\\53. 보안 감시적 승인서 자료\\CHM-공통-산안-006-작업 내용 변경 시 교육(근로자).docx',
  'change_supervisor.docx': 'D:\\1. 현장관리팀\\5. Regularly Report\\0. 종로타워\\53. 보안 감시적 승인서 자료\\CHM-공통-산안-006-작업 내용 변경 시 교육(관리감독자).docx',
  'special_all.docx': 'D:\\1. 현장관리팀\\5. Regularly Report\\0. 종로타워\\53. 보안 감시적 승인서 자료\\CHM-공통-산안-008-근로자 특별 교육.docx',
  
  'jongno_msds_clean.docx': 'D:\\1. 현장관리팀\\5. Regularly Report\\0. 종로타워\\53. 보안 감시적 승인서 자료\\CHM-JT-산안-010-MSDS교육(미화).docx',
  'jongno_msds_facil.docx': 'D:\\1. 현장관리팀\\5. Regularly Report\\0. 종로타워\\53. 보안 감시적 승인서 자료\\CHM-JT-산안-010-MSDS교육(시설).docx',
  
  'samhwa_msds_clean.docx': 'D:\\1. 현장관리팀\\5. Regularly Report\\00. 삼화타워\\4. 산업안전보건관리 자료\\CHM-ST-산안-010-MSDS교육(미화).docx',
  'samhwa_msds_facil.docx': 'D:\\1. 현장관리팀\\5. Regularly Report\\00. 삼화타워\\4. 산업안전보건관리 자료\\CHM-ST-산안-010-MSDS교육(시설).docx',
};

const templatesDir = path.join(__dirname, 'public', 'templates');
if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });

for (const [key, src] of Object.entries(pathsToCopy)) {
  const dest = path.join(templatesDir, key);
  try {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${key}`);
  } catch (err) {
    console.error(`Failed to copy ${key}: ${err.message}`);
  }
}
