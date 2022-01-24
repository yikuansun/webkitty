const { remote, app } = require("electron");
const fs = require("fs");
const { dialog, shell, BrowserWindow, ipcMain } = remote;

var projectdirectory = "";

function openFileInTextEditor(dir, rel_path) {
    var textarea = document.querySelector("#texteditor");
    textarea.value = fs.readFileSync(dir + "/" + rel_path);
}

function buildFileSelector(directory, optgroup, basedir) {
    var dircontents = fs.readdirSync(directory);
    optgroup.innerHTML = "";
    for (var file of dircontents) {
        if (fs.lstatSync(directory + "/" + file).isDirectory()) {
            if (file != ".git") {
                var newOptGroup = document.createElement("optgroup");
                newOptGroup.setAttribute("label", file);
                optgroup.appendChild(newOptGroup);
                buildFileSelector(directory + "/" + file, newOptGroup, basedir);
            }
        }
        else {
            var option = document.createElement("option");
            option.innerText = (directory + "/" + file).split(basedir + "/")[1];
            optgroup.appendChild(option);
        }
    }
};

function setProject(dir) {
    buildFileSelector(dir, document.querySelector("#fileselect"), dir);

    fileselect.value = "index.html";
    openFileInTextEditor(dir, "index.html");

    document.querySelector("#pagepreview").src = "file://" + dir + "/index.html";
    document.querySelector("#addressbar").value = "file://" + dir + "/index.html";
}

function saveTextFile(filepath, filecontents) {
    fs.writeFileSync(filepath, filecontents);
}

document.querySelector("#projectselect").addEventListener("click", function() {
    var dir = dialog.showOpenDialogSync({
        properties: ["openDirectory"]
    });
    if (dir[0]) {
        projectdirectory = dir[0];
        setProject(projectdirectory);
        document.querySelector("#landingscreen").style.display = "none";
    }
});

document.querySelector("#settingsbutton").addEventListener("click", function() {
    var settingsWin = new BrowserWindow({
        height: 500,
        width: 400,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    });

    settingsWin.setMenuBarVisibility(false);
    settingsWin.loadFile(__dirname + "/settings/index.html");
});

document.querySelector("#addressbar").addEventListener("change", function() {
    document.querySelector("#pagepreview").src = this.value;
});

document.querySelector("#reloadbutton").addEventListener("click", function() {
    document.querySelector("#pagepreview").src = document.querySelector("#addressbar").value;
});

document.querySelector("#devtoolsbutton").addEventListener("click", function() {
    document.querySelector("#pagepreview").openDevTools();
});

document.querySelector("#fileselect").addEventListener("change", function() {
    openFileInTextEditor(projectdirectory, this.value);
});

document.querySelector("#fileselect").addEventListener("mousedown", function() {
    var selectedFile = this.value;
    buildFileSelector(projectdirectory, document.querySelector("#fileselect"), projectdirectory);
    document.querySelector("#fileselect").value = selectedFile;
});

document.querySelector("#savebutton").addEventListener("click", function() {
    saveTextFile(projectdirectory + "/" + document.querySelector("#fileselect").value, document.querySelector("#texteditor").value);
    document.querySelector("#savebutton").style.fontWeight = "";
});

document.querySelector("#texteditor").addEventListener("keydown", function(e) {
    if (((process.platform == "darwin")?e.metaKey:e.ctrlKey) && e.key == "s") {
        saveTextFile(projectdirectory + "/" + document.querySelector("#fileselect").value, this.value);
        document.querySelector("#savebutton").style.fontWeight = "";
    }
});

document.querySelector("#texteditor").addEventListener("keydown", function(e) {
    var indentLength = 4;
    if (e.key == "Tab") {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;

        this.value = this.value.substring(0, start) + " ".repeat(indentLength) + this.value.substring(end);

        this.selectionStart = this.selectionEnd = start + indentLength;
    }
});

document.querySelector("#texteditor").addEventListener("input", function() {
    document.querySelector("#savebutton").style.fontWeight = "bold";
});

document.querySelector("#menubutton").addEventListener("click", function() {
    document.querySelector("#landingscreen").style.display = "";
});

document.querySelector("#filemanagerbutton").addEventListener("click", function() {
    shell.openPath(projectdirectory);
});

document.querySelector("#openexternalbutton").addEventListener("click", function() {
    shell.openExternal(document.querySelector("#addressbar").value);
});

var userDataPath = (app || remote.app).getPath("userData");
if (!fs.existsSync(userDataPath + "/settings.json")) {
    fs.writeFileSync(userDataPath + "/settings.json", JSON.stringify({
        primarycolor: "#f5f5f5",
        secondarycolor: "#161616",
        backgroundcolor: "#222222",
        layout: "left-right",
        codefontsize: 12
    }));
}
function readSettings() {
    var userSettings = JSON.parse(fs.readFileSync(userDataPath + "/settings.json"));
    document.documentElement.style.setProperty("--background-color", userSettings.backgroundcolor);
    document.documentElement.style.setProperty("--ui-primary-color", userSettings.primarycolor);
    document.documentElement.style.setProperty("--ui-secondary-color", userSettings.secondarycolor);
    if (userSettings.layout == "top-bottom") {
        document.querySelector("#leftsection").style.width = "100vw";
        document.querySelector("#rightsection").style.width = "100vw";
        document.querySelector("#leftsection").style.height = "calc(50vh - 15px)";
        document.querySelector("#rightsection").style.height = "calc(50vh - 15px)";
        document.querySelector("#rightsection").style.left = "0";
        document.querySelector("#leftsection").style.bottom = "calc(50vh - 15px)";
    }
    else {
        document.querySelector("#leftsection").style.width = "";
        document.querySelector("#rightsection").style.width = "";
        document.querySelector("#leftsection").style.height = "";
        document.querySelector("#rightsection").style.height = "";
        document.querySelector("#rightsection").style.left = "";
        document.querySelector("#leftsection").style.bottom = "";
    }
    document.querySelector("#texteditor").style.fontSize = `${userSettings.codefontsize}px`;
}
readSettings();
ipcMain.on("updateappsettings", function(data) {
    readSettings();
});