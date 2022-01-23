const { remote, app, shell } = require("electron");
const fs = require("fs");
const { dialog } = remote;

var projectdirectory = "";

function openFileInTextEditor(dir, rel_path) {
    var textarea = document.querySelector("#texteditor");
    textarea.value = fs.readFileSync(dir + "/" + rel_path);
}

function setProject(dir) {
    var recursion = function(directory, optgroup) {
        var dircontents = fs.readdirSync(directory);
        for (var file of dircontents) {
            if (fs.lstatSync(directory + "/" + file).isDirectory()) {
                if (file != ".git") {
                    var newOptGroup = document.createElement("optgroup");
                    newOptGroup.setAttribute("label", file);
                    optgroup.appendChild(newOptGroup);
                    recursion(directory + "/" + file, newOptGroup);
                }
            }
            else {
                var option = document.createElement("option");
                option.innerText = file;
                optgroup.appendChild(option);
            }
        }
    };

    recursion(dir, document.querySelector("#fileselect"));

    fileselect.value = "index.html";
    openFileInTextEditor(dir, "index.html");

    document.querySelector("#pagepreview").src = "file://" + dir + "/index.html";
    document.querySelector("#addressbar").value = "file://" + dir + "/index.html";
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