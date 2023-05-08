/*
Requires to uncomment the module.exports in metadata.js. 
Usage:
```
npm test
```
*/
const  githubMetadata   = require('./metadata.js');

test('Trasformation of GitHub metadata', () => {

    const fs = require('fs');
    var data =  JSON.parse(fs.readFileSync('./data/githubObject.json', 'utf8'));
    let metadata = githubMetadata(data);

    expect(metadata).toEqual(
        {
            name: "mkdocs-template",
            description: "Description of the FAIRsoft indicators, measured by the OpenEBench Software Observatory (https://openebench.bsc.es/).",
            links: [
                "https://evamart.github.io/mkdocs-template/",
                null
            ],
            isDisabled: false,
            isEmpty: false,
            isLocked: false,
            isPrivate: false,
            isTemplate: false,
            latestRelease: null,
            license: "MIT License",
            licenseURL: "http://choosealicense.com/licenses/mit/",
            licenseSPDXId: "MIT",
            repository: [
                "https://github.com/EvaMart/mkdocs-template"
            ],
            github_topics_urls: [
                "https://github.com/topics/fair"
            ],
            github_topics_names: [
                "fair"
            ],
            authors: [
                "Eva Martin del Pico"
            ]
        }
    )

});