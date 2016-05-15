package com.davesnowdon.guardDog.server;

public class AlarmState {

	public boolean armed;

	public AlarmState() {
	};

	public AlarmState(boolean armed) {
		this.armed = armed;
	}

	public boolean isArmed() {
		return armed;
	}

	public void setArmed(boolean armed) {
		this.armed = armed;
	}
}
