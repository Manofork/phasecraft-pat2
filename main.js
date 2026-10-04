const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'PhaseCraft, Three-Phase Transformer Trainer',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false
    }
  });

  win.webContents.on('before-input-event', (event, input) => {
    const key = (input.key || '').toLowerCase();
    const blockDevToolsShortcut =
      key === 'f12' ||
      (input.control && input.shift && (key === 'i' || key === 'j' || key === 'c')) ||
      (input.meta && input.alt && key === 'i');
    if (blockDevToolsShortcut) {
      event.preventDefault();
    }
  });

  win.webContents.session.on('will-download', (event, item) => {
    const savePath = dialog.showSaveDialogSync(win, {
      title: 'Save PDF Report',
      defaultPath: item.getFilename(),
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (savePath) {
      item.setSavePath(savePath);
    } else {
      item.cancel();
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'phasecraft.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
