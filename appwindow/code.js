const { remote, app, shell } = require("electron");
const fs = require("fs");
const { dialog } = remote;

var projectdirectory = "";
function setProject(dir) {
    var dircontents = fs.readdirSync(dir);
    var fileselect = document.querySelector("#fileselect");
    for (var file of dircontents) { // can't handle nested folder yet
        var option = document.createElement("option");
        option.innerText = file;
        fileselect.appendChild(option);

        if (file.split(".")[file.split(".").length - 1].toLowerCase() == "html") {
            document.querySelector("#previewselect").appendChild(option);
        }
    }

    document.querySelector("#pagepreview").src = "file://" + dir + "/index.html";
    document.querySelector("#previewselect").value = "index.html";
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