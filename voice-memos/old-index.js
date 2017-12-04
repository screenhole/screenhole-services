const express = require('express');
const axios = require('axios');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const urlencoded = require('body-parser').urlencoded;

const app = express();

// TODO: configure
axios.defaults.baseURL = process.env.API_BASE_LOCAL;

// Parse incoming POST params with Express middleware
app.use(urlencoded({ extended: false }));

app.post('/voice', (request, response) => {
    const twiml = new VoiceResponse();

    // gather calling_code from user
    const gather = twiml.gather({
        numDigits: 5,
        action: '/gather',
    });
    gather.say('Enter the calling code');

    // If the user doesn't enter input, loop
    twiml.redirect('/voice');

    response.type('text/xml');
    response.send(twiml.toString());
});

app.post('/gather', (request, response) => {
    const twiml = new VoiceResponse();

    // If the user entered digits, process their request
    if (request.body.Digits) {
        const env = request.body.Digits.charAt(5);
        
        // attach CallSid to calling_code
        axios.post('/svc/memo/voice', {
            call_sid: request.body.CallSid,
            calling_code: request.body.Digits.substring(0, 4),
        }).then(function(res){
            // initiate voice recording
            twiml.say('Leave your comment after the beep. When finished, press any key or hang up');

            twiml.record({
                action: '/record',
                transcribeCallback: '/transcribe',
                transcribe: true,
            });

            twiml.hangup();

            response.type('text/xml');
            response.send(twiml.toString());
        }).catch(function(){
            twiml.say('Sorry, there was an error. Try again later!');
            twiml.hangup();
        })
    } else {
        twiml.redirect('/voice');
    }
});

app.post('/record', (request, response) => {
    const twiml = new VoiceResponse();

    // save recording
    console.log({
        call_sid: request.body.CallSid,
        recording_url: request.body.RecordingUrl,
    })

    response.type('text/xml');
    response.send(twiml.toString());
});

app.post('/transcribe', (request, response) => {
    const twiml = new VoiceResponse();

    // save transcript
    console.log({
        call_sid: request.body.CallSid,
        recording_url: request.body.RecordingUrl,
        transcription_text: request.body.TranscriptionText,
    })

    response.type('text/xml');
    response.send(twiml.toString());
});

const PORT = process.env.PORT || 9000

app.listen(PORT, () => {
    console.log('Node app is running on port', PORT)
})