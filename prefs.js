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

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Gettext = imports.gettext.domain('habittracker');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

function init() {
    Convenience.initTranslations("habittracker");
}

const HabitTrackerPrefsWidget = new GObject.Class({
    Name: 'HabitTracker.Prefs.Widget',
    GTypeName: 'HabitTrackerPrefsWidget',
    Extends: Gtk.Grid,

    _init: function(params) {
        this.parent(params);
        this.margin = this.row_spacing = this.column_spacing = 10;

        this._settings = Convenience.getSettings();

        let current_row = -1;
        // attach(column, row, width, height);

        //
        // Setting: label-text
        //
        let current_label_text = this._settings.get_string('label-text');

        this._label_text = new Gtk.Entry();
        this._label_text.set_text(current_label_text);

        this.attach(new Gtk.Label({ label: _("Label text") }), 0, ++current_row, 1, 1);
        this.attach(this._label_text, 1, current_row, 1, 1);

        //
        // Setting: day-count
        //
        let current_day_count = this._settings.get_int('day-count');

        this._day_count_spin = Gtk.SpinButton.new_with_range (1, 10, 1);;
        this._day_count_spin.set_digits(0);
        this._day_count_spin.set_value(current_day_count);
        //this._day_count_spin.connet("value-changed", Lang.bind (this, this._newValue));

        this.attach(new Gtk.Label({ label: _("Day count") }), 0, ++current_row, 1, 1);
        this.attach(this._day_count_spin, 1, current_row, 1, 1);


        //
        // Save button
        //
        let button_save = new Gtk.Button({label: "Save"});
        button_save.connect('clicked', Lang.bind(this, this._onSaveRequest));
        this.attach(button_save, 0, ++current_row, 2, 1);
    },

    _onSaveRequest: function() {
        this._settings.set_string('label-text', this._label_text.get_text());
        this._settings.set_int('day-count', this._day_count_spin.get_value());
        
        // TODO: close window ?
    }
});

function buildPrefsWidget() {
    let widget = new HabitTrackerPrefsWidget();
    widget.show_all();
    return widget;
}
