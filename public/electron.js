const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // 方便调用 Node API
    },
  });

  win.loadURL(
    process.env.ELECTRON_START_URL ||
      `file://${path.join(__dirname, '../build/index.html')}`
  );
}

app.on('ready', createWindow);

const dataFile = path.join(app.getPath('userData'), 'tasks.json');

// 读数据
ipcMain.handle('load-tasks', async () => {
  try {
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(content);
    }
    return null;
  } catch (e) {
    return null;
  }
});

// 写数据
ipcMain.handle('save-tasks', async (event, tasks) => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(tasks, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
});
