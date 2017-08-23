var express = require('express');
var bundleRepoHandler = require('../services/bundleRepoHandler');
var googleDiffEngine = require('../libs/diff-match-patch');
var fileSystemEngine = require('fs');
var revHash = require('rev-hash');
const appConfig = require('../services/config');

var router = express.Router();

/* GET users listing. */
router.get('/hello', function(req, res, next) {
    res.json({message : 'Hello from Bundler Service'});
});

router.post('/upload', function (req, res, next)  {
    let orgId = req.param('orgId');

    if (!req.files)
        return res.status(400).send('No files were uploaded.');

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let bundleObject = req.files.bundle;
    console.log(bundleObject);

    //TODO: Add up some random bits at the end of the file to make it unique for the app.
    var tempPath = '/tmp/' + bundleObject.name;
    bundleObject.mv(tempPath, function(err) {
        if (err)
            return res.status(500).send(err);
        
        // Get rev-hash for the file.
        var currentVersionHash = revHash(fileSystemEngine.readFileSync(tempPath));
        var latestVersionHash = bundleRepoHandler.getLatestVersionHash(orgId);

        if(typeof latestVersionHash === 'undefined') {
            // This is the first bundle, create and return.
            bundleRepoHandler.updateConfigObject({
                versionId: 0,
                bundleHash: currentVersionHash
            }, orgId);
        }

        if(currentVersionHash === latestVersionHash) {
            // Simply ignore the file uploaded.
        } else {
            var latestVersionId = bundleRepoHandler.incrementLatestVersionId(orgId);
            if(!latestVersionId) {
                return res.status(500).send({});
            }

            var newBundleFolder = appConfig.bundleRepoBase + orgId + "/" + latestVersionId;
            if (!fileSystemEngine.existsSync(newBundleFolder)){
                fileSystemEngine.mkdirSync(newBundleFolder);
            }

            var newBundlePath = newBundleFolder + "/bundle.js";
            fileSystemEngine.createReadStream(tempPath).pipe(fileSystemEngine.createWriteStream(newBundlePath));
            bundleRepoHandler.updateLatestBundleHash(currentVersionHash, orgId);
        }

        res.send('File uploaded!');
    });
});

router.get('/fetch', function (req, res, next)  {
    let clientVersion = req.param('version');
    let orgId = req.param('orgId');
    let latestVersion = bundleRepoHandler.getLatestBundleVersion(orgId);

    if(typeof clientVersion === 'undefined') {
        let bundleFilePath = bundleRepoHandler.getLatestBundlePath(orgId);
        fileSystemEngine.readFile(bundleFilePath, 'utf8', function (err,data) {
            res.json({
                version: latestVersion,
                type: 'bundle',
                data: data
            });
        });
    } else if(clientVersion === latestVersion) {
        // Send the empty patch.
        res.json({
            version: latestVersion,
            type: 'patch'
        });
    } else {
        // Take the latest and client version of the bundles, do the diff and send the patch to the client.
        let bundleFilePath = bundleRepoHandler.getLatestBundlePath(orgId);
        let clientBundleFilePath = bundleRepoHandler.getBundlePathForVersion(clientVersion, orgId);

        fileSystemEngine.readFile(clientBundleFilePath, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            var firstFileContent = data;
            console.log("First file read completed");

            fileSystemEngine.readFile(bundleFilePath, 'utf8', function (err,data) {
                if (err) {
                    return console.log(err);
                }
                var secondFileContent = data;
                console.log("Second file read completed");

                console.log("Diff engine started");
                //var diffLines = diffEngine.createPatch("1", firstFileContent, secondFileContent);
                var gglDiffEngine = new googleDiffEngine.googleDiffEngine();
                var patchObjs = gglDiffEngine.patch_make(firstFileContent, secondFileContent);
                console.log("Diff engine completed");

                res.json({
                    version: latestVersion,
                    type: 'patch',
                    data: patchObjs
                })
            });
        });
    }
});

module.exports = router;

