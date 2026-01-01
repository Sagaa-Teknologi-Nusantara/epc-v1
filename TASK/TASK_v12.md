TASK
1. pada page dashboard, ada bagian quality performance dashboard tapi ini belum spenuhnya sama dengan yang ada di html, jadi coba buat sesuai dengan html tersebut. ambil referensi dari weekly-report-dashboard-v4c.html di line 1994 kebawah
   {/* Quality Performance Dashboard with Charts */}
                <div className="card" style={{padding:20,marginBottom:20}}>
                    <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>🔍 Quality Performance Dashboard</h3>
                    {(()=>{
                        const q=quality||{};
                        const ho=q.headOffice||{};
                        const so=q.siteOffice||{};
                        const disciplines=['process','mechanical','piping','electrical','instrument','civil'];
                        
                        // Prepare AFI data for charts
                        const hoAfiData=disciplines.map(d=>ho.afi?.[d]||{fail:0,ongoing:0,pass:0});
                        const soAfiData=disciplines.map(d=>so.afi?.[d]||{fail:0,ongoing:0,pass:0});
                        
                        // Prepare NCR data for charts
                        const hoNcrData=disciplines.map(d=>{
                            const o2c=ho.ncr?.ownerToContractor?.[d]||{};
                            const c2v=ho.ncr?.contractorToVendor?.[d]||{};
                            return{open:(o2c.open||0)+(c2v.open||0),closed:(o2c.closed||0)+(c2v.closed||0)};
                        });
                        const soNcrData=disciplines.map(d=>{
                            const o2c=so.ncr?.ownerToContractor?.[d]||{};
                            const c2v=so.ncr?.contractorToVendor?.[d]||{};
                            return{open:(o2c.open||0)+(c2v.open||0),closed:(o2c.closed||0)+(c2v.closed||0)};
                        });
                        
                        // Prepare Punch data for charts
                        const hoPunchData=disciplines.map(d=>{
                            const o2c=ho.punchList?.ownerToContractor?.[d]||{};
                            const c2v=ho.punchList?.contractorToVendor?.[d]||{};
                            return{open:(o2c.open||0)+(c2v.open||0),closed:(o2c.closed||0)+(c2v.closed||0)};
                        });
                        const soPunchData=disciplines.map(d=>{
                            const o2c=so.punchList?.ownerToContractor?.[d]||{};
                            const c2v=so.punchList?.contractorToVendor?.[d]||{};
                            return{open:(o2c.open||0)+(c2v.open||0),closed:(o2c.closed||0)+(c2v.closed||0)};
                        });
                        
                        // Calculate totals for donut charts
                        const hoNcrTotal=hoNcrData.reduce((a,c)=>({open:a.open+c.open,closed:a.closed+c.closed}),{open:0,closed:0});
                        const soNcrTotal=soNcrData.reduce((a,c)=>({open:a.open+c.open,closed:a.closed+c.closed}),{open:0,closed:0});
                        const hoPunchTotal=hoPunchData.reduce((a,c)=>({open:a.open+c.open,closed:a.closed+c.closed}),{open:0,closed:0});
                        const soPunchTotal=soPunchData.reduce((a,c)=>({open:a.open+c.open,closed:a.closed+c.closed}),{open:0,closed:0});
                        
                        const welding=so.welding||{};
                        
                        return(<div>
                            {/* AFI Charts Row */}
                            <div className="grid-2" style={{gap:16,marginBottom:16}}>
                                <QualityAFIChart data={hoAfiData} title="🏢 Head Office - AFI Status" color="#0f766e"/>
                                <QualityAFIChart data={soAfiData} title="🏗️ Site Office - AFI Status" color="#7c3aed"/>
                            </div>
                            
                            {/* NCR & Punch Charts Row */}
                            <div className="grid-2" style={{gap:16,marginBottom:16}}>
                                <QualityNCRPunchChart ncrData={hoNcrData} punchData={hoPunchData} title="🏢 Head Office - NCR & Punch List"/>
                                <QualityNCRPunchChart ncrData={soNcrData} punchData={soPunchData} title="🏗️ Site Office - NCR & Punch List"/>
                            </div>
                            
                            {/* Summary Donuts & Welding Gauge */}
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1.5fr',gap:16,marginBottom:16}}>
                                <QualityDonutChart open={hoNcrTotal.open} closed={hoNcrTotal.closed} title="HO NCR"/>
                                <QualityDonutChart open={hoPunchTotal.open} closed={hoPunchTotal.closed} title="HO Punch" openColor="#f59e0b"/>
                                <QualityDonutChart open={soNcrTotal.open} closed={soNcrTotal.closed} title="Site NCR"/>
                                <QualityDonutChart open={soPunchTotal.open} closed={soPunchTotal.closed} title="Site Punch" openColor="#f59e0b"/>
                                <WeldingGauge accepted={welding.ndtAccepted||0} rejected={welding.ndtRejected||0} targetRate={welding.rejectionRatePlan||2}/>
                            </div>
                            
                            {/* Certificate Status */}
                            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}}>
                                <CertificateDonut notYetApplied={q.certificate?.notYetApplied||0} underApplication={q.certificate?.underApplication||0} completed={q.certificate?.completed||0}/>
                                <CertificateChart notYetApplied={q.certificate?.notYetApplied||0} underApplication={q.certificate?.underApplication||0} completed={q.certificate?.completed||0}/>
                            </div>
                        </div>);
                    })()}
                </div>


2. pada page report, saat view detail. di tab quality juga belum lengkap. coba lengkapi dengan data yang bisa disimpan saat create reportnya