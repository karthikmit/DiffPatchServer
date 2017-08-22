var fileSystemEngine = require('fs');
const appConfig = require('./config');

class BundleRepoHandler {
    constructor() {
        this.configObjects = {

        };
    }

    getLatestVersionHash(orgId) {
        var configObject = this.getConfigObject(orgId);
        return configObject['bundleHash'];
    }

    incrementLatestVersionId(orgId) {
        var configObject = this.getConfigObject(orgId);
        if(configObject) {
            configObject['versionId'] += 1;
            this.syncConfigObject(configObject, orgId);
            return true;
        }
    }

    getConfigObject(orgId) {
        if(!this.configObjects[orgId]) {
            this.configObjects[orgId] = this.readConfigObject(orgId);
        }

        var configObject = this.configObjects[orgId];
        return configObject;
    }

    getLatestBundlePath(orgId) {
        var configObject = this.getConfigObject(orgId);
        if(configObject.versionId) {
            let baseBundleFolder = appConfig.bundleRepoBase + orgId;
            let bundlePath = baseBundleFolder + "/" + configObject.versionId + "/bundle.js";

            return bundlePath;
        }
    }

    getBundlePathForVersion(version, orgId) {
        let baseBundleFolder = appConfig.bundleRepoBase + orgId;
        let bundlePath = baseBundleFolder + "/" + version + "/bundle.js";

        return bundlePath;
    }

    syncConfigObject(configObject, orgId) {
        var configPath = this.getBundleConfigPath(orgId);
        fs.writeFileSync(configPath, JSON.stringify(configObject));
    }

    readConfigObject(orgId) {
        let configFilePath = this.getBundleConfigPath(orgId);
        if(!fs.existsSync(configFilePath)) {
            // New OrgID has to be initiated.
            var configObject = {
                
            };
            this.syncConfigObject(configObject, orgId);
        }
        return fs.readFileSync(configFilePath);
    }

    getBundleConfigPath(orgId) {
        let baseBundleFolder = appConfig.bundleRepoBase + orgId;
        if (!fs.existsSync(baseBundleFolder)) {
            fs.mkdirSync(baseBundleFolder);
        }

        let configFilePath = baseBundleFolder + "/bundle.json";
        return configFilePath;
    }
}

module.exports = new BundleRepoHandler();