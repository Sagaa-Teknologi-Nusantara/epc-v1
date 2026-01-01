BUG di Dashbaord Page
1. Quality Performance Dashboard di page dashboard belum sama dengan yang ada di HTML, cek apa saja yang harus ada di line 1994 kebawah di file html nya weekly-report-dashboard-v4c.html

2. Grafik S-curve, QR code, dan cash flow tidak tampil di dashboard, line 1838 di html
3. Schedule & LD Estimation, belumg lengkap kayak di html, cek line 1770 di html    


Bug di Report Page
1. saat mau create dan update report, di bagian quality, belum ada punchlist. cek line 3168 di html
2. fitur update report masih ada bug, ketika saya mau update report dan pencet save, ternyata tidak ke update


Bug di Project Page
1. ketika update project, di modal nya ga terisi data sebvelumnya malah kosong, coba handle ini




NOTES
- kerjakan bug fixing ini di branch baru
- silakan run yarn dev di background untuk anda testing sendiri
- buat commit secara bertahap agar ke track semua
