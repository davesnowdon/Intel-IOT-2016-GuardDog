/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
// Leave the above lines for propper jshinting
//Type Node.js Here :)

// Connect devices as follows
// D2 - IR interrupter
// D6 - buzzer
// A0 - sound sensor
// A1 - air quality
// A3 - vibration sensor
// I2C - LCD display

var os = require('os');

//MRAA Library was installed on the board directly through ssh session
var mraa = require("mraa");

// Load Grove module
var sensorModule = require('jsupm_ldt0028');

var distInterrupter = require("jsupm_rfr359f");

// Instantiate an RFR359F digital pin D2
// This was tested on the Grove IR Distance Interrupter
var myDistInterrupter = new distInterrupter.RFR359F(2);

// Create the LDT0-028 Piezo Vibration Sensor object using AIO pin 3
var vibration = new sensorModule.LDT0028(3);
// use vibration.getSample() to get sensor value
var VIBRATION_THRESHOLD = 16;

//Buzzer connected to D6 connector
var digital_pin_D6 = new mraa.Gpio(6);
digital_pin_D6.dir(mraa.DIR_OUT);
// start with buzz off
digital_pin_D6.write(0);

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
    
    if (addresses.wlan0) { 
        display.setCursor(1, 0);
        display.write('W ' + addresses.wlan0);
    }
    
    if (addresses.usb0) {
        display.setCursor(0,0);
        display.write('U ' + addresses.usb0);
    }
}

// The range appears to be about 4 inches, depending on adjustment
var myInterval = setInterval(function()
{
	if (myDistInterrupter.objectDetected()) {
		console.log("Object detected");
        // TODO re-enable buzzer
        //buzz();
    } else {
		console.log("Area is clear");
    }
}, 100);
// TODO enable IR detection
clearInterval(myInterval);

var vibrationInterval = setInterval(function()
{
    var sample = sampleVibration(20);
    if (sample > VIBRATION_THRESHOLD) {
        console.log("Vibration detected = "+sample);
    } 
}, 500);
// TODO enable IR detection
//clearInterval(vibrationInterval);


// When exiting: turn off LED, clear interval, and print message
process.on('SIGINT', function()
{
	clearInterval(myInterval);
    clearInterval(vibrationInterval);
	console.log("Exiting...");
    // ensure buzzer is off when stopping
    digital_pin_D6.write(0);
	process.exit(0);
});

function delay( milliseconds ) {
    var startTime = Date.now();
    while (Date.now() - startTime < milliseconds);
}
