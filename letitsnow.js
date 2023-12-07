var canvas = document.getElementById("MainCanvas");
var context = canvas.getContext("2d");
var backgroundCanvas = document.getElementById("BackgroundCanvas");
var backgroundContext = canvas.getContext("2d");
var paused = true;
var backgroundFlakes = [];
var existingPiles = [];
var frameCounter = 0;
var flakes = [];
var piles = [];
var explosions = [];
var explosion_particles = [];
var snowball = {
    x: 0,
    y: 0,
    r: 0,
    history: [],
    t: 0
};
var mouse = {
    x: 0,
    y: 0,
    state: "up",
    speed: 0
};
var mouseVelocity = 0;
var explosionAngle;
var decreaseSize;
var gravity = -9.81;
var difTime;
var velocityCalculated = false;
var mouseClicked = false;
var aStep = 0.01;

///////////////////////////////////////
/*************************************/
///////////////////////////////////////

var config = {
    flakesCount: 150,
    quickStart: false
};

/////////////////////////////////////////////////
// Get random num for the opacity of the flakes
////////////////////////////////////////////////

function randomIntFromInterval(min, max) {
    return Math.random() * (max - min + 1) + min;
}

/////////////////////////////////////////////////
// Convert degrees to radians
////////////////////////////////////////////////

function degreesToRadians(angle) {
    return angle * (Math.PI / 180);
}

/////////////////////////////////////////////////
// Reset variables for a clean slate
////////////////////////////////////////////////
function resetVariables() {
    explosions = [];
    explosion_particles = [];
    difTime = 0;
    velocityCalculated = false;
    snowball.history = [];
}

///////////////////////////////////////////////////////////////////
// Get velocity between two points (distance/time)
// Multiplied by time difference to get a more usable number
//////////////////////////////////////////////////////////////////

function getVelocity(p1, p2) {
    var dist = Math.sqrt(Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y));
    difTime = p2.t.getTime() - p1.t.getTime();
    var velocity = Math.floor(dist / difTime * difTime);

    if (velocity < 5) {
        velocity = 5;
    } else if (isNaN(velocity)) {
        velocity = 25;
    }
    return velocity;
}

///////////////////////////////////////////////
// Sets up all the event listeners on the page.
///////////////////////////////////////////////

$(document).ready(function() {

    snowInit(); // initialises snow
    window.requestAnimationFrame(UpdateCanvas);
    document.getElementById("MainCanvas").classList.add("grabbable");
    var canvas = document.getElementById('MainCanvas');
    resizeCanvas();

    ///////////////////////////////////////
    // MOUSEDOWN event listener
    ///////////////////////////////////////

    $(window).mousedown(function(event) {
        mouse.state = "down";
    });

    ///////////////////////////////////////
    // MOUSEUP event listener
    ///////////////////////////////////////

    $(window).mouseup(function(event) {
        mouse.state = "up";
    });

    ///////////////////////////////////////
    // MOUSEMOVE event listener
    ///////////////////////////////////////

    $(window).mousemove(function(event) {
        if (mouse.state === "down") {
            var rect = canvas.getBoundingClientRect();
            mouse.x =
                (event.clientX - rect.left) * (canvas.width / $("#MainCanvas").width());
            mouse.y =
                (event.clientY - rect.top) *
                (canvas.height / $("#MainCanvas").height());
        }
    });

});

///////////////////////////////////////
// Initialises the snow
///////////////////////////////////////
// x = x coordinate
// y = y coorindate
// r = radius
// o = opacity
// s = speed
// a = angle

function snowInit() {
    for (var i = 0; i < config.flakesCount; i++) {
        var flake = {
            x: Math.floor(Math.random() * canvas.width),
            y: Math.floor(Math.random() * canvas.height),
            r: Math.random() * 3 + 2,
            o: randomIntFromInterval(0.1, 0.5),
            s: randomIntFromInterval(2, 5)
        };
        flakes.push(flake);

        var backgroundFlake = {
            x: Math.floor(Math.random() * canvas.width),
            y: Math.floor(Math.random() * canvas.height),
            r: Math.random() * 3 + 2,
            o: randomIntFromInterval(0.1, 0.5),
            s: randomIntFromInterval(2, 5),
            a: randomIntFromInterval(0, Math.PI)
        };
        backgroundFlakes.push(backgroundFlake);

        if (config.quickStart) {
            piles.push({
                x: Math.floor(Math.random() * canvas.width),
                y: canvas.height,
                r: Math.random() * 100
            });
        }
    }
}

///////////////////////////////////////
// Method which animates the canvas
///////////////////////////////////////

function UpdateCanvas() {
    // Keep count of the animation frames
    frameCounter++;

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    backgroundContext.clearRect(
        0,
        0,
        backgroundCanvas.width,
        backgroundCanvas.height
    );

    // Let it snow!
    flakes.forEach(function(flake, i) {
        flake.y += flake.s;
        if (flake.y > canvas.height) {
            flake.y = 0;

            // increase the size of the pile
            var piled = false;
            piles.forEach(function(pile, ii) {
                if (pile.x === flake.x) {
                    pile.r += 2;
                    piled = true;
                }
            });

            // if there is no pile, start one
            if (!piled) {
                piles.push({
                    x: flake.x,
                    y: canvas.height - 1,
                    r: flake.r,
                    o: flake.o
                });
            }
        }
        context.beginPath();
        context.arc(flake.x, flake.y, flake.r, 0, 2 * Math.PI, false);
        context.fillStyle = "rgb(255,255,255, " + flake.o + ")";
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = "rgba(0,0,0,0)";
        context.stroke();
    });

    // Background canvas with snowballs falling from side to side
    backgroundFlakes.forEach(function(bFlake) {
        if (bFlake.y > backgroundCanvas.height) bFlake.y = 0;

        bFlake.y += bFlake.s;
        bFlake.x += Math.cos(bFlake.a) * bFlake.r;
        bFlake.a += aStep;

        backgroundContext.beginPath();
        backgroundContext.arc(bFlake.x, bFlake.y, bFlake.r, 0, 2 * Math.PI, false);
        backgroundContext.fillStyle = "rgb(255,255,255" + bFlake.o + ")";
        backgroundContext.fill();
        backgroundContext.lineWidth = 1;
        backgroundContext.strokeStyle = "rgba(0,0,0,0)";
        backgroundContext.stroke();
    });

    ///////////////////////////////////////////////////////////////////////////////
    // If the user clicks on the piled snow area, allow them to pick up some snow
    ///////////////////////////////////////////////////////////////////////////////

    piles.forEach(function(pile, i) {
        if (
            mouse.state === "down" &&
            (mouse.x - pile.x >= pile.r * -1 && mouse.x - pile.x <= pile.r) &&
            (mouse.y - canvas.height >= pile.r * -1 &&
                mouse.y - canvas.height <= pile.r)
        ) {
            pile.r -= 5;
            if (pile.r < 0) {
                pile.r = 0;
            }

            snowball.r += 0.5;
            if (snowball.r > 50) {
                snowball.r = 50;
            }
        }

        context.beginPath();
        context.arc(pile.x, pile.y, pile.r, 0, 2 * Math.PI, false);
        context.fillStyle = "rgb(255,255,255)";
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = "'rgba(0,0,0,0)'";
        context.stroke();
    });

    ///////////////////////////////////////
    // Snowball follows mouse.
    ///////////////////////////////////////

    if (snowball.r > 0) {
        // speed at which the explosions should decrease in size
        if (snowball.r > 100) {
            decreaseSize = 0.1;
        } else {
            decreaseSize = snowball.r / 100;
        }

        ///////////////////////////////////////
        ///////////////////////////////////////

        if (mouse.state === "down") {
            // If fresh click, reset the variables so that the snowball has a new history
            if (mouseClicked) {
                resetVariables();
                mouseClicked = false;
            }

            // Snowball is being dragged - update its x and y coords in line with the mouse's coordinates
            snowball.x = mouse.x;
            snowball.y = mouse.y;
            snowball.t = new Date();
            velocityCalculated = false;
        } else {
            ///////////////////////////////////////
            // Snowball has been RELEASED!
            ///////////////////////////////////////
            mouseClicked = true;

            if (snowball.history.length > 0) {
                // If the velocity has not been calculated, do it!
                // Should only happen once per dragged snowball, between the oldest recorded history and the latest position before release
                if (!velocityCalculated) {
                    mouseVelocity = getVelocity(snowball.history[0], snowball);
                    velocityCalculated = true; // velocity has been calculated
                    // getWeightedAverage(snowball);
                }

                // Only uses half of the history to get the latest angle of the snowball.
                var halfHistory = Math.round(snowball.history.length / 2);

                // Get angle/trajectory of the snowball
                var angleInRadians = Math.atan2(
                    snowball.y - snowball.history[halfHistory].y,
                    snowball.x - snowball.history[halfHistory].x
                );

                ////////////////////////////////////////////////////////////////////////////
                // HORIZONTAL DISPLACEMENT = COS(ANGLE) * VELOCITY
                // VERTICAL DISPLACEMENT =  SIN(ANGLE) * VELOCITY * TIME(default 1) * 0.5 * -9.81 * TIME SQUARED
                ////////////////////////////////////////////////////////////////////////////

                snowball.x += Math.cos(angleInRadians) * mouseVelocity;
                snowball.y +=
                    Math.sin(angleInRadians) * mouseVelocity * 1 -
                    0.5 * gravity * Math.pow(1, 2);

                // If snowball hits the right side of the canvas, create a new explosion with the x coordinate equal to the canvas's width

                if (snowball.x > canvas.width) {
                    if (explosions.length <= 0) {
                        explosions.push({
                            x: canvas.width,
                            y: snowball.y,
                            r: snowball.r
                        });
                        snowball.r = 0; // Remove the snowball by setting its radius to 0
                        velocityCalculated = false; // allow another snowball's velocity to be calculated
                    }
                    // If snowball hits the left side of the canvas, create a new explosion with the x coordinate equal to 0

                    // Set leftSide to true
                } else if (snowball.x < 0) {
                    if (explosions.length <= 0) {
                        explosions.push({
                            x: 0,
                            y: snowball.y,
                            r: snowball.r
                        });
                        snowball.r = 0;
                        velocityCalculated = false; // allow another snowball's velocity to be calculated
                    }
                } else if (snowball.y < 0) {
                    if (explosions.length <= 0) {
                        explosions.push({
                            x: snowball.x,
                            y: 0,
                            r: snowball.r
                        });
                        snowball.r = 0;
                        velocityCaluclated = false;
                    }
                }
            }

            // If snowball exceeds the canvas's height, remove it by setting its radius to 0
            if (snowball.y > canvas.height) {
                snowball.r = 0;
                resetVariables();
            }
        }

        var gradient = context.createRadialGradient(
            snowball.x,
            snowball.y,
            0,
            snowball.x,
            snowball.y,
            snowball.r
        );
        context.beginPath();
        context.arc(snowball.x, snowball.y, snowball.r, 0, 2 * Math.PI, false);
        context.fillStyle = "rgba(255,255,255, 0.9)";
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = "rgba(0,0,0,0)";
        context.stroke();
    }

    ///////////////////////////////////////
    /******* RECORD HISTORY **************/
    ///////////////////////////////////////

    if (snowball.r > 0) {
        // RECORDING 20 STEPS
        if (snowball.history.length >= 20) {
            snowball.history.splice(0, 1);
        }
        snowball.history.push({
            x: snowball.x,
            y: snowball.y,
            t: new Date()
        });
    }

    // Create explosion particles
    if (explosions.length > 0 && explosion_particles.length === 0) {
        explosionAngle = 360 / mouseVelocity; // size of angle between each particle
        var angle = 0;

        // use the velocity to determine how many particles there should be
        var i;
        for (i = 0; i < mouseVelocity; i++) {
            explosion_particles.push({
                x: explosions[0].x,
                y: explosions[0].y,
                r: randomIntFromInterval(1, explosions[0].r / 2), // assign a random radius
                speed: randomIntFromInterval(1, 8), // assign a random speed
                angle: degreesToRadians(angle)
            });
            angle = Math.floor(angle + explosionAngle); // increment the angle
        }
    }

    // Determine the position of the particles and animate
    if (explosion_particles.length > 0) {
        var particlesRemaining = 0;

        explosion_particles.forEach(function(particle, i) {
            particle.x += Math.cos(particle.angle) * particle.speed;
            particle.y +=
                Math.sin(particle.angle) * particle.speed * 1 -
                0.5 * -20 * Math.pow(1, 2);

            // as the particles move away from the explosion point, decrease their size
            particle.r -= decreaseSize;

            // If any particle exceeds the height of the canvas, delete it
            if (particle.y > canvas.height) {
                particle.r = 0;
                velocityCalculated = false;
            }

            // If a particle has a radius greater than 0, draw it!
            if (particle.r > 0) {
                var opacity = randomIntFromInterval(0.6, 1);
                particlesRemaining++;
                context.beginPath();
                context.arc(particle.x, particle.y, particle.r, 0, 2 * Math.PI, false);
                context.fillStyle = "rgba(0,114,206 " + opacity + ")";
                context.fill();
                context.lineWidth = 1;
                context.strokeStyle = "rgba(0,0,0,0)";
                context.stroke();
            }
        });

        // If there are no particles remaining, reset variables.
        if (particlesRemaining <= 0) {
            resetVariables();
        }
    }
    window.requestAnimationFrame(UpdateCanvas);
}


