const { Router } = require('express');
const router = Router();
var { authApp } = require('./auth');

async function getInstallationID(app, owner, repo){
    // This function performs the actual request to the GitHub API
    const installation = await app.octokit.request(`/repos/${owner}/${repo}/installation`);
    return installation;

}


// GET /installation/id?owner=foo&repo=foo
// Get the installation ID for a repository
router.get('/installation/id', (req, res) => {
    const { owner, repo } = req.query;
    authApp().then((app) => {
        getInstallationID(app, owner, repo).then((data) => {
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


module.exports = router;
