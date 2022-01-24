const { app, BrowserWindow, ipcMain } = require("electron");

function createWindow() {

    var mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
            webviewTag: true,
            //devTools: false
        }
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile("appwindow/index.html");

}

app.whenReady().then(function() {
    createWindow();
});

app.on("window-all-closed", function() { app.quit(); });