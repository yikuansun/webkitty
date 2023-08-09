const express = require("express");
const path = require("path");
const mime = require("mime-types");
const fs = require("fs");

class LocalServer {
    app;
    server;
    _dir = "~/";

    constructor() {
        this.app = express();
        this.server = this.app.listen(1995, function() {
            console.log("http://localhost:1995");
        });
        this.app.get("*", (req, res) => {
            var filePath = path.join(this._dir, req.path);
        
            if (!fs.existsSync(filePath)) {
                var document404 = "<h1>404 error!!!</h1>Atlanta area code.";
                if (fs.existsSync(path.join(this._dir, "404.html"))) document404 = fs.readFileSync(path.join(this._dir, "404.html"));
                res.set({ "content-type": "text/html" });
                return res.status(404).send(document404);
            }

            if (fs.lstatSync(filePath).isDirectory()) {
                filePath = path.join(filePath, "index.html");
            }

            var data = fs.readFileSync(filePath);
            var type = mime.lookup(filePath);
            res.set({ "content-type": type });
            return res.send(data);
        });
    }

    set dir(val) {
        this._dir = val;
    }

    get dir() {
        return this._dir;
    }

    get port() {
        return this.server.address().port;
    }
}

module.exports = LocalServer;