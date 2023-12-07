var canvas = document.getElementById("MainCanvas");
var context = canvas.getContext("2d");
var paused = true;
var frameCounter = 0;
var flakes = [];
var piles = [];
var explosions = [];
var explosion_particles = [];
var snowball = { x:0, y:0, r:0, history:[] };
var mouse = { x:0, y:0, state:'up' };
var config = {
	flakesCount: 500
};

$(document).ready(function(){
	init();
	
	$('#UpdateButton').click(function(){
		if ($('#UpdateButton').html() == 'Play'){
			$('#UpdateButton').html('Pause');
		} else {
			$('#UpdateButton').html('Play');
		}
		
		paused = !paused;
		window.requestAnimationFrame(UpdateCanvas);
	});
	
	$(window).mousedown(function(event){
		mouse.state = 'down';
	});
	
	$(window).mouseup(function(event){
		mouse.state = 'up';
	});
	
	$(window).mousemove(function(event){
		if (mouse.state === 'down'){
			var rect = canvas.getBoundingClientRect();
			
			mouse.x = (event.clientX - rect.left) * ( canvas.width / $('#MainCanvas').width() );
			mouse.y = (event.clientY - rect.top) * ( canvas.height / $('#MainCanvas').height() );
		}
	});
});

function init(){
	for (var i=0; i < config.flakesCount; i++){
		var flake = {
			x: Math.floor(Math.random() * (canvas.width - 20)) + 10,
			y: Math.floor(Math.random() * (canvas.height - 20)) + 10,
			r: 2
		};
		flakes.push(flake);
	}
}

function UpdateCanvas(timestamp){	
	// Keep count of the animation frames
	frameCounter++;
	
	// Clear the canvas
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	// Let it snow!
	flakes.forEach(function(flake, i){
		flake.y += 5;
		
		if (flake.y > canvas.height){
			flake.y = 0;
			
			var piled = false;
			piles.forEach(function(pile, ii){
				if (pile.x === flake.x){
					pile.r++;
					piled = true;
				}
			});
			
			if (!piled){
				piles.push({
					x: flake.x,
					y: canvas.height - 1,
					r: 1
				});
			}
		}
		
		context.beginPath();
		context.arc(
			flake.x, 
			flake.y, 
			flake.r, 
			0, 2 * Math.PI, false
		);
		context.fillStyle = 'white';
		context.fill();
		context.lineWidth = 1;
		context.strokeStyle = 'white';
		context.stroke();
		
	});
	
	// Someone call Mr. Plow!
	piles.forEach(function(pile, i){
		if (mouse.state === 'down' && 
			(mouse.x - pile.x >= (pile.r*-1) && mouse.x - pile.x <= pile.r) &&
			(mouse.y - canvas.height >= (pile.r*-1) && mouse.y - canvas.height <= pile.r)){
				
			pile.r -= 5;
			if ( pile.r < 0 ){ pile.r = 0; }
			
			snowball.r += 1;
			if ( snowball.r > 50 ){ snowball.r = 50; }
		}
		
		context.beginPath();
		context.arc(
			pile.x, 
			pile.y, 
			pile.r, 
			0, 2 * Math.PI, false
		);
		context.fillStyle = 'white';
		context.fill();
		context.lineWidth = 1;
		context.strokeStyle = 'white';
		context.stroke();
	});
	
	if (snowball.r > 0){
		if (mouse.state === 'down'){
			snowball.x = mouse.x;
			snowball.y = mouse.y;
		} else {
			if (snowball.history.length > 0){
				// Throwing mechanic needs hella work.. :/
				
				var difX = snowball.history[0].x - snowball.x;
				var difY = snowball.history[0].y - snowball.y;
				
				if (difX > 10){ difX = 10; }
				if (difX < -10){ difX = -10; }
				
				snowball.x -= difX;
				if (snowball.x > canvas.width){
					snowball.x = canvas.width;
					if (explosions.length <= 0){
						explosions.push({x:snowball.x, y:snowball.y, r:snowball.r});
					}
				} else if (snowball.x < 0){
					snowball.x = 0;
					if (explosions.length <= 0){
						explosions.push({x:snowball.x, y:snowball.y, r:snowball.r});
					}
				}
			}
			
			snowball.y += 3;
			if (snowball.y > canvas.height){
				snowball.r = 0;
			}
		}
		
		context.beginPath();
		context.arc(
			snowball.x, 
			snowball.y, 
			snowball.r, 
			0, 2 * Math.PI, false
		);
		context.fillStyle = 'white';
		context.fill();
		context.lineWidth = 1;
		context.strokeStyle = 'white';
		context.stroke();
	}
	
	if (snowball.r > 0){
		if (snowball.history.length >= 10){ snowball.history.splice(0, 1); }
		snowball.history.push({ x:snowball.x, y:snowball.y });
	}
	
	if (explosions.length > 0 && explosion_particles.length === 0){
		// Create explosion particles
		explosion_particles.push({ x:explosions[0].x, y:explosions[0].y, r:explosions[0].r });
	}
	
	if (explosion_particles.length > 0){
		var particlesRemaining = 0;
		explosion_particles.forEach(function(particle, i){
			particle.y += 1;
			
			if (particle.y > canvas.height){
				particle.r = 0;
			}
			
			if (particle.r > 0){
				particlesRemaining++;
				
				context.beginPath();
				context.arc(
					particle.x, 
					particle.y, 
					particle.r, 
					0, 2 * Math.PI, false
				);
				context.fillStyle = 'white';
				context.fill();
				context.lineWidth = 1;
				context.strokeStyle = 'white';
				context.stroke();
			}
		});
		
		if (particlesRemaining <= 0){
			explosions = [];
			explosion_particles = [];
		}
	}
	
	if (!paused){
		window.requestAnimationFrame(UpdateCanvas);
	}
}