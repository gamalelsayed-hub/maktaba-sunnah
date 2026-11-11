// نسخة سطح المكتب (Electron): نافذة مستقلة تشغّل البرنامج نفسه، وتتيح تحميل الكتب من الفهرس بدون قيود المتصفح
const { app, BrowserWindow, Menu, shell, ipcMain, net, dialog } = require('electron');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TITLE = 'مكتبة القرآن والسنة';
let win;

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

function createWindow() {
  win = new BrowserWindow({
    width: 1300, height: 860, minWidth: 900, minHeight: 600,
    title: TITLE,
    icon: path.join(ROOT, 'build', 'icon.png'),
    backgroundColor: '#f7f4ec',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });
  win.loadFile(path.join(ROOT, 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.on('page-title-updated', e => e.preventDefault());

  // الروابط الخارجية تُفتح في المتصفح الافتراضي
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); } });
}

// تحميل نصوص الكتب من مشروع OpenITI (من العملية الرئيسية، فلا تمنعها قيود المتصفح)
const ALLOWED = 'https://raw.githubusercontent.com/OpenITI/';
ipcMain.handle('fetch-text', async (_e, url) => {
  if (typeof url !== 'string' || !url.startsWith(ALLOWED)) throw new Error('رابط غير مسموح');
  const res = await net.fetch(url);
  if (!res.ok) throw new Error('المصدر رد بخطأ ' + res.status);
  return res.text();
});

function buildMenu() {
  const go = hash => () => win && win.webContents.executeJavaScript(`location.hash = ${JSON.stringify(hash)}`);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'البرنامج', submenu: [
      { label: 'الرئيسية', accelerator: 'Alt+Home', click: go('#/') },
      { label: 'المكتبة وتحميل الكتب', click: go('#/library') },
      { label: 'الإعدادات', click: go('#/settings') },
      { type: 'separator' },
      { label: 'خروج', role: 'quit' }
    ] },
    { label: 'تنقّل', submenu: [
      { label: 'رجوع', accelerator: 'Alt+Left', click: () => win && win.webContents.navigationHistory.goBack() },
      { label: 'تقدّم', accelerator: 'Alt+Right', click: () => win && win.webContents.navigationHistory.goForward() },
      { label: 'بحث', accelerator: 'CmdOrCtrl+F', click: () => win && win.webContents.executeJavaScript("document.getElementById('q').focus()") },
      { label: 'اسأل عن مسألة', click: go('#/ask') },
      { label: 'طلب العلم', click: go('#/talab') }
    ] },
    { label: 'عرض', submenu: [
      { label: 'تكبير', role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
      { label: 'تصغير', role: 'zoomOut' },
      { label: 'الحجم الطبيعي', role: 'resetZoom' },
      { type: 'separator' },
      { label: 'ملء الشاشة', role: 'togglefullscreen' },
      { label: 'إعادة تحميل', role: 'reload' },
      { label: 'أدوات المطور', role: 'toggleDevTools' }
    ] },
    { label: 'مساعدة', submenu: [
      { label: 'دليل البرنامج', click: () => shell.openPath(path.join(ROOT, 'دليل-البرنامج.md')) },
      { label: 'عن البرنامج', click: () => dialog.showMessageBox(win, { type: 'info', title: TITLE, message: TITLE, detail: 'الإصدار ' + app.getVersion() + '\nالقرآن الكريم وكتب الحديث وشروحها، والفقه المقارن، والسيرة — وقف لله تعالى.' }) }
    ] }
  ]));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
