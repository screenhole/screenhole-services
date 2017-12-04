const { send } = require('micro');
const parse = require('urlencoded-body-parser');

const VoiceResponse = require('twilio').twiml.VoiceResponse;

// TODO: configure
const request = require('request-promise').defaults({
    simple: true,
    baseUrl: process.env.API_BASE,
    url: '/svc/memo/voice',
});

function xml(res) {
    if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'text/xml')
    }

    return res;
}

module.exports = async function(req, res) {
    const body = await parse(req)

    console.log(req.url, body);

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
                    
                    request.post({ form: {
                        call_sid: body.CallSid,
                        calling_code: body.Digits,
                    }}).then(function(data){
                        console.log('/gather success: ', data);

                        // initiate voice recording
                        twiml.say('Leave your comment after the beep. When finished, press any key or hang up');

                        twiml.record({
                            action: '/record',
                            transcribeCallback: '/transcribe',
                            transcribe: true,
                        });
                    }).catch(function(err){
                        console.log('/gather error: ', err.error);
                        twiml.say("Sorry, something went wrong. Try again later!");
                    }).finally(function(){
                        twiml.hangup();
                        send(xml(res), 200, twiml.toString());
                    });
                } else {
                    twiml.redirect('/voice');
                }

                break;

            case '/record':
                request.post({ form: {
                    call_sid: body.CallSid,
                    recording_url: body.RecordingUrl,
                }}).then(function(data){
                    console.log('/record success: ', data);
                }).catch(function(err){
                    console.log('/record error: ', err.error);
                }).finally(function(){
                    twiml.hangup();
                    send(xml(res), 200, twiml.toString());
                });

                break;

            case '/transcribe':
                request.post({ form: {
                    call_sid: body.CallSid,
                    recording_url: body.RecordingUrl,
                    transcription_text: body.TranscriptionText,
                }}).then(function(data){
                    console.log('/transcribe success: ', data);
                }).catch(function(err){
                    console.log('/transcribe error: ', err.error);
                }).finally(function(){
                    twiml.hangup();
                    send(xml(res), 200, twiml.toString());
                });

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
