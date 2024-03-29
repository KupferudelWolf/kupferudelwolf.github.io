(function () {
    var CVS, CTX;

    class App {
        data = []
        tags = {
            '0': {
                name: '&lt;default&gt;',
                color: '#ffffff',
                id: 0
            }
        }
        cvsZoom = 1
        timeBegin = 0
        timeEnd = 1
        loops = []
        placeholder = $( '<div>' ).addClass( 'single-event placeholder' )

        constructor() {
            CVS = $( '#map' ).get( 0 );
            CTX = CVS.getContext( '2d' );
            CVS.width = 2**11;
            CVS.height = 2**10;
            $( CVS ).css({ 'top': '0px', 'left': '0px' });

            this.initDayCtrl();
            this.initBubbleCtrl();
            this.initTagCtrl();
            // this.initMapCtrl();
            this.initMiscCtrl();

            /// Default all colorpickers to the hexagonal "web" palette.
            $( '.colorpicker' ).colorpicker({
                defaultPalette: 'web'
            });

            /// Load the default JSON.
            this.loadData( 'ajax/record.json' ).then( () => {
                this.updateTags();
                this.sortEvents();
                this.startAnims();
                setTimeout( () => {
                    this.saveData( true );
                }, 1000 );
                setTimeout( () => {
                    this.loadData();
                }, 5000 );
                setTimeout( () => {
                    this.saveData( true );
                }, 4000 );
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
                tags = data.tags || [0],
                idAll = $( '.single-event' ).map( function () {
                    return $( this ).attr( 'data-id' ) * 1;
                }).get(),
                eventsPanel = $( '.events' ),
                colors = [], id,
                container, dragbar, header, headerInput, footerButtons, footerColor,
                color_button, color_picker, color_text, lockButton, tagSelect,
                dragging, offX, offY, mXP, mYP;

            for ( let i = 0, l = idAll.length + 1; i < l; ++i ) {
                if ( !idAll.includes( i ) ) {
                    id = i;
                    break;
                }
            }

            /// Create the container for the single event.
            container = $( '<div>' )
                .addClass( 'ui-bar ui-body-a single-event' )
                .attr( 'data-date', date )
                .attr( 'data-id', id )
                .appendTo( eventsPanel );

            data.div = container;

            /// Drag Bar
            dragbar = $( '<div>' )
                .addClass( 'dragbar' )
                .on( 'mousedown', function ( e ) {
                    let self = $( this ),
                        mX = e.pageX,
                        mY = e.pageY,
                        posSelf = self.position(),
                        offset = container.offset();
                    /// Persistent mouse values for edge-scrolling.
                    mXP = mX;
                    mYP = mY;
                    offX = -posSelf.left - self.width() / 2;
                    offY = -posSelf.top - self.height() * 2;
                    dragging = true;
                    app.placeholder
                        .height( `${ container.outerHeight() }px` )
                        .detach()
                        .insertAfter( container );
                    container
                        .width( `${ container.width() }px` )
                        .detach()
                        .appendTo( 'body' )
                        .addClass( 'dragging' )
                        .css( 'left', `${ mX + offX }px` )
                        .css( 'top', `${ mY + offY }px` );
                    /// Edge Scrolling
                    let ePan = eventsPanel.get( 0 ),
                        y1 = container.outerHeight() / 2,
                        y2 = $( window ).height() - y1;
                    app.loops.push( function () {
                        if ( !container.is( '.dragging' ) ) return true;
                        if ( mYP < y1 ) {
                            /// Scroll up.
                            ePan.scrollBy( 0, -15 );
                        } else if ( mYP > y2 ) {
                            /// Scroll down.
                            ePan.scrollBy( 0, 15 );
                        }
                    });
                })
                .appendTo( container );
            /// Title Button
            header = $( '<button>' )
                .addClass( 'event-title ui-btn ui-shadow ui-corner-all ui-btn-icon-right ui-icon-carat-u' )
                .attr( 'title', 'Expand / Collapse' )
                .attr( 'name', name )
                .html( `<span>${ name }</span>` )
                .on( 'click', function ( e ) {
                    /// Expand / collapse the event's details.
                    e.preventDefault();
                    let self = $( this );
                    if ( self.is( '.editting' ) ) return;
                    self.toggleClass( 'ui-icon-carat-u' )
                        .toggleClass( 'ui-icon-carat-d' );
                    container.toggleClass( 'collapsed' );
                })
                .on( 'contextmenu', function ( e ) {
                    /// Rename the title.
                    e.preventDefault();
                    if ( lockButton.attr( 'data-lock' ) === 'on' ) return;
                    header.addClass( 'editting' );
                    let name = header.children( 'span' ).hide().html();
                    headerInput
                        .val( app.sanitize( name, true ) )
                        .show().focus();
                })
                .appendTo( container );
            /// Title Changer
            headerInput = $( '<input>' )
                .attr( 'type', 'text' )
                .on( 'change focusout', function () {
                    /// Appears while renaming the title.
                    let self = $( this );
                    name = app.sanitize( self.val() ) || 'Unnamed Event';
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
            /// Date
            $( '<input>' )
                .addClass( 'event-date ui-bar ui-body-a' )
                .attr( 'type', 'text' )
                .val( this.printDate( date ) )
                .on( 'change', function () {
                    let val = app.interpretDate( this.value );
                    if ( val || val === 0 ) {
                        container.attr( 'data-date', val );
                    }
                    app.updateEvent( container );
                })
                .appendTo( container );
            /// Description
            $( '<textarea>' )
                .addClass( 'event-desc ui-bar ui-body-a' )
                .html( this.sanitize( desc, true ) )
                .appendTo( container );
            /// Button Container
            footerButtons = $( '<div>' )
                .addClass( 'event-footer' )
                .appendTo( container );
            /// Marker Button
            $( '<button>' )
                .addClass( 'ui-btn ui-shadow ui-btn-icon-notext ui-icon-location' )
                .attr( 'name', 'Mark' )
                .attr( 'title', 'Mark on Map' )
                .appendTo( footerButtons );
            /// Lock Button
            lockButton = $( '<button>' )
                .addClass( 'ui-btn ui-shadow ui-btn-icon-notext ui-icon-lock' )
                .attr( 'name', 'Lock' )
                .attr( 'title', 'Lock / Unlock' )
                .attr( 'data-lock', 'off' )
                .on( 'click', function () {
                    if ( this.getAttribute( 'data-lock' ) === 'on' ) {
                        this.setAttribute( 'data-lock', 'off' );
                        container.find( 'input, textarea' ).textinput( 'enable' );
                        container.find( 'button' ).attr('disabled', false );
                    } else {
                        this.setAttribute( 'data-lock', 'on' );
                        container.find( 'input, textarea' ).textinput( 'disable' );
                        container.find( 'button' ).not( this ).attr( 'disabled', true );
                        header.attr( 'disabled', false ).find( 'input' ).textinput( 'enable' );
                    }
                })
                .appendTo( footerButtons );
            /// Delete Button
            $( '<button>' )
                .addClass( 'ui-btn ui-shadow ui-btn-icon-notext ui-icon-delete' )
                .attr( 'name', 'Delete' )
                .attr( 'title', 'Delete Event' )
                .on( 'click', () => {
                    if ( confirm( `Are you sure you want to delete "${ this.sanitize( name, true ) }"?` )) {
                        container.remove();
                    }
                })
                .appendTo( footerButtons );
            /// Color Container
            footerColor = $( '<div>' )
                .addClass( 'event-footer' )
                .appendTo( container );
            /// Tag Selection
            tagSelect = $( '<select>' )
                // .attr( 'multiple', 'multiple' )
                // .attr( 'data-native-menu', 'false' )
                .addClass( 'event-tags' )
                .addClass( 'lists-tags' )
                .attr( 'value', tags.join(' ') )
                .on( 'change', function () {
                    let val = this.value;
                    tags = [ val ];
                    container.attr( 'data-tags', tags.join(' ') );
                    app.updateEvent( container );
                })
                .appendTo( footerColor );
            tagSelect.selectmenu({
                'icon': 'tag'
            });
            container.attr( 'data-tags', tags.join(' ') );

            /// Click-and-Drag Functionality
            container.on( 'mousemove', ( e ) => {
                if ( !dragging ) return;
                e.preventDefault();
                let mX = e.pageX,
                    mY = e.pageY,
                    y = mY,
                    left = mX + offX,
                    top = mY + offY,
                    height = container.outerHeight(),
                    found;
                /// Persistent mouse values for edge-scrolling.
                mXP = mX;
                mYP = mY;
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
                        app.placeholder.detach().insertBefore( this );
                        found = true;
                        return;
                    }
                });
                /// The following is true if the container is at the bottom of the list.
                if ( !found ) {
                    this.placeholder.detach().appendTo( eventsPanel );
                }
            });
            container.on( 'mouseup mouseleave', () => {
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
                    .insertAfter( this.placeholder );
                this.placeholder.detach();
                this.updateEvent( container );
            });

            /// Mobile-ize the inputs.
            container.children( 'input, textarea' ).textinput();

            this.updateTags( tagSelect );

            return container;
        }

        createTag( data ) {
            let ind = data.id;
            data.name = data.name || 'Unnamed Tag';
            data.color = data.color || '#ffffff';
            data.cat = data.cat || '';
            this.tags[ ind + '' ] = data;
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
                buttonLeft = $( '<button>' )
                    .addClass( classes )
                    .addClass( 'ui-icon-carat-l' )
                    .appendTo( self );
                /// Value
                $('<span>')
                    .addClass( 'bubble-value' )
                    .appendTo( self );
                /// Right
                buttonRight = $( '<button>' )
                    .addClass( classes )
                    .addClass( 'ui-icon-carat-r' )
                    .appendTo( self );
                buttonLeft.on( 'mousedown', function () {
                    targ.val( targ.val() * 1 - 1 ).trigger( 'change' );
                });
                buttonRight.on( 'mousedown', function () {
                    targ.val( targ.val() * 1 + 1 ).trigger( 'change' );
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
        }

        initDayCtrl() {
            let app = this;
            /// Enable Years Button
            $( '#enable-years' ).on( 'change', function () {
                let enableYears = $( this ).is( ':checked' );
                $( '#days-max' ).textinput( enableYears ? 'enable' : 'disable' );
                app.updateEvent();
            });
            /// Set daysMax.
            $( '#days-max' ).on( 'change input', function () {
                let self = $( this );
                app.daysMax = Math.max( self.val(), self.attr( 'min' ) );
                $( '#time-range-min, #time-range-max, #time-selection' ).trigger( 'change' );
                app.updateEvent();
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
            let app = this;

            /// Sort Events Button
            $( '.sort-events' ).on( 'click', () => {
                this.sortEvents();
            });

            /// Add New Event Button
            $( '.add-new-event' ).on( 'click', () => {
                let newEvent = this.createEvent({
                    name: 'New Event',
                    day: $( '#time-selection' ).val(),
                    tags: 0
                });
                newEvent.children( '.event-title' ).trigger( 'contextmenu' );
            });

            /// Filter Events Button
            $( '.filter-events' ).on( 'click', () => {
                let select = $( 'select.select-filter' ),
                    selectButton = select.parent().toggle();
                if ( selectButton.is( ':visible' ) ) {
                    select.trigger( 'change' );
                } else {
                    $( '.single-event' ).show();
                }
            }).trigger( 'click' );

            /// Filter Events Menu
            $( 'select.select-filter' ).on( 'change', function () {
                if ( !$( this ).parent().is( ':visible' ) ) return;
                let val = this.value;
                $( '.single-event' ).show().each( function () {
                    let self = $( this );
                    if ( !self.attr( 'data-tags' ).includes( val ) ) {
                        self.hide();
                    }
                });
            });
        }

        initTagCtrl() {
            let app = this,
                tag = this.tags[0],
                container = $( '.section-tags' ),
                selectTagButton = $( '#select-tag-button' ),
                tagSelect = $( '#select-tag' ),
                colorInput = $( '#tag-color-input' ),
                colorPicker = $( '.tag-colorpicker' ),
                catInput = $( '#tag-category-input' ),
                descInput = $( '.tag-desc' ),
                deleteButton = $( '.delete-tag' ),
                tagRenamer,
                setTagColor = ( color ) => {
                    container.get(0).style.setProperty( '--color', color );
                    colorInput.val( color );
                    tag.color = color;
                    this.updateTags();
                    this.updateEvent();
                };

            /// Tag Title
            tagSelect
                .on( 'change', () => {
                    tag = this.tags[ tagSelect.val() ];
                    if ( !tag ) {
                        tagSelect.val( 0 );
                        tag = app.tags[ 0 ];
                    }
                    tagRenamer.val( this.sanitize( tag.name, true ) );
                    colorInput.val( tag.color );
                    colorPicker.val( tag.color );
                    catInput.val( this.sanitize( tag.cat, true ) );
                    descInput.val( this.sanitize( tag.desc, true ) );
                    deleteButton.attr('disabled', +tag.id === 0 );
                    if ( +tag.id === 0 ) {
                        colorInput.textinput( 'disable' );
                        descInput.textinput( 'disable' );
                        catInput.textinput( 'disable' );
                    } else {
                        colorInput.textinput( 'enable' );
                        descInput.textinput( 'enable' );
                        catInput.textinput( 'enable' );
                    }
                    container.get( 0 ).style.setProperty( '--color', tag.color );
                })
                .on( 'contextmenu', ( e ) => {
                    e.preventDefault();
                    if ( +tag.id === 0 ) return;
                    if ( !$.contains( document, tagRenamer ) ) {
                        tagRenamer.prependTo( tagSelect.parent() );
                    }
                    selectTagButton.addClass( 'editting' );
                    selectTagButton.siblings( 'span' ).hide();
                    tagRenamer.val( this.sanitize( tag.name, true ) ).show().focus();
                });
            /// Tag Renamer
            tagRenamer = $( '<input>' )
                .attr( 'type', 'text' )
                .on( 'change focusout', () => {
                    if ( +tag.id === 0 ) return;
                    tag.name = app.sanitize( tagRenamer.val() ) || 'Unnamed Tag';
                    tagSelect.children( 'option[selected="selected"]' ).html( tag.name );
                    selectTagButton.removeClass( 'editting' );
                    selectTagButton.siblings( 'span' ).html( tag.name ).show();
                    tagRenamer.hide();
                    this.updateTags();
                })
                .textinput()
                .hide();
            /// Text Field
            colorInput.on( 'change input', () => {
                if ( +tag.id === 0 ) return;
                let color = colorInput.val().replace( /[^A-Fa-f0-9]/g, '' );
                color = '#' + color.substring( 0, 6 );
                tag.color = color;
                setTagColor( color );
            });
            /// Color Picker
            colorPicker.on( 'change.color', function ( e, val ) {
                if ( +tag.id === 0 ) return;
                setTagColor( val );
            });
            catInput.on( 'change', () => {
                if ( +tag.id === 0 ) return;
                tag.cat = this.sanitize( catInput.val() );
                this.updateTags();
            });
            /// Tag Description
            descInput.on( 'change input', () => {
                if ( +tag.id === 0 ) return;
                tag.desc = this.sanitize( descInput.val() );
            });

            tagSelect.trigger( 'change' );

            /// Add New Tag Button
            $( '.add-new-tag' ).on( 'click', () => {
                let id, idList = [];
                for ( const key in this.tags ) {
                    if ( this.tags.hasOwnProperty( key ) ) {
                        idList.push( this.tags[key].id * 1 );
                    }
                }
                for ( let i = 0, l = idList.length + 1; i < l; ++i ) {
                    if ( !idList.includes( i ) ) {
                        id = i;
                        break;
                    }
                }
                let newTag = this.createTag({ 'id': id });
                this.updateTags();
                tagSelect.val( id ).trigger( 'change' ).trigger( 'contextmenu' );
            });
            /// Delete Tag Button
            $( '.delete-tag' ).on( 'click', () => {
                if ( +tag.id === 0 ) return;
                if ( confirm( `Are you sure you want to delete "${ this.sanitize( tag.name, true ) }"?` )) {
                    delete this.tags[ tag.id ];
                    tagSelect.val( tag.id - 1 ).trigger( 'change' );
                    this.updateTags();
                    this.updateEvent();
                }
            });
        }

        interpretDate( d ) {
            if ( !isNaN( +d ) ) {
                return Math.floor( +d );
            }
            let reducer = ( a, b ) => a.length > b.length ? a : b,
                val = d.toLowerCase()
                    .replace( /(year)/g, 'y' )
                    .replace( /(day)/g, 'd' )
                    .replace( /[^-.0-9dy]/g, '' ),
                year = val.match( /y-?[0-9]+/g ),
                day = val.match( /d-?[0-9]+/g ),
                isNegative;
            if ( year ) {
                year = +year.reduce( reducer ).substring( 1 );
                day = day || ['d1'];
            } else {
                year = 0;
            }
            if ( day ) {
                day = +day.reduce( reducer ).substring( 1 );
                isNegative = year < 0 || ( year === 0 && day < 0 );
                if ( isNegative ) {
                    ++year;
                    day = this.daysMax - day;
                }
                year = Math.abs( year );
                day = Math.abs( day );
                day = year * this.daysMax + day;
                if ( isNegative ) day *= -1;
                // console.log( d, '=>', day );
                return Math.ceil( day - 1 );
            } else {
                return null;
            }
        }

        loadData( url ) {
            let app = this,
                deferred = $.Deferred(),
                semicolon = String.fromCharCode( 0x37e ),
                valid = [], elem;
            const parseData = function ( data ) {
                if ( !data ) return;
                let events = data.filter( a => a.type === 'event' ),
                    tags = data.filter( a => a.type === 'tag' );
                /// Load tags FIRST (in case an event relies on a new tag).
                app.tags = [ app.tags[0] ];
                tags.forEach( ( tag ) => {
                    /// Create a new tag.
                    app.createTag( tag );
                });
                app.updateTags();
                /// Load events. Replace existing ones to save memory.
                events.forEach( ( event ) => {
                    elem = $( `.single-event` ).filter( function () {
                        let name = $( this ).find( '.event-title > span' ).html();
                        return name === event.name;
                    });
                    if ( elem.length > 0 ) {
                        /// Update the existing event.
                        event.tags = event.tags || '0';
                        elem.attr( 'data-date', event.day || 0 );
                        elem.attr( 'data-tags', event.tags.join( ' ' ) );
                        elem.find( '.event-desc' ).val( app.sanitize( event.desc, true ) || '' );
                        app.updateEvent( elem );
                    } else {
                        /// Create a new event.
                        elem = app.createEvent( event );
                    }
                    valid.push( event.name );
                });
                $( '.single-event' ).each( function () {
                    let self = $( this ),
                        name = self.find( '.event-title > span' ).html();
                    if ( !valid.includes( name ) ) {
                        self.remove();
                    }
                });
                app.updateTags();
                console.log( 'loaded:', data );
            };

            if ( url ) {
                /// Load from JSON.
                $.getJSON( url, ( data ) => {
                    parseData( data );
                    this.updateEvent();
                }).error( () => {
                    console.error( 'JSON failed to resolve.' );
                    deferred.resolve();
                }).done( () => {
                    deferred.resolve();
                });
            } else {
                /// Load from cookies.
                let data = document.cookie.split( ';' );
                data.forEach( ( cookie, ind ) => {
                    if ( !cookie.includes( '=' ) ) return;
                    let pair = cookie.split( '=' ),
                        key = pair[ 0 ],
                        val = pair[ 1 ];
                    if ( !key.includes('TL_') ) {
                        data[ ind ] = undefined;
                        return;
                    }
                    val = JSON.parse( val );
                    /// Revert Greek question marks back to semicolons.
                    for ( let prop in val ) {
                        if ( val.hasOwnProperty( prop ) && typeof( val[ prop ]) === 'string' ) {
                            val[ prop ] = val[ prop ].replace( new RegExp( semicolon, 'g' ), ';' );
                        }
                    }
                    data[ ind ] = val;
                });
                data = data.filter( e => e !== undefined );
                parseData( data );
                deferred.resolve();
            }
            return deferred;
        }

        printDate( val ) {
            if ( $( '#enable-years' ).is( ':checked' ) ) {
                let year = Math.abs( val ) / this.daysMax,
                    day =  Math.abs( val ) - Math.floor( year ) * this.daysMax;
                if ( val < 0 ) {
                    ++year;
                    day = this.daysMax - day;
                }
                year = Math.floor( year ) * Math.sign( val );
                day = Math.floor( day ) + 1;
                // console.log( val, '=>', `Year ${ year }, Day ${ day }` );
                return `Year ${ year }, Day ${ day }`;
            } else {
                // day += Math.floor( year * this.daysMax );
                return `Day ${ val }`;
            }
        }

        sanitize( str, reverse ) {
            if ( typeof( str ) !== 'string' ) return '';
            if ( reverse ) {
                /// Unsanitize.
                return str
                    .replace( /&lt;/g, '<' )
                    .replace( /&gt;/g, '>' )
                    .replace( /&quot;/g, '"' )
                    .replace( /&#x27;/g, '\'' )
                    .replace( /&#x2F;/g, '/' );
            } else {
                /// Sanitize.
                return str
                    .trim()
                    .replace( /</g, '&lt;' )
                    .replace( />/g, '&gt;' )
                    .replace( /"/g, '&quot;' )
                    .replace( /'/g, '&#x27;' )
                    .replace( /\//g, '&#x2F;' );
            }
        }

        saveData( asCookies ) {
            let app = this,
                out = [],
                semicolon = String.fromCharCode( 0x37e );
            /// Record all events.
            $( '.single-event:not(.placeholder)' ).each( function () {
                let self = $( this );
                out.push({
                    'type': 'event',
                    'name': self.find( '.event-title' ).children( 'span' ).html(),
                    'day':  self.attr( 'data-date' ),
                    'desc': self.find( '.event-desc' ).val(),
                    'tags': self.attr( 'data-tags' ).split( ' ' )
                });
            });
            /// Record all tags (excluding <default>).
            for ( const key in this.tags ) {
                if ( this.tags.hasOwnProperty( key ) && key !== '0' ) {
                    let tag = this.tags[ key ];
                    out.push({
                        'type':  'tag',
                        'id':    key,
                        'name':  tag.name  || '',
                        'color': tag.color || '#ffffff',
                        'cat':   tag.cat   || '',
                        'desc':  tag.desc  || ''
                    });
                }
            }
            if ( asCookies ) {
                let cookie, key, val;
                /// Clear TL cookies.
                document.cookie.split( ';' ).forEach( cookie => {
                    if ( !cookie.includes( '=' ) ) return;
                    key = cookie.split( '=' )[0];
                    if ( !key.includes('TL_') ) return;
                    document.cookie = `${ key }=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                });
                out.forEach( obj => {
                    for ( const key in obj ) {
                        /// Replace semicolons with the similar Greek question mark.
                        if ( obj.hasOwnProperty( key ) && typeof( obj[ key ]) === 'string' ) {
                            obj[ key ] = app.sanitize( obj[ key ] );
                            obj[ key ] = obj[ key ].replace( /;/g, semicolon );
                        }
                    }
                    key = `TL_${ obj.type }_${ obj.id || obj.name }`;
                    val = JSON.stringify( obj );
                    document.cookie = `${ key }=${ val }`;
                });
                // console.log( document.cookie );
            } else {
                //
            }
            console.log( 'saved:', out );
        }

        sortEvents() {
            /// Sort all events chronologically.
            let all = $( '.events' ).children().sort( function ( a, b ) {
                return a.getAttribute( 'data-date' ) - b.getAttribute( 'data-date' );
            });
            $( '.events' ).children().detach();
            $( '.events' ).append( all );
            $( '.events input, .events textarea' ).textinput();
        }

        startAnims() {
            let newLoops = [],
                step = ( t ) => {
                    window.requestAnimationFrame( step );
                    this.loops.forEach( f => {
                        /// Loops should return true to be removed.
                        if ( !f( t ) ) newLoops.push( f );
                    });
                    this.loops = newLoops;
                    newLoops = [];
                };

            window.requestAnimationFrame( step );
        }

        updateEvent( e ) {
            if ( !e ) {
                /// Update everything that has tags.
                let app = this;
                $( '.single-event' ).each( function () {
                    app.updateEvent( this );
                });
                return;
            } else if ( Array.isArray( e ) ) {
                /// Update each individually.
                e.forEach( this.updateEvent );
            }

            let elem = $( e ),
                date = elem.attr( 'data-date' ),
                slider = $( '#time-selection' ),
                tags = elem.attr( 'data-tags' ).split(' '),
                sliderMin = 0,
                sliderMax = 0,
                colors = [];

            /// Update the date.
            elem.find( '.event-date' ).val( this.printDate( date ) );

            /// Update the color.
            tags.forEach( tag => {
                colors.push( this.tags[ tag ].color );
            });
            elem.get(0).style.setProperty( '--color', colors[0] || '#ffffff' );

            /// Update the timeline.
            $( '.single-event' ).each( function () {
                let date = $( this ).attr( 'data-date' );
                sliderMin = Math.min( sliderMin, date );
                sliderMax = Math.max( sliderMax, date );
            });
            slider
                .attr( 'min', sliderMin )
                .attr( 'max', sliderMax )
                .trigger( 'change' );

            return elem;
        }

        updateTags( e ) {
            if ( !e ) {
                /// Update everything that has tags.
                let app = this;
                $( 'select.lists-tags' ).each( function () {
                    app.updateTags( this );
                });
                return;
            } else if ( Array.isArray( e ) ) {
                /// Update each individually.
                e.forEach( this.updateTags );
            }

            let elemSelect = $( e ),
                elemHasTags = elemSelect.is( '.event-tags' ),
                tags = elemSelect.val() || '0',
                keys = Object.keys( this.tags ).sort( ( a, b ) => {
                    /// Alphabetize the tag IDs by their names.
                    let aN = this.sanitize( this.tags[ a ].name.toLowerCase(), true ),
                        bN = this.sanitize( this.tags[ b ].name.toLowerCase(), true );
                    if ( this.tags[ a ].id === 0 ) return -1;
                    if ( this.tags[ b ].id === 0 ) return 1;
                    if ( aN < bN ) return -1;
                    if ( aN > bN ) return 1;
                    return 0;
                }),
                newTags = [],
                elem;
            if ( !elemSelect.length ) return;

            if ( elemHasTags ) {
                /// These tags correspond to something.
                elem = elemSelect.parents( '[data-tags]' ).first();
                tags = elem.attr( 'data-tags' ) || tags;
            }
            tags = tags.split(' ');

            /// Remove all of the options.
            elemSelect.find( 'option' ).remove();
            /// Make a new option for each tag in alphabetical order.
            keys.forEach( key => {
                let obj = this.tags[ key ],
                    opt = $( '<option>' )
                        .attr( 'value', '' + obj.id )
                        .html( obj.name )
                        .appendTo( elemSelect );
                if ( tags.includes( '' + obj.id ) ) {
                    /// This tag is valid and should be kept.
                    newTags.push( obj.id );
                }
            });

            elemSelect.val( newTags[0] );

            if ( elemHasTags ) {
                if ( newTags.length ) {
                    /// Replace tags data with list of tags known to be valid.
                    elem.attr( 'data-tags', newTags.join(' ') );
                } else {
                    /// Default to <default> if there are no valid tags.
                    elemSelect.val( 0 );
                    elem.attr( 'data-tags', '0' );
                    this.updateEvent( elem );
                }
            }
            elemSelect.trigger( 'change' );

        }
    }

    $(function () {
        const app = new App();
    });

})();
