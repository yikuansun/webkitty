const fs = require('fs');
const { app, ipcRenderer, remote } = require('electron');
const userDataPath = (app || remote.app).getPath("userData");

var currentSettings = JSON.parse(fs.readFileSync(userDataPath + "/settings.json", "utf-8"));
document.getElementById("primarycolorpicker").value = currentSettings.primarycolor;
document.getElementById("secondarycolorpicker").value = currentSettings.secondarycolor;
document.getElementById("backgroundcolorpicker").value = currentSettings.backgroundcolor;
document.getElementById("layoutpicker").value = currentSettings.layout;

function save_options() {
    fs.writeFileSync(userDataPath + "/settings.json", JSON.stringify({
        layout: document.getElementById("layoutpicker").value,
        primarycolor: document.getElementById("primarycolorpicker").value,
        secondarycolor: document.getElementById("secondarycolorpicker").value,
        backgroundcolor: document.getElementById("backgroundcolorpicker").value
    }));

    ipcRenderer.send("updateappsettings");

    return false;
}

document.querySelector("form").onsubmit = save_options;