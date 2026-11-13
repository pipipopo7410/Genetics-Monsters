# 小怪獸遺傳實驗室 2.0｜第四輪修正版

## 本次修正

- **圖片**：將原本 11 張 WebP 素材保留原有造型，檔名改成英文小寫（如 `body-green.webp`），並更新程式引用；GitHub 要上傳完整 `assets/` 資料夾。圖片路徑檢查失敗時會出現提示，避免留白。
- **配子染色體**：精子、卵子裡的第 1、2、3 號染色體左右並排，**在同一水平中心線置中**；染色體長度仍各不相同，基因座線與字母保留。
- **七年級**：移除顯隱性對照表按鈕與紀錄簿裡的「查看完整對照」捷徑。仍保留推論顯性性狀的七年級探索任務。
- **九年級**：依先前約定，顯隱性提示直接出現在上方 A～H 性狀標籤，不設額外對照按鈕。
- 其餘原版介面、原本 11 張小怪獸素材、拖曳／彈回、細胞膜、受精融合、連生五胎及全版鎖定不變。

## 部署到 GitHub Pages

請先**解壓縮**本 ZIP，進入解壓縮後資料夾，選取其中的**全部檔案及整個 assets 資料夾**，再到你的 GitHub Repository → **Add file → Upload files**，將它們上傳到儲存庫的根目錄，再按 Commit changes。

**重要：不是只上傳 `index.html`！** 若選擇這份多檔專案，必須同時上傳 `app.js`、`style.css`、`assets/` 裡的 11 張圖；檔案彼此有相依關係。

```
index.html
app.js
style.css
README.md
assets/
    body-green.webp
    body-yellow.webp
    hands-two.webp
    hands-four.webp
    legs-short.webp
    legs-long.webp
    eyes-two.webp
    eyes-three.webp
    wings.webp
    horn.webp
    spots.webp
```

若部署後仍看不到圖片：到 GitHub Repo 頁面確認 `assets/` 存在，再嘗試在你的網站網址後加上 `assets/body-green.webp`（例如網站首頁為 `https://example.github.io/monster/`，圖片網址應為 `https://example.github.io/monster/assets/body-green.webp`）；可檢查圖檔是否能直接開啟。同時請使用強制重新整理避免舊版快取。

## 單檔備用版

另提供 `小怪獸遺傳2.0_第四輪_單檔備用版.html`，內含全部圖片、CSS 與 JS；這份檔案可單獨開啟及試玩。**不要在多檔版中混用不同輪次的檔案**。

## 驗收檢查

- [ ] 爸爸／媽媽與子代小怪獸圖片正常顯示。
- [ ] 精子和卵子內三條染色體左右水平置中對齊，且清楚可見。
- [ ] 七年級模式完全沒有「顯隱性對照表」按鈕。
- [ ] 九年級在上方性狀欄內顯示顯隱性。
- [ ] 原有染色體拖曳、同源染色體彈回、受精動畫、連生五胎都正常。
- [ ] iPad 橫向／手機直向不出現上下左右頁面捲軸。
