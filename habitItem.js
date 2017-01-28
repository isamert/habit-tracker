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
const Convenience = Me.imports.convenience;
const PercentageIcon = Me.imports.widgets.PercentageIcon;
const FileUtils = Me.imports.utils.FileUtils;
const DateUtils = Me.imports.utils.DateUtils;


const DayCheckButton = new Lang.Class({
    Name: 'DayCheckButton',
    Extends: St.Button,
    done: false,
    _icon_names: {done: 'object-select-symbolic', undone: 'window-close-symbolic'},
    //Signals: { 'done-state-changed': { param_types: [ GObject.TYPE_BOOLEAN ] } },


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
        if (this.done) {
            this.done = false;
            this.child.icon_name = this._icon_names.undone;
        } else {
            this.done = true;
            this.child.icon_name = this._icon_names.done;
        }
        
        //this.emit('done-state-changed', this.done);
    },

});


const HabitItem = new Lang.Class({
    Name: 'HabitItem',
    Extends: PopupMenu.PopupSubMenuMenuItem,
    Signals: { 'state-changed': { } },

    _init: function(habit) {
        this.parent(habit.name, false);
        this.habit = habit;

        this._settings = Convenience.getSettings();

        //
        // Icon
        //
        this.icon = new PercentageIcon(); // new St.Icon({ style_class: 'popup-menu-icon' });
        this.icon.setProgress(0.50);
        this.actor.insert_child_at_index(this.icon.actor, 1);


        //
        // Load days
        //
        let day_count = this._settings.get_int('day-count');
        for (let i = 0; i < day_count; ++i) {
            let day_no = i;
            let day_check_button = new DayCheckButton();

            let d = new Date();
            d.setDate(d.getDate() - day_no);
            this.habit.days_done.forEach(function(done_date) {
                if (DateUtils.isSameDay(d, done_date)) {
                    day_check_button.setDone();
                }
            }, this);


            day_check_button.connect('clicked', Lang.bind(this, function() {
                // we are 'day_no' away from today
                let date = new Date();
                date.setDate(date.getDate() - day_no);
                
                let contains = false;
                let index = -1;
                this.habit.days_done.forEach(function(done_date) {
                    if(DateUtils.isSameDay(date, done_date)) {
                        contains = true;
                        index = this.habit.days_done.indexOf(done_date);
                    }
                }, this);

                if (contains)
                    this.habit.days_done.splice(index, 1);    
                else
                    this.habit.days_done.push(date);

                this.emit('state-changed');
            }));

            this.actor.add(day_check_button, {expand: false, x_align: St.Align.MIDDLE});
        }


        //
        // Add menu items
        //
        let menu_item = new PopupMenu.PopupBaseMenuItem();
        let label_overview = new St.Label({text: _('Overview')});
        menu_item.actor.add(label_overview, {expand: false, x_align: St.Align.MIDDLE});
        this.menu.addMenuItem(menu_item);

        let menu_item2 = new PopupMenu.PopupBaseMenuItem();
        let icon = new PercentageIcon();
        menu_item2.actor.add(icon.actor, {expand: false, x_align: St.Align.MIDDLE});
        this.menu.addMenuItem(menu_item2);
        icon.setProgress(0.70);
        icon.setIconSize(50);
    }
});