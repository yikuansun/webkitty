const fs = require("fs");
const path = require("path");
const { dialog, shell, BrowserWindow, app, Menu, nativeImage } = require("@electron/remote");
const { ipcRenderer } = require("electron");
const { basicSetup } = require("codemirror");
const { EditorView, keymap, lineNumbers } = require("@codemirror/view");
const { EditorState, Compartment } = require("@codemirror/state");
const { defaultKeymap, history, historyKeymap, indentMore, indentLess } = require("@codemirror/commands");
const { syntaxHighlighting, defaultHighlightStyle, indentUnit } = require("@codemirror/language");
const { javascript } = require("@codemirror/lang-javascript");
const { html } = require("@codemirror/lang-html");
const { css } = require("@codemirror/lang-css");
const { markdown } = require("@codemirror/lang-markdown");
const { json } = require("@codemirror/lang-json");
const { xml } = require("@codemirror/lang-xml");
const { python } = require("@codemirror/lang-python"); // xd
const { basicDark, basicDarkTheme, basicDarkHighlightStyle } = require("cm6-theme-basic-dark");
const { materialDark, materialDarkTheme, materialDarkHighlightStyle } = require("cm6-theme-material-dark");
const { oneDark, oneDarkTheme, oneDarkHighlightStyle } = require("@codemirror/theme-one-dark");
const LocalServer = require("ezserv").server;

let projectdirectory = "";
var serve = new LocalServer(0);

var currentTheme = new Compartment();
var currentHighlightStyle = new Compartment();
var updateListener = new Compartment();
var languageMode = new Compartment();
let options = {
    doc: "hi",
    extensions: [
        basicSetup,
        indentUnit.of(" ".repeat(4)),
        keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            {
                key: "Tab",
                preventDefault: true,
                run: indentMore,
            },
            {
                key: "Shift-Tab",
                preventDefault: true,
                run: indentLess,
            },
        ]),
        currentTheme.of(oneDarkTheme),
        history(),
        languageMode.of(html()),
        currentHighlightStyle.of(syntaxHighlighting(basicDarkHighlightStyle)),
        lineNumbers(),
        updateListener.of(EditorView.updateListener.of(function() {})),
    ],
    parent: document.getElementById("cdm")
};

let editor = new EditorView(options);
function setCMHeight() {
    document.querySelector(".cm-editor").style.height = `calc(100vh - ${document.querySelector("#leftsection td").getBoundingClientRect().height + 28}px)`;
}
window.addEventListener("load", setCMHeight);
window.addEventListener("resize", setCMHeight);

function openFileInTextEditor(dir, rel_path, callback = false) {
    //let code = fs.readFileSync();

    fs.readFile(path.join(dir, rel_path), 'utf8' , (err, data) => {
      if (err) return console.error(err);

      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: data }
      });
      if (typeof callback == "function") callback();

      switch (path.extname(rel_path)) {
            case ".js":
                editor.dispatch({
                    effects: languageMode.reconfigure(javascript()),
                })
                break;
            case ".css":
                editor.dispatch({
                    effects: languageMode.reconfigure(css()),
                })
                break;
            case ".xml":
                editor.dispatch({
                    effects: languageMode.reconfigure(xml()),
                })
                break;
            case ".json":
                editor.dispatch({
                    effects: languageMode.reconfigure(json()),
                })
                break;
            case ".md":
                editor.dispatch({
                    effects: languageMode.reconfigure(markdown()),
                })
                break;
            case ".py":
                editor.dispatch({
                    effects: languageMode.reconfigure(python()),
                })
                break;
            default:
                editor.dispatch({
                    effects: languageMode.reconfigure(html()),
                })
                break;
      }
    });
}

function setProject(dir) {
    fileselect.value = "index.html";
    openFileInTextEditor(dir, "index.html");

    serve.dir = dir;

    document.querySelector("#pagepreview").src = `http://localhost:${serve.port}/`;
    document.querySelector("#addressbar").value = `http://localhost:${serve.port}/`;
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
    shell.openExternal("https://github.com/yikuansun/webkitty?tab=readme-ov-file#webkitty");
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

document.querySelector("#fileselect").addEventListener("mousedown", function(e) {
    e.preventDefault();
    var template = [];
    var constructTemplate = function(arr, directory, basedir) {
        var dircontents = fs.readdirSync(directory);
        for (var file of dircontents) {
            if (file == ".DS_Store" || file == ".git") continue;
            var buttonRepr = {label: file};
            if (fs.lstatSync(directory + "/" + file).isDirectory()) {
                var submenu = [];
                constructTemplate(submenu, directory + "/" + file, basedir);
                buttonRepr.submenu = submenu;
                buttonRepr.icon = nativeImage.createFromPath(`${__dirname}/fileicons/foldericon.png`).resize({ width: 12, height: 12 });
            }
            else {
                var rel_path = (directory + "/" + file).split(basedir + "/")[1];
                if (rel_path == document.querySelector("#fileselect").value) buttonRepr.enabled = false;
                buttonRepr.click = new Function(`
                document.querySelector("#fileselect").value = "${rel_path}";
                openFileInTextEditor(projectdirectory, "${rel_path}");
                document.querySelector("#fileselect").scrollLeft = document.querySelector("#fileselect").scrollWidth;
                `);
                var iconPath =  `${__dirname}/fileicons/${path.extname(file).replace(".", "").toLowerCase()}.png`;
                if (fs.existsSync(iconPath)) {
                    buttonRepr.icon = nativeImage.createFromPath(iconPath).resize({ width: 12, height: 12 });
                }
            }
            arr.push(buttonRepr);
        }
    };
    constructTemplate(template, projectdirectory, projectdirectory);
    var fileMenu = Menu.buildFromTemplate(template);
    var xy = this.getBoundingClientRect();
    fileMenu.popup({
        x: Math.floor(xy.x),
        y: Math.floor(xy.y + xy.height)
    });
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
        setCMHeight();
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
editor.dispatch({
    effects: updateListener.reconfigure(EditorView.updateListener.of(function(e) {
        if (document.querySelector("#fileselect").value) {
            if (autosave) {
                saveTextFile(
                    projectdirectory + "/" + document.querySelector("#fileselect").value,
                    editor.state.doc.toString()
                );
            }
            else {
                document.querySelector("#fileselect").style.fontStyle = "italic";
            }
        }
    }))
});

var smallmenu = Menu.buildFromTemplate([
    {
        label: "Manage Files",
        click: function() {
            shell.openPath(projectdirectory);
        }
    },
    {
        label: "Close Project",
        click: function() {
            document.querySelector("#landingscreen").style.display = "";
        }
    },
    {
        label: "Settings",
        click: function() {
            ipcRenderer.send("opensettingswin");
        }
    }
]);
document.querySelector("#menubutton").addEventListener("click", function() {
    var xy = this.getBoundingClientRect();
    smallmenu.popup({
        x: Math.floor(xy.x),
        y: Math.floor(xy.y + xy.height)
    });
});

/*document.querySelector("#filemanagerbutton").addEventListener("click", function() {
    shell.openPath(projectdirectory);
});*/

document.querySelector("#openexternalbutton").addEventListener("click", function() {
    shell.openExternal(`http://localhost:${serve.port}`);
});

document.querySelector("#publishbutton").addEventListener("click", function() {
    shell.openExternal("https://pages.github.com/")
});
/*
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
    /*if (userSettings.layout == "top-bottom") {
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
    }*/
    document.querySelector(".cm-editor").style.fontSize = `${userSettings.codefontsize}px`;
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

window.addEventListener("keydown", function(e) {
    if (((process.platform == "darwin")?e.metaKey:e.ctrlKey) && e.key == "s") {
        saveTextFile(
            projectdirectory + "/" + document.querySelector("#fileselect").value,
            editor.state.doc.toString()
        );
        document.querySelector("#fileselect").style.fontStyle = "";
    }
    else if (((process.platform == "darwin")?e.metaKey:e.ctrlKey) && e.key == "r") {
        e.preventDefault();
        document.querySelector("#reloadbutton").click();
    }
    else if ((process.platform == "darwin")?(e.metaKey && e.altKey && e.key.toLowerCase() == "i"):(e.ctrlKey && e.shiftKey && e.key.toLowerCase() == "i")) {
        e.preventDefault();
        document.querySelector("#devtoolsbutton").click();
    }
});

var time = new Date();
if (time.getMonth() == 4 && time.getDate() == 1) {
    for (var elem of document.querySelectorAll("*")) {
        elem.style.fontFamily = "cursive";
    }
}