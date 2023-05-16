const { Router } = require('express');
const router = Router();
const { Octokit, App  } = require('octokit');
var  { personalAccessToken , authApp }  = require('./auth');
const jsonld = require('jsonld');


/* ---------------------------------- */
/*          POST /metadata            */
/* -----------------------------------*/

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

/* ----------------------------------------- */
/*          GET  /metadata/codemeta          */
/* ----------------------------------------- */

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

function generateCodeMeta(metadata){
    var codemeta = {
        '@context': 'https://raw.githubusercontent.com/codemeta/codemeta/master/codemeta.jsonld',
        '@type': 'SoftwareApplication',
        name: metadata.name,
        description: metadata.description[0]
    }
    /*
    var codemeta = {
        '@context': 'https://raw.githubusercontent.com/codemeta/codemeta/master/codemeta.jsonld',
        '@type': 'SoftwareApplication',
        name: metadata.name,
        description: metadata.description[0],
        //author: generateAuthors(metadata),
        license: "", // URL or SPDX identifier
        url: metadata.webpage[0],
        codeRepository: metadata.repository[0],
        keywords: metadata.topics.map((topic) => topic.term),
        applicationCategory: metadata.type,
        downloadURL: metadata.download,
        operatingSystem: metadata.os,
        //softwareHelp: generateDocumentation(metadata),
        softwareRequirements: metadata.dependencies,
        softwareVersion: metadata.version[0],
        //readme: getReadme(metadata.documentation),
        isAccessibleForFree: '',
        // supportingData: https://schema.org/DataFeed // TODO may need to rescue data type
        // Data formats 
        mantainer: "", // TODO
        //buildInstructions: getBuildInstructions(metadata), // TODO
    }
    */
    return codemeta;
}


// Generate Codemeta
router.post('/metadata/codemeta', (req, res) => {
    const metadata = req.body;

    try {
        var codemeta = generateCodeMeta(metadata);
    } catch (e) {
        const resp = {
            status: e.status,
            message: e.message,
        }
        res.send(resp);
    } finally{
        const resp = {
            status: 200,
            message: 'OK',
            codemeta: codemeta
        }
        res.send(resp);
    }
    
});




/* ------------------------------------------- */
/*           POST /metadata/pull               */
/* --------------------------------------------*/

async function getOctokit(installationID){
    /*
    Get an octokit instance using app authentication
    */
    const app = await authApp();
    const octokit = await app.getInstallationOctokit(installationID);
    return octokit;
}


function jsonToBase64(object) {
    /*
    Transform a JSON object to a base64 string
    */
    const json = JSON.stringify(object);
    return Buffer.from(json).toString("base64");
  }

async function getSHAofMaster(octokit, owner, repo){
    /*
    Get the SHA of the master branch
    Get all branches and look for the one named master or main
    Returns the SHA of the master branch, the name of the branch and all the branch names
    */
    const resp = await octokit.request('GET /repos/{owner}/{repo}/branches', {
        owner: owner,
        repo: repo,
    })

    const branches = resp.data;
    const all_branch_names = branches.map((branch) => branch.name);
    for (const branch of branches) {
        if (branch.name == 'master' || branch.name == 'main'){
            console.log('SHA of master branch: ' + branch.commit.sha)
            return { 
                masterSHA : branch.commit.sha,
                branchName : branch.name,
                allBranchNames : all_branch_names
        };
        }
    }
    return null;
  }

function generateBranchName(branches){
    // look for 'evaluator' and 'evaluator-n' branches.
    const re = new RegExp("^evaluator(-[0-9]+)?$");
    const evaluator_branches = branches.allBranchNames.filter((branch) => re.test(branch));
    if(evaluator_branches.length != 0){
        // get number group
        const re2 = new RegExp("^evaluator(-([0-9]+))?$");
        var numbers = evaluator_branches.map((branch) => re2.exec(branch)[2]);
        // remove nulls
        numbers = numbers.filter((number) => number != undefined);
        // select biggest number
        const max_number = Math.max(...numbers);
        // add 1
        const new_number = max_number + 1;
        return 'evaluator-' + new_number;
    }else{
        return 'evaluator-1';
    }
}

async function createBranch(octokit, owner, repo, branchName, sha){
    /*
    Create a new branch from master
    ref: ref of the new branch. Example: refs/heads/my-new-branch
    sha: SHA of the commit to branch from (master/main)
    */

    const resp = await octokit.request('POST https://api.github.com/repos/{owner}/{repo}/git/refs',{
        owner: owner,
        repo: repo,
        ref: "refs/heads/" + branchName,
        sha: sha, 
    })
    return resp;
}

async function createFile(octokit, owner, repo, branchName, path, content, message){
    /*
    Create a new file in a branch
    */
    const resp = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner: owner,
        repo: repo,
        path: path,
        branch: branchName,
        message: message,
        committer: {
          name: 'Evaluator',
          email: 'evaluator@oeb.es'
        },
        content: content // The new file content, using Base64 encoding. https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents
    })

    return resp
}

async function createPullRequest(octokit, owner, repo, head, base,title, body){
    /*
    Create a new pull request
    */
    const resp = await octokit.request('POST /repos/{owner}/{repo}/pulls',{
        owner: owner,
        repo: repo,
        title: title,
        head: head,
        base: base,
        body: body,
        accept: 'application/vnd.github+json'
    })
    return resp;
};


router.post('/pullrequest', async (req, res) => {
    /* 
    This endpoint creates a new pull request with the codemeta file. It does:
    1. Get content to add.
    2. Get SHA of master branch (name: master or main).
    3. Create a new branch from master.
    4. Add files to branch and commit:
    5. Create pull request
    */

    const { owner, repo, installationID, metadata } = req.body;

    try{
        const codemeta = generateCodeMeta(metadata);
        const content = jsonToBase64(codemeta);
 
        const octokit = await getOctokit(installationID);

        const branches = await getSHAofMaster(octokit, owner, repo);
        const sha = branches.masterSHA;
        const baseBranch = branches.branchName;
        const newBranchName = generateBranchName(branches)
    
        await createBranch(octokit, owner, repo, newBranchName, sha);
  
        await createFile(octokit, owner, repo, newBranchName, 'test2.md', content, 'test');

        const pullrequest = await createPullRequest(octokit, 
            owner, 
            repo, 
            newBranchName, 
            baseBranch, 
            'test pull request',
            'test pull request body'
            );

        resp = {
            status: 200,
            message: 'OK',
            new_branch_name: newBranchName,
            head_branch_name: baseBranch,
            pullrequest_message: pullrequest
            }

    }catch(e){
        resp = {
            status: e.status,
            message: e.message
        }
        
    } finally {
        res.send(resp);
    }
    
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



