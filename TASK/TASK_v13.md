TASK
1. pada page report, ada bagian Progress & EVM dan Cashflow. Tolong pastikan data yang bvisa diinput sesuai dengan yang ada di html. dan perhitunganny sesuai tolong double check karena ini sangat penting.  ambil referensi dari weekly-report-dashboard-v4c.html 
 <div className="formula-box">
                <h4 style={{fontWeight:600,marginBottom:12,color:'#92400e'}}>📊 Auto-Calculated Results</h4>
                <div className="grid-3" style={{gap:10,marginBottom:12}}>
                    <div style={{background:'#f0fdf4',padding:10,borderRadius:8}}><label className="label" style={{color:'#16a34a'}}>SPI = BCWP/BCWS</label><input className="input input-sm auto-calc" disabled value={(evm.spiValue||0).toFixed(4)}/></div>
                    <div style={{background:'#fef3c7',padding:10,borderRadius:8}}><label className="label" style={{color:'#d97706'}}>CPI = BCWP/ACWP</label><input className="input input-sm auto-calc" disabled value={(evm.cpiValue||0).toFixed(4)}/></div>
                    <div style={{background:'#fef2f2',padding:10,borderRadius:8}}><label className="label" style={{color:'#dc2626'}}>CV = BCWP-ACWP</label><input className="input input-sm" disabled value={`$${((evm.cv||0)/1e6).toFixed(2)}M`}/></div>
                </div>
                <div className="grid-2" style={{gap:8}}>
                    <div style={{background:'#f8fafc',padding:8,borderRadius:6,display:'flex',justifyContent:'space-between',fontSize:11}}><span>EAC (Typical) = BAC/CPI</span><strong>${((evm.eacTypical||0)/1e6).toFixed(2)}M</strong></div>
                    <div style={{background:'#f8fafc',padding:8,borderRadius:6,display:'flex',justifyContent:'space-between',fontSize:11}}><span>EAC (Atypical)</span><strong>${((evm.eacAtypical||0)/1e6).toFixed(2)}M</strong></div>
                    <div style={{background:'#f8fafc',padding:8,borderRadius:6,display:'flex',justifyContent:'space-between',fontSize:11}}><span>EAC (Combined)</span><strong>${((evm.eacCombined||0)/1e6).toFixed(2)}M</strong></div>
                    <div style={{background:(evm.vac||0)>=0?'#dcfce7':'#fee2e2',padding:8,borderRadius:6,display:'flex',justifyContent:'space-between',fontSize:11}}><span>VAC = BAC - EAC</span><strong style={{color:(evm.vac||0)>=0?'#16a34a':'#dc2626'}}>${((evm.vac||0)/1e6).toFixed(2)}M</strong></div>
                </div>
            </div>
2. pastiukan pula revenue diambil dari perhitungan BCWP
3. tambahkan juga  Target Minimum TKDN (Plan) % pada Progress & EVM  pada report, baik saat create report maupun saat edit report