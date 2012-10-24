
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
     window.webkitRequestAnimationFrame ||
     window.mozRequestAnimationFrame ||
     window.oRequestAnimationFrame ||
     window.msRequestAnimationFrame ||
     function(callback) {
       window.setTimeout(callback, 1000/50);
     };
})();

var game = {
	currState: {},
	// prevState: {},
	// nextState: {},
	methods: ['changeState','onKeyDown','onTouch','update','paint'],
	isMouseDown: false,
	isKeyDown: false,
	_debug: true,
	view: {
		x: 0,
		y: 0
	}
};

game.run = function(){
	var len = game.methods.length;
	
	for(var i = 0 ; i < len ; i++){
		var functionName = game.methods[i];
		var method = game[functionName];
		// if(typeof game[functionName] === 'function'){
			// functionName = game.functionName();
		// }
		if(method){
			try{
				method.call();
			}catch(e){}
		}
		
		if(game._debug){
			draw.font = 'bold 10px Courier New, Centaur, sans-serif';
			draw.color = "rgb(255, 255, 255)";
			//draw.font = ''
//			draw.text('keydown is : ' + game.keyDown, 10, 10);
//			draw.text('pointX: ' + game.gameCanvas.pointX, 10, 30);
//			draw.text('pointY: ' + game.gameCanvas.pointY, 10, 50);
		}
	}

};

game.init = function(cnvs){
	game.gameCanvas = cnvs;
	game.gameCanvas.ctx = cnvs.getContext('2d');
	game.screenWidth = game.gameCanvas.width;
	game.screenHeight = game.gameCanvas.height;
	game.view.width = game.screenWidth;
	game.view.height = game.screenHeight;
};

game.paint = function(){
	game.currState.paint();
};

game.update = function(){
	game.currState.update();
};

game.onTouch = function(){
	if(game.isMouseDown){
		game.currState.onTouch(game.pointX, game.pointY);
		game.isMouseDown = false;
	}
};

game.onKeyDown = function(){
	if(game.isKeyDown){
		game.currState.onKeyDown(game.keyDown);
		game.isKeyDown = false;
	}
};

game.setState = function(state){
	game.nextState = state;
};

game.changeState = function(){
	if(game.nextState != undefined){
		if(game.currState != undefined){
			game.currState.destroy();
			}
		game.currState = game.nextState;
		game.currState.init();
		game.nextState = undefined;
	}
};

game.draw = {
		get alpha() {
			return game.gameCanvas.ctx.globalAlpha;
		},
		
		set alpha(value) {
			game.gameCanvas.ctx.globalAlpha = value;
			return value;
		},
		
		get color() {
			return game.gameCanvas.ctx.fillStyle;
		},
		
		set color(value) {
			var ctx = game.gameCanvas.ctx;
			
			ctx.fillStyle = value;
			ctx.strokeStyle = value;
			
			return value;
		},
		
		get cursor() {
			return game.gameCanvas.style.cursor;
		},
		
		set cursor(value) {
			game.gameCanvas.style.cursor = value;
			return value;
		},
		
		get font() {
			return game.gameCanvas.ctx.font;
		},
		
		set font(value) {
			game.gameCanvas.ctx.font = value;
			return value;
		},
		
		get lineWidth() {
			return game.gameCanvas.ctx.lineWidth;
		},
		
		set lineWidth(value) {
			game.gameCanvas.ctx.lineWidth = value;
			return value;
		},
		
		get lineCap() {
			return game.gameCanvas.ctx.lineCap
		},
		
		set lineCap(value) {
			game.gameCanvas.ctx.lineCap = value;
			return value;
		},
		
		get textHalign() {
			return game.gameCanvas.ctx.textAlign;
		},
		
		set textHalign(value) {
			game.gameCanvas.ctx.textAlign = value;
			return value;
		},
		
		get textValign() {
			return game.gameCanvas.ctx.textBaseline;
		},
		
		set textValign(value) {
			game.gameCanvas.ctx.textBaseline = value;
			return value;
		},
		
		clear: function(ctx) {
			ctx = ctx || game.gameCanvas.ctx;
			/*game.gameCanvas.ctx.clearRect(0,0,game.view.width,game.view.height);
			game.gameCanvas.ctx.clearRect(0,0,game.view.width,game.view.height);*/
			ctx.clearRect(0,0,game.view.width,game.view.height);
		},
		
		circle: function(x,y,radius,stroke,color) {
			if (color !== undefined) {
				game.draw.color = color;
			}
			
			x -= game.view.x;
			y -= game.view.y;
			
			game.gameCanvas.ctx.beginPath();
			game.gameCanvas.ctx.arc(x,y,radius,0,6.283185307179586,false);
			
			if (stroke) {
				game.gameCanvas.ctx.stroke();
			} else {
				game.gameCanvas.ctx.fill();
			}
		},
		
		depth: function(obj,depth) {
			obj.depth = depth;
			game.draw.depth.update = true;
		},
		
		line: function(x1,y1,x2,y2,width,color) {
			if (width !== undefined) {
				game.draw.lineWidth = width;
			}
			
			if (color !== undefined) {
				game.draw.color = color;
			}
			
			x1 -= game.view.x+0.5;
			y1 -= game.view.y+0.5;
			x2 -= game.view.x+0.5;
			y2 -= game.view.y+0.5;
			
			game.gameCanvas.ctx.beginPath();
			game.gameCanvas.ctx.moveTo(x1,y1);
			game.gameCanvas.ctx.lineTo(x2,y2);
			game.gameCanvas.ctx.stroke();
		},
		
		rectangle: function(x1,y1,width,height,stroke,color) {
			if (color !== undefined) {
				game.draw.color = color;
			}
			
			if (width !== 0 && height !== 0) {
				x1 -= game.view.x;
				y1 -= game.view.y;
						
				if (stroke) {
					game.gameCanvas.ctx.strokeRect(x1,y1,width,height);
				} else {
					game.gameCanvas.ctx.fillRect(x1,y1,width,height);
				}
			}
		},
		
		text: function(text,x,y,stroke,maxWidth) {
			x -= game.view.x;
			y -= game.view.y;
			
			if (stroke) {
				if (maxWidth !== undefined) {
					game.gameCanvas.ctx.strokeText(text,x,y,maxWidth);
				} else {
					game.gameCanvas.ctx.strokeText(text,x,y);
				}
			} else {
				if (maxWidth !== undefined) {
					game.gameCanvas.ctx.fillText(text,x,y,maxWidth);
				} else {
					game.gameCanvas.ctx.fillText(text,x,y);
				}
			}
		},
		
		triangle: function(x1,y1,x2,y2,x3,y3,stroke,color) {
			if (color !== undefined) {
				game.draw.color = color;
			}
			
			var ctx = game.gameCanvas.ctx;
			
			x1 -= game.view.x;
			y1 -= game.view.y;
			x2 -= game.view.x;
			y2 -= game.view.y;
			x3 -= game.view.x;
			y3 -= game.view.y;
			
			ctx.beginPath();
			ctx.moveTo(x1,y1);
			ctx.lineTo(x2,y2);
			ctx.lineTo(x3,y3);
			
			if (stroke) {
				ctx.closePath();  
				ctx.stroke();
			} else {
				ctx.fill();
			}
		}
};

window.onmousedown = function(event){
//	game.gameCanvas.pointX = event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft) - getOffset(game.gameCanvas).left;
//	game.gameCanvas.pointY =  event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) - getOffset(game.gameCanvas).top;
//	game.isMouseDown = true;
};

window.onkeydown = function(event){
	game.keyDown = event.keyCode;
	game.isKeyDown = true;
}

function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.parentNode;
    }
    return { top: _y, left: _x };
}
