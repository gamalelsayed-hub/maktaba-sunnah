// جسر آمن بين البرنامج ونسخة سطح المكتب
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  fetchText: url => ipcRenderer.invoke('fetch-text', url),
  fetchBin: url => ipcRenderer.invoke('fetch-bin', url)
});
