const { Router } = require('express');
const router = Router();
const { Octokit, App  } = require('octokit');
var  { personalAccessToken , authApp }  = require('./auth');
const jsonld = require('jsonld');

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

function removeNull(array){
    return array.filter(val => val !== null)
}

function buildTopics(githubObject){
    /*
    For each topic in the github object, generate an item in the topics array
    {
        "vocabulary": "EDAM",
        "term": "Topic",
        "uri": "http://edamontology.org/topic_0003"
    }
    */
    let topics = [];
    githubObject.repositoryTopics.nodes.forEach((node) => {
        var item = {
            uri: node.url,
            term: node.topic.name,
            vocabulary: 'GitHub topics'
        }
        topics.push(item);
    });
    return topics;
}


function githubMetadata(ghObject){
    console.log('hello from githubMetadata')
    const meta = {
        name: ghObject.name,
        label: [
            ghObject.name
        ],
        description: removeNull([ 
            ghObject.description 
        ]),
        links: removeNull([
            ghObject.mirrorUrl 
        ]),
        webpage: removeNull([
            ghObject.homepageUrl
        ]),
        isDisabled: ghObject.isDisabled,
        isEmpty: ghObject.isEmpty,
        isLocked: ghObject.isLocked,
        isPrivate: ghObject.isPrivate,
        isTemplate: ghObject.isTemplate,
        version: ghObject.releases.nodes.map((node) => node.tagName),
        license: removeNull([
            ghObject.licenseInfo.name
        ]),
        licenseURL: removeNull([ 
            ghObject.licenseInfo.url
        ]),
        licenseSPDXId: removeNull([ 
            ghObject.licenseInfo.spdxId
        ]),
        repository: removeNull([ 
            ghObject.url
        ]),
        
        topics: buildTopics(ghObject),
        operations: [],
        authors: removeNull(ghObject.collaborators.nodes.map((node) => node.name)),
        bioschemas: false,
        contribPolicy: false,
        dependencies: [],
        documentation: [],
        download: [], // This could be package or come from repository contents
        edam_operations: [],
        edam_topics: [],
        https: true,
        input: [],
        inst_instr: false,
        operational: false,
        os: [],
        output: [],
        publication: [],
        semantics: {
            inputs: [],
            outputs: [],
            topics: [],
            operations: [],
        },
        source: ['github'],
        src: [],
        ssl: true,
        tags: [],
        test: false,
        type: "",   
    }

    return meta;

}
    
function PrepareListsIds(metadata){
    /*
    For each field in the metadata, if it is a list, add an id to each item in the list
    From:
    [
        term1,
        term2,
        ...
    ]
    To:
    [
        { term: term1, id: id1 },
        { term: term2, id: id2 },
        ...
    ]
    */
    const fields = [
        'edam_topics',
        'edam_operations',
        'documentation',
        'description',
        'webpage',
        'license',
        'src',
        'links',
        'topics',
        'operations',
        'input',
        'output',
        'repository',
        'dependencies',
        'os',
        'authors',
        'publication',
    ]
    
    for (const field of fields) {
        var n=0;
        new_field = []
        for (var item of metadata[field]) {
            new_field.push({
                term: item,
                id: n
            });
            n++;
        };
        metadata[field] = new_field;
    }
    return metadata;

}

async function getRepositoryMetadata(octokit, owner, repo){
    // Use the Explorer to build the GraphQL query: https://docs.github.com/en/graphql/overview/explorer
    const repository = await queryRepositoryObject(octokit, owner, repo);
    console.log('Repository object retrieved. Transforming to metadata')
    var metadata = githubMetadata(repository); // transform data to the observatory metadata schema
    metadata = PrepareListsIds(metadata); // add ids to specific lists so they can be used in the UI
    console.log(metadata)
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


router.post('/pullrequest', (req, res) => {
    const { owner, repo, installationID } = req.body;
    console.log('Authenticating app')
    authApp().then((app) => {
        app.getInstallationOctokit(installationID).then((octokit) => {
            console.log('Making request')
            octokit.request('POST /repos/{owner}/{repo}/pulls',{
                owner: owner,
                repo: repo,
                title: 'Test pull request',
                head: 'test-branch',
                base: 'main',
                body: 'This is a test pull request',
                accept: 'application/vnd.github+json',
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                  }
            }).then((response) => {
                console.log(response)
                res.json({
                    data: response,
                    status: 200,
                });
            })
        });
    });

})

function generateAuthors(metadata){
    /*
    For each author in the metadata, generate an item in the authors array
    {
        "name": "",
        "email": ""
    }
    */
    let authors = [];
    metadata.authors.forEach((author) => {
        var item = {
            "@type": "Person",
            "@id": "",
            name: author,
            email: "",
        }
        authors.push(item);
    });
    return authors;
}

function generateDocumentation(metadata){
// creative work
}

function generatePublication(metadata){
// scholarly article
}

function getReadme(documentation){
// get readme from documentation
}

function getBuildInstructions(documentation){
// get build instructions from documentation
}


// Generate Codemeta
router.post('/metadata/codemeta', (req, res) => {
    const metadata = req.body;

    var codemeta = {
        '@context': 'https://raw.githubusercontent.com/codemeta/codemeta/master/codemeta.jsonld',
        '@type': 'SoftwareApplication',
        name: metadata.name,
        description: metadata.description[0],
        author: generateAuthors(metadata),
        license: "", // URL or SPDX identifier
        url: metadata.webpage[0],
        codeRepository: metadata.repository[0],
        keywords: metadata.topics.map((topic) => topic.term),
        applicationCategory: metadata.type,
        downloadURL: metadata.download,
        operatingSystem: metadata.os,
        softwareHelp: generateDocumentation(metadata),
        softwareRequirements: metadata.dependencies,
        softwareVersion: metadata.version[0],
        readme: getReadme(metadata.documentation),
        isAccessibleForFree: '',
        // supportingData: https://schema.org/DataFeed // TODO may need to rescue data type
        // Data formats 
        mantainer: "", // TODO
        buildInstructions: getBuildInstructions(metadata), // TODO
    }
});


async function compact(doc, context){
    const compacted = await jsonld.compact(doc, context);
    return compacted;
}

// Recontextualize metadata example
router.post('/recontextualize/example', (req, res) => {
    
    const doc = {
        "http://schema.org/name": "Manu Sporny",
        "http://schema.org/url": {"@id": "http://manu.sporny.org/"},
        "http://schema.org/image": {"@id": "http://manu.sporny.org/images/manu.png"}
    };
    const context = {
        "name": "http://schema.org/name",
        "homepage": {"@id": "http://schema.org/url", "@type": "@id"},
        "image": {"@id": "http://schema.org/image", "@type": "@id"}
    };

    // compact a document according to a particular context
    compact(doc, context).then(
        (compacted) => {
            res.json({
                data: compacted,
                status: 200,
            });
        },
    ).catch((error) => {
        res.json({
            data: null,
            status: error.status,
            message: error.message,
        });
    }
    );

})


async function expand(compacted){
    const expanded = await jsonld.expand(compacted);
    return expanded;
}

router.post('/expand', (req, res) => {
    const compacted = req.body;
    /*
    const compacted = {
		"@context": {
			"name": "http://schema.org/name",
			"homepage": {
				"@id": "http://schema.org/url",
				"@type": "@id"
			},
			"image": {
				"@id": "http://schema.org/image",
				"@type": "@id"
			}
		},
		"image": "http://manu.sporny.org/images/manu.png",
		"name": "Manu Sporny",
		"homepage": "http://manu.sporny.org/"
	};
    */
    expand(compacted).then(
        (expanded) => {
            res.json({
                data: expanded,
                status: 200,
            });
        }
    ).catch((error) => {
        res.json({
            data: null,
            status: error.status,
            message: error.message,
        });
    });
})

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



