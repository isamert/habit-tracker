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


const Gio   = imports.gi.Gio;
const GLib = imports.gi.GLib;

const DateUtils = {};
const FileUtils = {};
const HabitTrackerUtils = {};

const MILLI_SECONDS_PER_DAY = 24 * 60 * 60 * 1000;


DateUtils.daysBetween = function (startDate, endDate) {
    return Math.round(Math.abs((startDate.getTime() - endDate.getTime())/(MILLI_SECONDS_PER_DAY)));
};

DateUtils.isSameDay = function (date1, date2) {
    return date1.toDateString() == date2.toDateString();
};

DateUtils.dateReviver = function(key, value) {
    let datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    let isSerializedDate = (typeof value === 'string' || value instanceof String) &&
                            datePattern.test(value);

    if (isSerializedDate)
        return new Date(value);
    return value;
};

FileUtils.writeFile = function(file_path, text, write_finished_handler = null) {
    let file = Gio.File.new_for_path(file_path);
    file.replace_async(null, false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        GLib.PRIORITY_LOW, null, (file, res) => {

            let stream;
            if (!res.had_error()) {
                stream = file.replace_finish(res);
                stream.write(text, null);
                stream.close(null);
            }

            if (write_finished_handler != null) {
                write_finished_handler();
            }
    });
};

FileUtils.readFile = function(file_path, read_finished_handler) {
    let file = Gio.File.new_for_path(file_path);

    file.load_contents_async(null, (file, res) => {
        let contents;
        try {
            contents = file.load_contents_finish(res)[1].toString();
            read_finished_handler(contents);
        } catch (e) {
            log(e);
        }
    });
};

HabitTrackerUtils.storagePath = function() {
    let path = GLib.get_user_data_dir() + '/habit-tracker';
    GLib.mkdir_with_parents(path, 0755);
    return path;
}

HabitTrackerUtils.storageFile = function() {
    let path = HabitTrackerUtils.storagePath() + '/' + 'habits.json';
    return path;
}