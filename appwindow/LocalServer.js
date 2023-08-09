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

            if (req.path == "/") {
                filePath = path.join(this._dir, "index.html");
            }
        
            if (!fs.existsSync(filePath)) {
                return res.status(404).send("<h1>404 error!!!</h1>Atlanta area code.");
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