#! /bin/sh
gst-launch-1.0 filesrc location= $1 ! wavparse ! pulsesink
gst-launch-1.0 filesrc location= $1 ! wavparse ! pulsesink
