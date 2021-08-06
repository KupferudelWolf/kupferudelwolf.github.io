(function () {
    ///
    var daysMax;

    const getDate = function ( val ) {
        const year = Math.floor( val / daysMax ) + 1,
              day = Math.floor( val % daysMax ) + 1;
        return `Year ${ year }, Day ${ day }`;
    };

    $(function () {

        ///
        $( '#enable-days' ).on( 'change', function () {
            $( '#days-max' ).prop( 'disabled', !$(this).is(':checked') );
        });

        /// Set daysMax.
        $( '#days-max' ).on( 'change input', function () {
            daysMax = Math.max( $(this).val(), $(this).attr('min') );
            $( '#time-range-min, #time-range-max, #time-selection' ).trigger( 'change' );
        }).trigger( 'change' );

        ///
        $( '.slider-bubble' ).each( function () {
            var self = $( this ),
                targ = self.prevAll('input').first(),
                classes = [
                    'ui-btn',
                    'ui-btn-icon-notext',
                    'ui-shadow',
                    'ui-corner-all'
                ].join(' '),
                buttonLeft, buttonRight;

            if ( !targ.length ) {
                targ = self.siblings( '.ui-slider' ).children( 'input' ).first();
            }
            console.log(targ);

            /// Left
            buttonLeft = $('<button>')
                .addClass( classes )
                .addClass( 'ui-icon-carat-l' )
                .appendTo( self );
            /// Value
            $('<span>')
                .addClass( 'bubble-value' )
                .appendTo( self );
            /// Right
            buttonRight = $('<button>')
                .addClass( classes )
                .addClass( 'ui-icon-carat-r' )
                .appendTo( self );
            buttonLeft.on( 'mousedown', function () {
                targ.val( targ.val() * 1 - 1 ).trigger( 'change' );
                // buttonRight.attr( 'disabled', targ.attr( 'val' ) >= targ.attr( 'max' ) );
            });
            buttonRight.on( 'mousedown', function () {
                targ.val( targ.val() * 1 + 1 ).trigger( 'change' );
                // buttonLeft.attr( 'disabled', targ.attr( 'val' ) <= targ.attr( 'min' ) );
            });
        });

        /// Control bubbles.
        $( '#time-selection' ).on( 'change input', function () {
            const self = $( this ),
                  bubble = $( `#${ self.attr('id') }-bubble` ),
                  bar = self.siblings().first(),
                  x = bar.position().left + $( window ).width() * 0.05,
                  w = bar.width();
            let val = self.val(),
                min = self.attr( 'min' ),
                max = self.attr( 'max' ),
                perc = ( val - min ) / ( max - min ),
                left = x + w * perc;
            // left = Math.min( Math.max( left, x/2 ), $( window ).width() );
            bubble.children( '.bubble-value' ).html( getDate( val ) );
            bubble.css( 'left', `${ left }px` );
        }).trigger( 'change' );
        // $( '#time-range-min, #time-range-max' ).on( 'change input', function () {
        //     const self = $( this ),
        //           bubble = $( `#${ self.attr('id') }-bubble` ),
        //           bar = self.siblings( '.ui-rangeslider-sliders' ).children().first(),
        //           x = bar.position().left + $( window ).width() * 0.05,
        //           w = bar.width();
        //     let val = self.val(),
        //         min = self.attr( 'min' ),
        //         max = self.attr( 'max' ),
        //         perc = ( val - min ) / ( max - min ),
        //         left = x + w * perc;
        //     // left = Math.min( Math.max( left, x/2 ), $( window ).width() );
        //     bubble.children( '.bubble-value' ).html( getDate( val ) );
        //     bubble.css( 'left', `${ left }px` );
        // }).trigger( 'change' );
    });

})();
