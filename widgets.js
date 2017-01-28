const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Cairo = imports.cairo;
const Signals = imports.signals;

const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Meta = imports.gi.Meta;
const Pango = imports.gi.Pango;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const CheckBox = imports.ui.checkBox.CheckBox;

const FADE_OUT_OPACITY = 0.38;
const ICON_SIZE = 22;


const CenteredLabel = new Lang.Class({
    Name: 'CenteredLabel',
    Extends: St.Label,

    _init: function(text) {
        this.parent({text: text,
                    y_expand: true,
                    y_align: Clutter.ActorAlign.CENTER,
                    style_class: 'habittracker-centeredlabel'});
    }
});


const SwitchBox = new Lang.Class({
    Name: 'SwitchBox',
    Extends: St.BoxLayout,
    Signals: { 'toggled': { param_types: [ Boolean ] } },

    _init: function(text, active) {
        this.parent({vertical: false});

        this.label = new CenteredLabel(text);
        this._switch = new PopupMenu.Switch(active);
        this._active = active;

        this._statusBin = new St.Button({ x_align: St.Align.END });
        this._statusBin.child = this._switch.actor;

        this._statusBin.connect('clicked', Lang.bind(this, function() {
            this._switch.toggle();
            this._active = !this._active;
            this.emit('toggled', this._active);
        }));

        this.add(this.label);
        this.add(this._statusBin, { expand: true, x_align: St.Align.END });
    }
});


const TimePicker = new Lang.Class({
    Name: 'TimePicker',
    Extends: St.BoxLayout,

    _init: function(text) {
        this.parent({vertical: false});

        this.label = new CenteredLabel(text);
        this._label_seperator = new CenteredLabel(':');
        this.entry_hour = new HintEntry('23');
        this.entry_mins = new HintEntry('59');

        let expander = new St.Bin({ style_class: 'popup-menu-item-expander' });
        
        this.add(this.label);
        this.add(expander, { expand: true });
        this.add(this.entry_hour);
        this.add(this._label_seperator);
        this.add(this.entry_mins);
    },

    getHour: function() {
        //TODO: implement this
    }
});

const DayPicker = new Lang.Class({
    Name: 'DayPicker',
    Extends: St.BoxLayout,

    _init: function(text) {
        this.parent({vertical: true});
        this.days = [_('Saturday'), _('Sunday'), _('Monday'), _('Tuesday'), 
                     _('Wednesday'), _('Thursday'), _('Friday')];

        this.label = new CenteredLabel(_('Days'));
        this.add(this.label);

        this.days.forEach(function(day) {
            let checkbox_day = new CheckBox(day);
            this.add(checkbox_day.actor);
        }, this);
    },

    getSelectedDays: function() {
        //TODO: implement this
    }
});

const HintEntry = new Lang.Class({
    Name: 'HintEntry',
    Extends: St.Entry,

    _init: function(hint_text, set_text=false) {
        this.parent({hint_text: hint_text,
                    track_hover: true,
                    can_focus: true,
                    style_class: 'habittracker-hintenry'});

        if (set_text)
            this.text = hint_text;
    }
});



const IconButton = new Lang.Class({
    Name: 'IconButton',
    Extends: St.Button,

    _init: function(icon_name) {
        this.parent({x_align: 1,
                    reactive: true,
                    can_focus: true,
                    track_hover: true,
                    style_class: 'system-menu-action  habittracker-iconbutton' });

        this.child = new St.Icon({ icon_name: icon_name });
    }
});


/*
 * This widget is slightly and badly modified version of IconIndicator from gnome-pomodoro
 * https://github.com/codito/gnome-pomodoro/blob/master/plugins/gnome/extension/indicator.js#L519
 * 
 * gnome-pomodoro: https://github.com/codito/gnome-pomodoro/
*/
const PercentageIcon = new Lang.Class({
    Name: 'PercentageIcon',

    _init : function() {
        this._progress        = 0.0;
        this._minHPadding     = 0;
        this._natHPadding     = 0;
        this._minVPadding     = 0;
        this._natVPadding     = 0;
        this._iconSize        = ICON_SIZE;
        this._primaryColor = new Clutter.Color({
            red: 255,
            green: 255,
            blue: 255,
            alpha: 255
        });
        this._secondaryColor = new Clutter.Color({
            red: this._primaryColor.red,
            green: this._primaryColor.green,
            blue: this._primaryColor.blue,
            alpha: this._primaryColor.alpha * FADE_OUT_OPACITY
        });
        // TODO: make this color changable from settings

        this.actor = new Shell.GenericContainer({ reactive: true });
        this.actor._delegate = this;

        this.icon = new St.DrawingArea({ style_class: 'system-status-icon' });
        this.icon.connect('style-changed', Lang.bind(this, this._onIconStyleChanged));
        this.icon.connect('repaint', Lang.bind(this, this._onIconRepaint));
        this.icon.connect('destroy', Lang.bind(this, this._onIconDestroy));
        this.actor.add_child(this.icon);

        this.actor.connect('get-preferred-width', Lang.bind(this, this._getPreferredWidth));
        this.actor.connect('get-preferred-height', Lang.bind(this, this._getPreferredHeight));
        this.actor.connect('allocate', Lang.bind(this, this._allocate));
        this.actor.connect('style-changed', Lang.bind(this, this._onStyleChanged));
        this.actor.connect('destroy', Lang.bind(this, this._onActorDestroy));

        this.setProgress(0.0);
    },

    setProgress: function(progress) {
        let progress_fixed = 1 - progress;

        if (this._progress !== progress_fixed) {
            this._progress = progress_fixed;
            this.icon.queue_repaint();
        }
    },

    setIconSize: function(isize) {
        this._iconSize = isize;
    },

    _onIconStyleChanged: function(actor) {
        let themeNode = actor.get_theme_node();

        [actor.min_width, actor.natural_width] = themeNode.adjust_preferred_width(this._iconSize, this._iconSize);
        [actor.min_height, actor.natural_height] = themeNode.adjust_preferred_height(this._iconSize, this._iconSize);
    },

    _onIconRepaint: function(area) {
        let cr = area.get_context();
        let [width, height] = area.get_surface_size();

        let radius    = 0.5 * this._iconSize - 2.0;
        let progress  = this._progress;

        cr.translate(0.5 * width, 0.5 * height);
        cr.setOperator(Cairo.Operator.SOURCE);
        cr.setLineCap(Cairo.LineCap.ROUND);

        let angle1 = - 0.5 * Math.PI - 2.0 * Math.PI * Math.min(Math.max(progress, 0.000001), 1.0);
        let angle2 = - 0.5 * Math.PI;

        // EMPTY STATE:
        // Clutter.cairo_set_source_color(cr, this._secondaryColor);
        // cr.arcNegative(0, 0, radius, angle1, angle2);
        // cr.setLineWidth(2.2);
        // cr.stroke();
        // END
        
        // DRAWN STATE
        Clutter.cairo_set_source_color(cr, this._secondaryColor);
        cr.arc(0, 0, radius, 0.0, 5.0 * Math.PI);
        cr.setLineWidth(2.2);
        cr.stroke();

        if (angle2 > angle1) {
            Clutter.cairo_set_source_color(cr, this._primaryColor);
            cr.arcNegative(0, 0, radius, angle1, angle2);
            cr.setOperator(Cairo.Operator.CLEAR);
            cr.setLineWidth(3.5);
            cr.strokePreserve();

            cr.setOperator(Cairo.Operator.SOURCE);
            cr.setLineWidth(2.2);
            cr.stroke();
        }
        // END

        cr.$dispose();
    },

    _onIconDestroy: function() {

    },

    _onStyleChanged: function(actor) {
        let themeNode = actor.get_theme_node();

        this._minHPadding = themeNode.get_length('-minimum-hpadding');
        this._natHPadding = themeNode.get_length('-natural-hpadding');
        this._minVPadding = themeNode.get_length('-minimum-vpadding');
        this._natVPadding = themeNode.get_length('-natural-vpadding');
    },

    _getPreferredWidth: function(actor, forHeight, alloc) {
        let child = actor.get_first_child();

        if (child) {
            [alloc.min_size, alloc.natural_size] = child.get_preferred_width(-1);
        }
        else {
            alloc.min_size = alloc.natural_size = 0;
        }

        alloc.min_size += 2 * this._minHPadding;
        alloc.natural_size += 2 * this._natHPadding;
    },

    _getPreferredHeight: function(actor, forWidth, alloc) {
        let child = actor.get_first_child();

        if (child) {
            [alloc.min_size, alloc.natural_size] = child.get_preferred_height(-1);
        }
        else {
            alloc.min_size = alloc.natural_size = 0;
        }

        alloc.min_size += 2 * this._minVPadding;
        alloc.natural_size += 2 * this._natVPadding;
    },

    _allocate: function(actor, box, flags) {
        let child = actor.get_first_child();
        if (!child) {
            return;
        }

        let availWidth  = box.x2 - box.x1;
        let availHeight = box.y2 - box.y1;

        let [minWidth, natWidth] = child.get_preferred_width(availHeight);

        let childBox = new Clutter.ActorBox();
        childBox.y1 = 0;
        childBox.y2 = availHeight;

        if (natWidth + 2 * this._natHPadding <= availWidth) {
            childBox.x1 = this._natHPadding;
            childBox.x2 = availWidth - this._natHPadding;
        }
        else {
            childBox.x1 = this._minHPadding;
            childBox.x2 = availWidth - this._minHPadding;
        }

        child.allocate(childBox, flags);
    },

    _onActorDestroy: function() {
        this.icon = null;

        this.actor._delegate = null;

        this.emit('destroy');
    },

    destroy: function() {
        this.actor.destroy();
    }
});
Signals.addSignalMethods(PercentageIcon.prototype);