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
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Util = imports.misc.util;
const Gtk = imports.gi.Gtk;
const Atk = imports.gi.Atk;
const Signals = imports.signals;
const GObject = imports.gi.GObject;

const ExtensionSystem = imports.ui.extensionSystem;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const PercentageIcon = Me.imports.widgets.PercentageIcon;
const FileUtils = Me.imports.utils.FileUtils;
const DateUtils = Me.imports.utils.DateUtils;


const DayCheckButton = new Lang.Class({
    Name: 'DayCheckButton',
    Extends: St.Button,
    done: false,
    date: null,
    _icon_names: {done: 'object-select-symbolic', undone: 'window-close-symbolic'},
    _disabled_toggle: false,
    Signals: { 'done-state-changed': { } },


    _init: function() {
        this.parent({ x_align: 1,
                      reactive: true,
                      can_focus: true,
                      track_hover: true,
                      accessible_name: 'check',
                      style_class: 'system-menu-action habittracker-check-button' });
        
        this.child = new St.Icon({ icon_name: this._icon_names.undone });
        this.connect('clicked', Lang.bind(this, this.setDone));
    },

    setDone: function() {
        //FIXME: this func gets called at startup
        this.emit('done-state-changed');

        if (!this._disabled_toggle) {
            if (this.done) {
                this.done = false;
                this.child.icon_name = this._icon_names.undone;
            } else {
                this.done = true;
                this.child.icon_name = this._icon_names.done;
            }
        }
    },

    setDisableToggle: function(toggle) {
        this._disabled_toggle = toggle;
    }
});


const HabitItem = new Lang.Class({
    Name: 'HabitItem',
    Extends: PopupMenu.PopupSubMenuMenuItem,
    Signals: { 'state-changed': { } },

    _init: function(habit, day_count) {
        this.parent(habit.name, false);
        this.habit = habit;

        //
        // Icon
        //
        this.icon = new PercentageIcon();
        this.actor.insert_child_at_index(this.icon.actor, 1);
        this._updatePerformance();


        //
        // Load days
        //
        for (let i = 0; i < day_count; ++i) {
            let day_no = i;
            let day_check_button = new DayCheckButton();

            let date = new Date();
            date.setDate(date.getDate() - day_no);

            day_check_button.date = date;

            this.habit.days_done.forEach(function(done_date) {
                if (DateUtils.isSameDay(date, done_date)) {
                    day_check_button.setDone();
                }
            }, this);


            day_check_button.connect('done-state-changed', Lang.bind(this, function() {
                if (this._isBeforeCreateDate(day_check_button)) {
                    day_check_button.setDisableToggle(true);
                    //TODO: show tooltip
                } else {
                    day_check_button.setDisableToggle(false);

                    // we are 'day_no' away from today
                    let date = new Date();
                    date.setDate(date.getDate() - day_no);
                    this.habit.toggleDone(date);
                    this._updatePerformance();
                    this.emit('state-changed');
                }
            }));

            this.actor.add(day_check_button, {expand: false, x_align: St.Align.MIDDLE});
        }


        //
        // Add menu items
        //
        let menu_item = new PopupMenu.PopupBaseMenuItem();
        let label_overview = new St.Label({text: _("Overview")});
        menu_item.actor.add(label_overview, {expand: false, x_align: St.Align.MIDDLE});
        this.menu.addMenuItem(menu_item);

        let menu_item2 = new PopupMenu.PopupBaseMenuItem();
        let icon = new PercentageIcon();
        menu_item2.actor.add(icon.actor, {expand: false, x_align: St.Align.MIDDLE});
        this.menu.addMenuItem(menu_item2);
        icon.setProgress(0.70);
        icon.setIconSize(50);
    },

    _updatePerformance: function() {
        this.icon.setProgress(this.habit.getPerformance());
    },

    _isBeforeCreateDate: function(day_check_button) {
        if (!DateUtils.isSameDay(day_check_button.date, this.habit.create_date) &&
            day_check_button.date < this.habit.create_date) {
                return true;
            }
        return false;
    }
});