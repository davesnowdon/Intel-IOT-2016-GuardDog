/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
// Leave the above lines for propper jshinting
//Type Node.js Here :)

// Connect devices as follows
// D2 - IR interrupter
// D3 - red LED
// D4 - green LED
// D6 - buzzer
// A0 - sound sensor
// A1 - air quality
// A3 - vibration sensor
// I2C - LCD display

// TODO load config from config.json

var USE_WRAPPER_SCRIPT = false;
var ENABLE_PROXIMITY = true;
var ENABLE_AUDIO_ALERT = false;

var os = require('os');
var spawn = require('child_process').spawn;

//MRAA Library was installed on the board directly through ssh session
var mraa = require("mraa");

// Load Grove module
var sensorModule = require('jsupm_ldt0028');
var groveSensor = require('jsupm_grove');

var distInterrupter = require("jsupm_rfr359f");

// Instantiate an RFR359F digital pin D2
// This was tested on the Grove IR Distance Interrupter
var myDistInterrupter = new distInterrupter.RFR359F(2);

// Air quality sensor get samples using air.getSample(), higher number is worse
var air = new (require("jsupm_gas").TP401)(1);
var AIR_THRESHOLD = 150;

// Create the LDT0-028 Piezo Vibration Sensor object using AIO pin 3
var vibration = new sensorModule.LDT0028(3);
// use vibration.getSample() to get sensor value
var VIBRATION_THRESHOLD = 20;

var loudnessLib = require('jsupm_loudness');
// Instantiate a Loudness sensor on analog pin A0, with an analog
// reference voltage of 5.0
var loudness = new loudnessLib.Loudness(0, 5.0);
var LOUDNESS_THRESHOLD = 0.5; // 0.2 is conversion nearby

//Buzzer connected to D6 connector
var digital_pin_D6 = new mraa.Gpio(6);
digital_pin_D6.dir(mraa.DIR_OUT);
// start with buzz off
digital_pin_D6.write(0);

// red LED on D3
var redLed = new groveSensor.GroveLed(3);

// green LED on D4
var greenLed = new groveSensor.GroveLed(4);

var PLAY_WAV_CMD = undefined;
if (USE_WRAPPER_SCRIPT) {
    // the wrapper script runs this command (twice)
    //var PLAY_WAV_CMD = "/usr/bin/gst-launch-1.0 filesrc location= {filename} ! wavparse ! pulsesink";
    // TODO upload script as paty of XDK upload when know how to locate in filesystem (project current directory)
    PLAY_WAV_CMD = "/bin/sh /opt/soundfiles/playwav2.sh {filename}";
} else {
    PLAY_WAV_CMD = "/usr/bin/gst-launch-1.0 filesrc location= {filename} ! wavparse ! pulsesink";
}
var SECURITY_ALERT_WAV = "/opt/soundfiles/intruder.wav";
var HEALTH_ALERT_WAV = "/opt/soundfiles/air-quality.wav";
var ALL_CLEAR_WAV = "/opt/soundfiles/no-problems-detected.wav";

var MIN_AUDIO_PLAY_INTERVAL = 20000;

var alertCondition = false;
var lastAudioPlay = new Date();

console.log("This area is being guarded by K9 security");

var localAddr = localAddresses();
console.log("Local address", localAddr);
displayAddresses(localAddr);

function buzz() {
    //console.log("Buzz ON!!!");
    digital_pin_D6.write(1);
    setInterval(function () {
        //console.log("Buzz OFF!!!");
        digital_pin_D6.write(0);
    }, 500);
}

function runCmd(cmd, parameters, callback) {
    console.log("RUN: ", cmd, parameters);
    var proc = spawn(cmd, parameters);

    proc.stdout.on('data', function(data) {
        console.log('stdout: ', data);
    }); 

    proc.stderr.on('data', function(data) {
        console.log('stderr: ', data);
    });

    proc.on('close', function(code) {
        console.log('child process exited with code '+code);
        if (callback) {
            callback(code);
        }
    });
}

function playWav(filename) {
    if (filename) {
        var now = new Date();
        if ((now.getTime() - lastAudioPlay.getTime()) > MIN_AUDIO_PLAY_INTERVAL) {
            var cmdline = PLAY_WAV_CMD.replace("{filename}", filename);
            //console.log("RUN: "+cmdline);
            var c = cmdline.split(" ");
            var cmd = c[0];
            var params = c.slice(1);
            // stop new audio when we start playing
            lastAudioPlay = new Date();
            runCmd(cmd, params, function(code) {
                // add a further delay once the audio has stopped
                lastAudioPlay = new Date();
            });
        } else {
            console.log("Not playing audio, not enough time elapsed");
        }
    }
}

function sampleVibration(numSamples, delay) {
    delay = typeof delay !== 'undefined' ? delay : 20;
    var sum = 0;
    for (var i=0; i<numSamples; ++i) {
        sum += vibration.getSample();
    }
    return sum / numSamples;
}

function localAddresses() {
    var ifaces = os.networkInterfaces();
    var result = {};
    
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if ((ifname != "wlan0") && (ifname != "usb0")) {
                return;
            }
            
            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address);
                result[ifname] = iface.address
            } else {
                // this interface has only one ipv4 adress
                console.log(ifname, iface.address);
                result[ifname] = iface.address
            }
            ++alias;
        });
    });
    return result;
}

/**
 * Use the upm library to drive the two line display to display the device address on the LCD
 *
 */
function displayAddresses(addresses) {
    var lcd = require('jsupm_i2clcd');
    var display = new lcd.Jhd1313m1(0, 0x3E, 0x62);
    display.setColor(128, 128, 128);
    
    if (addresses.wlan0) { 
        display.setCursor(1, 0);
        display.write('W ' + addresses.wlan0);
    }
    
    if (addresses.usb0) {
        display.setCursor(0,0);
        display.write('U ' + addresses.usb0);
    }
}

function isSecurityAlert(sensorValues) {
    return sensorValues.proximityAlert ||
        (sensorValues.noiseLevel > LOUDNESS_THRESHOLD) ||
        (sensorValues.vibration > VIBRATION_THRESHOLD);
}

function isHealthAlert(sensorValues) {
    return sensorValues.airQuality > AIR_THRESHOLD;
}

// The IR interruptopr range appears to be about 4 inches, depending on adjustment
var monitoringInterval = setInterval(function()
{
    var result = {}
    if (ENABLE_PROXIMITY) {
        result.proximityAlert = myDistInterrupter.objectDetected();
    } else {
        result.proximityAlert = false;
    }
    result.noiseLevel = loudness.loudness();
    result.airQuality = air.getSample();
    result.vibration = sampleVibration(10, 5);
    
    if (isSecurityAlert(result)) {
        console.log("Security alert!", result);
        alertCondition = true;
        if (ENABLE_AUDIO_ALERT) {
            playWav(SECURITY_ALERT_WAV);
        }
    } else if (isHealthAlert(result)) {
        console.log("Health alert!", result);
        alertCondition = true;
        if (ENABLE_AUDIO_ALERT) {
            playWav(HEALTH_ALERT_WAV);
        }
    } else {
        if (alertCondition) {
            alertCondition = false;
            console.log("All clear :-)", result);
            if (ENABLE_AUDIO_ALERT) {
                playWav(ALL_CLEAR_WAV);
            }
        }
    }
    
    if (alertCondition) {
        redLed.on();
        greenLed.off();
        // TODO re-enable buzzer
        //buzz();
    } else {
        redLed.off();
        greenLed.on();    }
}, 100);
//clearInterval(monitoringInterval);

// When exiting: turn off LED, clear interval, and print message
process.on('SIGINT', function()
{
	clearInterval(monitoringInterval);
	console.log("Exiting...");
    // ensure buzzer is off when stopping
    digital_pin_D6.write(0);
    loudness.cleanup();
	process.exit(0);
});

function delay( milliseconds ) {
    var startTime = Date.now();
    while (Date.now() - startTime < milliseconds);
}
