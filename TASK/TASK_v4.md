tugas yang perlu dilakukan
1. solve this bug: Minor note: Login page currently shows sidebar due to layout inheritance - can be polished later if needed
2. di page reports, kasih filter based on project
3. cek error ini
## Error Type
Console Error

## Error Message
React has detected a change in the order of Hooks called by AnalysisPage. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
1. useContext                 useContext
2. useMemo                    useMemo
3. useMemo                    useMemo
4. undefined                  useMemo
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^



    at AnalysisPage (src/app/analysis/page.tsx:290:33)

## Code Frame
  288 |
  289 |     // Group risks by category
> 290 |     const groupedRisks = useMemo(() => {
      |                                 ^
  291 |         const categories = ['Schedule', 'Cost', 'Cash Flow', 'Safety', 'Quality', 'TKDN', 'Milestone Schedule', 'Milestone Payment'];
  292 |         const grouped = categories.map(cat => ({
  293 |             category: cat,

Next.js version: 16.1.1 (Turbopack)

## Error Type
Runtime Error

## Error Message
Rendered more hooks than during the previous render.


    at AnalysisPage (src/app/analysis/page.tsx:290:33)

## Code Frame
  288 |
  289 |     // Group risks by category
> 290 |     const groupedRisks = useMemo(() => {
      |                                 ^
  291 |         const categories = ['Schedule', 'Cost', 'Cash Flow', 'Safety', 'Quality', 'TKDN', 'Milestone Schedule', 'Milestone Payment'];
  292 |         const grouped = categories.map(cat => ({
  293 |             category: cat,

Next.js version: 16.1.1 (Turbopack)


4. ubah password akun admin menjadi "password123"