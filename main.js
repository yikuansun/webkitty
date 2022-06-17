const { app, BrowserWindow, ipcMain, Menu, nativeTheme } = require("electron");
require("@electron/remote/main").initialize();
const fs = require("fs");

nativeTheme.themeSource = "dark";

function createWindow() {
    var mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        backgroundColor: "#222222",
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
            webviewTag: true,
            devTools: false
        },
        icon: "appwindow/icon.png",
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile("appwindow/index.html");

    require("@electron/remote/main").enable(mainWindow.webContents);

    ipcMain.on("updateappsettings", function(data) {
        mainWindow.webContents.send("updateappsettings");
    });
    
}

app.whenReady().then(function() {
    createWindow();
});

app.on("window-all-closed", function() { app.quit(); });

ipcMain.on("opensettingswin", function(data) {
    var settingsWin = new BrowserWindow({
        height: 555,
        width: 400,
        resizable: false,
        webPreferences: {
            devTools: false,
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    });

    settingsWin.setMenuBarVisibility(false);
    settingsWin.loadFile(__dirname + "/appwindow/settings/index.html");

    require("@electron/remote/main").enable(settingsWin.webContents);
});
