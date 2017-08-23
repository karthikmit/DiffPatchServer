var fs = require('fs');
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

    getLatestBundleVersion(orgId) {
        var configObject = this.getConfigObject(orgId);
        if(configObject) {
            return configObject['versionId'];
        }
    }

    incrementLatestVersionId(orgId) {
        var configObject = this.getConfigObject(orgId);
        if(configObject) {
            configObject['versionId'] += 1;
            this.syncConfigObject(configObject, orgId);
            return configObject['versionId'];
        }
    }

    updateLatestBundleHash(newHash, orgId) {
        var configObject = this.getConfigObject(orgId);
        if(configObject) {
            configObject['bundleHash'] = newHash;
            this.syncConfigObject(configObject, orgId);
            return true;
        }
    }

    updateConfigObject(configNew, orgId) {
        var configObject = this.getConfigObject(orgId);
        configObject['versionId'] = configNew['versionId'];
        configObject['bundleHash'] = configNew['bundleHash'];

        this.syncConfigObject(configObject, orgId);
    }

    getConfigObject(orgId) {
        if(!this.configObjects[orgId]) {
            this.configObjects[orgId] = this.readConfigObject(orgId);
        }

        return this.configObjects[orgId];
    }

    getLatestBundlePath(orgId) {
        var configObject = this.getConfigObject(orgId);
        if(configObject.versionId) {
            let baseBundleFolder = appConfig.bundleRepoBase + orgId;
            return baseBundleFolder + "/" + configObject.versionId + "/bundle.js";
        }
    }

    getBundlePathForVersion(version, orgId) {
        let baseBundleFolder = appConfig.bundleRepoBase + orgId;
        return baseBundleFolder + "/" + version + "/bundle.js";
    }

    syncConfigObject(configObject, orgId) {
        var configPath = this.getBundleConfigPath(orgId);
        console.log("Config to be written :: " + configObject);
        var configString = JSON.stringify(configObject);
        console.log("Config to be written :: " + configString);
        fs.writeFileSync(configPath, configString);
    }

    readConfigObject(orgId) {
        let configFilePath = this.getBundleConfigPath(orgId);
        if(!fs.existsSync(configFilePath)) {
            // New OrgID has to be initiated.
            var configObject = {
                
            };
            this.syncConfigObject(configObject, orgId);
        }
        var fileContent = fs.readFileSync(configFilePath).toString();

        return JSON.parse(fileContent);
    }

    getBundleConfigPath(orgId) {
        let baseBundleFolder = appConfig.bundleRepoBase + orgId;
        if (!fs.existsSync(baseBundleFolder)) {
            fs.mkdirSync(baseBundleFolder);
        }

        return baseBundleFolder + "/bundle.json";
    }
}

module.exports = new BundleRepoHandler();