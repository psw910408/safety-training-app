const fs = require('fs');
let code = fs.readFileSync('src/app/cooling/page.tsx', 'utf8');

// 1. Remove "V5 엔지니어링 폼"
code = code.replace('<p>V5 엔지니어링 폼</p>', '');

// 2. Add Export Logic to handleSubmit
const exportCode = `
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newComp = { id: Date.now(), siteText, eqText: eqText || '미지정', title: \`\${siteText || '미지정'}-\${eqText || '미지정'}\`, date: new Date().toLocaleString(), formData };
    const updatedComp = [newComp, ...completed];
    setCompleted(updatedComp);
    localStorage.setItem('cooling_inspection_completed', JSON.stringify(updatedComp));
    
    // Excel Export Call
    try {
      const res = await fetch('/api/export-cooling-excel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, siteText, eqText })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = \`Cooling_Inspection_\${eqText || 'Report'}.xlsx\`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else {
        alert('엑셀 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('엑셀 생성 오류 발생');
    }

    if (currentDraftId) {
      const updatedDrafts = drafts.filter(d => d.id !== currentDraftId);
      setDrafts(updatedDrafts);
      localStorage.setItem('cooling_inspection_drafts', JSON.stringify(updatedDrafts));
    }
    alert('최종 저장 및 엑셀 다운로드가 완료되었습니다!');
    setFormData(INITIAL_FORM); setSiteText(''); setEqText(''); setCurrentDraftId(null); setStep(1);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };
`;
// Replace the old handleSubmit with the new exportCode
code = code.replace(/const handleSubmit = \(e: React.FormEvent\) => \{[\s\S]*?handleSubmit\s+function\s+end.*/, ''); // this regex might fail if end comment is not there.
// Instead, just replace the exact block:
const hsMatch = code.match(/const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?setTimeout.*?\n  \};/);
if (hsMatch) {
    code = code.replace(hsMatch[0], exportCode);
}

// Update Drafts and Completed initialization and save functions to support 'title'
code = code.replace(/const newDraft = \{ id: currentDraftId \|\| Date\.now\(\), siteText, eqText: eqText \|\| '기기 미지정', date: new Date\(\)\.toLocaleString\(\), formData, step \};/,
  "const newDraft = { id: currentDraftId || Date.now(), siteText, eqText: eqText || '기기 미지정', title: `${siteText || '미지정'}-${eqText || '기기 미지정'}`, date: new Date().toLocaleString(), formData, step };"
);

// Function for Rename/Delete
const funcCode = `
  const handleDeleteDraft = (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated); localStorage.setItem('cooling_inspection_drafts', JSON.stringify(updated));
  };
  const handleRenameDraft = (id: number) => {
    const newTitle = prompt('새로운 이름을 입력하세요:');
    if (!newTitle) return;
    const updated = drafts.map(d => d.id === id ? { ...d, title: newTitle } : d);
    setDrafts(updated); localStorage.setItem('cooling_inspection_drafts', JSON.stringify(updated));
  };
  const handleDeleteComp = (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const updated = completed.filter(d => d.id !== id);
    setCompleted(updated); localStorage.setItem('cooling_inspection_completed', JSON.stringify(updated));
  };
  const handleRenameComp = (id: number) => {
    const newTitle = prompt('새로운 이름을 입력하세요:');
    if (!newTitle) return;
    const updated = completed.map(d => d.id === id ? { ...d, title: newTitle } : d);
    setCompleted(updated); localStorage.setItem('cooling_inspection_completed', JSON.stringify(updated));
  };
`;

code = code.replace('useEffect(() => {', funcCode + '\n  useEffect(() => {');

// Update UI to show rename/delete buttons
// Drafts UI replacement
code = code.replace(/<div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>\{draft\.siteText \|\| '사옥 미지정'\} - \{draft\.eqText\}<\/div>/g, 
  "<div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>{draft.title || `${draft.siteText || '사옥 미지정'}-${draft.eqText}`} <span onClick={() => handleRenameDraft(draft.id)} style={{cursor:'pointer', fontSize:'0.8rem'}}>✏️</span></div>"
);
code = code.replace(/<div style={{ display: 'flex', gap: '6px' }}><button type="button" onClick=\{\(\) => handleLoadDraft\(draft\)\} style=\{\{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' \}\}>불러오기<\/button><\/div>/g,
  "<div style={{ display: 'flex', gap: '6px' }}><button type=\"button\" onClick={() => handleLoadDraft(draft)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>불러오기</button><button type=\"button\" onClick={() => handleDeleteDraft(draft.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button></div>"
);

// Completed UI replacement
code = code.replace(/<div style={{ fontWeight: 'bold', color: '#065f46', marginBottom: '4px' }}>\{comp\.siteText\} - \{comp\.eqText\}<\/div>/g,
  "<div style={{ fontWeight: 'bold', color: '#065f46', marginBottom: '4px' }}>{comp.title || `${comp.siteText}-${comp.eqText}`} <span onClick={() => handleRenameComp(comp.id)} style={{cursor:'pointer', fontSize:'0.8rem'}}>✏️</span></div>"
);
code = code.replace(/<button type="button" onClick=\{\(\) => \{ if\(confirm\('다시 열어보시겠습니까\? 현재 내용은 덮어씌워집니다\.'\)\) \{ setSiteText\(comp\.siteText\); setEqText\(comp\.eqText\); setFormData\(comp\.formData\); setStep\(1\); window\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\); \} \}\} style=\{\{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' \}\}>다시 열기<\/button>/g,
  "<div style={{ display: 'flex', gap: '6px' }}><button type=\"button\" onClick={() => { if(confirm('다시 열어보시겠습니까? 현재 내용은 덮어씌워집니다.')) { setSiteText(comp.siteText); setEqText(comp.eqText); setFormData(comp.formData); setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); } }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>다시 열기</button><button type=\"button\" onClick={() => handleDeleteComp(comp.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button></div>"
);

fs.writeFileSync('src/app/cooling/page.tsx', code, 'utf8');
console.log('Update script 2 applied.');
