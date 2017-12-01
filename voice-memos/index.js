const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const urlencoded = require('body-parser').urlencoded;

const app = express();

// Parse incoming POST params with Express middleware
app.use(urlencoded({ extended: false }));

app.post('/voice', (request, response) => {
    // Use the Twilio Node.js SDK to build an XML response
    const twiml = new VoiceResponse();

    const gather = twiml.gather({
        numDigits: 5,
        action: '/gather',
    });
    gather.say('Enter the calling code');

    // If the user doesn't enter input, loop
    twiml.redirect('/voice');

    // Render the response as XML in reply to the webhook request
    response.type('text/xml');
    response.send(twiml.toString());
});

app.post('/gather', (request, response) => {
    // Use the Twilio Node.js SDK to build an XML response
    const twiml = new VoiceResponse();

    // If the user entered digits, process their request
    if (request.body.Digits) {
        console.log(request.body.CallSid);
        console.log(request.body.Digits);

        twiml.say('Leave your comment after the beep. Press any key or hang up when finished.');

        twiml.record({
            action: '/record',
            transcribeCallback: '/transcribe',
            transcribe: true,
        });

        twiml.hangup();
    } else {
        // If no input was sent, redirect to the /voice route
        twiml.redirect('/voice');
    }

    // Render the response as XML in reply to the webhook request
    response.type('text/xml');
    response.send(twiml.toString());
});

app.post('/record', (request, response) => {
    const twiml = new VoiceResponse();

    console.log(request.body.CallSid);
    console.log(request.body.RecordingUrl);

    // TODO: Delete recording

    response.type('text/xml');
    response.send(twiml.toString());
});

app.post('/transcribe', (request, response) => {
    const twiml = new VoiceResponse();

    console.log(request.body.CallSid);
    console.log(request.body.RecordingUrl);
    console.log(request.body.TranscriptionText);

    // TODO: Delete transcription?

    response.type('text/xml');
    response.send(twiml.toString());
});

const PORT = process.env.PORT || 9000

app.listen(PORT, () => {
    console.log('Node app is running on port', PORT)
})