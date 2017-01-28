
const Gio   = imports.gi.Gio;
const GLib = imports.gi.GLib;

const DateUtils = {};
const FileUtils = {};

const MILLI_SECONDS_PER_DAY = 24 * 60 * 60 * 1000;

DateUtils.treatAsUTC = function () {
    let result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
};

DateUtils.daysBetween = function (startDate, endDate) {
    return (DateUtils.treatAsUTC(endDate) - DateUtils.treatAsUTC(startDate)) / MILLI_SECONDS_PER_DAY;
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

FileUtils.writeFile = function(file_path, text) {
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
