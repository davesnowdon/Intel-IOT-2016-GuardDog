
 //[START begin]
package com.davesnowdon.guardDog.server;

import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.api.server.spi.response.NotFoundException;
import com.google.appengine.api.users.User;

import java.util.ArrayList;

import javax.inject.Named;
//[END begin]
//[START api_def]

/**
 * Defines v1 of a simple API representing an alarm state and whether it is armed
 */
@Api(name = "guarddog",
    version = "v1",
    scopes = {Constants.EMAIL_SCOPE},
    clientIds = {Constants.WEB_CLIENT_ID, Constants.ANDROID_CLIENT_ID, Constants.IOS_CLIENT_ID},
    audiences = {Constants.ANDROID_AUDIENCE}
)
public class Greetings {

  public static AlarmState alarmState = new AlarmState(false);

//[END api_def]
//[START armed]

  public AlarmState getAlarmState() throws NotFoundException {
      return alarmState;
  }
//[END armed]
//[START arm]

  @ApiMethod(httpMethod = "post")
  public AlarmState setAlarmState(AlarmState greeting) {
    alarmState = greeting;
    return alarmState;
  }
//[END arm]
}
