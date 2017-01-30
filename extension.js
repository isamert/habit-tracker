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

const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Gettext = imports.gettext.domain('habittracker');
const _ = Gettext.gettext;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const HabitItem = Me.imports.habitItem.HabitItem;
const Habit = Me.imports.habit.Habit;
const IconButton = Me.imports.widgets.IconButton;
const HintEntry = Me.imports.widgets.HintEntry;
const CenteredLabel = Me.imports.widgets.CenteredLabel;
const TimePicker = Me.imports.widgets.TimePicker;
const DayPicker = Me.imports.widgets.DayPicker;
const SwitchBox = Me.imports.widgets.SwitchBox;
const FileUtils = Me.imports.utils.FileUtils;
const DateUtils = Me.imports.utils.DateUtils;

const HabitTracker = new Lang.Class({
    Name: 'HabitTracker',
    _habit_items: [],

    _init: function() {
        this._settings = Convenience.getSettings();
        this._settings.connect('changed', Lang.bind(this, this._loadSettings));

        this._createContainer();
        this._loadSettings();
        this._stuff();
    },

    _stuff: function() {

    },

    _createContainer: function() {
        this.container = new PanelMenu.Button()
        PanelMenu.Button.prototype._init.call(this.container, 0.0);
        
        let hbox = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        let icon = new St.Icon({icon_name: 'system-run-symbolic', 
                                style_class: 'system-status-icon'});
        this._label = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        hbox.add_child(icon);
        hbox.add_child(this._label);

        this.container.actor.add_actor(hbox);
        this.container.actor.add_style_class_name('panel-status-button');

        // this.container.actor.connect('button-press-event', Lang.bind(this, function() {
        //     this._refresh();
        // }));

        this._createHeader();
        this._loadHabits();
        this._createUtilityItems();
        Main.panel.addToStatusArea('habitTracker', this.container);
    },

    _createHeader: function() {
        //
        // Add "Habits" header and + button
        //
        let header = new PopupMenu.PopupSubMenuMenuItem(_("Habits"), false);
        header.label.style_class = 'habittracker-header-label';
        header._triangle.visible = false; //FIXME: a little bit of hack here
        

        let button_new = new IconButton('list-add-symbolic');
        button_new.connect('clicked', Lang.bind(this, function() {
            header.setSubmenuShown(!header.menu.isOpen);
        }));
        header.actor.insert_child_at_index(button_new, 2);
        

        //
        // Add days to header
        //
        let date = new Date();

        let day_count = this._settings.get_int('day-count');
        for (let i = 0; i < day_count; ++i) {
            date.setDate(date.getDate() - 1); // Go back 1 day everytime

            let day_text = date.toLocaleFormat('%a').toUpperCase() + '\n' + date.getUTCDate();
            let day_label = new St.Label({text: day_text, style_class: 'habittracker-day-label'});
            header.actor.add(day_label, {expand: false, x_align: St.Align.START});
        }


        //
        // Create "new item" menu
        //
        let menu_item = new PopupMenu.PopupMenuSection();
        let entry_name = new HintEntry(_("Name..."));
        let entry_description = new HintEntry(_('Description...'));
        
        let box_repeat = new St.BoxLayout({ vertical: false });
        let label_repeat_repeat = new CenteredLabel(_("Repeat"));
        let label_repeat_times = new CenteredLabel(_('times in'));
        let label_repeat_days = new CenteredLabel(_('days.'));
        let entry_repeat_times = new HintEntry(_("2"), true);
        let entry_repeat_days = new HintEntry(_("7"), true);

        box_repeat.add(label_repeat_repeat);
        box_repeat.add(entry_repeat_times);
        box_repeat.add(label_repeat_times);
        box_repeat.add(entry_repeat_days);
        box_repeat.add(label_repeat_days);


        let show_time_picker = false;
        
        let timepicker = new TimePicker(_("Hour"));
        timepicker.visible = show_time_picker;

        let daypicker = new DayPicker();
        daypicker.visible = show_time_picker;

        let switch_reminder = new SwitchBox(_("Reminder"), show_time_picker);
        switch_reminder.connect('toggled', Lang.bind(this, function(sender, state) {
            timepicker.visible = state;
            daypicker.visible = state;
        }));

        let button_save = new St.Button({label: _("Save")});
        button_save.connect('clicked', Lang.bind(this, function(sender) {
            let new_habit = new Habit();
            new_habit.name = entry_name.get_text();
            //...
        }));

        menu_item.actor.add_style_class_name('habittracker-entrysection');
        menu_item.actor.add(entry_name);
        menu_item.actor.add(entry_description);
        menu_item.actor.add(box_repeat);
        menu_item.actor.add(switch_reminder);
        menu_item.actor.add(timepicker);
        menu_item.actor.add(daypicker);
        menu_item.actor.add(button_save);


        header.menu.addMenuItem(menu_item);

        this.container.menu.addMenuItem(header);
        this._addMenuSeperator();
    },

    _createUtilityItems: function() {
        let utility_menu = new PopupMenu.PopupBaseMenuItem();
        
        let expander = new St.Bin({ style_class: 'popup-menu-item-expander' });
        utility_menu.actor.add(expander, { expand: true });

        let button_settings = new IconButton('view-list-symbolic');
        utility_menu.actor.add(button_settings);

        this.container.menu.addMenuItem(utility_menu);
        this._addMenuSeperator();
    },

    _loadSettings: function() {
        // load label_text
        let label_text = this._settings.get_string('label-text');
        this._label.set_text(label_text);
    },

    _loadHabits: function() {
        FileUtils.readFile('/home/isa/Workspace/HABBIT.json', Lang.bind(this, function(contents) {
            let habit_list = JSON.parse(contents, DateUtils.dateReviver);
            habit_list.forEach(function(habit_json) {
                let habit = new Habit();
                habit.fromObj(habit_json);

                let habit_item = new HabitItem(habit);
                this._habit_items.push(habit_item);
                habit_item.connect('state-changed', Lang.bind(this, function() {
   
                    let json_arr = [];
                    this._habit_items.forEach(function(element) {
                        json_arr.push(element.habit);
                    }, this);

                    FileUtils.writeFile('/home/isa/Workspace/HABBIT.json', JSON.stringify(json_arr));
                }));

                this.container.menu.addMenuItem(habit_item, 2); // 1 header + 1 seperator = 2
            }, this);
        }));
        this._addMenuSeperator();
    },

    _addMenuSeperator: function() {
        this.container.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    },

    destroy: function() {
        this.container.destroy();
    }
});



let habitTracker;

function init() {
    Convenience.initTranslations("habittracker");
}

function enable() {
    habitTracker = new HabitTracker();
}

function disable() {
    habitTracker.destroy();
    habitTracker = null;
}