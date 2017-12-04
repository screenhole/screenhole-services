const { send } = require('micro');
const parse = require('urlencoded-body-parser');

const request = require('request')
const VoiceResponse = require('twilio').twiml.VoiceResponse;

// TODO: configure
const API_BASE = process.env.API_BASE;

function xml(res) {
    if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'text/xml')
    }

    return res;
}

module.exports = async function(req, res) {
    const body = await parse(req)

    // const data = await request({
    //     baseUrl: API_BASE,
    //     uri: '/shots',
    //     json: true
    // })

    console.log(body);

    try {
        const twiml = new VoiceResponse();

        switch (req.url) {
            case '/voice':
                // gather calling_code from user
                const gather = twiml.gather({
                    numDigits: 5,
                    action: '/gather',
                });
                gather.say('Enter the calling code');

                // If the user doesn't enter input, loop
                twiml.redirect('/voice');

                send(xml(res), 200, twiml.toString());
                break;

            case '/gather':
                // If the user entered digits, process their request
                if (body.Digits) {
                    const env = body.Digits.charAt(5);
                    
                    // initiate voice recording
                    twiml.say('Leave your comment after the beep. When finished, press any key or hang up');

                    twiml.record({
                        action: '/record',
                        transcribeCallback: '/transcribe',
                        transcribe: true,
                    });

                    twiml.hangup();
                } else {
                    twiml.redirect('/voice');
                }

                send(xml(res), 200, twiml.toString());
                break;

            case '/record':
                send(xml(res), 200, twiml.toString());
                break;

            case '/transcribe':
                send(xml(res), 200, twiml.toString());
                break;

            default:
                send(res, 200, ';)');
                break;
        }
    } catch (err) {
        var msg = { error: true, message: err.message }

        if (process.env.NODE_ENV !== 'production' && err.stack) {
            msg.stack = err.stack;
        }

        send(res, err.statusCode || 500, msg);
    }
}
