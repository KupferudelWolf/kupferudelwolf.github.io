import AV from '../../lib/av.module.js';

const GC = 6.6743015e-11;

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
    parameter: {
        options: {
            ' ': 1,
            '%': 0.01
        },
        ranges: {
            ' ': [ 0, 0.999, 0.001 ],
            '%': [ 0, 99.9, 0.1 ]
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
            this.controls.ring_width.quietUpdate();
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
        return Math.max( this.scale_height_max, this.roche_ice );
    }
    get ring_max() {
        return this.hill;
    }

    get gm() {
        return GC * this.mass;
    }

    get hill() { return this._.hill; }
    get period() { return this._.period; }
    get period_ms() { return this._.period * UNITS.time.options.yr * 1000; }


    get anomaly() { return this._.anomaly; }
    set anomaly( x ) {
        this._.anomaly = x;
    }

    get arg()      { return this._.arg; }
    set arg( val ) { this._.arg = val; }

    get scale_height_min() { return this._.scale_height_min; }
    set scale_height_min( x ) {
        this._.scale_height_min = x;
    }
    get scale_height_max() { return this._.scale_height_max; }
    set scale_height_max( x ) {
        this._.scale_height_max = x;
    }
    get scale_height() { return ( this.scale_height_min + this.scale_height_max ) / 2; }

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

    get inc()      { return this._.inc; }
    set inc( val ) { this._.inc = val; }

    get isClockwise() { return !this._.ccw; }
    set isClockwise( val ) { this._.ccw = !val; }
    get isCounterClockwise() { return !!this._.ccw; }
    set isCounterClockwise( val ) { this._.ccw = !!val; }

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

    get raan()      { return this._.raan; }
    set raan( val ) { this._.raan = val; }

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

        const counterclockwise = prop.counterclockwise;

        const semi = prop.semi;            /// Semi-major axis.
        const ecc = prop.ecc || 0;         /// Eccentricity.
        const arg = prop.arg || 0;         /// Argument of the perigee.
        const raan = prop.raan || 0;       /// Right ascension of the ascending node.
        const anomaly = prop.anomaly || 0; /// Mean anomaly.
        const inc = prop.inc || 0;         /// Inclination.

        const setFocus = prop.setFocus || function () {};
        const onAddMoon = prop.onAddMoon || function () {};
        const onDelete = prop.onDelete || function () {};

        const scale_height_min = prop.scale_height_min || prop.scale_height || 0;
        const scale_height_max = prop.scale_height_max || prop.scale_height || 0;
        const ring_inner = prop.ring_inner;
        const ring_outer = prop.ring_outer;
        const obliquity = prop.obliquity;

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
            this._.arg = arg;
            this._.raan = raan;
            this._.anomaly = anomaly;
            this._.inc = inc;
            this._.ccw = counterclockwise;
            if ( typeof( this._.ccw ) === 'undefined' ) {
                this._.ccw = true;
            }
        }

        this._.scale_height_min = scale_height_min;
        this._.scale_height_max = scale_height_max;

        this._.ring_inner = ring_inner;
        this._.ring_outer = ring_outer;

        this._.obliquity = obliquity;

        this.gui = gui;

        this.refresh();
        this.updateController();
    }

    calcTrueAnomaly( time ) {
        const t = ( time / this.period ) % 1;
        const ecc = this.ecc;
        const anom_mean = ( this.anomaly + t * AV.RADIAN ) % AV.RADIAN;
        /// Find eccentric anomaly via Newton-Raphson iterator.
        let anom_ecc = ecc < 0.8 ? anom_mean : Math.PI,
            dividend = anom_ecc - ecc * Math.sin( anom_mean ) - anom_mean;
        for ( let i = 0; i < 30; ++i ) {
            anom_ecc -= dividend / ( 1 - ecc * Math.cos( anom_ecc ) );
            dividend = anom_ecc - ecc * Math.sin( anom_ecc ) - anom_mean;
        }
        const x = Math.cos( anom_ecc ) - ecc;
        const y = Math.sqrt( 1 - ecc ** 2 ) * Math.sin( anom_ecc );
        return Math.atan2( y, x );
    }

    getCartesian( time = Date.now() ) {
        if ( !parent ) {
            return {
                x: 0, y: 0, z: 0,
                v_x: 0, v_y: 0, v_z: 0
            };
        }
        /// https://www.mathworks.com/matlabcentral/fileexchange/80632-kepler2carts
        const a = this.semi;
        const gm = this.parent.gm * 1e-9;
        const ecc = this.ecc;
        const nu = this.calcTrueAnomaly( time ) * ( this.isCounterClockwise ? -1 : 1 );
        const peri = a * ( 1 - ecc ** 2 );
        const r_0 = peri / ( 1 + ecc * Math.cos( nu ));
        const c_px = r_0 * Math.cos( nu );
        const c_py = r_0 * Math.sin( nu );
        const c_v = Math.sqrt( gm / peri );
        const c_vx = -c_v * Math.sin( nu );
        const c_vy = c_v * ( ecc + Math.cos( nu ) );
        const trig = {};
        [ 'arg', 'inc', 'raan' ].forEach( ( key ) => {
            trig[ key ] = {
                'sin': Math.sin( this[ key ] ),
                'cos': Math.cos( this[ key ] )
            }
        });
        const a_x =  trig.raan.cos * trig.arg.cos - trig.raan.sin * trig.arg.sin * trig.inc.cos;
        const a_y = -trig.raan.cos * trig.arg.sin - trig.raan.sin * trig.arg.cos * trig.inc.cos;
        const b_x =  trig.raan.sin * trig.arg.cos + trig.raan.cos * trig.arg.sin * trig.inc.cos;
        const b_y = -trig.raan.sin * trig.arg.sin + trig.raan.cos * trig.arg.cos * trig.inc.cos
        const c_x = trig.arg.sin * trig.inc.sin;
        const c_y = trig.arg.cos * trig.inc.cos;
        return {
              x: a_x * c_px + a_y * c_py,
              y: b_x * c_px + b_y * c_py,
              z: c_x * c_px + c_y * c_py,
            v_x: a_x * c_vx + a_y * c_vy,
            v_y: b_x * c_vx + b_y * c_vy,
            v_z: c_x * c_vx + c_y * c_vy
        }
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
                'ecc': this.ecc,
                'arg': this.arg,
                'isClockwise': this.semi ? this.isClockwise : null,
                'ring_inner': this.ring_inner,
                'ring_width': this.ring_width
            };
            const props = {
                'mass': {
                    units: 'mass',
                    folder: 'Physical Characteristics'
                },
                'radius': {
                    units: 'radius',
                    folder: 'Physical Characteristics'
                },
                'density': {
                    units: 'density',
                    folder: 'Physical Characteristics'
                },
                'semi': {
                    name: 'Semi-major',
                    units: 'distance',
                    folder: 'Orbital Characteristics'
                },
                'anomaly': {
                    name: 'Mean anomaly',
                    units: 'angle',
                    folder: 'Orbital Characteristics'
                },
                'ecc': {
                    name: 'Eccentricity',
                    units: 'parameter',
                    folder: 'Orbital Characteristics'
                },
                'arg': {
                    name: 'Arg. Perigee',
                    units: 'angle',
                    folder: 'Orbital Characteristics'
                },
                'isClockwise': {
                    name: 'Reverse Orbit',
                    folder: 'Orbital Characteristics'
                },
                'ring_inner': {
                    name: 'Ring (inner)',
                    units: 'radius',
                    // ranges: () => {
                    //     return [ this.ring_min, this.ring_max ];
                    // }
                    folder: 'Rings'
                },
                'ring_width': {
                    name: 'Ring (width)',
                    units: 'radius',
                    // ranges: [ 1, this.ring_max ]
                    folder: 'Rings'
                }
            };
            const buttons = {
                'Focus': () => {
                    this.setFocus( this );
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
                        ecc: 0,
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
            const subfolders = {};

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
                    folder = this.folder,
                    name, control, div_unit, unit_mult;

                if ( prop.folder ) {
                    folder = subfolders[ prop.folder ];
                    if ( !folder ) {
                        folder = subfolders[ prop.folder ] = this.folder.addFolder( prop.folder );
                    }
                    folder.close();
                }

                if ( prop.name ) {
                    name = prop.name;
                } else {
                    name = key.slice( 0, 1 ).toUpperCase() + key.slice( 1 );
                }
                control = controls[key] = folder.add( data_disp, key );
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
                    if ( key !== 'anomaly' && unit_type !== 'angle' && unit_type !== 'parameter' ) {
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
                    control_unit = folder.add( obj, 'unit', keys );
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
                        // .appendTo( folder.$children )
                        .children( '.name' ).remove();
                    /// Remove the reference to this control.
                    // control.children.push( control_unit );
                    folder.children.pop();

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
