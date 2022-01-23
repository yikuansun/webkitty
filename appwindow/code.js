const { remote, app, shell } = require("electron");
const { dialog } = remote;

var projectdirectory = "";
document.querySelector("#projectselect").addEventListener("click", function() {
    var dir = dialog.showOpenDialogSync({
        properties: ["openDirectory"]
    });
    if (dir) {
        projectdirectory = dir;
        document.querySelector("#landingscreen").style.display = "none";
    }
});