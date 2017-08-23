var bundleRepoHandler = require('../services/bundleRepoHandler');

describe("BundleRepo Handler", function () {
    describe("getLatestVersionHash tests", function () {
        it("should return undefined if the bundle for the org is not available", function () {
            var latestVersionHash = bundleRepoHandler.getLatestVersionHash();
            expect(latestVersionHash).toBeUndefined();
        });
    });
});