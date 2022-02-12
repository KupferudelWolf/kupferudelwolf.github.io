import AV from '../../lib/av.module.js';
import { Body2D } from '../build/av-astro.module.js';
// import { AstroGUI } from '../build/av-astro-gui.js';

$( function () {
    $( '.control input:not(.input-display)').on( 'input change', function () {
        $( this ).siblings( 'input[type=number]' ).val( this.value );
    });
    $( '.input-angle' ).attr({
        type: 'range',
        min: 0,
        max: 360,
        step: 1
    });
    $( '.input-parameter' ).attr({
        type: 'range',
        min: 0,
        max: 0.999,
        step: 0.001
    });

    //

});
