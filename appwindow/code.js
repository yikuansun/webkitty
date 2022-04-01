const fs = require("fs");
const path = require("path");
const { dialog, shell, BrowserWindow, app } = require("@electron/remote");
const { ipcRenderer } = require("electron");

let projectdirectory = "";

let currentTheme = "mbo";
//GLOBAL EDITOR CONFIGURATION
let options = {
  lineNumbers: true,
  theme: currentTheme,
  //lineWrapping: true,
  autoCloseBrackets: true,
  matchBrackets: true
};

let editor = CodeMirror(document.getElementById("cdm"), options);
editor.setOption("mode", "htmlmixed");
editor.setSize("100%", "calc(100vh - 54px)"); // codemirror doesn't repect height of parent element.

function openFileInTextEditor(dir, rel_path, callback = false) {
    //let code = fs.readFileSync();

    fs.readFile(path.join(dir, rel_path), 'utf8' , (err, data) => {
      if (err) return console.error(err);

      editor.setValue(data);
      if (typeof callback == "function") callback();
    });
}

function buildFileSelector(directory, optgroup, basedir) {
    var dircontents = fs.readdirSync(directory);
    optgroup.innerHTML = "";
    for (var file of dircontents) {
        if (file == ".DS_Store" || file == ".git") continue;
        if (fs.lstatSync(directory + "/" + file).isDirectory()) {
            var newOptGroup = document.createElement("optgroup");
            newOptGroup.setAttribute("label", file);
            optgroup.appendChild(newOptGroup);
            buildFileSelector(directory + "/" + file, newOptGroup, basedir);
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

document.querySelector("#newprojectbutton").addEventListener("click", function() {
    var dir = dialog.showSaveDialogSync({
        title: "Make a New Project",
        defaultPath: app.getPath("documents") + "/New Project"
    });
    if (dir) {
        fs.mkdirSync(dir);
        fs.writeFileSync(dir + "/index.html", fs.readFileSync(__dirname + "/defaultindexhtml.txt"));
        fs.writeFileSync(dir + "/code.js", "");
        fs.writeFileSync(dir + "/style.css", "");
        projectdirectory = dir;
        setProject(projectdirectory);
        document.querySelector("#landingscreen").style.display = "none";
    }
});

document.querySelector("#projectselect").addEventListener("click", function() {
    var dir = dialog.showOpenDialogSync({
        title: "Open Project Folder",
        properties: ["openDirectory"]
    });
    if (dir[0]) {
        projectdirectory = dir[0];
        if (!fs.readdirSync(dir[0]).includes("index.html")) {
            alert("no index.html found in the selected project");
            return;
        }
        setProject(projectdirectory);
        document.querySelector("#landingscreen").style.display = "none";
    }
});

document.querySelector("#settingsbutton").addEventListener("click", function() {
    ipcRenderer.send("opensettingswin");
});

document.querySelector("#aboutbutton").addEventListener("click", function() {
    shell.openExternal("https://github.com/yikuansun/webkitty");
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
/*
document.querySelector("#savebutton").addEventListener("click", function() {
    saveTextFile(projectdirectory + "/" + document.querySelector("#fileselect").value, document.querySelector("#texteditor").value);
    document.querySelector("#savebutton").style.fontWeight = "";
});
*/
document.querySelector("#texteditor").addEventListener("keydown", function(e) {
    if (((process.platform == "darwin")?e.metaKey:e.ctrlKey) && e.key == "s") {
        saveTextFile(projectdirectory + "/" + document.querySelector("#fileselect").value, this.value);
        document.querySelector("#savebutton").style.fontWeight = "";
    }
});


// A function is used for dragging and moving
function dragElement(element, direction)
{
    var   md; // remember mouse down info
    const first  = document.getElementById("first");
    const second = document.getElementById("second");

    element.onmousedown = onMouseDown;

    function onMouseDown(e)
    {
        document.getElementById("rightsection").classList.add("nopointer");
        //console.log("mouse down: " + e.clientX);
        md = {e,
              offsetLeft:  element.offsetLeft,
              offsetTop:   element.offsetTop,
              firstWidth:  first.offsetWidth,
              secondWidth: second.offsetWidth
             };

        document.onmousemove = onMouseMove;
        document.onmouseup = () => {
            //console.log("mouse up");
            document.onmousemove = document.onmouseup = null;
            document.getElementById("rightsection").classList.remove("nopointer");
        }
    }

    function onMouseMove(e)
    {
        //console.log("mouse move: " + e.clientX);
        var delta = {x: e.clientX - md.e.clientX,
                     y: e.clientY - md.e.clientY};

        if (direction === "H" ) // Horizontal
        {
            // Prevent negative-sized elements
            delta.x = Math.min(Math.max(delta.x, -md.firstWidth),
                       md.secondWidth);

            element.style.left = md.offsetLeft + delta.x + "px";
            first.style.width = (md.firstWidth + delta.x) + "px";
            second.style.width = (md.secondWidth - delta.x) + "px";
        }
    }
}

dragElement( document.getElementById("separator"), "H" );

var autosave = true;
/*document.querySelector("#texteditor").addEventListener("change", function() {
    if (autosave) {
        saveTextFile(projectdirectory + "/" + document.querySelector("#fileselect").value, this.value);
        document.querySelector("#savebutton").style.fontWeight = "";
    }
});*/
editor.on("change", function() {
    console.log("Sending savedata", {
        path: projectdirectory + "/" + document.querySelector("#fileselect").value,
        data: editor.getValue()
    })
    ipcRenderer.send("project:save", {
        path: projectdirectory + "/" + document.querySelector("#fileselect").value,
        data: editor.getValue()
    });
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
/*
document.querySelector("#publishbutton").addEventListener("click", function() {
    shell.openExternal("https://pages.github.com/")
});

document.querySelector("#htmlbuilderlink").addEventListener("click", function() {
    shell.openExternal("https://github.com/yikuansun/html-builder");
});
*/
var userDataPath = app.getPath("userData");
if (!fs.existsSync(userDataPath + "/settings.json")) {
    fs.writeFileSync(userDataPath + "/settings.json", JSON.stringify({
        primarycolor: "#f5f5f5",
        secondarycolor: "#161616",
        backgroundcolor: "#222222",
        layout: "left-right",
        codefontsize: 12,
        autosave: true,
        httpreferrer:  "",
        useragent: "",
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
    autosave = userSettings.autosave;
    if (userSettings.httpreferrer) document.querySelector("#pagepreview").setAttribute("httpreferrer", userSettings.httpreferrer);
    else document.querySelector("#pagepreview").removeAttribute("httpreferrer");
    if (document.querySelector("#pagepreview").hasAttribute("#useragent")) {
        document.querySelector("#pagepreview").setUserAgent(userSettings.useragent);
    }
    else document.querySelector("#pagepreview").setAttribute("useragent", userSettings.useragent);
}
readSettings();
ipcRenderer.on("updateappsettings", function(data) {
    readSettings();
});

ipcRenderer.on("project:save", function() {
    console.log("Sending savedata", {
        path: projectdirectory + "/" + document.querySelector("#fileselect").value,
        data: editor.getValue()
    })
    ipcRenderer.send("project:save", {
        path: projectdirectory + "/" + document.querySelector("#fileselect").value,
        data: editor.getValue()
    });
});