const { app, BrowserWindow, ipcMain, Menu } = require("electron");
require("@electron/remote/main").initialize();
const fs = require("fs");

/*function save_project(path, data) {
    if (!data) return console.log("No data");

    fs.writeFile(path, data, function (err) {
      if (err) return console.log(err);

      console.log("File saved");
    });
}*/

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
            //devTools: false
        }
    });

    /*const template = [
      {
        label: 'Edit',
        submenu: [
            {
                label: 'Save',
                accelerator: 'CommandOrControl+S',
                role: 'save',
                click() {
                    mainWindow.webContents.send("project:save");
                }
            },
          {
            label: 'Copy',
            accelerator: 'CommandOrControl+C',
            role: 'copy',
          },
          {
            label: 'Paste',
            accelerator: 'CommandOrControl+V',
            role: 'paste',
          },
        ]
      },
      {
        label: 'Debug',
        submenu: [
            {
                label: 'Open DevTools',
                accelerator: 'CommandOrControl+Shift+I',
                role: 'devtools',
                click() {
                    mainWindow.openDevTools();
                }
            }
        ]
      }
    ];*/

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile("appwindow/index.html");

    require("@electron/remote/main").enable(mainWindow.webContents);

    ipcMain.on("updateappsettings", function(data) {
        mainWindow.webContents.send("updateappsettings");
    });

    /*ipcMain.on("project:save", function(event, data) {
        console.log("GOT DATA", data)
        save_project(data.path, data.data);
    });*/

    //Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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
