const fs = require('fs');
let code = fs.readFileSync('src/app/cooling/page.tsx', 'utf8');

// 1. Fix Math
code = code.replace('/ 4.184)', '/ 4.186)');
code = code.replace('/ 3320)', '/ 3900)');

// 2. Remove "점검 냉동기 선택" UI
code = code.replace(
  `<div><label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>점검 냉동기 선택</label><input type="text" list="eq-list" className="input-field" value={eqText} onChange={(e) => setEqText(e.target.value)} /><datalist id="eq-list">{(masterData[siteText] || []).map(eq => <option key={eq.name} value={eq.name} />)}</datalist></div>`,
  ``
);
// Also change the grid layout of site selection from 2 cols to 1 col
code = code.replace(
  `<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div><label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>사옥 선택</label><input type="text" list="site-list" className="input-field" value={siteText} onChange={(e) => setSiteText(e.target.value)} placeholder="ex: 종로타워" /><datalist id="site-list">{Object.keys(masterData).map(s => <option key={s} value={s} />)}</datalist></div>
              </div>`,
  `<div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>사옥 선택 (선택 시 첫 번째 기기 자동입력)</label>
              <input type="text" list="site-list" className="input-field" value={siteText} onChange={(e) => setSiteText(e.target.value)} placeholder="ex: 종로타워" style={{maxWidth: '300px'}} />
              <datalist id="site-list">{Object.keys(masterData).map(s => <option key={s} value={s} />)}</datalist>
            </div>`
);
// To auto-select the first chiller when site changes, update the useEffect:
code = code.replace(
  `const matchedEq = siteEqs.find(e => e.name === eqText);`,
  `const matchedEq = siteEqs.length > 0 ? siteEqs[0] : null;`
);

// 3. Fix Table UI spacing (adding min-width to input-field inside tables and white-space: nowrap)
code = code.replace(
  `table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '400px' }}`,
  `table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '600px', whiteSpace: 'nowrap' }}`
);
code = code.replace(
  `table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '600px' }}`,
  `table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '800px', whiteSpace: 'nowrap' }}`
);
code = code.replace(
  `table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '700px' }}`,
  `table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '1000px', whiteSpace: 'nowrap' }}`
);
// Add a global css rule for inputs in tables
code = code.replace(
  `<style>{\`input::-webkit-calendar-picker-indicator { display: none !important; } input[type="date"]::-webkit-calendar-picker-indicator { display: block !important; }\`}</style>`,
  `<style>{\`
    input::-webkit-calendar-picker-indicator { display: none !important; } 
    input[type="date"]::-webkit-calendar-picker-indicator { display: block !important; }
    td .input-field { min-width: 60px; padding: 6px; }
    th { padding: 8px 4px; }
  \`}</style>`
);

fs.writeFileSync('src/app/cooling/page.tsx', code, 'utf8');
console.log('Update script applied.');
