const { Octokit, App  } = require('octokit');


module.exports = {
    authApp: async function () {
        // Authenticate as an installation of an app, but not as a user
        // Returns an authenticated instance of octokit

        // reading the app private key from a file
        // TODO: in production, put as env variable
        const fs = require("fs");
        var myKey = fs.readFileSync("/Users/evabsc/projects/software-observatory/node-api/src/routes/fair4s-evaluator-test.2023-04-27.private-key.pem", "utf8");
        
        const app = await new App({
            appId: 324890,
            privateKey: myKey,
        });

        return app;

    },

    personalAccessToken: async function () {
        // Authenticate using a personal access token
        // Returns an authenticated instance of octokit

        // Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
        const octokit = await new Octokit({ auth: "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" });
        return octokit;
    },

}

