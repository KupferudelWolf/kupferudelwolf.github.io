import * as THREE from '/build/three.js/build/three.module.js';
import { UVsDebug } from '/build/three.js/examples/jsm/utils/UVsDebug.js';
import { OrbitControls } from '/build/three.js/examples/jsm/controls/OrbitControls.js';
import AV from '/lib/av.module.js';

const CVS = document.getElementById( '#output' );
const CTX = CVS.getContext( '2d' );

( function () {

    class App {
        geo = {};
        shaders = {};
        radius = 6371;

        // mode = 'realistic';
        mode = 'heatmap';

        dir_glsl = [
            'ground.fragment.glsl',
            'ground.vertex.glsl',
            'sky.fragment.glsl',
            'sky.vertex.glsl'
        ];

        constructor() {
            AV.createStats();

            this.loadGLSL().then( () => {
                this.initCanvas( CVS );
                this.initRenderer();
                this.initCamera();
                this.initScenes();
                this.initControls();
                this.initGUI();
                $( window ).resize();
                this.ready = true;
            } );
        }

        loadGLSL() {
            const defers = [ $.Deferred() ];
            const deferred = $.Deferred();

            this.dir_glsl.forEach( ( file ) => {
                const defer = $.Deferred();
                defers.push( defer );
                $.ajax( {
                    url: `./shaders/${ file }`,
                    dataType: 'text',
                    success: ( data ) => {
                        const split = file.split( '.' );
                        const group = split[ 0 ];
                        const key = split[ 1 ];
                        if ( !this.shaders[ group ] ) {
                            this.shaders[ group ] = {};
                        }
                        this.shaders[ group ][ key ] = data;
                        defer.resolve();
                    }
                } );
            } );
            defers[ 0 ].resolve();

            $.when( ...defers ).done( deferred.resolve );

            return deferred;
        }

        /** WebGL camera. */
        initCamera() {
            this.camera = new THREE.PerspectiveCamera(
                45,
                CVS.width / CVS.height,
                1, 100000
            );

            // this.camera.position.z = -4;
            this.camera.position.set( this.radius * 4, 0, 0 );
        }

        initCanvas( cvs ) {
            $( window ).on( 'resize', () => {
                cvs.width = window.innerWidth;
                cvs.height = window.innerHeight;
                if ( !this.camera ) return;
                this.camera.aspect = CVS.width / CVS.height;
                this.camera.updateProjectionMatrix();
                if ( !this.renderer ) return;
                this.renderer.setSize( CVS.width, CVS.height );
            } );
        }

        initControls() {
            this.controls = new OrbitControls( this.camera, CVS );
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.1;
            this.controls.rotateSpeed = 0.44;
            this.controls.enablePan = false;
            this.controls.enableZoom = true;
            this.controls.enabled = true;
            this.controls.minPolarAngle = 0;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.minDistance = this.radius * 2;
            this.controls.maxDistance = this.camera.far - this.radius;
        }

        initGUI() {
            const div = $( '<div>' );
        }

        /** WebGL renderer. */
        initRenderer() {
            this.renderer = new THREE.WebGLRenderer( {
                alpha: false,
                antialias: true
            } );
            this.renderer.setPixelRatio( window.devicePixelRatio );
            this.renderer.setSize( CVS.width, CVS.height );
        }

        /** WebGL objects. */
        initScenes() {
            const globe_geo = new THREE.IcosahedronGeometry( this.radius, 21 );
            const globe_mat = new THREE.MeshBasicMaterial();
            let min_x = Infinity, max_x = -Infinity,
                min_y = Infinity, max_y = -Infinity;
            // for ( let ind = 0, len = globe_geo.attributes.uv.count; ind < len; ++ind ) {
            //     const x = globe_geo.attributes.uv.getX( ind );
            //     const y = globe_geo.attributes.uv.getY( ind );
            //     min_x = Math.min( x, min_x );
            //     max_x = Math.max( x, max_x );
            //     min_y = Math.min( y, min_y );
            //     max_y = Math.max( y, max_y );
            // }
            // for ( let ind = 0, len = globe_geo.attributes.uv.count; ind < len; ++ind ) {
            //     let x = globe_geo.attributes.uv.getX( ind );
            //     let y = globe_geo.attributes.uv.getY( ind );
            //     x = AV.map( x, min_x, max_x, 0, 1 );
            //     y = AV.map( y, min_y, max_y, 0, 1 );
            //     globe_geo.attributes.uv.setXY( ind, x, y );
            // }
            // for ( let ind = 0, len = globe_geo.attributes.uv.count; ind < len; ind += 3 ) {
            //     const u = [], v = [];
            //     var zero = -1;
            //     for ( let i = 0; i < 3; ++i ) {
            //         const x = globe_geo.attributes.normal.getX( ind + i );
            //         const y = globe_geo.attributes.normal.getY( ind + i );
            //         const z = globe_geo.attributes.normal.getZ( ind + i );
            //         const a = 0.5 + Math.atan2( z, x ) / AV.RADIAN;
            //         const b = 0.5 - Math.asin( y ) / Math.PI;
            //         u.push( a );
            //         v.push( b );
            //         // if ( zero === -1 && a === 1 ) zero = i;
            //     }
            //     // if ( zero !== -1 ) {
            //         const len_a = [], len_b = [];
            //         for ( let i = 0; i < 3; ++i ) {
            //             // const i_a = ( 3 + i - zero ) % 3;
            //             const i_a = ( i + ind ) % 3;
            //             const i_b = ( i_a + 1 ) % 3;
            //             var l = AV.dist( u[ i_a ], v[ i_a ], u[ i_b ], v[ i_b ] );
            //             len_a.push( l );
            //             if ( i_a === 0 ) l = AV.dist( 1 - u[ i_a ], v[ i_a ], u[ i_b ], v[ i_b ] );
            //             if ( i_b === 0 ) l = AV.dist( u[ i_a ], v[ i_a ], 1 - u[ i_b ], v[ i_b ] );
            //             len_b.push( l );
            //         }
            //         const sp_a = len_a.reduce( ( a, b ) => a + b ) / 2;
            //         const sp_b = len_b.reduce( ( a, b ) => a + b ) / 2;
            //         const area_a = Math.sqrt( sp_a * ( sp_a - len_a[0] ) * ( sp_a - len_a[1] ) * ( sp_a - len_a[2] ) );
            //         const area_b = Math.sqrt( sp_b * ( sp_b - len_b[0] ) * ( sp_b - len_b[1] ) * ( sp_b - len_b[2] ) );
            //         if ( area_b < area_a ) {
            //             u[ zero ] = 1 - u[ zero ];
            //         }
            //     // }
            //     for ( let i = 0; i < 3; ++i ) {
            //         globe_geo.attributes.uv.setXY( ind + i, u[i], v[i] );
            //     }
            //     // if ( z === 0 ) {
            //     //     if ( v_claimed.includes( v ) ) {
            //     //         u = 1 - u;
            //     //     } else {
            //     //         v_claimed.push( v );
            //     //     }
            //     // }
            //     // globe_geo.attributes.uv.setXY( ind, u, v );
            // }
            globe_mat.wrapS = THREE.RepeatWrapping;
            globe_mat.wrapT = THREE.RepeatWrapping;
            globe_geo.attributes.uv.needsUpdate = true;
            const globe_mesh = new THREE.Mesh( globe_geo, globe_mat );

            this.scenes = {
                heatmap: {},
                realistic: {}
            };
            for ( const key in this.scenes ) {
                if ( !this.scenes.hasOwnProperty( key ) ) return;
                const globe = globe_mesh.clone();
                const scene = new THREE.Scene();
                this.scenes[ key ].globe = globe;
                this.scenes[ key ].scene = scene;

                scene.add( globe );
                // scene.add( this.camera );
                scene.background = 0x000000;

                this.scenes[ key ].init = () => { };
                this.scenes[ key ].update = () => { };
            }

            this.initHeatmapScene();
            this.initRealisticScene();

            /// DEBUG
            this.scenes[ this.mode ].init();
        }

        initHeatmapScene() {
            const scene = this.scenes.heatmap.scene;
            const globe = this.scenes.heatmap.globe;
            const globe_mat = new THREE.MeshStandardMaterial( {
                color: 0xdddddd
            } );
            const res = 2 ** 13;
            // const res = 2**8;

            const axis_y = new THREE.ArrowHelper(
                new THREE.Vector3( 0, 1, 0 ),
                new THREE.Vector3( 0, -this.radius * 1.25, 0 ),
                this.radius * 2.5,
                0x00ff00,
                this.radius * 0.15
            );
            this.scenes.heatmap.globe.add( axis_y );

            scene.background = new THREE.Color( 0x444444 );

            const light = new THREE.DirectionalLight();
            scene.add( light );

            const lines_cvs = $( '<canvas>' )
                .attr( {
                    'width': res,
                    'height': res
                } )
                .get( 0 );
            const lines_ctx = lines_cvs.getContext( '2d' );

            const uv_cvs = UVsDebug( globe.geometry, {
                size: res,
                showText: false
            } );
            // const uv_ctx = uv_cvs.getContext( '2d' );
            const div_uv = $( '<div>' );
            div_uv.css( {
                'position': 'absolute',
                'right': 0,
                'top': 0,
                'width': `320px`
            } );
            $( uv_cvs ).css( 'width', '100%' );
            div_uv.appendTo( 'body' );
            div_uv.append( uv_cvs );

            lines_ctx.drawImage( uv_cvs, 0, 0 );

            const globe_tex = new THREE.CanvasTexture( lines_cvs );
            globe_mat.map = globe_tex;

            const raycaster = new THREE.Raycaster();
            const pointer = {};
            var intersected;

            $( CVS ).on( 'mouseover mousemove', ( e ) => {
                if ( this.mode !== 'heatmap' ) return;
                const m_x = e.clientX;
                const m_y = e.clientY;
                pointer.x = 2 * m_x / window.innerWidth - 1;
                pointer.y = 1 - 2 * m_y / window.innerHeight;
                raycaster.setFromCamera( pointer, this.camera );
                const intersects = raycaster.intersectObjects( [ globe ], false );
                if ( intersects.length > 0 ) {
                    if ( intersected != intersects[ 0 ] ) {
                        intersected = intersects[ 0 ];
                    }
                } else {
                    intersected = null;
                    return;
                }
            } );

            this.scenes.heatmap.init = () => {
                globe.material = globe_mat;
            };
            this.scenes.heatmap.update = () => {
                light.position.set( 0, 1, 0 );
                light.position.copy( this.camera.position );

                if ( !intersected ) return;
                const uv = intersected.uv;
                const uv_x = uv.x * uv_cvs.width;
                const uv_y = ( 1 - uv.y ) * uv_cvs.height;
                // intersected.object.material.map.transformUv( uv );

                lines_ctx.clearRect( 0, 0, res, res );
                lines_ctx.drawImage( uv_cvs, 0, 0 );
                lines_ctx.fillStyle = 'red';
                // for ( let x = -1; x <= 1; ++x ) {
                lines_ctx.beginPath();
                lines_ctx.ellipse(
                    uv_x + 0 * uv_cvs.width,
                    uv_y,
                    20, 40, 0,
                    0, AV.RADIAN );
                lines_ctx.closePath();
                lines_ctx.fill();
                // }

                globe.material.map.needsUpdate = true;
            };
        }

        initRealisticScene() {
            const scene = this.scenes.realistic.scene;
            const globe = this.scenes.realistic.globe;
            const atmo_param = {
                Kr: 0.0025,
                Km: 0.0010,
                ESun: 20.0,
                g: -0.950,
                innerRadius: this.radius,
                outerRadius: this.radius * 1.025,
                wavelength: [ 0.650, 0.570, 0.475 ],
                scaleDepth: 0.25,
                mieScaleDepth: 0.1
            };

            const ambient = new THREE.AmbientLight( 0x1f1f1f );
            scene.add( ambient );

            const light = new THREE.DirectionalLight( 0xfff5f2, 0.9 );
            light.position.set( 0, 0, -1 );
            scene.add( light );

            const sky_geo = new THREE.IcosahedronGeometry( this.camera.far, 20 );
            const sky_mat = new THREE.MeshBasicMaterial( {
                color: 0x000000,
                side: THREE.BackSide
            } );
            const sky_mesh = new THREE.Mesh( sky_geo, sky_mat );
            scene.add( sky_mesh );

            const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
            const diffuse = THREE.ImageUtils.loadTexture( '/map-small.jpg' );
            const diffuseNight = THREE.ImageUtils.loadTexture( '/map-lights.jpg' );
            diffuse.anisotropy = maxAnisotropy;
            diffuseNight.anisotropy = maxAnisotropy;

            const uniforms = {
                v3LightPosition: {
                    type: 'v3',
                    value: new THREE.Vector3( 1e8, 0, 1e8 ).normalize()
                },
                v3InvWavelength: {
                    type: 'v3',
                    value: new THREE.Vector3( 1 / Math.pow( atmo_param.wavelength[ 0 ], 4 ), 1 / Math.pow( atmo_param.wavelength[ 1 ], 4 ), 1 / Math.pow( atmo_param.wavelength[ 2 ], 4 ) )
                },
                fCameraHeight: {
                    type: 'f',
                    value: 0
                },
                fCameraHeight2: {
                    type: 'f',
                    value: 0
                },
                fInnerRadius: {
                    type: 'f',
                    value: atmo_param.innerRadius
                },
                fInnerRadius2: {
                    type: 'f',
                    value: atmo_param.innerRadius * atmo_param.innerRadius
                },
                fOuterRadius: {
                    type: 'f',
                    value: atmo_param.outerRadius
                },
                fOuterRadius2: {
                    type: 'f',
                    value: atmo_param.outerRadius * atmo_param.outerRadius
                },
                fKrESun: {
                    type: 'f',
                    value: atmo_param.Kr * atmo_param.ESun
                },
                fKmESun: {
                    type: 'f',
                    value: atmo_param.Km * atmo_param.ESun
                },
                fKr4PI: {
                    type: 'f',
                    value: atmo_param.Kr * 4.0 * Math.PI
                },
                fKm4PI: {
                    type: 'f',
                    value: atmo_param.Km * 4.0 * Math.PI
                },
                fScale: {
                    type: 'f',
                    value: 1 / ( atmo_param.outerRadius - atmo_param.innerRadius )
                },
                fScaleDepth: {
                    type: 'f',
                    value: atmo_param.scaleDepth
                },
                fScaleOverScaleDepth: {
                    type: 'f',
                    value: 1 / ( atmo_param.outerRadius - atmo_param.innerRadius ) / atmo_param.scaleDepth
                },
                g: {
                    type: 'f',
                    value: atmo_param.g
                },
                g2: {
                    type: 'f',
                    value: atmo_param.g * atmo_param.g
                },
                nSamples: {
                    type: 'i',
                    value: 3
                },
                fSamples: {
                    type: 'f',
                    value: 3.0
                },
                tDiffuse: {
                    type: 't',
                    value: diffuse
                },
                tDiffuseNight: {
                    type: 't',
                    value: diffuseNight
                },
                tDisplacement: {
                    type: 't',
                    value: 0
                },
                tSkyboxDiffuse: {
                    type: 't',
                    value: 0
                },
                fNightScale: {
                    type: 'f',
                    value: 1
                }
            };
            const ground_mat = new THREE.ShaderMaterial( {
                uniforms: uniforms,
                vertexShader: this.shaders.ground.vertex,
                fragmentShader: this.shaders.ground.fragment
            } );

            const atmo = {
                geometry: new THREE.IcosahedronGeometry( atmo_param.outerRadius, 20 ),
                material: new THREE.ShaderMaterial( {
                    uniforms: uniforms,
                    vertexShader: this.shaders.sky.vertex,
                    fragmentShader: this.shaders.sky.fragment
                } )
            };

            atmo.mesh = new THREE.Mesh( atmo.geometry, atmo.material );
            atmo.material.side = THREE.BackSide;
            atmo.material.transparent = true;

            scene.add( atmo.mesh );

            const sun_radius = 695700;
            const sun_dist = 1.496e+8;
            const sun_ang_diam = 2 * Math.atan( sun_radius / sun_dist );
            const sim_dist = this.camera.far / 2;
            const sim_rad = sim_dist * Math.tan( sun_ang_diam / 2 );
            const sun_color_value = atmo_param.wavelength.map( x => Math.round( x * 255 ) ).join( ',' );
            const sun_color = new THREE.Color( `rgb(${ sun_color_value })` );
            const sun_geo = new THREE.IcosahedronGeometry( 1, 20 );
            const sun_mat = new THREE.MeshBasicMaterial( {
                color: sun_color
            } );
            const sun_mesh = new THREE.Mesh( sun_geo, sun_mat );
            sun_mesh.scale.set( sim_rad, sim_rad, sim_rad );
            sun_mesh.position.set( 0, 0, -sim_dist );
            scene.add( sun_mesh );
            // light.position.set( 0, 0, -1 );
            light.color = sun_color;

            this.scenes.realistic.init = () => {
                globe.material = ground_mat;
            };
            this.scenes.realistic.update = () => {
                /// Update atmosphere.
                this.camera.lookAt( 0, 0, 0 );
                const light_pos = light.position.clone();
                const camera_height = this.camera.position.length();

                atmo.mesh.material.uniforms.v3LightPosition.value = light_pos;
                atmo.mesh.material.uniforms.fCameraHeight.value = camera_height;
                atmo.mesh.material.uniforms.fCameraHeight2.value = camera_height ** 2;
                // ground.mesh.material.uniforms.v3LightPosition.value = light_pos;
                // ground.mesh.material.uniforms.fCameraHeight.value = camera_height;
                // ground.mesh.material.uniforms.fCameraHeight2.value = camera_height ** 2;
                globe.material.uniforms.v3LightPosition.value = light_pos;
                globe.material.uniforms.fCameraHeight.value = camera_height;
                globe.material.uniforms.fCameraHeight2.value = camera_height ** 2;

                /// Update star.
                const sun_radius = 695700;
                const sun_dist = 1.496e+8;
                const sun_ang_diam = 2 * Math.atan( sun_radius / sun_dist );

                const targ_dist = 0;//-this.camera.far;

                const cam_dist = this.camera.position.distanceTo( new THREE.Vector3( 0, 0, 0 ) );

                const ang = this.camera.position.angleTo( new THREE.Vector3( 0, 0, -1 ) );

                const sim_dist = Math.sqrt( cam_dist ** 2 + targ_dist ** 2 - 2 * cam_dist * targ_dist * Math.cos( ang ) );
                const sim_rad = sim_dist * Math.tan( sun_ang_diam / 2 );

                sun_mesh.position.set( 0, 0, -sim_dist );
                sun_mesh.scale.set( sim_rad, sim_rad, sim_rad );
            };
        }

        /** Renders a frame of the WebGL scene. */
        render() {
            this.renderer.render( this.scenes[ this.mode ].scene, this.camera );
            CTX.drawImage( this.renderer.domElement, 0, 0 );
        }

        loop() {
            if ( !this.ready ) return;
            this.scenes[ this.mode ].update();
            this.render();
        }

        run() {
            let start;
            const rate = 1000 / 60;
            const step = ( time ) => {
                let delta = Math.floor( time - start );
                if ( delta >= rate || !start ) {
                    start = time;
                    this.loop();
                }
                window.requestAnimationFrame( step );
            };
            window.requestAnimationFrame( step );
        }
    }

    $( function () {
        const app = new App();

        app.run();
    } );

} )();
