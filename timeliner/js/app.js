(function () {
    ///
    var cvsZoom = 1,
        daysMax,
        CVS, CTX, DATA;

    const getDate = function ( val ) {
        const year = Math.floor( val / daysMax ) + 1,
              day = Math.floor( val % daysMax ) + 1;
        return `Year ${ year }, Day ${ day }`;
    };

    const initDayCtrl = function () {
        $( '#enable-days' ).on( 'change', function () {
            $( '#days-max' ).prop( 'disabled', !$(this).is( ':checked' ) );
        });
        /// Set daysMax.
        $( '#days-max' ).on( 'change input', function () {
            let self = $( this );
            daysMax = Math.max( self.val(), self.attr( 'min' ) );
            $( '#time-range-min, #time-range-max, #time-selection' ).trigger( 'change' );
        }).trigger( 'change' );
    };
    const initBubbles = function () {
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
    };
    const initMapCtrl = function () {
        /// Control map canvas.
        $( CVS ).on( 'wheel', function (e) {
            e.preventDefault();
            let self = $( this ),
                cont = self.parent(),
                offset = cont.offset(),
                dY = Math.sign( e.originalEvent.wheelDelta ),
                mX = e.originalEvent.x - offset.left,
                mY = e.originalEvent.y - offset.top,
                x = mX / cont.width(),
                y = mY / cont.height(),
                left = Math.floor( -CVS.width * x ),
                top = Math.floor( -CVS.height * y );
            if ( dY >= 1 ) {
                cvsZoom *= 2;
            } else if ( dY <= -1 ) {
                cvsZoom /= 2;
            }
            console.log( left, top );
            cvsZoom = Math.min( Math.max( cvsZoom, 1 ), 8 );
            self.css({
                'width':  `${ cvsZoom * 100 }%`,
                'height': `${ cvsZoom * 100 }%`,
                'left':   `${ left }px`,
                'top':    `${ top }px`,
            });
        });
    };
    const loadData = function () {
        let deferred = $.Deferred()
        $.getJSON( 'ajax/record.json', function (data) {
            DATA = data.sort( ( a, b ) => a.day - b.day );
            deferred.resolve();
        });
        return deferred;
    };


    $(function () {
        CVS = $( '#map' ).get( 0 );
        CTX = CVS.getContext( '2d' );
        CVS.width = 2**11;
        CVS.height = 2**10;
        $( CVS ).css({ 'top': '0px', 'left': '0px' });

        initDayCtrl();
        initBubbles();
        // initMapCtrl();

        loadData().then( function () {
            /// Temporary: fill the map with a checkerboard pattern.
            let ckbd = 32;
            CTX.fillStyle = 'black';
            for ( let y = 0, h = CVS.height / ckbd; y < h; ++y ) {
                for ( let x = 0, w = CVS.width / ckbd; x < w; ++x ) {
                    CTX.fillStyle = 'rgb(224,224,224)';
                    if ( x % 2 === y % 2 ) {
                        CTX.fillStyle = 'white';
                    }
                    CTX.fillRect( x * ckbd, y * ckbd, ckbd, ckbd );
                }
            }
        });
    });

})();
