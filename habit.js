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
        return 0.70;
    },

    isDone: function(day) {
        return 0.70;
    }
});
