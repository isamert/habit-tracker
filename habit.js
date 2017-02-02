/**
 * Copyright (C) 2017  İsa Mert Gürbüz
 * 
 * This file is part of habittracker@isamert.net.
 * 
 * habittracker@isamert.net is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * habittracker@isamert.net is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with habittracker@isamert.net.  If not, see <http://www.gnu.org/licenses/>.
 * 
 */

const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const DateUtils = Me.imports.utils.DateUtils;


const Habit = new Lang.Class({
    Name: 'Habit',

    _init: function() {
        this.name = null;
        this.description = null;
        this.create_date = null;

        this.repeat = null;
        this.repeat_day = null;

        this.reminder_hour = null;
        this.reminder_days = [];

        this.days_done = [];
    },

    toJson: function() {
        return JSON.stringify(this);
    },

    fromJson: function(json) {
        let obj = JSON.parse(json, DateUtils.dateReviver);
        this.fromObj(obj);
    },

    fromObj: function(obj) {
        for (let prop in obj) {
            this[prop] = obj[prop];
        }
    },

    getPerformance: function() {
        let days_between = DateUtils.daysBetween(this.create_date, new Date());
        let total = (days_between / this.repeat_day) * this.repeat;
        let done = this.days_done.length / total;
        return done;
    },

    toggleDone: function(date) {
        let contains = false;
        let index = -1;
        this.days_done.forEach(function(done_date) {
            if(DateUtils.isSameDay(date, done_date)) {
                contains = true;
                index = this.days_done.indexOf(done_date);
            }
        }, this);

        if (contains)
            this.days_done.splice(index, 1);    
        else
            this.days_done.push(date);
    },

    scheduleNotifications: function() {
        
    }
});
