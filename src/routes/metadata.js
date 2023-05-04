const { Router } = require('express');
const router = Router();
const { Octokit, App  } = require('octokit');
var  { personalAccessToken , authApp }  = require('./auth');

async function getRepositoryMetadata(octokit, owner, repo){
  // Use the Explorer to build the GraphQL query: https://docs.github.com/en/graphql/overview/explorer
  const { repository } = await octokit.graphql(
    `
      {
        repository(owner: "${owner}", name: "${repo}") {
          collaborators(first: 10), 
          contactLinks,
          description,
          descriptionHTML,
          homepageUrl,
          labels,
          repositoryTopics,
          languages,
          primaryLanguage, 
          licenseInfo,
          packages,
          releases,
          submodules,
          visibility
        }
      }
    `
  );

  return repository;

}

// Get metadata using app authentication and installation ID
router.get('/metadata', (req, res) => { 
    const { owner, repo, installationID } = req.query;
    console.log(typeof(getInstallationOctokit));
    authApp().then((app) => {
      app.getInstallationOctokit(installationID).then((octokit) => {
            getRepositoryMetadata(octokit, owner, repo).then((data) => {
              res.json({
                  data: data,
                  status: 200,
              });
            }).catch((error) => {
                res.json({
                    data: null,
                    status: error.status,
                    message: error.message,
                });
            });
        });
    });

});

////////
// Test getting metadata (using personal access token)
////////

async function getTestMetadataUsingPersonalToken(octokit){
  // Get the last 3 issues from the graphql.js repository
  // using a personal access token
  const { repository } = await octokit.graphql(
      `
        {
          repository(owner: "evamart", name: "mkdocs-template") {
            issues(last: 3) {
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      `
    );
  console.log(repository)
  return repository;
}

// Get metadata using user personal access token
router.get('/metadata/test', (req, res) => {
  personalAccessToken().then((octokit) => {
    getTestMetadataUsingPersonalToken(octokit).then((data) => {
        res.json(data);
    });
  });
});


module.exports = router;