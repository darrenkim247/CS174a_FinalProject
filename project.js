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

export class Project extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(40, 40),
            torus2: new defs.Torus(3, 15),
            flat_sphere_1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
            sphere_4: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            box: new defs.Cube(), 
            apple: new defs.Subdivision_Sphere(2),
            crosshair: new defs.Regular_2D_Polygon(1, 4)
        };

        this.base_ambient = 0.5;

        // *** Materials
        this.materials = {
            phong: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#ffffff")}),
            test2: new Material(new Gouraud_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#992828")}),
            test3: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#ff8e31")}),
            test4: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 1, color: color(0.5, 0.5, 0.5, 1)}),

            light_gadget: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, color: color(1, 1, 1, 1)}),
            floor: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.8, specularity: 0.2, smoothness: 0, color: color(0.6, 0.1, 0.1, 1)}),

            stem: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#693423")}),
            leaf: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#2cb733")}),
            apple: new Material(new Gouraud_Shader(), {ambient: .4, diffusivity: .6, color: hex_color("#ff0000")}),

            skin: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("a97d64")}),
            shirt: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("494697")}),
            pants: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: hex_color("#0eaeae")}),

            face: new Material(new defs.Fake_Bump_Map(1), {ambient: .5, texture: new Texture("assets/face.png")}),

            crosshair: new Material(new defs.Textured_Phong(), {ambient: 1, texture: new Texture("assets/crosshair.png")}),

            arrow_dark: new Material(new defs.Phong_Shader(), {ambient: this.base_ambient, diffusivity: 0.6, color: color(0.26, 0.15, 0.15, 1)})

        }

        this.initial_eye = vec3(0, 2, 6);
        this.initial_camera_location = Mat4.look_at(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0));
        this.camera_delta = vec3(0, 0, 0);

        this.canvas = document.querySelector("#main-canvas");
        this.canvas.addEventListener('mousedown', function(evt) { clicked = evt; mousedown = evt; });
        this.canvas.addEventListener('mouseup', function(evt) { clicked = null; mousedown = null; mouseup = evt; });

        this.canvas.addEventListener('mousemove', function(evt) { mouse = evt; });

        this.physics_objects = [
            new Apple(vec3(0, 5, -3), vec3(0, 1, 0), this),
            new Apple(vec3(0, 5, -3), vec3(0, 0, 1), this),
            new Apple(vec3(0, 5, -3), vec3(1, 0, 1), this),
            new Apple(vec3(0, 5, -3), vec3(-1, 0, 0.5), this)
        ]
        this.kinematic_objects = [
            new Floor(vec3(0, -0.5, 0), this, 0.75, 0.97),
            new Model(vec3(0, 0, 0), this),
            new ChildModel(vec3(0, 0, 0), this)
        ]

        this.States = {
            'animation' : 0,
            'game' : 1,
            'none': null
        }

        this.state = this.States.game;
        this.ticking = true;
        this.speed = 1.0;
        this.fov_default = Math.PI / 4;
        this.fov_mult = 1.0;
        this.fov_to = 1.0;
        this.fov_drawn = 0.7;

        this.tick = 0;
        this.cooldown = 150;
        this.last_mouse = null;
        this.mouse_sens = 0.5;
        this.play_scope_in = true;

        this.initial_arrow_vel = vec3(0, 0, -25);

        this.crosshair = new Crosshair(this);

        this.camera_to = this.initial_camera_location;

    }
    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("make objs jump", ["Control", "0"], function() {
            for(var obj of this.physics_objects) {
                obj.add_impulse(vec3(Math.random()*1, Math.random()*12, Math.random()*1));
                obj.angular_velocity = vec4(Math.random()*10, Math.random()*10, Math.random()*10, 0);
            }
        });
        this.new_line();
        this.key_triggered_button("spawn apple", ["Control", "1"], function() {
            this.physics_objects.push(new Apple(vec3(this.mro(4),Math.random()*4,this.mro(4)), vec3(this.mro(1),(Math.random()*1) + 4,this.mro(1)), this))
        });
        this.new_line();
        this.key_triggered_button("pause/play", ["p"], function() {
            this.ticking = !this.ticking;
        });
        this.new_line();
        this.key_triggered_button("half speed", ["h"], function() {
            this.speed = this.speed / 2.0;
        });
        this.key_triggered_button("double speed", ["d"], function() {
            this.speed = this.speed * 2.0;
        });
        this.key_triggered_button("scope", ["s"], function() {
            
        });
        this.new_line();
    }

    mro(scale) {
        return (Math.random()-0.5)*scale;
    }

    clicked(event) {
        if(this.state == this.States.game) {
            console.log(event, 'game')
        }
    }
    game_toggleScope(bool) {
        if(!bool) {
            this.fov_to = 1.0;
            document.querySelector("#drawback").currentTime = 0;
            document.querySelector("#drawback").play();
        } else {
            this.fov_to = this.fov_drawn;
            if(this.play_scope_in) {
                document.querySelector("#draw").currentTime = 0;
                document.querySelector("#draw").play();
            }
        }
    }

    game_spawnArrow(fov, program_state, context) {
        this.physics_objects.push(new Arrow(this.initial_eye, this.initial_arrow_vel.times(fov**4), this, program_state, context))
    }

    game_appleHit(apple) {
        document.querySelector("#hit").currentTime = 0;
        document.querySelector("#hit").play();
        apple.kill();
    }

    display(context, program_state) {

        //run the below regardless of state:
        //program_state.set_camera(this.initial_camera_location);
        program_state.camera_inverse = this.camera_to.map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
        program_state.projection_transform = Mat4.perspective(this.fov_default * this.fov_mult, context.width / context.height, .1, 1000);
        const light_position = vec4(0, 8, 0, 1);
        program_state.lights = [new Light(light_position, hex_color('#ffffff'), 10**3)];

        if(document.querySelector("canvas") != null) { 
            this.canvas = document.querySelector("canvas");
        }

        switch(this.state) {

            case this.States.animation : {

                /**
                 *      Animation display logic goes here
                 */

            }   break;

            case this.States.game : {

                /**
                 *      Game display logic goes here
                 */

                this.ticking && this.tickGame(context, program_state);
                this.drawGame(context, program_state);

            }   break;


            default : {
                tickDefault(context, program_state);
            }
        }

        this.draw_environment(context, program_state);
        this.draw_light_gadgets(context, program_state);

    }

    /**
     *      Game draw function
     */
    drawGame(context, program_state) {

        this.draw_physics_objects(context, program_state);
        this.crosshair.draw(context, program_state, this.canvas)

    }
    /**
     *      Game tick function
     */
    tickGame(context, program_state) {

        if(this.tick % this.cooldown == 0) {
            let xv = Math.random()*3 + 2.5;
            if(Math.random() < 0.5) {
                xv *= -1;
            }
            this.physics_objects.push(new Apple(vec3(-5*(xv / Math.abs(xv)), 5, -5), vec3(xv,((Math.random()*1) + 1) + 4, 0), this))
        }

        this.tick_physics_objects(program_state);
        this.fov_mult = this.lerp(this.fov_mult, this.fov_to, 0.07);

        if(mousedown != null) { 
            this.game_toggleScope(true);
            this.play_scope_in = false;
        }
        if(mouseup != null) { 
            this.game_spawnArrow(this.fov_drawn / (this.fov_default * this.fov_mult), program_state, context);
            this.game_toggleScope(false);
            mouseup = null;
            this.play_scope_in = true;
        }
        if(clicked != null) {
            clicked = null;
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
            this.shapes.box.draw(context, program_state, Mat4.scale(10, 8, 1).times(Mat4.translation(0, 0, -10)), this.materials.phong)
            this.shapes.box.draw(context, program_state, Mat4.scale(2, 0.25, 1.25).times(Mat4.translation(2, 25, -6)), this.materials.test2)
        /* x+ wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(1, 8, 10).times(Mat4.translation(10, 0, 0)), this.materials.phong)
        /* x- wall */
            this.shapes.box.draw(context, program_state, Mat4.scale(1, 8, 10).times(Mat4.translation(-10, 0, 0)), this.materials.phong)

            //apple
            
    }

    draw_light_gadgets(context, program_state) {
        for(var light of program_state.lights) {
            this.shapes.sphere_4.draw(context, program_state, Mat4.translation(light.position[0], light.position[1], light.position[2], light.position[3]), this.materials.light_gadget)
        }
    }

    draw_physics_objects(context, program_state) {
        for(var object of this.kinematic_objects) {
            object.draw(context, program_state);
        }
        for(var object of this.physics_objects) {
            object.draw(context, program_state);
        }
    }
    tick_physics_objects(program_state) {
        for(var object of this.physics_objects) {
            object.step(program_state, [this.kinematic_objects[0]]);
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
    }
    step(program_state, kobjs) {
        const t = program_state.animation_time;
        const dt = program_state.animation_delta_time;

        const dtm = dt * 0.001 * this.scene.speed;
        
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
        let xc = this.position[0] > k.bounds[0] && this.position[0] < k.bounds[3];
        let yc = this.position[1]*(this.scale[1]*1.1) > k.bounds[1] && this.position[1]*(this.scale[1]*1.1) < k.bounds[4];
        let zc = this.position[2] > k.bounds[2] && this.position[2] < k.bounds[5];
        return (xc && yc && zc)
    }
    is_colliding_d(d) {
        let xc = Math.abs(this.position[0] - d.position[0]) <= this.radius + d.radius;
        let yc = Math.abs(this.position[1] - d.position[1]) <= this.radius + d.radius;
        let zc = Math.abs(this.position[2] - d.position[2]) <= this.radius + d.radius;
        return (xc && yc && zc)
    }
    draw(context, program_state) {};
    add_impulse(vec) {
        this.velocity = this.velocity.plus(vec);
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
        this.color = color(Math.random()*0.5 + 0.5, 0, 0, 1);
        this.radius = 0.5;
        this.alpha = 1.0;
        this.alpha_to = 1.0;
    }

    draw(context, program_state) {
        this.color = color(this.color[0], 0, 0, this.alpha);
        let apple_transform = this.model_transform.times(Mat4.rotation(Math.PI, 0, 0, 1));
        this.scene.shapes.apple.draw(context, program_state, apple_transform, this.scene.materials.apple.override({color: this.color}));

        let stem_transform = this.model_transform.times(Mat4.translation(0, 1, 0))
            .times(Mat4.scale(.1, .35, .1));
        let stem_color = hex_color("#693423");
        stem_color[3] = this.alpha;
        this.scene.shapes.box.draw(context, program_state, stem_transform, this.scene.materials.stem.override({color: stem_color}));

        let leaf_transform = this.model_transform.times(Mat4.translation(0.5, 1.2, 0))
            .times(Mat4.scale(.3, .1, .1))
            .times(Mat4.rotation(Math.PI/6, 0, 0, 1));

        let leaf_color = hex_color("#2cb733");
        leaf_color[3] = this.alpha;
        this.scene.shapes.box.draw(context, program_state, leaf_transform, this.scene.materials.leaf.override({color: leaf_color}));
        this.alpha = this.scene.lerp(this.alpha, this.alpha_to, 0.1);
        if(this.alpha < 0.1) {
            delete this;
        }
    }

    kill() {
        this.wasHit = true;
        this.alpha_to = 0.0;
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
        console.log(y_t)
        this.velocity = vec3(initial_velocity[2] * (theta), initial_velocity[2] * y_t, initial_velocity[2]);
        this.scale = vec3(0.1, 0.1, 0.4);
        this.radius = 0.2;
        this.angular_drag = 0.0;
        this.angular_velocity = vec4(0, 0, 10, 1)
    }

    draw(context, program_state) {

        this.scene.shapes.box.draw(context, program_state, this.model_transform, this.scene.materials.arrow_dark);

    }
    step(program_state, kobjs) {
        super.step(program_state, kobjs);
        for(var apple of this.scene.physics_objects.filter(x => x.constructor.name === "Apple")) {
            if(this.is_colliding_d(apple) && !apple.wasHit) {
                console.log("collision with ", apple)
                apple.add_impulse(this.velocity.times(0.2))
                apple.angular_velocity = vec4(Math.random()*10 + 10, Math.random()*10 + 10, Math.random()*10 + 10, 0);
                this.scene.game_appleHit(apple);
            }
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

    }

    draw(context, program_state) {
        let t = program_state.animation_time / 1000;
        //Body
        let body_transform = this.model_transform.times(Mat4.scale(1, 1.5, 0.5)).times(Mat4.translation(0, 2, 0))
        this.scene.shapes.box.draw(context, program_state, body_transform, this.scene.materials.shirt.override({color: color(0.5, 1, 0.5, 1)}));

        //Head
        const max_ang = Math.PI*0.5;
        var rot_ang = 0.25*(Math.sin(Math.PI*t)); 
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

class Crosshair {
    constructor(scene) { this.scene = scene; }
    draw(context, program_state, canvas) {
        this.scene.shapes.crosshair.draw(context, program_state, Mat4.inverse(program_state.camera_inverse).times(Mat4.translation(0, 0, -3).times(Mat4.scale(0.05, 0.05, 0.05))), this.scene.materials.crosshair)
    }
}

