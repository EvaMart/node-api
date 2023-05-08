const { Router } = require('express');
const router = Router();
const { Octokit, App  } = require('octokit');
var  { personalAccessToken , authApp }  = require('./auth');


async function queryRepositoryObject(octokit, owner, repo){
    // Use the Explorer to build the GraphQL query: https://docs.github.com/en/graphql/overview/explorer
    const { repository } = await octokit.graphql(
        `
        {    
            repository(owner: "${owner}", name: "${repo}") {
            
            collaborators {
                nodes {
                    email
                    name
                }
                }
            description
            descriptionHTML
            homepageUrl
            isDisabled
            isEmpty
            isFork
            isInOrganization
            isLocked
            isMirror
            isPrivate
            isTemplate
            latestRelease {
                name
                tagName
            }
            licenseInfo {
                id
                name
                spdxId
                url
            }
            name
            mirrorUrl
            packages(first: 10) {
                nodes {
                    id
                    name
                    packageType
                    version(version: "") {
                    version
                    summary
                    }
                }
            }
            releases(last: 10) {
                nodes {
                    id
                    tagName
                    name
                    url
                }
            }
            url
            repositoryTopics(first: 10) {
                nodes {
                url
                topic {
                    id
                    name
                }
                }
            }
            }
        }
    `
    );

    // transform data to the observatory metadata schema
    return repository;

}


function githubMetadata(ghObject){
    console.log('hello from githubMetadata')
    const meta = {
        name: ghObject.name,
        description: ghObject.description,
        links: [
            ghObject.homepageUrl, 
            ghObject.mirrorUrl],
        isDisabled: ghObject.isDisabled,
        isEmpty: ghObject.isEmpty,
        isLocked: ghObject.isLocked,
        isPrivate: ghObject.isPrivate,
        isTemplate: ghObject.isTemplate,
        version: ghObject.releases.nodes.map((node) => node.tagName),
        license: ghObject.licenseInfo.name,
        licenseURL: ghObject.licenseInfo.url,
        licenseSPDXId: ghObject.licenseInfo.spdxId,
        repository: [ 
            ghObject.url
        ],
        github_topics_urls: ghObject.repositoryTopics.nodes.map((node) => node.url),
        github_topics_names: ghObject.repositoryTopics.nodes.map((node) => node.topic.name),
        authors: ghObject.collaborators.nodes.map((node) => node.name)
    }

    return meta;

}


async function getRepositoryMetadata(octokit, owner, repo){
    // Use the Explorer to build the GraphQL query: https://docs.github.com/en/graphql/overview/explorer
    const repository = await queryRepositoryObject(octokit, owner, repo);
    console.log('Repository object retrieved. Transforming to metadata')
    console.log(repository)
    const metadata = githubMetadata(repository);
    console.log(metadata.description)
    return metadata;
}
    
       

// Get metadata using app authentication and installation ID
router.post('/metadata', (req, res) => { 
    const { owner, repo, installationID } = req.body;
    console.log('Authenticating app')
    authApp().then((app) => {
        console.log('App authenticated. Getting installation octokit')
        console.log(installationID)
        app.getInstallationOctokit(installationID).then((octokit) => {
            console.log('Installation octokit retrieved. Getting repository metadata')
            getRepositoryMetadata(octokit, owner, repo).then((data) => {
            console.log(data)
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

/* Only for testing purposes

module.exports = githubMetadata; 
*/



