tugas yang perlu dilakukan
1. init ini ke github repository saya mau simpen di organization
# Initialize git (jika belum)
git init

# Add semua files
git add .

# Commit pertama
git commit -m "Initial commit: EPC v1 project"

# Buat repository di organization, lalu connect
git remote add origin https://github.com/Sagaa-Teknologi-Nusantara/epc-v1.git
git branch -M main
git push -u origin main

2. saya mau deploy di vercell? gimana ya langkah2nya? saya juga mau siapin CI/CD nya

3. masukkan folder TASK ke gitignore jadi ga ke push
