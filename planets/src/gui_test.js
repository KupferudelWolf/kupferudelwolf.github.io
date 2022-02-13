import AV from '../../lib/av.module.js';
import { Body2D } from '../build/av-astro.module.js';
// import { AstroGUI } from '../build/av-astro-gui.js';

$( function () {
    const UNITS = {
        angle: {
            converts: {
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
            converts: {
                'g/cm<sup>3</sup>': 1,
                'kg/m<sup>3</sup>': 1e-3
            }
        },
        distance: {
            converts: {
                'km': 1,
                'AU': 149597870.691
            }
        },
        mass: {
            converts: {
                'kg': 1,
                'M<sub>&#9790;</sub>': 7.348e+22,
                'M<sub>&#128808;</sub>': 5.976e+24
            }
        },
        parameter: {
            ranges: {
                ' ': [ 0, 0.999, 0.001 ]
            }
        },
        radius: {
            converts: {
                'km': 1,
                'R<sub>&#9790;</sub>': 1737.4,
                'R<sub>&#128808;</sub>': 6378.14
            }
        },
        time: {
            converts: {
                's': 1,
                'm': 60,
                'hr': 3600,
                'day': 86400,
                'yr': 365.2425 * 86400
            }
        }
    };

    $( '.astro-gui .control' ).each( function () {
        const group = $( this );
        const elem_control = group.children( 'input:not(.input-display)' );
        const elem_display = group.children( '.input-display' );
        const elem_both = elem_control.add( elem_display );
        var unit = {}, elem_unit, current_unit, dragging;
        for ( let key in UNITS ) {
            if ( elem_control.hasClass( 'input-' + key ) ) {
                unit = UNITS[ key ];
            }
        }

        if ( unit.converts ) {
            current_unit = Object.keys( unit.converts )[0];
        } else if ( unit.ranges ) {
            current_unit = Object.keys( unit.ranges )[0];
        }

        if ( unit.ranges ) {
            const range = unit.ranges[ current_unit ];
            elem_both.attr({
                'min':  range[0],
                'max':  range[1],
                'step': range[2]
            });
        } else {
            elem_control.attr({
                'min': -1,
                'max':  1,
                'step': 0.1
            }).val( 0 ).addClass( 'slider-plusminus' );
        }
        if ( unit.converts ) {
            elem_unit = $( '<select>' );
            elem_unit.addClass( 'input-unit' );
            elem_unit.appendTo( this );
            for ( let val in unit.converts ) {
                const opt = $( '<option>' );
                opt.val( val );
                opt.html( val );
                opt.appendTo( elem_unit );
            }
            elem_unit.on( 'change', function () {
                const new_unit = this.value;
                const cur_opt = unit.converts[ current_unit ];
                const new_opt = unit.converts[ new_unit ];
                var val = elem_display.val() * cur_opt / new_opt;
                current_unit = new_unit;
                if ( unit.ranges ) {
                    const range = unit.ranges[ current_unit ];
                    elem_both.attr({
                        'min':  range[0],
                        'max':  range[1],
                        'step': range[2]
                    });
                    val = AV.clamp( val, range[0], range[1] );
                }
                elem_display.val( val ).trigger( 'change' );
            });
        }

        elem_both.on( 'change input', function () {
            let val = this.value;
            if ( unit.ranges ) {
                const range = unit.ranges[ current_unit ];
                val = AV.clamp( val, range[0], range[1] );
                elem_both.val( val );
            } else {
                // elem_control.attr({
                //     'min': +val - 10,
                //     'max': +val + 10
                // }).val( val );
            }
        });
        elem_control.on( 'mousedown', function () {
            if ( unit.ranges ) return;
            dragging = true;
        }).on( 'mousedown mousemove', function () {
            if ( !dragging ) return;
            elem_control.attr({
                'min': -1,// * par,
                'max':  1,// * ( 1 - par ),
                'step': 0.01
            });
            let val = elem_control.val() * 1 + elem_display.val() * 1;
            elem_display.val( val );
            setTimeout( () => {
                elem_control.trigger( 'mousemove' );
            }, 1 );
        }).on( 'mouseup mouseleave', function () {
            if ( dragging ) elem_control.val( 0 );
            dragging = false;
        });

        elem_display.add( elem_unit ).on( 'focusin', function () {
            group.addClass( 'active' ).css( 'right', '75%' );
        }).on( 'focusout', function () {
            group.removeClass( 'active' );
            if ( group.children( '.active' ).length ) return;
            group.css( 'right', '0%' );
        });

        elem_display.val(0).trigger( 'change' );
    });

    //

});
