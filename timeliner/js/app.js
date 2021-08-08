(function () {
    var CVS, CTX;

    class App {
        data = []
        cvsZoom = 1
        timeBegin = 0
        timeEnd = 1

        constructor() {
            CVS = $( '#map' ).get( 0 );
            CTX = CVS.getContext( '2d' );
            CVS.width = 2**11;
            CVS.height = 2**10;
            $( CVS ).css({ 'top': '0px', 'left': '0px' });

            this.initDayCtrl();
            this.initBubbleCtrl();
            // this.initMapCtrl();
            this.initMiscCtrl();

            this.loadData().then( () => {
                this.sortEvents();
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
        }

        createEvent( data ) {
            let app = this,
                name = data.name,
                date = data.day,
                desc = data.desc || 'No description.',
                color = data.color || '#ffffff',
                idAll = $( '.single-event' ).map( function () {
                    return $( this ).attr( 'data-id' );
                }).get(),
                id,
                container, placeholder, dragger, header, footer,
                color_button, color_picker, color_text,
                dragging, offX, offY;

            while ( !id || idAll.includes( id ) ) {
                id = Math.floor( Math.random() * Math.max( 2*10, idAll.length + 1 ) );
            }
            document.documentElement.style.setProperty( `--color-${ id }`, color );

            container = $( '<div>' )
                .addClass( 'ui-bar ui-body-a single-event' )
                .attr( 'data-date', date )
                .attr( 'data-id', id )
                .css( 'background-color', `var(--color-${ id })` )
                .appendTo( '.events' );
            placeholder = $( '<div>' )
                .addClass( 'single-event placeholder' );

            data.div = container;

            dragger = $( '<div>' )
                .addClass( 'dragger' )
                .on( 'mousedown', function ( e ) {
                    let self = $( this ),
                        mX = e.pageX,
                        mY = e.pageY,
                        posSelf = self.position(),
                        offset = container.offset();
                    offX = -posSelf.left - self.width()/2;
                    offY = -posSelf.top - self.height()/2;
                    // offX = offset.left - e.pageX;
                    // offY = offset.top - e.pageY;
                    dragging = true;
                    placeholder
                        .height( `${ container.outerHeight() }px` )
                        .detach()
                        .insertAfter( container );
                    container
                        .width( `${ container.outerWidth() }px` )
                        .detach()
                        .appendTo( 'body' )
                        .addClass( 'dragging' )
                        .css( 'left', `${ mX + offX }px` )
                        .css( 'top', `${ mY + offY }px` );
                    self.addClass( 'dragging' );
                })
                .appendTo( container );
            header = $( '<button>' )
                .addClass( 'event-title ui-btn ui-shadow ui-corner-all ui-btn-icon-right ui-icon-carat-u' )
                .attr( 'title', 'Expand / Collapse' )
                .attr( 'name', name )
                .html( `<span>${ name }</span>` )
                .on( 'click', function ( e ) {
                    e.preventDefault();
                    let self = $( this );
                    if ( self.is( '.editting' ) ) return;
                    self.toggleClass( 'ui-icon-carat-u' )
                        .toggleClass( 'ui-icon-carat-d' );
                    container.toggleClass( 'collapsed' );
                })
                .bind( 'contextmenu', function ( e ) {
                    e.preventDefault();
                    let self = $( this );
                    self.addClass( 'editting' );
                    self.children( 'span' ).hide();
                    self.children( 'input' ).show().focus();
                })
                .appendTo( container );
            $( '<input>' )
                .attr( 'type', 'text' )
                .val( name )
                .on( 'change focusout', function () {
                    let self = $( this );
                    name = self.val() || 'Unnamed Event';
                    header
                        .attr( 'name', name )
                        .removeClass( 'editting' )
                        .children( 'span' )
                            .html( name )
                            .show();
                    self.hide();
                })
                .textinput()
                .hide()
                .prependTo( header );
            $( '<input>' )
                .addClass( 'event-date ui-bar ui-body-a' )
                .attr( 'type', 'text' )
                .val( this.printDate( date ) )
                .on( 'change', function () {
                    let self = $( this ),
                        val = app.interpretDate( self.val() );
                    if ( val ) {
                        container.attr( 'data-date', val );
                    }
                    app.updateEvent( container );
                })
                .appendTo( container );
            $( '<textarea>' )
                .addClass( 'event-desc ui-bar ui-body-a' )
                .html( desc )
                .appendTo( container );

            footer = $( '<div>' )
                .addClass( 'event-footer' )
                .appendTo( container );
            // $( '<button>' )
            //     .addClass( 'ui-btn ui-shadow ui-btn-icon-notext ui-icon-crosshair' )
            //     .attr( 'title', 'Mark on Map' )
            //     .appendTo( footer );
            color_button = $( '<input>' )
                .addClass( 'event-color-button' )
                .attr( 'type', 'color' )
                .val( color )
                .attr( 'title', 'Change Color' )
                // .css( 'background-color', color )
                .on( 'click', function ( e ) {
                    e.preventDefault();
                    color_picker.val( color );
                    color_picker.toggleClass( 'hidden' );
                })
                .appendTo( footer );
            color_text = $( '<input>' )
                .attr( 'type', 'text' )
                .val( color )
                .on ( 'change input', function () {
                    color = $( this ).val().replace( /[^A-Fa-f0-9]/g, '' );
                    color = '#' + color.substring( 0, 6 );
                    $( this ).val( color );
                    color_button.val( color );
                    color_picker.colorpicker( 'val', color );
                    document.documentElement.style.setProperty( `--color-${ id }`, color );
                })
                .appendTo( footer );

            color_picker = $( '<span>' )
                .addClass( 'event-colorpicker hidden' )
                .colorpicker({
                    defaultPalette: 'web'
                })
                .on( 'change.color', function ( e, val ) {
                    color = val;
                    color_button.val( val );
                    color_text.val( val );
                    document.documentElement.style.setProperty( `--color-${ id }`, color );
                })
                .appendTo( container );

            container.on( 'mousemove', function ( e ) {
                if ( !dragging ) return;
                e.preventDefault();
                let mX = e.pageX,
                    mY = e.pageY,
                    y = mY,
                    left = mX + offX,
                    top = mY + offY,
                    height = container.outerHeight(),
                    found;
                container.css({
                    'left': `${ left }px`,
                    'top': `${ top }px`
                });
                /// Place the placeholder between the nearest event elements.
                $( '.events .single-event:not(".placeholder")' ).each( function () {
                    if ( found ) return;
                    let self = $( this ),
                        h = self.innerHeight(),
                        y1 = self.offset().top + h / 2;
                    if ( y <= y1 ) {
                        placeholder.detach().insertBefore( this );
                        found = true;
                        return;
                    }
                });
                /// The following is true if the container is at the bottom of the list.
                if ( !found ) {
                    placeholder.detach().appendTo( '.events' );
                }
            });
            container.on( 'mouseup mouseleave', () => {
                dragger.removeClass( 'dragging' );
                if ( !dragging ) return;
                let date = +container.attr( 'data-date' ),
                    allDates = $( '.single-event' ).map( function () {
                        return this.getAttribute( 'data-date' );
                    }).get(),
                    prevDate, nextDate;
                dragging = false;
                /// Replace the placeholder with the container.
                container
                    .width('')
                    .css({ left: '', top: '' })
                    .removeClass( 'dragging' )
                    .detach()
                    .insertAfter( placeholder );
                placeholder.detach();

                /// Set the date to a date between the neighboring containers (if necessary).
                if ( container.prev().length > 0 ) {
                    prevDate = +container.prev().attr( 'data-date' );
                } else {
                    prevDate = Math.min( ...allDates );
                }
                if ( container.next().length > 0 ) {
                    nextDate = +container.next().attr( 'data-date' );
                } else {
                    nextDate = Math.max( ...allDates );
                }

                if ( date < prevDate || date > nextDate ) {
                    let newDate = prevDate + ( nextDate - prevDate ) / 2;
                    container.attr( 'data-date', Math.floor( newDate ) );
                }
                this.updateEvent( container );
            });

            container.children( 'input, textarea' ).textinput();

            return container;
        }

        sortEvents() {
            let all = $( '.events' ).children().sort( function ( a, b ) {
                return a.getAttribute( 'data-date' ) - b.getAttribute( 'data-date' );
            });
            $( '.events' ).children().detach();
            $( '.events' ).append( all );
            $( '.events input, .events textarea' ).textinput();
        }

        initBubbleCtrl() {
            let app = this;
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
                bubble.children( '.bubble-value' ).html( app.printDate( val ) );
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
            //     bubble.children( '.bubble-value' ).html( app.printDate( val ) );
            //     bubble.css( 'left', `${ left }px` );
            // }).trigger( 'change' );
        }

        initDayCtrl() {
            let app = this;
            $( '#enable-days' ).on( 'change', function () {
                $( '#days-max' ).prop( 'disabled', !$(this).is( ':checked' ) );
            });
            /// Set daysMax.
            $( '#days-max' ).on( 'change input', function () {
                let self = $( this );
                app.daysMax = Math.max( self.val(), self.attr( 'min' ) );
                $( '#time-range-min, #time-range-max, #time-selection' ).trigger( 'change' );
            }).trigger( 'change' );
        }

        initMapCtrl() {
            let app = this;
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
                    app.cvsZoom *= 2;
                } else if ( dY <= -1 ) {
                    app.cvsZoom /= 2;
                }
                console.log( left, top );
                app.cvsZoom = Math.min( Math.max( app.cvsZoom, 1 ), 8 );
                self.css({
                    'width':  `${ app.cvsZoom * 100 }%`,
                    'height': `${ app.cvsZoom * 100 }%`,
                    'left':   `${ left }px`,
                    'top':    `${ top }px`,
                });
            });
        }

        initMiscCtrl() {
            $( '.sort-events' ).on( 'click', () => {
                this.sortEvents();
            });
            $( '.add-new-event' ).on( 'click', () => {
                this.createEvent({
                    name: 'New Event',
                    day: $( '#time-selection' ).val()
                }).children( '.event-title' ).trigger( 'contextmenu' );
            });
        }

        interpretDate( d ) {
            if ( !isNaN( d * 1 ) ) {
                return Math.floor( d * 1 );
            }
            let reducer = ( a, b ) => a.length > b.length ? a : b,
                val = d
                    .toLowerCase()
                    .replace(/(year)/g, 'y')
                    .replace(/(day)/g, 'd')
                    .replace(/[^dy0-9.]/g, ''),
                year = val.match( /y[0-9]+/g ),
                day = val.match( /d[0-9]+/g );
            if ( year ) {
                year = year.reduce(reducer).substring(1) - 1;
                if ( !day ) {
                    day = ['d2'];
                }
            } else {
                year = 0;
            }
            if ( day ) {
                day = day.reduce( reducer ).substring( 1 ) * 1;
                return Math.ceil( year * this.daysMax ) + day - 1;
            } else {
                return null;
            }
        }

        loadData() {
            let deferred = $.Deferred()
            $.getJSON( 'ajax/record.json', ( data ) => {
                data.forEach( v => {
                    this.createEvent( v );
                });
            }).then( () => {
                deferred.resolve();
            });
            return deferred;
        }

        printDate( val ) {
            const year = Math.floor( val / this.daysMax ) + 1,
                  day = Math.floor( val % this.daysMax ) + 1;
            return `Year ${ year }, Day ${ day }`;
        }

        updateEvent( e ) {
            let elem = $( e ),
                date = elem.attr( 'data-date' );
            elem.find( '.event-date' ).val( this.printDate( date ) );
        }
    }

    $(function () {
        const app = new App();
    });

})();
