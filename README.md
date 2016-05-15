Edison Guard Dog Application
============================
This application makes use of a number of grove sensors and actuators connected to the Edison including.
* IR interruptor
* sound (noise) sensor
* air quality sensor
* LCD 2-line display with RGB backlight
* red & green LEDs
* vibration sensor

The application also makes use of a Bluetooth connnected speaker. Any speaker should work, but this one (a Bluetooth controlled K9) was used to make the application more visually interesting: http://www.ebay.co.uk/itm/381567203632?_trksid=p2060353.m1438.l2649&ssPageName=STRK%3AMEBIDX%3AIT

Reverse engineering the K9's Bluetooth protocol to allow the Edison to make the K9 robot move would be a nice feature to add in future.

The Edison part of the application is built using Intel's XDK IoT Edition IDE


Connecting the Bluetooth speaker to Edison
------------------------------------------
Replace 00:58:50:00:08:21 with the address of your speaker (which can be discovered using the "scan on" command of bluetoothctl

    rfkill unblock bluetooth
    bluetoothctl
    # run the following commands inside bluetoothctl
    scan on
    pair 00:58:50:00:08:21
    connect 00:58:50:00:08:21
    quit

    # use pactl to find the speaker and make the the default
    pactl list sinks
    pactl set-default-sink bluez_sink.00_58_50_00_08_21

