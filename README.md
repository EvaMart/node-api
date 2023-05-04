# FAIR4S Evaluator GitHub App API

This repository contains the API for the FAIR4S Evaluator GitHub App. The API is used by the FAIR4S Evaluator to communicate with GitHub. To do so, the FAIR4S Evaluator is registered as a [GitHub App](https://github.com/apps/fair4s-evaluator-test).

## GitHub webhook payload

Example of payload sent after the addiction of an the app "fair4s-evaluator-test" to the repository "EvaMart/CitySentinel":
```json
    {
    action: 'added',
    installation: {
      id: 37102421,
      account: {
        login: 'EvaMart',
        id: 11412829,
        node_id: 'MDQ6VXNlcjExNDEyODI5',
        avatar_url: 'https: //avatars.githubusercontent.com/u/11412829?v=4',
        gravatar_id: '',
        url: 'https: //api.github.com/users/EvaMart',
        html_url: 'https: //github.com/EvaMart',
        followers_url: 'https: //api.github.com/users/EvaMart/followers',
        following_url: 'https: //api.github.com/users/EvaMart/following{/other_user}',
        gists_url: 'https: //api.github.com/users/EvaMart/gists{/gist_id}',
        starred_url: 'https: //api.github.com/users/EvaMart/starred{/owner}{/repo}',
        subscriptions_url: 'https: //api.github.com/users/EvaMart/subscriptions',
        organizations_url: 'https: //api.github.com/users/EvaMart/orgs',
        repos_url: 'https: //api.github.com/users/EvaMart/repos',
        events_url: 'https: //api.github.com/users/EvaMart/events{/privacy}',
        received_events_url: 'https: //api.github.com/users/EvaMart/received_events',
        type: 'User',
        site_admin: false
            },
      repository_selection: 'selected',
      access_tokens_url: 'https: //api.github.com/app/installations/37102421/access_tokens',
      repositories_url: 'https: //api.github.com/installation/repositories',
      html_url: 'https: //github.com/settings/installations/37102421',
      app_id: 324890,
      app_slug: 'fair4s-evaluator-test',
      target_id: 11412829,
      target_type: 'User',
      permissions: { contents: 'read', metadata: 'read', pull_requests: 'write'
            },
      events: [],
      created_at: '2023-05-03T12: 29: 27.000+02: 00',
      updated_at: '2023-05-04T11: 46: 10.000+02: 00',
      single_file_name: null,
      has_multiple_single_files: false,
      single_file_paths: [],
      suspended_by: null,
      suspended_at: null
        },
    repository_selection: 'selected',
    repositories_added: [
            {
        id: 120319114,
        node_id: 'MDEwOlJlcG9zaXRvcnkxMjAzMTkxMTQ=',
        name: 'CitySentinel',
        full_name: 'EvaMart/CitySentinel',
        private: false
            }
        ],
    repositories_removed: [],
    requester: null,
    sender: {
      login: 'EvaMart',
      id: 11412829,
      node_id: 'MDQ6VXNlcjExNDEyODI5',
      avatar_url: 'https: //avatars.githubusercontent.com/u/11412829?v=4',
      gravatar_id: '',
      url: 'https: //api.github.com/users/EvaMart',
      html_url: 'https: //github.com/EvaMart',
      followers_url: 'https: //api.github.com/users/EvaMart/followers',
      following_url: 'https: //api.github.com/users/EvaMart/following{/other_user}',
      gists_url: 'https: //api.github.com/users/EvaMart/gists{/gist_id}',
      starred_url: 'https: //api.github.com/users/EvaMart/starred{/owner}{/repo}',
      subscriptions_url: 'https: //api.github.com/users/EvaMart/subscriptions',
      organizations_url: 'https: //api.github.com/users/EvaMart/orgs',
      repos_url: 'https: //api.github.com/users/EvaMart/repos',
      events_url: 'https: //api.github.com/users/EvaMart/events{/privacy}',
      received_events_url: 'https: //api.github.com/users/EvaMart/received_events',
      type: 'User',
      site_admin: false
        }
    }

```