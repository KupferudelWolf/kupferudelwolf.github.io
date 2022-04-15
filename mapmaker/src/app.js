import * as THREE from '/build/three.js/build/three.module.js';
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
                $( window ).resize();
                this.ready = true;
            });
        }

        loadGLSL() {
            const defers = [ $.Deferred() ];
            const deferred = $.Deferred();

            this.dir_glsl.forEach( ( file ) => {
                const defer = $.Deferred();
                defers.push( defer );
                $.ajax({
                    url: `./shaders/${ file }`,
                    dataType: 'text',
                    success: ( data ) => {
                        const split = file.split('.');
                        const group = split[0];
                        const key = split[1];
                        if ( !this.shaders[ group ] ) {
                            this.shaders[ group ] = {};
                        }
                        this.shaders[ group ][ key ] = data;
                        defer.resolve();
                    }
                });
            });
            defers[0].resolve();

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
            });
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

        /** WebGL renderer. */
        initRenderer() {
            this.renderer = new THREE.WebGLRenderer({
                alpha: false,
                antialias: true
            });
            this.renderer.setPixelRatio( window.devicePixelRatio );
            this.renderer.setSize( CVS.width, CVS.height );
        }

        /** WebGL objects. */
        initScenes() {
            const globe = {
                geometry: new THREE.IcosahedronGeometry( this.radius, 20 ),
                material: new THREE.MeshBasicMaterial()
            };
            globe.mesh = new THREE.Mesh( globe.geometry, globe.material );
            this.geo.globe = globe.mesh;

            this.scenes = {
                heatmap: {},
                realistic: {}
            };
            for ( const key in this.scenes ) {
                if ( !this.scenes.hasOwnProperty( key ) ) return;
                const globe = this.geo.globe.clone()
                const scene = new THREE.Scene();
                this.scenes[ key ].globe = globe;
                this.scenes[ key ].scene = scene;

                scene.add( globe );
                // scene.add( this.camera );
                scene.background = 0x000000;

                this.scenes[ key ].init = () => {};
                this.scenes[ key ].update = () => {};
            }

            this.initHeatmapScene();
            this.initRealisticScene();

            /// DEBUG
            this.scenes[ this.mode ].init();
        }

        initHeatmapScene() {
            const scene = this.scenes.heatmap.scene;
            const globe_mat = new THREE.MeshStandardMaterial({
                color: 0xdddddd
            });

            const axis = new THREE.ArrowHelper(
                new THREE.Vector3( 0, 1, 0 ),
                new THREE.Vector3( 0, -this.radius * 1.25, 0 ),
                this.radius * 2.5,
                0xff0000,
                this.radius * 0.15
            );
            scene.add( axis );

            scene.background = new THREE.Color( 0x444444 );

            const light = new THREE.DirectionalLight();
            scene.add( light );

            this.scenes.heatmap.init = () => {
                this.scenes.heatmap.globe.material = globe_mat;
            };
            this.scenes.heatmap.update = () => {
                light.position.set( 0, 1, 0 );
                light.position.copy( this.camera.position );
            };
        }

        initRealisticScene() {
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
            this.scenes.realistic.scene.add( ambient );

            this.scenes.realistic.light = new THREE.DirectionalLight( 0xfff5f2, 0.9 );
            this.scenes.realistic.light.position.set( 0, 0, -1 );
            this.scenes.realistic.scene.add( this.scenes.realistic.light );

            const sky_geo = new THREE.IcosahedronGeometry( this.camera.far, 20 );
            const sky_mat = new THREE.MeshBasicMaterial({
                color: 0x000000,
                side: THREE.BackSide
            });
            const sky_mesh = new THREE.Mesh( sky_geo, sky_mat );
            this.scenes.realistic.scene.add( sky_mesh );

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
                    value: new THREE.Vector3( 1 / Math.pow( atmo_param.wavelength[0], 4 ), 1 / Math.pow( atmo_param.wavelength[1], 4 ), 1 / Math.pow( atmo_param.wavelength[2], 4 ) )
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
            const ground_mat = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: this.shaders.ground.vertex,
                fragmentShader: this.shaders.ground.fragment
            });

            this.geo.globe.material = ground_mat;

            const sky = {
                geometry: new THREE.IcosahedronGeometry( atmo_param.outerRadius, 20 ),
                material: new THREE.ShaderMaterial({
                    uniforms: uniforms,
                    vertexShader: this.shaders.sky.vertex,
                    fragmentShader: this.shaders.sky.fragment
                })
            };

            sky.mesh = new THREE.Mesh( sky.geometry, sky.material );
            sky.material.side = THREE.BackSide;
            sky.material.transparent = true;

            this.geo.atmo = sky.mesh;
            this.scenes.realistic.scene.add( sky.mesh );

            const sun_radius = 695700;
            const sun_dist = 1.496e+8;
            const sun_ang_diam = 2 * Math.atan( sun_radius / sun_dist );
            const sim_dist = this.camera.far / 2;
            const sim_rad = sim_dist * Math.tan( sun_ang_diam / 2 );
            const sun_color_value = atmo_param.wavelength.map( x => Math.round( x * 255 ) ).join( ',' );
            const sun_color = new THREE.Color( `rgb(${ sun_color_value })` );
            const sun_geo = new THREE.IcosahedronGeometry( 1, 20 );
            const sun_mat = new THREE.MeshBasicMaterial({
                color: sun_color
            });
            const sun_mesh = new THREE.Mesh( sun_geo, sun_mat );
            sun_mesh.scale.set( sim_rad, sim_rad, sim_rad );
            sun_mesh.position.set( 0, 0, -sim_dist );
            this.scenes.realistic.scene.add( sun_mesh );
            // this.scenes.realistic.light.position.set( 0, 0, -1 );
            this.scenes.realistic.light.color = sun_color;

            this.scenes.realistic.init = () => {
                this.geo.globe.material = ground_mat;
            };
            this.scenes.realistic.update = () => {
                /// Update atmosphere.
                this.camera.lookAt( 0, 0, 0 );
                const light = this.scenes.realistic.light.position.clone();
                const cameraHeight = this.camera.position.length();

                this.geo.atmo.material.uniforms.v3LightPosition.value = light;
                this.geo.atmo.material.uniforms.fCameraHeight.value = cameraHeight;
                this.geo.atmo.material.uniforms.fCameraHeight2.value = cameraHeight ** 2;
                this.geo.globe.material.uniforms.v3LightPosition.value = light;
                this.geo.globe.material.uniforms.fCameraHeight.value = cameraHeight;
                this.geo.globe.material.uniforms.fCameraHeight2.value = cameraHeight ** 2;

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
    });

})();
