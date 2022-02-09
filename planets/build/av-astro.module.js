import AV from '../../lib/av.module.js';

const GC = 6.67408e-11;

var id = 0;

const UNITS = {
    angle: {
        options: {
            'rad': 1,
            'deg': Math.PI / 180,
            'tau': AV.RADIAN
        },
        ranges: {
            'rad': [ 0, AV.RADIAN, Math.PI / 180 ],
            'deg': [ 0, 360, 1 ],
            'tau': [ 0, 1, 0.01 ]
        }
    },
    density: {
        options: {
            'g/cm<sup>3</sup>': 1,
            'kg/m<sup>3</sup>': 1e-3
        }
    },
    distance: {
        options: {
            'km': 1,
            'AU': 149597870.691
        }
    },
    mass: {
        options: {
            'kg': 1,
            'M<sub>&#9790;</sub>': 7.348e+22,
            'M<sub>&#128808;</sub>': 5.976e+24
        }
    },
    radius: {
        options: {
            'km': 1,
            'R<sub>&#9790;</sub>': 1737.4,
            'R<sub>&#128808;</sub>': 6378.14
        }
    },
    time: {
        options: {
            's': 1,
            'm': 60,
            'hr': 3600,
            'day': 86400,
            'yr': 365.2425 * 86400
        }
    }
};

class Body2D {
    _ = {
        id: id++
    };
    children = [];

    updateDensity() {
        let m = this.mass,
            r = this.radius,
            d = m / ( 4/3 * Math.PI * r ** 3 );
        d *= 1e-12;
        this._.density = d;
        if ( this.controls ) {
            this.controls.density.quietUpdate();
        }
    }
    updateHill() {
        if ( !this.parent ) {
            this._.hill = null;
            return null;
        }
        let a = this.semi,
            e = this.ecc,
            m_par = this.parent._.mass,
            m_sat = this._.mass;
        this._.hill = a * ( 1 - e ) * Math.pow( m_sat / ( 3 * m_par ), 1/3 );
        if ( this.controls && this.has_rings ) {
            this.controls.ring_inner.quietUpdate();
            this.controls.ring_outer.quietUpdate();
        }
    }
    updateRoche( d_sat ) {
        let r_par = this.radius,
            d_par = this.density;
        return r_par * Math.pow( 2 * d_par / d_sat, 1/3 );
    }
    updatePeriod() {
        if ( !this.semi || !this.parent ) return null;
        let a = this.semi / 100,
            u = GC * this.parent.mass;
        this._.period = AV.RADIAN * Math.sqrt( a ** 3 / u );
    }


    get id() {
        return this._.id;
    }
    get roche() {
        if ( !this.parent ) return null;
        return this.parent.roche_rock();
    }
    get roche_ice() {
        return this.updateRoche( 0.917 );
    }
    get roche_rock() {
        return this.updateRoche( 2.65 );
    }
    get ring_min() {
        return Math.max( this.atmo_height, this.roche_ice );
    }
    get ring_max() {
        return this.hill;
    }

    get hill()    { return this._.hill; }
    get period()  { return this._.period; }

    get anomaly() { return this._.anomaly; }
    set anomaly( x ) {
        this._.anomaly = x;
    }

    get atmo_height() { return this._.atmo_height; }
    set atmo_height( x ) {
        this._.atmo_height = x;
    }

    get density() { return this._.density; }
    set density( val ) {
        let volume = Math.PI * ( this.radius ** 3 ) * ( 4 / 3 ),
            mass = volume * val * 1e+12;
        this._.density = val;
        this._.mass = mass;
        this.updateHill();
        if ( this.controls ) {
            this.controls.mass.quietUpdate();
        }
    }

    get ecc() { return this._.ecc; }
    set ecc( val ) {
        this._.ecc = val;
        this.updateHill();
    }

    get mass() { return this._.mass; }
    set mass( val ) {
        this._.mass = val;
        this.updateDensity();
        this.updateHill();
        this.children.forEach( ( body ) => {
            body.updateHill();
            body.updatePeriod();
        });
    }

    get parent() { return this._.parent; }
    set parent( val ) {
        this._.parent = val;
        this.refresh();
    }

    get radius() { return this._.radius; }
    set radius( val ) {
        this._.radius = val;
        if ( this.density ) {
            let mass = 1e+12 * this.density * ( 4/3 * Math.PI * val ** 3 );
            this.mass = mass;
            if ( this.controls ) {
                this.controls.mass.quietUpdate();
            }
        } else {
            this.updateDensity();
        }
    }

    get ring_inner() {
        if ( !this.has_rings ) return null;
        return Math.max( this._.ring_inner, this.ring_min );
    }
    set ring_inner( val ) {
        this.ring_outer = val + this.ring_width;
        this._.ring_inner = val;
    }
    get ring_outer() {
        if ( !this.has_rings ) return null;
        return Math.min( this._.ring_outer, this.ring_max );
    }
    set ring_outer( val ) {
        this._.ring_outer = val;
    }
    get ring_width() {
        if ( !this.has_rings ) return null;
        return Math.abs( this.ring_outer - this.ring_inner );
    }
    set ring_width( val ) {
        this.ring_outer = this.ring_inner + val;
    }

    get semi() { return this._.semi; }
    set semi( val ) {
        this._.semi = val;
        this.updateHill();
        this.updatePeriod();
    }

    constructor( prop, gui ) {
        const name = prop.name;
        const parent = prop.parent;

        const mass = prop.mass;
        const radius = prop.radius;
        const semi = prop.semi;

        const setFocus = prop.setFocus || function () {};
        const onAddMoon = prop.onAddMoon || function () {};
        const onDelete = prop.onDelete || function () {};

        const atmo_height = prop.atmo_height || 0;
        const ecc = prop.ecc || 0;
        const ring_inner = prop.ring_inner;
        const ring_outer = prop.ring_outer;

        var anomaly = prop.anomaly || 0;
        if ( typeof( prop.anomaly ) === 'undefined' ) {
            anomaly = Math.random() * AV.RADIAN;
        }

        this.setFocus = setFocus;
        this.onAddMoon = onAddMoon;
        this.onDelete = onDelete;

        if ( ring_inner || ring_outer ) {
            this.has_rings = true;
        } else {
            this.has_rings = false;
        }

        this.name = name;

        if ( parent ) {
            this._.parent = parent;
            this._.parent.children.push( this );
        }

        this._.radius = radius;
        this._.mass = mass;
        this._.semi = semi;
        if ( semi ) {
            this._.ecc = ecc;
            this._.anomaly = anomaly;
        }

        this._.ring_inner = ring_inner;
        this._.ring_outer = ring_outer;

        this._.atmo_height = atmo_height;

        this.gui = gui;

        this.refresh();
        this.updateController();
    }

    getCartesian( time = Date.now() ) {
        let semi = this.semi,
            yr = time * 0.001 / UNITS.time.options.yr,
            t = ( time / this.period ) % 1,
            anomaly = AV.RADIAN * t + this.anomaly;
        return {
            x: semi * Math.sin( anomaly ),
            y: semi * Math.cos( anomaly ),
            z: 0
        };
    };

    delete() {
        if ( this.parent ) {
            this.parent.children = this.parent.children.filter( ( obj ) => {
                return obj && obj.id !== this.id;
            });
        }
        this.children.forEach( ( moon ) => {
            if ( moon ) moon.delete();
        });
        this.children = [];
        this.onDelete( this );
        if ( this.folder ) this.folder.destroy();
    }

    refresh() {
        this.radius = this._.radius;
        this.mass = this._.mass;
        this.semi = this._.semi;
        this.ecc = this._.ecc;
    }

    updateController() {
        if ( !this.gui ) return;
        if ( !this.folder ) {
            const data_disp = {
                'name': this.name,
                'mass': this.mass,
                'radius': this.radius,
                'density': this.density,
                'semi': this.semi,
                'anomaly': this.anomaly,
                'ring_inner': this.ring_inner,
                'ring_width': this.ring_width
            };
            const props = {
                'mass': {
                    units: 'mass'
                },
                'radius': {
                    units: 'radius'
                },
                'density': {
                    units: 'density'
                },
                'semi': {
                    name: 'Semi-major',
                    units: 'distance'
                },
                'anomaly': {
                    units: 'angle'
                },
                'ring_inner': {
                    name: 'Ring (inner)',
                    units: 'radius',
                    // ranges: () => {
                    //     return [ this.ring_min, this.ring_max ];
                    // }
                },
                'ring_width': {
                    name: 'Ring (width)',
                    units: 'radius',
                    // ranges: [ 1, this.ring_max ]
                }
            };
            const buttons = {
                'Focus': () => {
                    this.setFocus();
                },
                'Add Moon': () => {
                    const mass = this.mass * 1e-4;
                    const density = 3.34;
                    const moon = new Body2D({
                        name: this.name + ' ' + ( this.children.length + 1 ),
                        parent: this,
                        mass: mass,
                        radius: ( 3 * mass / ( 1e+12 * 4 * density * Math.PI ) ) ** ( 1/3 ),
                        semi: Math.min( this.radius * ( 1.5 + ( this.children.length + 1 ) * 0.5 ), this.hill ),
                        anomaly: Math.random() * AV.RADIAN,
                        setFocus: this.setFocus,
                        onAddMoon: this.onAddMoon,
                        onDelete: this.onDelete,
                    }, this.folder );
                    this.children.push( moon );
                    this.onAddMoon( moon );
                },
                'Delete': () => {
                    this.delete();
                }
            };
            const controls = {};

            /// Add the new folder to the parent object's folder.
            let group = this.gui;
            if ( this.parent && this.parent.folder ) {
                group = this.parent.folder;
            }
            this.folder = group.addFolder( this.name );

            for ( let key in data_disp ) {
                if ( typeof( data_disp[ key ] ) === 'undefined' ) continue;
                if ( data_disp[ key ] === null ) continue;

                const prop = props[ key ] || {};
                let unit_type = prop.units,
                    name, control, div_unit, unit_mult;

                if ( prop.name ) {
                    name = prop.name;
                } else {
                    name = key.slice( 0, 1 ).toUpperCase() + key.slice( 1 );
                }
                control = controls[key] = this.folder.add( data_disp, key );
                control.name( name );
                control.onChange( () => {
                    this[key] = data_disp[key] * ( unit_mult || 1 );
                });

                /// Add a unit dropdown menu.
                if ( unit_type ) {
                    const units_obj = UNITS[ unit_type ];
                    const units = units_obj.options;
                    const ranges = prop.ranges || units_obj.ranges;
                    const keys = Object.keys( units );
                    const obj = { unit: keys[0] };
                    let min = Infinity, unit_best = keys[0], control_unit;

                    /// Find which unit fits best.
                    if ( key !== 'anomaly' ) {
                        keys.forEach( ( u_key ) => {
                            let val = data_disp[ key ] / units[ u_key ],
                                dist = Math.abs( Math.log10( val ) );
                            if ( dist < min ) {
                                min = dist;
                                unit_best = u_key;
                            }
                        });
                    }

                    /// Add the unit dropdown.
                    control_unit = this.folder.add( obj, 'unit', keys );
                    control.onChange( () => {
                        this[key] = data_disp[key] * unit_mult;
                    });
                    control_unit.onChange( () => {
                        let prev = unit_mult;
                        unit_mult = units[ obj.unit ];
                        if ( ranges ) {
                            let arr = [];
                            if ( ranges instanceof Function ) {
                                arr = ranges();
                                arr.forEach( ( val, ind ) => {
                                    arr[ ind ] = val / unit_mult;
                                });
                            } else if ( ranges[ obj.unit ] ) {
                                arr = ranges[ obj.unit ];
                            } else {
                                arr = ranges;
                                arr.forEach( ( val, ind ) => {
                                    arr[ ind ] = val / unit_mult;
                                });
                            }
                            control.min( arr[0] );
                            control.max( arr[1] );
                            control.step( arr[2] || 1 );
                        }
                        control.setValue( data_disp[ key ] * prev / unit_mult );
                    });
                    /// Move the unit dropdown to be inline.
                    $( control_unit.domElement )
                        .addClass( 'unit' )
                        .appendTo( control.domElement )
                        // .appendTo( this.folder.$children )
                        .children( '.name' ).remove();
                    /// Remove the reference to this control.
                    // control.children.push( control_unit );
                    this.folder.children.pop();

                    /// Set the unit.
                    unit_mult = units[ obj.unit ];
                    control_unit.setValue( unit_best );
                    /// Allow the displayed value to change when necessary.
                    control.quietUpdate = () => {
                        data_disp[ key ] = this[ key ] / unit_mult;
                        control.updateDisplay();
                    };
                }
            }

            /// Add buttons.
            const button_obj = {};
            for ( let key in buttons ) {
                const func = buttons[ key ];
                const control = this.folder.add( buttons, key );
                button_obj[ key ] = control;
            }
            if ( !this.semi ) {
                button_obj[ 'Add Moon' ].name( 'Add Planet' );
            }

            /// Change the folder's name when the name changes.
            controls.name.onChange( () => {
                this.name = data_disp.name;
                this.folder.title( this.name );
            });

            this.controls = controls;
        }
        //
    }
}

export { Body2D };
