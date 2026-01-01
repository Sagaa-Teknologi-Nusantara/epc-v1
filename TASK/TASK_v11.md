TASK
1. pada page Risk Analysis, ada bagian risk register. coba pahami agar ini berfungsi dengan baik, karena sepertoinya ini belom sesuai. ambil referensi dari weekly-report-dashboard-v4c.html di line 2521 kebawah
   {/* Risk Register - Enhanced with Categories */}
            <div className="card" style={{padding:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h3 style={{fontSize:16,fontWeight:700}}>⚠️ Risk Register</h3>
                    <div style={{display:'flex',gap:8}}>
                        <span style={{fontSize:10,background:'#fee2e2',color:'#dc2626',padding:'3px 8px',borderRadius:4,fontWeight:600}}>High: {risks.filter(r=>r.level==='High'||r.level==='Critical').length}</span>
                        <span style={{fontSize:10,background:'#fef3c7',color:'#d97706',padding:'3px 8px',borderRadius:4,fontWeight:600}}>Medium: {risks.filter(r=>r.level==='Medium').length}</span>
                        <span style={{fontSize:10,background:'#dcfce7',color:'#16a34a',padding:'3px 8px',borderRadius:4,fontWeight:600}}>Low: {risks.filter(r=>r.level==='Low').length}</span>
                    </div>
                </div>
                
                {/* Group risks by category */}
                {(()=>{
                    const categories=['Schedule','Cost','Cash Flow','Safety','Quality','TKDN','Milestone Schedule','Milestone Payment'];
                    const categorizedRisks=categories.map(cat=>({
                        category:cat,
                        risks:risks.filter(r=>r.category===cat)
                    })).filter(c=>c.risks.length>0);
                    
                    // Add uncategorized risks
                    const otherRisks=risks.filter(r=>!categories.includes(r.category));
                    if(otherRisks.length>0)categorizedRisks.push({category:'Other',risks:otherRisks});
                    
                    const getCategoryIcon=(cat)=>{
                        const icons={'Schedule':'📅','Cost':'💰','Cash Flow':'💵','Safety':'🦺','Quality':'🔍','TKDN':'🏭','Milestone Schedule':'🎯','Milestone Payment':'💳','Other':'📋'};
                        return icons[cat]||'📋';
                    };
                    
                    const getCategoryColor=(cat)=>{
                        const colors={'Schedule':'#16a34a','Cost':'#f59e0b','Cash Flow':'#ec4899','Safety':'#2563eb','Quality':'#7c3aed','TKDN':'#0891b2','Milestone Schedule':'#8b5cf6','Milestone Payment':'#f59e0b','Other':'#64748b'};
                        return colors[cat]||'#64748b';
                    };
                    
                    return(
                        <div>
                            {categorizedRisks.map((cat,ci)=>(
                                <div key={ci} style={{marginBottom:ci<categorizedRisks.length-1?16:0}}>
                                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                                        <span style={{fontSize:14}}>{getCategoryIcon(cat.category)}</span>
                                        <span style={{fontSize:13,fontWeight:700,color:getCategoryColor(cat.category)}}>{cat.category}</span>
                                        <span style={{fontSize:10,color:'#94a3b8'}}>({cat.risks.length} risk{cat.risks.length>1?'s':''})</span>
                                    </div>
                                    <div style={{background:'#f8fafc',borderRadius:8,overflow:'hidden',border:'1px solid #e2e8f0'}}>
                                        <table className="table" style={{margin:0}}>
                                            <thead><tr style={{background:'#f1f5f9'}}><th style={{width:80}}>Level</th><th>Description</th><th style={{width:'30%'}}>Recommendation</th></tr></thead>
                                            <tbody>
                                                {cat.risks.map((r,ri)=>(
                                                    <tr key={ri} style={{background:r.level==='High'||r.level==='Critical'?'#fef2f2':r.level==='Medium'?'#fffbeb':'white'}}>
                                                        <td>
                                                            <span className={`badge ${r.level==='High'||r.level==='Critical'?'badge-danger':r.level==='Medium'?'badge-warning':'badge-success'}`}>
                                                                {r.level==='High'||r.level==='Critical'?'🔴':r.level==='Medium'?'🟡':'🟢'} {r.level}
                                                            </span>
                                                        </td>
                                                        <td style={{fontSize:12}}>{r.description}</td>
                                                        <td style={{fontSize:11,color:'#475569'}}>{r.recommendation}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                            {categorizedRisks.length===0&&(
                                <div style={{textAlign:'center',padding:30,color:'#16a34a'}}>
                                    <span style={{fontSize:36}}>✅</span>
                                    <p style={{fontWeight:600,marginTop:8}}>No significant risks identified</p>
                                    <p style={{fontSize:12,color:'#64748b'}}>All performance indicators are within acceptable range</p>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>);
    };