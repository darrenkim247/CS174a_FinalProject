import {defs, tiny} from './examples/common.js';
import {Gouraud_Shader, Ring_Shader} from './examples/shaders.js'
import {Shape_From_File} from './examples/obj-file-demo.js'

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene,
} = tiny;

var clicked = null;
var mousedown = null;
var mouseup = null;
var mouse = null;
var isR = false;

export class Project extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        this.widget_options = {show_canvas: true, make_controls: false, show_explanation: true,
            make_editor: false, make_code_nav: false};

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(40, 40),
            torus2: new defs.Torus(3, 15),
            flat_sphere_1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
            sphere_4: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            box: new defs.Cube(), 
            apple: new defs.Subdivision_Sphere(2),
            crosshair: new defs.Regular_2D_Polygon(1, 4),
            particle: new defs.Regular_2D_Polygon(1, 4),
            menu: new defs.Cube(),
            arrowhead: new (defs.Closed_Cone.prototype.make_flat_shaded_version())(4,4,[[0,2],[0,1]]),
            feather: new defs.Triangle(),
            bow: new defs.Surface_Of_Revolution(30, 30,
                Vector3.cast( [0,9.5,0], [0,10,.3],[0,10,.7],[0,9.5,1],[0,9.5,0]),
                Vector3.cast( [0,9.5,0], [0,10,.3],[0,10,.7],[0,9.5,1],[0,9.5,0]),
                Math.PI),
            barrel: new defs.One_Capped_Cylinder(16,16,[[0,2],[0,1]]),
            text: new Text_Line(35)
        };

        this.base_ambient = 0.5;

        // *** Materials
        this.materials = {
            phong: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#ffffff")}),
            test2: new Material(new Gouraud_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#992828")}),
            test3: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#ff8e31")}),
            test4: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 1, color: color(0.5, 0.5, 0.5, 1)}),

            light_gadget: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, color: color(1, 1, 1, 1)}),
            floor: new Material(new defs.Textured_Phong(), {ambient: .7, diffusivity: 1, color: color(0.1, 0.1, 0.2, 1), texture: new Texture("assets/concrete.png")}),

            stem: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#693423")}),
            leaf: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#2cb733")}),
            apple: new Material(new Gouraud_Shader(), {ambient: .4, diffusivity: .6, color: hex_color("#ff0000")}),

            skin: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("a97d64")}),
            shirt: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("494697")}),
            pants: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#0eaeae")}),

            face: new Material(new defs.Fake_Bump_Map(1), {ambient: .5, texture: new Texture("assets/face.gif")}),

            crosshair: new Material(new defs.Textured_Phong(), {ambient: 1, texture: new Texture("assets/crosshair.png")}),
            apple_kill: new Material(new defs.Textured_Phong(), {ambient: 1, texture: new Texture("assets/apple_kill.png")}),


            menu: new Material(new defs.Textured_Phong(), {ambient: 1, texture: new Texture("assets/pausemenu.png")}),
            start_menu: new Material(new defs.Textured_Phong(), {ambient: 1, texture: new Texture("assets/startmenu.png")}),
            pause_menu: new Material(new defs.Textured_Phong(), {ambient: 1, texture: new Texture("assets/pause.png")}),
            gameover_menu: new Material(new defs.Textured_Phong(), {ambient: 1, texture: new Texture("assets/gameover.png")}),
            gameoverchild_menu: new Material(new defs.Textured_Phong(), {ambient: 1, texture: new Texture("assets/gameoverchild.png")}),

            arrow_dark: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: color(0.26, 0.15, 0.15, 1)}),
            arrowhead: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#9fa4ab")}),
            feather: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#ffffff")}),

            barrel: new Material(new defs.Fake_Bump_Map(1), {ambient: .5, texture: new Texture("assets/bark_tex.jpg")})

        }
        this.text_image = new Material(new defs.Textured_Phong(1), {
            ambient: 1, diffusivity: 0, specularity: 0,
            texture: new Texture("assets/text.png")
        });

        this.initial_eye = vec3(0, 2, 6);
        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0));
        this.camera_delta = vec3(0, 0, 0);

        this.canvas = document.querySelector("#main-canvas");
        this.canvas.addEventListener('mousedown', function(evt) { clicked = evt; mousedown = evt; });
        this.canvas.addEventListener('mouseup', function(evt) { clicked = null; mousedown = null; mouseup = evt; });

        this.canvas.addEventListener('mousemove', function(evt) { mouse = evt; });

        this.child = new ChildModel(vec3(0, 0, 0), this);

        this.physics_objects = [
        ]
        this.kinematic_objects = [
            new Floor(vec3(0, -0.5, 0), this, 0.75, 0.97),
            new Model(vec3(0, 0, 0), this),
            this.child,
            new Bow(vec3(0, 0, 0), this),
        ]
        this.pauseButton = new Button3D(vec3(0, 0, 0), this);

        this.States = {
            'start' : 0,
            'game' : 1,
            'gameOver' : 2,
            'gameOverChild' : 3,
            'none': null
        }
        
        this.crosshair = new Crosshair(this);
        this.pause = new Menu(this, "pause");
        this.startm = new Menu(this, "start");
        this.gameoverm = new Menu(this, "gameover");
        this.gameoverchildm = new Menu(this, "gameoverchild");

        this.main_light = new Light(vec4(0, 8, 0, 1), hex_color('#ffffff'), 10**3);
        this.reset();

    }

    reset() {
        isR = false;
        this.state = this.States.start;
        this.level = 1;
        this.apples_thrown = 0;
        this.total_apples_thrown = 0;
        this.dist_sum = 0;
        this.true_accuracy = 0;
        this.apples_hit = 0;
        this.def_lives = 5;
        this.lives = this.def_lives;
        this.score = 0;
        this.ticking = true;
        this.paused = true;
        this.speed = 1.0;
        this.speed_to = 1.0;
        this.fov_default = Math.PI / 4;
        this.fov_mult = 1.0;
        this.fov_to = 1.0;
        this.fov_drawn = 0.7;
        this.shot_cooldown = 1;
        this.cam_lerp = 0.05;
        this.cam_lerp_to = 0.05;

        this.accuracy = 0.0;
        this.tick = 0;
        this.level_start = 1;
        this.level_start_float = 1;
        this.fps = 0;
        this.cooldown = 150;
        this.temp_cooldown = 0;
        this.base_cooldown = 150;
        this.last_mouse = null;
        this.mouse_sens = 0.5;
        this.play_scope_in = true;
        this.volume = 1.0;

        this.particles = 0;

        this.initial_arrow_vel = vec3(0, 0, -25);

        this.camera_to = this.initial_camera_location;
        this.physics_objects = [];
    }
    make_control_panel() {
    }

    mro(scale) {
        return (Math.random()-0.5)*scale;
    }
    clicked(event) {}
    game_toggleScope(bool) {
        if(!bool) {
            this.fov_to = 1.0;
        } else {
            this.fov_to = this.fov_drawn;
            if(this.play_scope_in) {
                document.querySelector("#draw").volume = (this.volume * 0.6);
                document.querySelector("#draw").currentTime = 0;
                document.querySelector("#draw").play();
            }
        }
    }

    game_spawnArrow(fov, program_state, context) {
        document.querySelector("#drawback").volume = (this.volume * 0.6);
        document.querySelector("#drawback").currentTime = 0;
        document.querySelector("#drawback").play();
        this.physics_objects.push(new Arrow(this.initial_eye, this.initial_arrow_vel.times(fov**4), this, program_state, context));
        this.accuracy = (this.total_apples_thrown == 0 ? 1 : this.apples_hit) / (this.total_apples_thrown == 0 ? 1 : this.total_apples_thrown);
        //minimum accuracy is 0, maximum is 1
        //max of dist_sum is apples_hit * 0.5, min is 0
        this.true_accuracy = 1 - ((this.dist_sum)/(this.apples_hit * 0.5));
    }

    game_appleHit(arrow, apple) {
        apple.hit_when = apple.scene.tick;
        apple.last_rot = apple.rotation;
        apple.kill();
        let arrowpos = vec3(arrow.position[0], arrow.position[1], arrow.position[2]-0.4);
        let dist = this.dist(arrowpos, apple.position);
        this.dist_sum += dist;
        dist = Math.max(0, Math.min(dist, 0.5));
        dist = (0.5 - dist)/0.5;
        let diff = Math.round(Math.exp((dist + 1)*2)) + (this.level * 5);
        this.score += diff;
        this.apples_hit++;
        this.kinematic_objects.push(new ScoreText(apple.position, this, `+${diff}`))
        document.querySelector("#hit").volume = (this.volume * 0.6);
        document.querySelector("#hit").currentTime = 0;
        document.querySelector("#hit").play();

        this.physics_objects.push(new Particle(apple.position, vec3(0.5, 0.5, 0.5), this.materials.apple_kill, this));
    }
    game_goldenAppleHit(arrow, apple) {
        this.score += 450 + (50*this.level);
        this.lives = Math.min(5, this.lives+1);
        this.slow = 900;
    }
    game_childHit(apple) {
        document.querySelector("#hurt").volume = (this.volume * 0.6);
        document.querySelector("#hurt").currentTime = 0.5;
        document.querySelector("#hurt").play();
        this.lives--;
    }
    game_childArrow(arrow) {
        document.querySelector("#hurt").volume = (this.volume * 0.6);
        document.querySelector("#hurt").currentTime = 0.5;
        document.querySelector("#hurt").play();
        //this.lives = -1;
        this.state = this.States.gameOverChild;
    }
    game_spawnConfetti() {
        if(this.particles > 5) {
            this.particles = 0;
            return this.confetti = false;
        }
        this.physics_objects.push(new Confetti(vec3(((Math.random()-0.5)*1.75) - 4, 4 + (Math.random()*0.5), -8), vec3(0.25, 0.25, 1), null, this));
        this.particles++;
        return;
    }

    dist(vec1, vec2) {
        return Math.sqrt((vec2[0] - vec1[0])**2 + (vec2[1] - vec1[1])**2 + (vec2[2] - vec1[2])**2);
    }

    display(context, program_state) {

        //run the below regardless of state:
        //program_state.set_camera(this.initial_camera_location);
        this.cam_lerp = this.lerp(this.cam_lerp, this.cam_lerp_to, 0.05);
        program_state.camera_inverse = this.camera_to.map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, this.cam_lerp));
        program_state.projection_transform = Mat4.perspective(this.fov_default * this.fov_mult, context.width / context.height, .1, 1000);
        program_state.lights = [];
        program_state.lights.push(this.main_light);

        if(document.querySelector("canvas") != null) { 
            this.canvas = document.querySelector("canvas");
        }

        switch(this.state) {

            case this.States.start : {

                /**
                 *      Animation display logic goes here
                 */
                this.cam_lerp_to = 0.01;
                this.runStart(context, program_state);

            }   break;

            case this.States.game : {

                /**
                 *      Game display logic goes here
                 */
                this.cam_lerp_to = 0.1;
                this.ticking && this.tickGame(context, program_state);
                this.drawGame(context, program_state);

            }   break;

            case this.States.gameOver : {
                this.runGameOver(context, program_state);
            }   break;

            case this.States.gameOverChild : {
                this.runGameOverChild(context, program_state);
            }   break;


            default : {
                tickDefault(context, program_state);
            }
        }
        this.draw_light_gadgets(context, program_state);
        this.draw_environment(context, program_state);

    }
    show_explanation(document_element) {
        document_element.innerHTML = `<p>Oh no! Your child has fallen over while playing in the kitchen and bumped into the wall, causing your infinite stock of apples to fall from the barrels above. Use your world-class archery skills to stop the apples, score points, and save your child!</p>
        <p><u>Click and hold</u> to draw back your bow. Aim with your mouse, and <u>release</u> to fire.</p>
        <p>You earn points for every apple you hit. The closer you are to the center of the apple, the more points you'll earn!</p>
        <p>Be careful, any apple that hits your child will cause them to lose health. If 5 apples hit them during one level, the game will end!</p>
        <p>Be on the lookout for special <strong>golden apples</strong>--if you hit one with an arrow, it will slow down the apples and make them easier to hit. You'll also get a big score bonus!</p>
        <p>Press <strong>p</strong> to pause.</p>`;
        let canvas = document_element.parentNode.children[1];
        let expl = document_element.parentNode.children[0];
        document_element.parentNode.appendChild(expl);
        document_element.parentNode.style.marginTop = "100px";
    }

    runStart(context, program_state) {
        this.fov_mult = 1.0;
        this.startm.draw(context, program_state, this.canvas);
        this.camera_to = Mat4.look_at(this.initial_eye, vec3(-10, 0, 0), vec3(0, 1, 0));
        if(clicked != null) {
            clicked = null;
            this.paused = false;
            this.temp_cooldown = 300;
            this.state = this.States.game;
            return;
        }
    }
    runGameOver(context, program_state) {
        this.fov_mult = 1.0;
        this.gameoverm.draw(context, program_state, this.canvas);
        this.camera_to = Mat4.look_at(this.initial_eye, vec3(10, 0, 0), vec3(0, 1, 0));

        this.shapes.text.set_string(`${this.score}`, context.context);
        this.shapes.text.draw(context, program_state, Mat4.inverse(program_state.camera_inverse).times(Mat4.translation(-0.1, 0.045, -1).times(Mat4.scale(0.027, 0.027, 1))), this.text_image.override({color: color(0, 1, 0.5, 0.9)}));

        this.shapes.text.set_string(`${Math.round(this.accuracy * 10000)/100/*Math.round(this.accuracy * 10000)/100*/}%`, context.context);
        this.shapes.text.draw(context, program_state, Mat4.inverse(program_state.camera_inverse).times(Mat4.translation(-0.025, -0.025, -1).times(Mat4.scale(0.027, 0.027, 1))), this.text_image.override({color: color(0, 1, 1, 1)}));

        this.shapes.text.set_string(`${Math.round(this.true_accuracy * 10000)/100/*Math.round(this.accuracy * 10000)/100*/}%`, context.context);
        this.shapes.text.draw(context, program_state, Mat4.inverse(program_state.camera_inverse).times(Mat4.translation(0.07, -0.08, -1).times(Mat4.scale(0.02, 0.02, 1))), this.text_image.override({color: color(0.4, 0.4, 0.4, 0.6)}));

        document.body.onkeyup = function(event) {
            if(event.key.toLowerCase() == "r") {
                isR = true;
            }
        }
        if(isR) {
            this.reset();
            this.paused = false;
            this.temp_cooldown = 300;
            this.state = this.States.game;
            document.body.onkeyup = null;
            return;
        }
    }
    runGameOverChild(context, program_state) {
        this.fov_mult = 1.0;
        this.gameoverchildm.draw(context, program_state, this.canvas);
        this.camera_to = Mat4.look_at(this.initial_eye, vec3(10, 0, 0), vec3(0, 1, 0));

        document.body.onkeyup = function(event) {
            if(event.key.toLowerCase() == "r") {
                isR = true;
            }
        }
        if(isR) {
            this.reset();
            this.paused = false;
            this.temp_cooldown = 300;
            this.state = this.States.game;
            document.body.onkeyup = null;
            return;
        }
    }

    /**
     *      Game draw function
     */
    drawGame(context, program_state) {

        if(this.paused) {
            this.pause.draw(context, program_state, this.canvas);
        } else {
            
        this.draw_physics_objects(context, program_state);
        this.crosshair.draw(context, program_state, this.canvas);

        let scoreboard_transform = Mat4.translation(-1.8, 0, 0);

        this.shapes.box.draw(context, program_state, scoreboard_transform.times(Mat4.translation(-3.8, 3.5, -9.0).times(Mat4.scale(3.1, 1.5, 0.1))), this.materials.phong.override({color: hex_color("#000000")}));

        this.shapes.text.set_string(`Level ${this.level}`, context.context);
        this.shapes.text.draw(context, program_state, scoreboard_transform.times(Mat4.identity().times(Mat4.translation(-6, 4.25, -8.7)).times(Mat4.scale(0.4, 0.4, 1))), this.text_image);

        this.shapes.text.set_string(`Lives: ${this.lives}`, context.context);
        this.shapes.text.draw(context, program_state, scoreboard_transform.times(Mat4.identity().times(Mat4.translation(-6, 3.5, -8.7)).times(Mat4.scale(0.4, 0.4, 1))), this.text_image.override({color: color(this.lives<3?1:0, this.lives>1?1:0, 0, 1)}));

        this.shapes.text.set_string(`Score: ${this.score}`, context.context);
        this.shapes.text.draw(context, program_state, scoreboard_transform.times(Mat4.identity().times(Mat4.translation(-6, 2.75, -8.7)).times(Mat4.scale(0.3, 0.3, 1))), this.text_image.override({color: color(0.2, 1, 1, 1)}));

        this.shapes.text.set_string(`${this.fps} FPS`, context.context);
        this.shapes.text.draw(context, program_state, scoreboard_transform.times(Mat4.identity().times(Mat4.translation(-6.55, 2.1, -8.7)).times(Mat4.scale(0.08, 0.08, 1))), this.text_image.override({color: color(0.3, 0.3, 0.3, 0.3)}));

        };
    }
    /**
     *      Game tick function
     */
    tickGame(context, program_state) {

        if(this.lives == 0) {
            this.state = this.States.gameOver;
        }
        document.body.onkeyup = function(event) {
            if(event.key.toLowerCase() == "p") {
                isR = "p";
            }
            if(event.key.toLowerCase() == "r") {
                isR = "r";
            }
        }
        if(isR == "p") {
            this.paused = !this.paused;
            isR = "";
            return;
        }
        if(isR == "r") {
            this.reset();
            this.paused = false;
            this.temp_cooldown = 300;
            this.state = this.States.game;
            document.body.onkeyup = null;
            return;
        }

        if(!this.paused) {
            this.level_start = Math.round(this.level_start_float);
            this.tick_particles();
            if(this.slow > 0) { this.speed_to = 0.4; } else { this.speed_to = 1.0; }
            this.speed = this.lerp(this.speed, this.speed_to, 0.04);
            if(this.level_start % this.cooldown == 0 && this.temp_cooldown <= 0) {

                if(this.apples_thrown > (this.level * 2) + 3) {
                    this.level++;
                    this.apples_thrown = 0;
                    this.lives = this.def_lives;
                    this.temp_cooldown = 150;
                    this.cooldown = (this.base_cooldown - (this.level * 2));
                    this.level_start_float = 0;
                    this.score += this.level * 100;
                    this.confetti = true;
                    this.slow = -1;
                    this.physics_objects.forEach(x => x.kill())
                    return;
                }
                this.cooldown = Math.max(50, this.cooldown - 1);
                let xv = Math.random()*3 + 2.5;
                if(Math.random() < 0.5) {
                    xv *= -1;
                }
                this.physics_objects.push(new Apple(vec3(-5*(xv / Math.abs(xv)), 7, -8.9), vec3(xv, 3, 0), this));
                this.apples_thrown++;
                this.total_apples_thrown++;
                if(Math.random()*100 < 9 && this.slow < 0 && this.apples_thrown < (this.level * 1.5)) {
                    this.physics_objects.push(new GoldenApple(vec3(0, 10, -8.9), vec3(this.mro(3), Math.random()*4, 0), this, program_state));
                }
                
            }
            if(this.temp_cooldown <= 0) {
                this.level_start_float += this.speed_to;
            }
            else {
                this.temp_cooldown--;
            }
            this.shot_cooldown--;
            this.slow--;

            this.tick_physics_objects(program_state);

            this.fov_mult = this.lerp(this.fov_mult, this.fov_to, 0.07);

            if(mousedown != null) { 
                this.game_toggleScope(true);
                this.play_scope_in = false;
            }
            if(mouseup != null) { 
                if(this.shot_cooldown <= 0) {
                    this.game_spawnArrow(this.fov_drawn / (this.fov_default * this.fov_mult), program_state, context);
                    this.shot_cooldown = 35;
                }
                this.game_toggleScope(false);
                mouseup = null;
                this.play_scope_in = true;
            }
            if(this.last_mouse && mouse) {
                let mid_to_mouse = vec(((mouse.clientX + window.scrollX) - (this.canvas.offsetLeft + (this.canvas.offsetWidth / 2))), 
                ((mouse.clientY + window.scrollY) - (this.canvas.offsetTop + (this.canvas.offsetHeight / 2))));
                mid_to_mouse = mid_to_mouse.times(this.mouse_sens);
                let factor = 0.05;
                this.camera_to = Mat4.look_at(this.initial_eye, vec3(mid_to_mouse[0] * factor, mid_to_mouse[1] * -1 * factor, 0), vec3(0, 1, 0));
            }
            this.last_mouse = mouse;
            this.tick++;
            if(this.tick%10 == 0) this.fps = Math.round(100000 / program_state.animation_delta_time) / 100;
        } else {
            this.fov_mult = 1.0;
        }
    }

    tick_particles() {
        if(this.confetti && this.tick%10 == 0) this.game_spawnConfetti();
    }

    /**
     *      Default display tick to run; acts as a backup to the above
     */
    tickDefault(context, program_state) {

    }

    draw_environment(context, program_state) {
        /* floor */
            //this.shapes.box.draw(context, program_state, Mat4.scale(10, 0.5, 10).times(Mat4.translation(0, -4, 0)), this.materials.tex)
        /* z- wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(16, 8, 1).times(Mat4.translation(0, 0.5, -10)), this.materials.phong)
        /* x+ wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(1, 8, 16).times(Mat4.translation(10, 0.5, 0)), this.materials.phong)
        /* x- wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(1, 8, 16).times(Mat4.translation(-10, 0.5, 0)), this.materials.phong)
        //barrels
            this.shapes.box.draw(context, program_state, Mat4.scale(2, 0.25, 1.25).times(Mat4.translation(2.75, 25, -6)), this.materials.test2)
            this.shapes.barrel.draw(context, program_state, Mat4.scale(2.5, 1.25, 1.25).times(Mat4.translation(2.0, 6, -6)).times(Mat4.rotation(Math.PI/2, 0, 1, 0)), this.materials.barrel);

            this.shapes.box.draw(context, program_state, Mat4.scale(2, 0.25, 1.25).times(Mat4.translation(-2.75, 25, -6)), this.materials.test2);
            this.shapes.barrel.draw(context, program_state, Mat4.scale(2.5, 1.25, 1.25).times(Mat4.translation(-2.0, 6, -6)).times(Mat4.rotation(-1 * Math.PI/2, 0, 1, 0)), this.materials.barrel);
        //ceiling
        this.shapes.box.draw(context, program_state, Mat4.scale(10, 0.5, 10).times(Mat4.translation(0, 21, 0)), this.materials.floor);
            //this.pauseButton.draw(context, program_state);
    }

    draw_light_gadgets(context, program_state) {
        for(var light of program_state.lights) {
            this.shapes.sphere_4.draw(context, program_state, Mat4.translation(light.position[0], light.position[1], light.position[2], light.position[3]), this.materials.light_gadget)
        }
    }

    draw_physics_objects(context, program_state) {
        let kills = this.kinematic_objects.filter(x => x.killed);
        this.kinematic_objects = this.kinematic_objects.filter(x => !x.killed);
        for(var object of this.kinematic_objects) {
            object.draw(context, program_state);
        }
        for(var object of this.physics_objects) {
            object.draw(context, program_state);
        }
        while(kills.length > 0) {
            delete kills.pop();
        }
    }
    tick_physics_objects(program_state) {

        let kills = this.physics_objects.filter(x => x.killed);
        this.physics_objects = this.physics_objects.filter(x => !x.killed);

        for(var object of this.physics_objects) {
            object.step(program_state, [this.kinematic_objects[0]]);
        }
        while(kills.length > 0) {
            delete kills.pop();
        }

    }
    lerp(a, b, t) {
        return (1 - t) * a + t * b;
    }
}

class PhysicsObject {
    constructor(initial_position, initial_velocity, scene) {
        this.model_transform = Mat4.identity();
        this.bounds;
        this.scene = scene;
        this.scale = vec3(1, 1, 1);
        this.position = initial_position;
        this.velocity = initial_velocity;
        this.acceleration = vec3(0, -9.8, 0);
        this.rotation = vec4(0, 0, 0, 1);
        this.angular_velocity = vec4(0, 0, 0, 0);
        this.angular_drag = 0.95;
        this.radius = 1.0;
        this.killed = false;
        this.born = scene.tick;
        this.lifetime = 5000;
    }
    step(program_state, kobjs) {

        if(this.scene.tick > this.born + this.lifetime) {
            this.killed = true;
        }

        const t = program_state.animation_time;
        const dt = program_state.animation_delta_time;

        let dtm = 0;
        if(this.scene.slow > 0 && this.constructor.name == "Arrow") {
            dtm = dt * 0.001 * 1.0;
        } else if(this.constructor.name == "GoldenApple") {
            dtm = dt * 0.001 * 0.5;
        } else {
            dtm = dt * 0.001 * this.scene.speed;
        }
        
        this.velocity = this.velocity.plus(this.acceleration.times(dtm));
        this.position = this.position.plus(this.velocity.times(dtm));

        this.rotation = this.rotation.plus(this.angular_velocity.times(dtm));
        this.model_transform = Mat4.translation(this.position[0], this.position[1], this.position[2])
                                    .times(Mat4.rotation(this.rotation[0], this.rotation[1], this.rotation[2], this.rotation[3]))
                                    .times(Mat4.scale(this.scale[0], this.scale[1], this.scale[2]));
        
        for(var k of kobjs) {
            if(this.is_colliding_k(k)) {
                this.velocity[1] = Math.abs(this.velocity[1])*1;
                this.velocity[0] *= k.friction; this.velocity[2] *= k.friction;
                this.angular_velocity = this.angular_velocity.times(this.angular_drag);
                this.velocity[1] = k.damp*this.velocity[1];
                this.acceleration[1] = 0;
            } else {
                this.acceleration[1] = -9.8;
            }
        }
    }
    is_colliding_k(k) {
        if(this.constructor.name == "Arrow") {
            let xc = this.position[0] > k.bounds[0] && this.position[0] < k.bounds[3];
            let yc = this.position[1] > k.bounds[1] && this.position[1] < k.bounds[4];
            let zc = this.position[2] > k.bounds[2] && this.position[2] < k.bounds[5];
            return (xc && yc && zc)
        } else {
            let xc = this.position[0] > k.bounds[0] && this.position[0] < k.bounds[3];
            let yc = this.position[1]*(this.scale[1]*1.1) > k.bounds[1] && this.position[1]*(this.scale[1]*1.1) < k.bounds[4];
            let zc = this.position[2] > k.bounds[2] && this.position[2] < k.bounds[5];
            return (xc && yc && zc)
        }
    }
    is_colliding_d(d) {
        if(this.constructor.name == "Arrow") {
            let xc = Math.abs(this.position[0] - d.position[0]) <= this.radius + d.radius;
            let yc = Math.abs(this.position[1] - d.position[1]) <= this.radius + d.radius;
            let zc = Math.abs((this.position[2]-0.4) - d.position[2]) <= this.radius + d.radius;
            return (xc && yc && zc)
        } else {
            let xc = Math.abs(this.position[0] - d.position[0]) <= this.radius + d.radius;
            let yc = Math.abs(this.position[1] - d.position[1]) <= this.radius + d.radius;
            let zc = Math.abs(this.position[2] - d.position[2]) <= this.radius + d.radius;
            return (xc && yc && zc)
        }
        
    }
    draw(context, program_state) {};
    kill() {};
    add_impulse(vec) {
        this.velocity = this.velocity.plus(vec);
    }
    wobble(t) {
        return (1/(1 + 10*t)) * Math.cos(10*t);
    }
}
class KinematicObject extends PhysicsObject {

    constructor(position, scene, damp, friction) {
        super(position, vec3(0, 0, 0), scene)
        this.damp = damp;
        this.friction = friction;
        this.bounds = null;
        this.normal = vec3(0, 1, 0);
    }
}

class Apple extends PhysicsObject {

    constructor(position, initial_velocity, scene) {
        super(position, initial_velocity, scene);
        this.rotation = vec4(1, 0, 0, 1);
        this.angular_velocity = vec4(Math.random()*10, Math.random()*10, Math.random()*10, 0);
        this.scale = vec3(0.4, 0.4, 0.4);
        this.color = (Math.random() < 0.4 ? color(Math.random()*0.7 + 0.3, 0, 0, 1) : color(0.3, Math.random()*0.5 + 0.2, 0, 1))
        this.init_color = this.color;
        this.radius = 0.3;
        this.alpha = 0.0;
        this.alpha_to = 0.0;
        this.born = scene.tick;
        this.lifetime = 700;
        this.hit_when = -1;
        this.last_rot = vec4(0, 0, 0, 0);
    }

    step(program_state, kobjs) {
        super.step(program_state, kobjs);
        if(this.position[2] <= -9) {
            this.acceleration = vec3(0, 0, 0);
            this.velocity = vec3(0, 0, -0.01);
            this.angular_velocity = vec4(0, 0, 0, 0);
            this.rotation = this.last_rot.plus(vec4(2*this.wobble(0.1*(this.scene.tick - this.hit_when)) + this.last_rot[0], 0, 0, 0));
        }
        if(this.is_colliding_k(this.scene.child) && this.constructor.name == "Apple") {
            this.kill();
            this.killed = true;
            this.scene.game_childHit(this);
        }
    }

    draw(context, program_state) {
        this.color = this.init_color;
        this.color = this.color.plus(vec4(this.alpha, this.alpha, this.alpha, this.alpha));
        let apple_transform = this.model_transform.times(Mat4.rotation(Math.PI, 0, 0, 1));
        this.scene.shapes.apple.draw(context, program_state, apple_transform, this.scene.materials.apple.override({color: this.color}));

        let stem_transform = this.model_transform.times(Mat4.translation(0, 1, 0))
            .times(Mat4.scale(.1, .35, .1));
        let stem_color = hex_color("#693423");
        stem_color = stem_color.plus(vec4(this.alpha, this.alpha, this.alpha, this.alpha));
        this.scene.shapes.box.draw(context, program_state, stem_transform, this.scene.materials.stem.override({color: stem_color}));

        let leaf_transform = this.model_transform.times(Mat4.translation(0.5, 1.2, 0))
            .times(Mat4.scale(.3, .1, .1))
            .times(Mat4.rotation(Math.PI/6, 0, 0, 1));

        let leaf_color = hex_color("#2cb733");
        leaf_color = leaf_color.plus(vec4(this.alpha, this.alpha, this.alpha, this.alpha));
        this.scene.shapes.box.draw(context, program_state, leaf_transform, this.scene.materials.leaf.override({color: leaf_color}));
        this.alpha = this.scene.lerp(this.alpha, this.alpha_to, 0.01);
        if(this.alpha > 0.9 || this.scene.tick > this.born + Math.round(this.lifetime * 0.8)) {
            this.kill();
        }
    }

    kill() {
        this.wasHit = true;
        this.alpha_to = 1.0;
    }
}

class GoldenApple extends Apple {
    constructor(position, initial_velocity, scene, program_state) {
        super(position, initial_velocity, scene);
        this.color = color(1, 1, 0, 1);
        this.init_color = this.color;
        this.light = new Light(this.position, hex_color('#ffffff'), 10**1);
    }
    step(program_state, kobjs) {
        super.step(program_state, kobjs);
        if(this.is_colliding_k(this.scene.child)) {
            this.kill();
            this.killed = true;
        }
        this.light.position = this.position;
    }
}

class Arrow extends PhysicsObject {

    constructor(position, initial_velocity, scene, program_state, context) {
        super(position, initial_velocity, scene);
        let ar = context.width / context.height;
        let theta = Math.acos(program_state.camera_inverse[0][0]) * (program_state.camera_inverse[0][3])/(Math.abs(program_state.camera_inverse[0][3])) * 1;
        let y_t = (program_state.camera_inverse[2][1]) * (ar * 0.8);
        this.rotation = vec4(theta, 0, 1, 0);
        this.rot2 = Mat4.rotation(y_t, -1, 0, 0);
        this.velocity = vec3(initial_velocity[2] * (theta), initial_velocity[2] * y_t, initial_velocity[2]);
        this.scale = vec3(0.1, 0.1, 0.4);
        this.radius = 0.1;
        this.angular_drag = 0.0;
        this.angular_velocity = vec4(0, 0, 10, 1);
        this.born = scene.tick;
        this.lifetime = 200;
        this.last_rot = vec4(0, 0, 0, 0);
        this.hit_apple = null;
        this.hit_when = -1;
        this.hit_wall = false;
    }

    draw(context, program_state) {
        let arrow_transform = this.model_transform.times(Mat4.scale(1/4, 1/4, 3));
        this.scene.shapes.box.draw(context, program_state, arrow_transform, this.scene.materials.arrow_dark);
        let arrowhead_transform = this.model_transform.times(Mat4.translation(0, 0, -3.5))
            .times(Mat4.scale(1/2, 1/2, 1/2))
            .times(Mat4.rotation(Math.PI, 1, 0,0));
        this.scene.shapes.arrowhead.draw(context, program_state, arrowhead_transform, this.scene.materials.arrowhead);
        let feather1_transform = this.model_transform.times(Mat4.translation(1/4, 0, 2.8))
            .times(Mat4.rotation(Math.PI*3/2, 1, 0,0))
            .times(Mat4.scale(1, 1.5, 1));
        this.scene.shapes.feather.draw(context, program_state, feather1_transform, this.scene.materials.feather);
        let feather2_transform = this.model_transform.times(Mat4.translation(-1/4, 0, 2.8))
            .times(Mat4.rotation(Math.PI/2, 1, 0,0))
            .times(Mat4.rotation(Math.PI, 0, 0,1))
            .times(Mat4.scale(1, 1.5, 1));
        this.scene.shapes.feather.draw(context, program_state, feather2_transform, this.scene.materials.feather);
        let feather3_transform = this.model_transform.times(Mat4.translation(0, 1/4, 2.8))
            .times(Mat4.rotation(Math.PI*3/2, 0, 1,0))
            .times(Mat4.rotation(Math.PI/2, 0, 0,1))
            .times(Mat4.scale(1, 1.5, 1));
        this.scene.shapes.feather.draw(context, program_state, feather3_transform, this.scene.materials.feather);
        let feather4_transform = this.model_transform.times(Mat4.translation(0, -1/4, 2.8))
            .times(Mat4.rotation(Math.PI*3/2, 0, 1,0))
            .times(Mat4.rotation(Math.PI, 1, 0,0))
            .times(Mat4.rotation(Math.PI/2, 0, 0,1))
            .times(Mat4.scale(1, 1.5, 1));
        this.scene.shapes.feather.draw(context, program_state, feather4_transform, this.scene.materials.feather);

    }
    step(program_state, kobjs) {
        super.step(program_state, kobjs);

        if((this.position[0] > -0.6 && this.position[0] < 0.6
            && this.position[1] > 0.6 && this.position[1] < 2
            && (this.position[2]-0.4) > -10 && (this.position[2]-0.4) < -7)
            ||
            (this.position[0] > -1 && this.position[0] < 1
                && this.position[1] > -2 && this.position[1] < 0.6
                && (this.position[2]-0.4) > -10 && (this.position[2]-0.4) < -7)) {
            this.scene.game_childArrow(this);
        }

        for(var apple of this.scene.physics_objects.filter(x => x.constructor.name.indexOf("Apple") != -1)) {
            if(this.is_colliding_d(apple) && !apple.wasHit && !this.hit_apple) {
                apple.add_impulse(this.velocity.times(0.2))
                apple.angular_velocity = vec4(Math.random()*10 + 10, Math.random()*10 + 10, Math.random()*10 + 10, 0);
                this.hit_apple = apple;
                this.last_rot = this.rotation;
                this.hit_when = this.scene.tick;
                if(apple.constructor.name === "GoldenApple") {
                    this.scene.game_goldenAppleHit(this, apple);
                } else {
                    this.scene.game_appleHit(this, apple);
                }
            }
        }
        if(this.position[2] <= -9 && !this.hit_wall) { 
            this.hit_wall = true; 
            this.hit_when = this.scene.tick; 
            this.last_rot = this.rotation; 
        }
        if(this.hit_apple || this.position[2] <= -9) {
            //this.position = this.hit_apple.position;
            this.velocity = vec3(0, 0, 0);
            this.acceleration = vec3(0, 0, 0);
            this.rotation = this.last_rot.plus(vec4(3*this.wobble(0.35*(this.scene.tick - this.hit_when + 2)) + this.last_rot[0], 0, 0, 0));
        }
    }
}

class Model extends KinematicObject {

    constructor(position, scene) {
        super(position, scene);
        this.model_transform = Mat4.translation(100, 0, 0);
    }

    draw(context, program_state) {
        let t = program_state.animation_time / 1000;

        //Head
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.translation(0, 5.5, 0)), this.scene.materials.skin);
        //Face
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.scale(1, 1, 0.01)).times(Mat4.translation(0, 5.5, 100)), this.scene.materials.face);

        let body_transform = this.model_transform.times(Mat4.scale(1, 1.5, 0.5)).times(Mat4.translation(0, 2, 0))
        this.scene.shapes.box.draw(context, program_state, body_transform, this.scene.materials.shirt);
        //Legs
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.scale(.5, 1.5, .5)).times(Mat4.translation(-1, 0, 0)), this.scene.materials.pants);
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.scale(.5, 1.5, .5)).times(Mat4.translation(1, 0, 0)), this.scene.materials.pants);

        //Arms
        let larm_transform = body_transform.times(Mat4.scale(.5, 1, 1)).times(Mat4.translation(-3, 0, 0));
        let rarm_transform = body_transform.times(Mat4.scale(.5, 1, 1)).times(Mat4.translation(3, 0, 0));
        this.scene.shapes.box.draw(context, program_state, larm_transform, this.scene.materials.skin)
        this.scene.shapes.box.draw(context, program_state, rarm_transform, this.scene.materials.skin)

    }
}
class ChildModel extends KinematicObject {

    constructor(model_transform, scene) {
        super(model_transform, scene);
        this.model_transform = Mat4.translation(0, -1.75, -9).times(Mat4.scale(.5, .5, .5));
        this.bounds = [-0.75, 0, -8.99, 0.75, 1, -8.8]
    }

    draw(context, program_state) {
        //Body
        let body_transform = this.model_transform.times(Mat4.scale(1, 1.5, 0.5)).times(Mat4.translation(0, 2, 0))
        this.scene.shapes.box.draw(context, program_state, body_transform, this.scene.materials.shirt.override({color: color(0.5, 1, 0.5, 1)}));

        //Head
        const max_ang = Math.PI*0.5;
        var rot_ang = 0.25*(Math.sin(Math.PI*(this.scene.tick / 100)));
        let head_transform = body_transform.times(Mat4.rotation(rot_ang, 0, 0, 1)).times(Mat4.scale(1, 1, 1)).times(Mat4.translation(0, 2, 0.25));
        //this.model_transform.times(Mat4.translation(0, 5.5, 0))
        this.scene.shapes.box.draw(context, program_state, head_transform, this.scene.materials.face);
        //Legs
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.rotation(Math.sin(Math.PI/6), 0, -1, 0)).times(Mat4.scale(.5, .5, 1.5)).times(Mat4.translation(-1, 2, 1)), this.scene.materials.pants);
        this.scene.shapes.box.draw(context, program_state, this.model_transform.times(Mat4.rotation(Math.sin(Math.PI/6), 0, 1, 0)).times(Mat4.scale(.5, .5, 1.5)).times(Mat4.translation(1, 2, 1)), this.scene.materials.pants);

        //Arms
        let larm_transform = body_transform.times(Mat4.scale(.5, 1, 1)).times(Mat4.translation(-3, 0, 0));
        //larm_transform = larm_transform.times(Mat4.translation(0, 1, 0)).times(Mat4.rotation(Math.sin(t), 0, 0, 1)).times(Mat4.translation(0, -1, 0)).times(Mat4.scale(.5, 1, 1));

        let rarm_transform = body_transform.times(Mat4.scale(.5, 1, 1)).times(Mat4.translation(3, 0, 0));
        //rarm_transform = rarm_transform.times(Mat4.translation(0, 1, 0)).times(Mat4.rotation(Math.sin(-t), 0, 0, 1)).times(Mat4.translation(0, -1, 0));

        this.scene.shapes.box.draw(context, program_state, larm_transform, this.scene.materials.skin)
        this.scene.shapes.box.draw(context, program_state, rarm_transform, this.scene.materials.skin)

    }
}

class Floor extends KinematicObject {

    constructor(position, scene, damp, friction) {
        super(position, scene, damp, friction)
        this.model_transform = Mat4.scale(10, 0.5, 10)
                                    .times(Mat4.translation(0, -4, 0));
        this.materials = {
            tex: new Material(new defs.Fake_Bump_Map(1), {ambient: .5, texture: new Texture("assets/wood_floor.png")})
        }
        this.bounds = [-10, -100, -10, 10, -0.5, 10];
    }

    draw(context, program_state) {
        this.scene.shapes.box.draw(context, program_state, this.model_transform, this.materials.tex)
    }

}

class Button3D extends KinematicObject {

    constructor(position, scene) {
        super(position, scene, 0, 0)
        this.bounds = [5, 1.5, -9, 8, 0.5, -8];
    }

    draw(context, program_state) {
        this.scene.shapes.box.draw(context, program_state, Mat4.scale(0.9, 0.4, 1)
                                                        .times(Mat4.translation(8, 3, -9.5))
                                , this.scene.materials.arrow_dark);
        this.scene.shapes.text.set_string(`${this.paused ? "Play" : "Pause"}`, context.context);
        this.scene.shapes.text.draw(context, program_state, Mat4.translation(6, 1.2, -8)
        .times(Mat4.scale(0.2, 0.2, 1)), this.scene.text_image);
    }

}

class ScoreText extends KinematicObject {

    constructor(position, scene, text) {
        super(position, scene, 0, 0);
        this.born = this.scene.tick;
        this.lifetime = 100;
        this.text = text;
        this.killed = false;
        this.scalar = 1.0;
        this.scalar_to = 0.0;
    }

    draw(context, program_state) {
        this.scene.shapes.text.set_string(`${this.text}`, context.context);
        this.scene.shapes.text.draw(context, program_state, Mat4.translation(this.position[0], this.position[1] + 0.4 + ((this.scene.tick - this.born)*0.01), this.position[2]+0.1).times(Mat4.scale(0.2 * this.scalar, 0.2 * this.scalar, 1)), this.scene.text_image.override({color: color(1, 0, 1, 1)}));
        if(this.scene.tick - this.born > this.lifetime) {
            this.killed = true;
        }
        this.scalar = this.scene.lerp(this.scalar, this.scalar_to, (0.0001*((this.scene.tick - this.born)**1.1)));
    }
}

class Bow extends KinematicObject {

    constructor(position, scene, damp, friction) {
        super(position, scene, damp, friction)
        //this.model_transform = Mat4.translation(0, 2, -1).times(Mat4.rotation(Math.PI * -1/3,0,1,0));
        //this.model_transform = Mat4.translation(0, 2, -1).times(Mat4.rotation(Math.PI * -1/3,0,1,0));
        this.model_transform = Mat4.identity();
        //this.model_transform =Mat4.inverse(program_state.camera_inverse);
        //this.model_transform = this.model_transform.times(Mat4.translation(0, 5, 0));

    }

    draw(context, program_state) {
        this.model_transform = Mat4.inverse(program_state.camera_inverse)
            .times(Mat4.scale(1, 1, 1))
            .times(Mat4.translation(1.7, 0, -.5))
            .times(Mat4.rotation(Math.PI * -1/3,0,1,0))
            //.times(Mat4.scale(1/2, 1/2, 1/2))
        ;
        //Mat4.inverse(program_state.camera_inverse).times(Mat4.translation(0, 0, -3).times(Mat4.scale(0.05, 0.05, 0.05)))
        let bow_transform = this.model_transform.times(Mat4.scale(1/5, 1/5, 1/5));
        //let bow_transform = Mat4.inverse(program_state.camera_inverse).times(Mat4.scale(0.05, 0.05, 0.05));
        this.scene.shapes.bow.draw(context, program_state, bow_transform, this.scene.materials.arrow_dark);
        let bowstring_transform = this.model_transform.times(Mat4.scale(0.02, 1.9, .02))
            .times(Mat4.translation(-5, 0, 5));
        this.scene.shapes.box.draw(context, program_state, bowstring_transform, this.scene.materials.feather);


        this.model_transform = Mat4.inverse(program_state.camera_inverse)
            .times(Mat4.scale(1/8, 1/8, 1))
            .times(Mat4.translation(4, 0, 1))
            .times(Mat4.rotation(Math.PI/36,0,1,0));

        let arrow_transform = this.model_transform.times(Mat4.scale(1/4, 1/4, 3)).times(Mat4.translation(0, 0, -1 * (this.scene.fov_mult - 1)));
        this.scene.shapes.box.draw(context, program_state, arrow_transform, this.scene.materials.arrow_dark);
        let arrowhead_transform = this.model_transform.times(Mat4.translation(0, 0, (-3 * (this.scene.fov_mult - 1)) - 3.5))
            .times(Mat4.scale(1/2, 1/2, 1/2))
            .times(Mat4.rotation(Math.PI, 1, 0,0));
        this.scene.shapes.arrowhead.draw(context, program_state, arrowhead_transform, this.scene.materials.arrowhead);
        let feather1_transform = this.model_transform.times(Mat4.translation(1/4, 0, 2.8))
            .times(Mat4.rotation(Math.PI*3/2, 1, 0,0))
            .times(Mat4.scale(1, 1.5, 1));
        this.scene.shapes.feather.draw(context, program_state, feather1_transform, this.scene.materials.feather);
        let feather2_transform = this.model_transform.times(Mat4.translation(-1/4, 0, 2.8))
            .times(Mat4.rotation(Math.PI/2, 1, 0,0))
            .times(Mat4.rotation(Math.PI, 0, 0,1))
            .times(Mat4.scale(1, 1.5, 1));
        this.scene.shapes.feather.draw(context, program_state, feather2_transform, this.scene.materials.feather);
        let feather3_transform = this.model_transform.times(Mat4.translation(0, 1/4, 2.8))
            .times(Mat4.rotation(Math.PI*3/2, 0, 1,0))
            .times(Mat4.rotation(Math.PI/2, 0, 0,1))
            .times(Mat4.scale(1, 1.5, 1));
        this.scene.shapes.feather.draw(context, program_state, feather3_transform, this.scene.materials.feather);
        let feather4_transform = this.model_transform.times(Mat4.translation(0, -1/4, 2.8))
            .times(Mat4.rotation(Math.PI*3/2, 0, 1,0))
            .times(Mat4.rotation(Math.PI, 1, 0,0))
            .times(Mat4.rotation(Math.PI/2, 0, 0,1))
            .times(Mat4.scale(1, 1.5, 1));
        this.scene.shapes.feather.draw(context, program_state, feather4_transform, this.scene.materials.feather);
        /*
        let bowstring_transform = this.model_transform.times(Mat4.scale(0.02, .9, .02))
            .times(Mat4.translation(-5, 1.1, 5));
        this.scene.shapes.box.draw(context, program_state, bowstring_transform, this.scene.materials.feather);
        let bowstring_transform2 = this.model_transform.times(Mat4.scale(0.02, .9, .02))
            .times(Mat4.translation(-5, -1.1, 5));
        this.scene.shapes.box.draw(context, program_state, bowstring_transform2, this.scene.materials.feather);
        let bowstring_transform3 = this.model_transform.times(Mat4.scale(0.02, .2, .02))
            .times(Mat4.translation(-5, 0, 1/4));
        this.scene.shapes.box.draw(context, program_state, bowstring_transform3, this.scene.materials.feather);

         */



    }

}
class Crosshair {
    constructor(scene) { this.scene = scene; }
    draw(context, program_state, canvas) {
        this.scene.shapes.crosshair.draw(context, program_state, Mat4.inverse(program_state.camera_inverse).times(Mat4.translation(0, 0, -3).times(Mat4.scale(0.05, 0.05, 0.05))), this.scene.materials.crosshair)
    }
}
class Menu {
    constructor(scene, type) { 
        this.scene = scene;
        this.type = type;
        this.scale = vec3(1, 1, 1);
        this.offset = vec3(0, 0, 0);
    }
    draw(context, program_state, canvas) {
        let mat = this.scene.materials.menu;
        switch(this.type) {
            case "start" : {
                mat = this.scene.materials.start_menu;
                this.scale = vec3(1.4, 1.4, 1);
                this.offset = vec3(0, 0.15, 0);
            }   break;
            case "pause" : {
                mat = this.scene.materials.pause_menu;
            }   break;
            case "gameover" : {
                mat = this.scene.materials.gameover_menu;
            }   break;
            case "gameoverchild" : {
                mat = this.scene.materials.gameoverchild_menu;
            }   break;
            default : {
                mat = this.scene.materials.menu;
            }
        }
        this.scene.shapes.menu.draw(context, program_state, Mat4.inverse(program_state.camera_inverse).times(Mat4.translation(0+this.offset[0], 0+this.offset[1], -3.5+this.offset[2]).times(Mat4.scale(1*this.scale[0], 1*this.scale[1], 1*this.scale[2]))), mat)
    }
}

export class Text_Line extends Shape {                           // **Text_Line** embeds text in the 3D world, using a crude texture
    // method.  This Shape is made of a horizontal arrangement of quads.
    // Each is textured over with images of ASCII characters, spelling
    // out a string.  Usage:  Instantiate the Shape with the desired
    // character line width.  Then assign it a single-line string by calling
    // set_string("your string") on it. Draw the shape on a material
    // with full ambient weight, and text.png assigned as its texture
    // file.  For multi-line strings, repeat this process and draw with
    // a different matrix.
    constructor(max_size) {
        super("position", "normal", "texture_coord");
        this.max_size = max_size;
        var object_transform = Mat4.identity();
        for (var i = 0; i < max_size; i++) {                                       // Each quad is a separate Square instance:
            defs.Square.insert_transformed_copy_into(this, [], object_transform);
            object_transform.post_multiply(Mat4.translation(1.5, 0, 0));
        }
    }

    set_string(line, context) {             // set_string():  Call this to overwrite the texture coordinates buffer with new
                                            // values per quad, which enclose each of the string's characters.
        this.arrays.texture_coord = [];
        for (var i = 0; i < this.max_size; i++) {
            var row = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) / 16),
                col = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) % 16);

            var skip = 3, size = 32, sizefloor = size - skip;
            var dim = size * 16,
                left = (col * size + skip) / dim, top = (row * size + skip) / dim,
                right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

            this.arrays.texture_coord.push(...Vector.cast([left, 1 - bottom], [right, 1 - bottom],
                [left, 1 - top], [right, 1 - top]));
        }
        if (!this.existing) {
            this.copy_onto_graphics_card(context);
            this.existing = true;
        } else
            this.copy_onto_graphics_card(context, ["texture_coord"], false);
    }
}

class Particle extends PhysicsObject {
    constructor(position, scale, material, scene) {
        super(position, vec3(0, 0, 0), scene);
        this.rotation = vec4(1, 0, 0, 1);
        this.angular_velocity = vec4(Math.random()*10, Math.random()*10, Math.random()*10, 0);
        this.scale = scale;
        this.init_scale = scale;
        this.radius = 0.0;
        this.alpha = 0.0;
        this.alpha_to = 0.0;
        this.born = scene.tick;
        this.lifetime = 100;
        //
        this.material = material;
        this.acceleration = vec3(0, 0, 0);
        this.velocity = vec3(Math.random(), Math.random(), Math.random());
        this.scalar = 1.0;
        this.scalar_to = 0.0;
    }
    draw(context, program_state) {
        this.scene.shapes.particle.draw(context, program_state, this.model_transform, this.material);
    }
    step(program_state, kobjs) {
        super.step(program_state, kobjs);
        this.scale = this.init_scale.times(this.scalar);
        this.scalar = this.scene.lerp(this.scalar, this.scalar_to, (0.0001*((this.scene.tick - this.born)**1.1)));
    }
}
class Confetti extends Particle {
    constructor(position, scale, material, scene) {
        super(position, scale, material, scene);
        this.rotation = vec4(1, 0, 0, 1);
        this.angular_velocity = vec4(Math.random()*10, Math.random()*10, Math.random()*10, Math.random()*10);
        this.velocity = vec3(this.scene.mro(3), 3, this.scene.mro(3));
        this.material = new Material(new defs.Textured_Phong(), {ambient: 1, diffusivity: 0.1, specularity: 0.1, texture: new Texture("assets/confetti.png")});
        this.lifetime = 300;
        let r = Math.round(Math.random()*2);
        this.rcolor = color(r==0?1:0, r==1?1:0, r==2?1:0, 1);
    }
    draw(context, program_state) {
        this.scene.shapes.particle.draw(context, program_state, this.model_transform, this.material.override({color: this.rcolor}));
    }
    step(program_state, kobjs) {
        super.step(program_state, kobjs);
        if(this.scene.tick - this.born > this.lifetime) {
            this.killed = true;
        }
    }

}







