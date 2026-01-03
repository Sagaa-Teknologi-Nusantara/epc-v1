- buat implementation plan dan commit secara terstruktur

TASK:
1. pada page dashboard, dibawah informasi project summary kan ada KPI cards EAC dan Cashflow, ini sepertinya belum sync dengan data yang sebenernya. coba di cek dan benerin
 {/* KPI Cards */}
                <div className="grid-6" style={{marginBottom:20}}>
                    <div className="stat-card" style={{borderLeft:'4px solid #0d9488'}}><p style={{color:'#64748b',fontSize:11}}>Overall Progress</p><p style={{fontSize:24,fontWeight:800}}>{overallProgress?.actual?.toFixed(2)||0}%</p><div style={{display:'flex',alignItems:'center',gap:4}}>{(overallProgress?.variance||0)>=0?<Icons.ArrowUp/>:<Icons.ArrowDown/>}<span style={{color:(overallProgress?.variance||0)>=0?'#10b981':'#ef4444',fontSize:12}}>{(overallProgress?.variance||0)>=0?'+':''}{overallProgress?.variance?.toFixed(2)||0}%</span></div></div>
                    <div className="stat-card" style={{borderLeft:'4px solid #3b82f6'}}><p style={{color:'#64748b',fontSize:11}}>SPI</p><p style={{fontSize:24,fontWeight:800,color:(evm?.spiValue||1)>=1?'#10b981':'#ef4444'}}>{evm?.spiValue?.toFixed(3)||'1.000'}</p><p style={{fontSize:10,color:'#64748b'}}>{(evm?.spiValue||1)>=1?'On Schedule':'Behind'}</p></div>
                    <div className="stat-card" style={{borderLeft:'4px solid #f59e0b'}}><p style={{color:'#64748b',fontSize:11}}>CPI</p><p style={{fontSize:24,fontWeight:800,color:(evm?.cpiValue||1)>=1?'#10b981':'#f59e0b'}}>{evm?.cpiValue?.toFixed(2)||'1.00'}</p><p style={{fontSize:10,color:'#64748b'}}>{(evm?.cpiValue||1)>=1?'Under Budget':'Over Budget'}</p></div>
                    <div className="stat-card" style={{borderLeft:'4px solid #8b5cf6'}}><p style={{color:'#64748b',fontSize:11}}>EAC (Typical)</p><p style={{fontSize:24,fontWeight:800}}>${((evm?.eac||0)/1e6).toFixed(1)}M</p><p style={{fontSize:10,color:(evm?.vac||0)>=0?'#10b981':'#ef4444'}}>VAC: ${((evm?.vac||0)/1e6).toFixed(2)}M</p></div>
                    <div className="stat-card" style={{borderLeft:'4px solid #10b981'}}><p style={{color:'#64748b',fontSize:11}}>Safe Hours</p><p style={{fontSize:24,fontWeight:800}}>{((hseSafe.safeHours||0)/1000).toFixed(0)}K</p><p style={{fontSize:10,color:'#10b981'}}>LTI: {hseSafe.lagging?.lti||0}</p></div>
                    <div className="stat-card" style={{borderLeft:`4px solid ${cf.overallStatus==='green'?'#22c55e':cf.overallStatus==='yellow'?'#f59e0b':'#ef4444'}`}}><p style={{color:'#64748b',fontSize:11}}>Cash Flow Status</p><p style={{fontSize:20,fontWeight:800}}>{cf.overallStatus==='green'?'🟢 Healthy':cf.overallStatus==='yellow'?'🟡 At Risk':'🔴 Critical'}</p><p style={{fontSize:10,color:'#64748b'}}>Score: {(cf.overallScore*100).toFixed(0)}%</p></div>
                </div>
2. pada dashbaord kan ada section 💵 Cash Flow Details (bukan 💵 Cash Flow Performance Dashboard). coba comment saja bagian ini 💵 Cash Flow Details

3. pada page dashboard, di bagian project info cards, ini belum sesuai datanya dengan yang diperlukan di html. tolong sesuaikan agar yang di web informasinya menyediakan sama seperti yang di html
di html
  {/* Project Information Card */}
                <div className="card" style={{padding:20,marginBottom:20,background:'linear-gradient(135deg,#f0fdfa,#ecfeff)'}}>
                    <h3 style={{fontSize:16,fontWeight:700,marginBottom:16,color:'#0f766e'}}>📋 Project Information</h3>
                    <div className="grid-4" style={{gap:12,marginBottom:12}}>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>Owner</p><p style={{fontWeight:600,fontSize:12}}>{selectedProject?.owner||'-'}</p></div>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>Contractor</p><p style={{fontWeight:600,fontSize:12}}>{selectedProject?.contractor||'-'}</p></div>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>Contract Type</p><p style={{fontWeight:600,fontSize:12}}>{selectedProject?.contractType||'-'}</p></div>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>Term of Payment</p><p style={{fontWeight:600,fontSize:12}}>{selectedProject?.termOfPayment||'-'}</p></div>
                    </div>
                    <div className="grid-5" style={{gap:12,marginBottom:12}}>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>Contract Price</p><p style={{fontWeight:700,fontSize:14,color:'#0f766e'}}>${((selectedProject?.contractPrice||0)/1e6).toFixed(2)}M</p></div>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>Start Date</p><p style={{fontWeight:600,fontSize:12}}>{selectedProject?.startDate||'-'}</p></div>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>Finish Date</p><p style={{fontWeight:600,fontSize:12}}>{selectedProject?.finishDate||'-'}</p></div>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>Duration</p><p style={{fontWeight:600,fontSize:12}}>{scheduleDuration} days</p></div>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>Guaranteed Power</p><p style={{fontWeight:700,fontSize:14,color:'#3b82f6'}}>{selectedProject?.guaranteedPower||0} MW</p></div>
                    </div>
                    <div className="grid-3" style={{gap:12}}>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>LD Delay Rate</p><p style={{fontWeight:600,fontSize:12}}>${(selectedProject?.ldDelay||0).toLocaleString()}/day</p></div>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>LD Performance Rate</p><p style={{fontWeight:600,fontSize:12}}>${(selectedProject?.ldPerformance||0).toLocaleString()}/kW</p></div>
                        <div style={{background:'white',padding:12,borderRadius:8}}><p style={{fontSize:10,color:'#64748b'}}>Scope by Owner</p><p style={{fontWeight:600,fontSize:11}}>{selectedProject?.scopeByOwner||'-'}</p></div>
                    </div>
                </div>


di web
 {/* Project Info Cards - Enhanced */}
      {selectedProject && (
        <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Owner</p>
              <p className="text-sm font-semibold">{selectedProject.owner || '-'}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Contractor</p>
              <p className="text-sm font-semibold">{selectedProject.contractor || '-'}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Contract Type</p>
              <p className="text-sm font-semibold">{selectedProject.contractType || '-'}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Term of Payment</p>
              <p className="text-sm font-semibold">{(selectedProject as unknown as { termOfPayment?: string }).termOfPayment || 'NET 30'}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Contract Price</p>
              <p className="text-sm font-bold">${((selectedProject.contractPrice || 0) / 1e6).toFixed(2)}M</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Duration</p>
              <p className="text-sm font-semibold">{selectedProject.startDate} - {selectedProject.finishDate}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">Guaranteed Power</p>
              <p className="text-sm font-semibold">{(selectedProject as unknown as { guaranteedPower?: number }).guaranteedPower || 0} MW</p>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-[10px] opacity-80">LD Rate (Delay)</p>
              <p className="text-sm font-semibold">{((selectedProject as unknown as { ldDelayRate?: number }).ldDelayRate || 0.1) * 100}%/day</p>
            </div>
          </div>
        </div>
      )}

