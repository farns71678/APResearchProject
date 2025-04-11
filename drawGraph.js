const { createCanvas } = require('canvas');
const fs = require('fs');

const width = 1200;
const height = 1200;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

var pad = mapSize(31);
var area = mapSize(150);
var easeFunc = easeInQuad;

class Point {
	constructor(x, y) {
  	this.x = x;
    this.y = y;
  }
}

class Color {
	constructor(r, g, b) {
  	this.red = r;
    this.green = g;
    this.blue = b;
  }
  
  toHex() {
  	var ret = this.pad(this.red.toString(16), 2);
    ret += this.pad(this.green.toString(16), 2);
    return ret + this.pad(this.blue.toString(16), 2);
  }
  
  pad(num, size) {
      while (num.length < size) {
          num = "0" + num;
      }
      return num;
  }
}


var grad1 = new Color(0, 209, 255);
var grad2 = new Color(0, 255, 233);

var points = [];
resetEasingStuff();

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('graph.png', buffer);
console.log('Drew Graph');

function resetEasingStuff() {
	points = [];
  calculateGraph();
  paintCanvas();
}

function calculateGraph() {
	var pos = 0;
  var start = 0;
  var end = area;

  for (var i = 0; i < area + 1; i++) {
    var y = easeFunc(pos / area);
    //c.moveTo(25 + i, 25 + y);
    //c.fillRect(pad + i - 1, area + pad*2 - (pad + y * area) - 1, 3, 3);
    points.push(new Point(pad + i, area + pad*2 - (pad + y * area)));
    pos++;
  }
}

function paintCanvas() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
	//paint graph
  ctx.lineCap = "round";
  //ctx.strokeStyle = "#16A";
  ctx.strokeStyle = "#999";
  ctx.fillStyle = "#999";
  ctx.lineWidth = mapSize(1.0);
  ctx.font = Math.round(mapSize(14)) + "px Arial";
  ctx.fillText("x", pad + mapSize(6), pad + mapSize(8));
  ctx.fillText("t", pad + area - mapSize(6), pad + area - mapSize(6));
  ctx.lineWidth = mapSize(0.5);
  ctx.strokeText("x", pad + mapSize(6), pad + mapSize(8));
  ctx.strokeText("t", pad + area - mapSize(6), pad + area - mapSize(6));
  ctx.lineWidth = mapSize(3.0);
  ctx.moveTo(pad, area + pad);
  ctx.lineTo(area + pad, area + pad);
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, area + pad);
  ctx.stroke();

	//draw line
  ctx.beginPath();
  var grd = ctx.createLinearGradient(0, 0, area + pad, 0);
  grd.addColorStop(0, "#00d1ff");
  grd.addColorStop(1, "#00ffe9");
  ctx.strokeStyle = grd;
  ctx.lineWidth = mapSize(3.5);
  for (var i = 1; i < points.length; i++) {
    ctx.moveTo(points[i - 1].x, points[i - 1].y);
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}
// ease in functions
function easeInQuad(t) { return t*t; }

function mapSize(x) {
    return x / 212 * width;
}

















