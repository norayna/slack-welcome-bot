const express = require('express')
const crypto = require('crypto');
const timingSafeCompare = require('tsscmp');

const apiUrl = ''
const slackAccessToken = 'xoxb-2996362529415-3532914114021-DXIfNeK6HLkqIdTRrDFnu9Vr'
const slackSigningSecret = 'abf987f2f0073dccae404cefdc6ec1d2'

const app = express()

app.use(express.json())

app.use((request, response, next) => {
    const signature = request.headers['x-slack-signature'];
    const timestamp = request.headers['x-slack-request-timestamp'];
    const hmac = crypto.createHmac('sha256', process.env.SLACK_SIGNING_SECRET);
    const [version, hash] = signature.split('=');

    // Check if the timestamp is too old
    const fiveMinutesAgo = ~~(Date.now() / 1000) - (60 * 5);
    if (timestamp < fiveMinutesAgo) return false;

    hmac.update(`${version}:${timestamp}:${req.rawBody}`);

    // check that the request signature matches expected value
    if(timingSafeCompare(hmac.digest('hex'), hash)) {
        next()
    } else {
        response.status(400).send({
            message: 'The signature failed verification',
            status: 400
        })
    }
})

app.post('/events', (request, response) => {
    if (request.body.type === 'url_verification') {
       response.send({
           challenge: request.body.challenge
       })
    } else if (request.body.type === 'event_callback') {
        const event = req.body.event
        const {team_id, id} = event.user
        if(event.type === 'team_join') {
            fetch(apiUrl + '/im.open', {
                headers: {
                    'Authorisation': 'Bearer ' + slackAccessToken
                }
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data)
                    const channelId = data.channel.id
                    const message = {
                        text: 'Welcome to the slack queen',
                        channel: channelId
                    }

                    fetch(apiUrl + '/chat.postMessage', {
                        body: message,
                        headers: {
                            'Authorisation': 'Bearer ' + slackAccessToken
                        }
                    }).then(response => response.json())
                        .then(data => {
                            console.log(data)
                        })
                })
        }
    }
})

app.listen(4000)