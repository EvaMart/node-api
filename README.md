# FAIR4S Evaluator GitHub App API

This repository contains the API for the FAIR4S Evaluator GitHub App. The API is used by the FAIR4S Evaluator to communicate with GitHub. To do so, the FAIR4S Evaluator is registered as a [GitHub App](https://github.com/apps/fair4s-evaluator-test).

## Dev

To run the app locally:

```sh
npm install
npm run dev
```

Some features require this app to publicly accessible. To do so, you can use [ngrok](https://ngrok.com/). To run ngrok and make the apps port (3500) public, run the following command:

```sh
ngrok http 3500
```
It should return something like this: 

![ngrok](./docs/ngrok.png)



This exposes the app in a public URL (https://9956-84-88-188-110.ngrok-free.app in the above example). This URL can be used to configure the [GitHub app webhook](#github-app-webhook).

> To install and configure ngrok, follow [these steps](https://dashboard.ngrok.com/get-started/setup). Note that running ngrok requires a personal token that can be obtained from the [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken). It needs registration.


## Interaction with GitHub APIs

## GitHub App Webhook
Whenever a repository installs, unistalls or modifies in any way its permissions to the FAIR4S Evaluator App, the GitHub app sends a webhook to the FAIR4S Evaluator API. 
The webhok configuration is set in the [app settings](https://github.com/settings/apps/fair4s-evaluator-test): 

![GitHub app webhook configuration](./docs/webhook_configuration.png)

The webhook is sent to the URL xxxx/payloads. The webhook is sent in JSON format.

## Socket.io 

## Redis 

