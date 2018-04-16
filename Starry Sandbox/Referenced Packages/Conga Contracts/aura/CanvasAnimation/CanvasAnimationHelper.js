({
  rgb : function(r, g, b, a) {
    a = a === undefined ? 1 : a;
    return "rgba("+(r|0)+","+(g|0)+","+(b|0)+","+a+")";
  },
  createCanvas: function(cmp) {
    var width = cmp.get("v.width");
    var height = cmp.get("v.height");
    var canvas = document.createElement("canvas");
    canvas.id = cmp.getGlobalId() + "_canvas";
    canvas.height = height;
    canvas.width = width;
    return canvas;
  },
  /* Method to create a point object */
  PointAt:function(x,y) {
    // Input validation & default values
    if (typeof x !== "number") {
        x = 0;
    }
    if (typeof y !== "number") {
        y = 0;
    }
    var ret = {"x":x, "y":y};
    /* Point methods */
    ret.add = function(point) {
        ret.x += point.x;
        ret.y += point.y;
    };
    ret.subtract = function(point) {
        ret.x -= point.x;
        ret.y -= point.y;
    };
    ret.scale = function(factor) {
        ret.x *= factor;
        ret.y *= factor;
    };
    ret.dotProduct = function(point) {
        return ret.x * point.x + ret.y * point.y;
    };
    return ret;
  },
  
  /* Method to create a pointmass object, a point specialized with
  some mass and the ability to move through an environment realistically.
  tick(dt) method on returning object calulates new position after
  dt time has passed. */
  PointMassAt:function(x,y, mass, environment, size) {
    /* PointMass specializes Point */
    var ret = this.PointAt(x,y);
    
    /* Input validation & default values */
    if (typeof mass !== "number") {
        mass = 1.0;
    }
    if (typeof environment !== "object") {
        environment = Physics.createEnvironment();
    }
    
    /* Setup instance variables */
    ret.prev = Object.create(ret); // var for holding prev xy position
    ret.mass = mass;
    ret.size = size;
    ret.environment = environment;
    
    /* Private variable and function to handle constraints */
    var constraints = [];
    var delta = this.PointAt(0,0);
    var constrain = function(pointA, pointB, maxDist, minDist) {
      delta.x = pointA.x;
      delta.y = pointA.y;
      delta.subtract(pointB);
      var dotprod = delta.dotProduct(delta);
      if (typeof minDist === "number") {
      var k = minDist * minDist;
          if(dotprod < k) {
              // Only allow pointA to get minDist close to pointB
              delta.scale(k / (dotprod + k) - 0.5);
              pointB.subtract(delta);
              pointA.add(delta);
          }
      }
      if (typeof maxDist === "number") {
          k = maxDist * maxDist;
          if(dotprod > k) {
              // Only allow pointA to get minDist far from pointB
              delta.scale(k / (dotprod + k) - 0.5);
              pointB.subtract(delta);
              pointA.add(delta);
          }
      }
    };
    ret.constraints = constraints;
    
    /* Add a constraint from this point to specified point and distance */
    ret.addConstraint = function(point, minDist, maxDist) {
      if (typeof maxDist !== 'number') {
          maxDist = minDist;
      }
      constraints.push({
        "point":point, 
        "minDist":minDist,
        "maxDist":maxDist
      });
    };
    
    /* Approximates points position in the future time dt based on previous position,
    environment, and contraints that have been added. */
    ret.tick = function(dt) {
      var dtdt = dt * dt;
      var verlet = function(x) {
          // calc new x using Verlet integration
          var a = ret.environment.force[x] / ret.mass; // acceleration
          // (2-c) * x - (1-c) * [x-1] * a * dt^2
          var t = (2 - ret.environment.friction) * ret[x] - (1 - ret.environment.friction) * ret.prev[x] + a * dtdt;
          ret.prev[x] = ret[x];
          ret[x] = t;
      };
      /* Perform verlet integration in all dimensions */
      verlet("x");
      verlet("y");
      
      /* Perform actions if environment bounds have been crossed */
      ret.environment.edgeTest(this);
      
      /* Enforce any constraints with other Points that have been set */
      for (var i=0; i<constraints.length; i++) {
          constrain(ret, constraints[i].point, constraints[i].minDist, constraints[i].maxDist);
      }   
    };
    
    return ret;
  },
  /* Method to create a containing environment for physics objects. */
  createEnvironment:function(width,height,friction,forceVector) {
    /* Input validation & default values */
    if (typeof width !== "number") {
        width = 640;
    }
    if (typeof height !== "number") {
        height = 480;
    }
    if (typeof friction !== "number") {
        friction = 0.01;
    }
    if (typeof forceVector !== "object") {
        forceVector = this.PointAt(0,0);
    }
    
    var ret = {
        "width":width,
        "height":height,
        "friction":friction,
        force:forceVector,
        // Assumes top-left origin
        hasLeft:true, // left = x<0
        hasRight:true, // right = x>width
        hasTop:true, // top = y<0
        hasBottom:true // bottom = y>height
    };

    /* Method to test if a pointmass has passed out of this 
    container, and take action as needed. In this case,
    push pointmass back inside container (bounce off edges).
    Return true if outside containing edges. */
    ret.edgeTest = function(pm) {
        var ret = false;
        if (this.hasLeft && pm.x < 0) {
          ret = true;
          pm.prev.x = pm.x;
          pm.x = 0;
        }
        else if (this.hasRight && pm.x > width) {
          ret = true;
          pm.prev.x = pm.x;
          pm.x = width;
        }
        if (this.hasBottom && pm.y > height - pm.size) {
          ret = true;
          pm.prev.y = pm.y;
          pm.y = height - pm.size + 1;
        }
        else if (this.hasTop && pm.y < 0) {
          ret = true;
          pm.prev.y = pm.y;
          pm.y = 0;
        }
        return ret;
    };
    
    return ret;
  },

})