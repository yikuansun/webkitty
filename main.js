const { app, BrowserWindow } = require("electron");

function createWindow() {

    var mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile("appwindow/index.html");

}

app.whenReady().then(function() {
    createWindow();
});

app.on("window-all-closed", function() { app.quit(); });