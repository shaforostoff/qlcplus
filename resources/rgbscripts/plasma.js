/*
  Q Light Controller Plus
  plasma.js

  Copyright (c) Tim Cullingworth

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0.txt

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// Development tool access
var testAlgo;

(
  function()
  {
    var algo = new Object;
    algo.apiVersion = 3;
    algo.name = "Plasma";
    algo.author = "Tim Cullingworth, Massimo Callegari";
    algo.acceptColors = 5;
    algo.properties = new Array();
    algo.rstepcount = 0;
    algo.gstepcount = 50;
    algo.bstepcount = 100;
    algo.presetIndex = 4;
    algo.properties.push(
      "name:presetIndex|type:list|display:Preset|" +
      "values:User Defined,Rainbow,Fire,Abstract,Ocean|" +
      "write:setPreset|read:getPreset");
    algo.presetSize = 5;
    algo.properties.push(
      "name:presetSize|type:range|display:Size|" +
      "values:1,20|write:setSize|read:getSize");
    algo.ramp = 20;
    algo.properties.push(
      "name:ramp|type:range|display:Ramp|" +
      "values:10,30|write:setRamp|read:getRamp");
    algo.stepsize = 25;
    algo.properties.push(
      "name:stepsize|type:range|display:Speed|" +
      "values:1,50|write:setStep|read:getStep");

    var util = new Object;
    util.initialized = false;
    util.gradientData = new Array();
    util.colorArray = new Array();

    algo.setPreset = function(_preset)
    {
      algo.acceptColors = 0;
      if (_preset === "Rainbow")
      {
        algo.presetIndex = 0;
      }
      else if (_preset === "Fire")
      {
        algo.presetIndex = 1;
      }
      else if (_preset === "Abstract")
      {
        algo.presetIndex = 2;
      }
      else if (_preset === "Ocean")
      {
        algo.presetIndex = 3;
      }
      else if (_preset === "User Defined")
      {
        algo.presetIndex = 4;
        algo.acceptColors = 5;
      }
      else { algo.presetIndex = 4; }
      util.initialized = false;
    };

    algo.getPreset = function()
    {
      if (algo.presetIndex === 0) { return "Rainbow"; }
      else if (algo.presetIndex === 1) { return "Fire"; }
      else if (algo.presetIndex === 2) { return "Abstract"; }
      else if (algo.presetIndex === 3) { return "Ocean"; }
      else if (algo.presetIndex === 4) { return "User Defined"; }
      else { return "User Defined"; }
    };

    algo.setSize = function(_size)
    {
      algo.presetSize = _size;
      util.initialized = false;
    };

    algo.getSize = function()
    {
      return algo.presetSize;
    };

    algo.setRamp = function(_ramp)
    {
      algo.ramp = _ramp;
      util.initialized = false;
    };

    algo.getRamp = function()
    {
      return algo.ramp;
    };

    algo.setStep = function(_step)
    {
      algo.stepsize = _step;
      util.initialized = false;
    };

    algo.getStep = function()
    {
      return algo.stepsize;
    };

    util.initialize = function()
    {
      // calculate the gradient for the selected preset
      // with the given width
      var gradIdx = 0;
      util.gradientData = new Array();
      var colorArray = algo.rgbMapGetColors();
      for (var i = 0; i < colorArray.length; i++)
      {
        var sColor = colorArray[i];
        var eColor = colorArray[(i + 1) % colorArray.length];
        if (! sColor)
          sColor = 0;
        if (! eColor)
          eColor = 0;

        util.gradientData[gradIdx++] = sColor;
        var sr = (sColor >> 16) & 0x00FF;
        var sg = (sColor >> 8) & 0x00FF;
        var sb = sColor & 0x00FF;
        var er = (eColor >> 16) & 0x00FF;
        var eg = (eColor >> 8) & 0x00FF;
        var eb = eColor & 0x00FF;

        var stepR = ((er - sr) / 300);
        var stepG = ((eg - sg) / 300);
        var stepB = ((eb - sb) / 300);

        for (var s = 1; s < 300; s++)
        {
          var gradR = Math.floor(sr + (stepR * s)) & 0x00FF;
          var gradG = Math.floor(sg + (stepG * s)) & 0x00FF;
          var gradB = Math.floor(sb + (stepB * s)) & 0x00FF;
          var gradRGB = (gradR << 16) + (gradG << 8) + gradB;
          util.gradientData[gradIdx++] = gradRGB;
        }
      }
      util.permArray = new Array(512);
      var permutation = [ // 256 members
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
        140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247,
        120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57,
        177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74,
        165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
        60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
        65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
        200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3,
        64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85,
        212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170,
        213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43,
        172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185,
        112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191,
        179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31,
        181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150,
        254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195,
        78, 66, 215, 61, 156, 180
      ];

      // initialize symmetrical permutation array(512)
      for (var i = 0; i < 256; i++) {
        util.permArray[i] = permutation[i];
        util.permArray[256 + i] = permutation[i];
      }
      util.initialized = true;
    };

    // This is a port of Ken Perlin's Java code. The
    // original Java code is at http://cs.nyu.edu/%7Eperlin/noise/.
    // Note that in this version, a number from 0 to 1 is returned.
    util.noise = function(x, y, z)
    {
      // Find unit cube that contains point.
      var X = Math.floor(x) & 255;
      var Y = Math.floor(y) & 255;
      var Z = Math.floor(z) & 255;
      // Find relative x,y,z of point in cube.
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      // Compute fade curves for each of y, y, z
      var u = fade(x);
      var v = fade(y);
      var w = fade(z);
      // Hash coordinates of the 8 cube corners,
      var A  = util.permArray[X] + Y;
      var AA = util.permArray[A] + Z;
      var AB = util.permArray[A + 1] + Z;
      var B  = util.permArray[X + 1] + Y;
      var BA = util.permArray[B] + Z;
      var BB = util.permArray[B + 1] + Z;

      // And add blended results from8 corners of cube
      var rawNoise = lerp(w,
        lerp(v, lerp(u, grad(util.permArray[AA    ], x  , y    , z    ),
                        grad(util.permArray[BA    ], x-1, y    , z    )),
                lerp(u, grad(util.permArray[AB    ], x  , y - 1, z    ),
                        grad(util.permArray[BB    ], x-1, y - 1, z    ))),
        lerp(v, lerp(u, grad(util.permArray[AA + 1], x  , y    , z - 1),
                        grad(util.permArray[BA + 1], x-1, y    , z - 1)),
                lerp(u, grad(util.permArray[AB + 1], x  , y - 1, z - 1),
                        grad(util.permArray[BB + 1], x-1, y - 1, z - 1)))
      );
      // Scale to range between 0 and 1
      var noise = scale(rawNoise);
      return noise;
    };
    // Fade function for values between 0 and 1
    function fade(t)
    {
      // https://www.geogebra.org/calculator
      // f(t)=t^(3) (t (t*6-15)+10)
      var fade = t * t * t * (t * (t * 6 - 15) + 10);
      return fade;
    }
    // https://en.wikipedia.org/wiki/Linear_interpolation
    function lerp(t, a, b)
    {
      return a + t * (b - a);
    }

    // https://en.wikipedia.org/wiki/Gradient
    function grad(hash, x, y, z)
    {
      // CONVERT TO 4 BITS OF HASH CODE
      var h = hash & 0x0000000f;
      // INTO 12 GRADIENT DIRECTIONS.
      var u = (h < 8) ? x : y;
      var v = (h < 4) ? y : (h === 12 || h === 14) ? x : z;
      return (((h & 1) === 0) ? u : -1 * u) + (((h & 2) === 0) ? v : -1 * v);
    }
    function scale(n)
    {
      var scaled = (1 + n) / 2;
      return scaled;
    }

    algo.rgbMapSetColors = function(rawColors)
    {
      if (! Array.isArray(rawColors))
        return;

      util.colorArray = new Array(rawColors.length);
      for (var i = 0; i < util.colorArray.length; i++) {
        if (i < rawColors.length)
        {
          util.colorArray[i] = rawColors[i];
        } else {
          util.colorArray[i] = 0;
        }
      }
      util.initialized = false;
    }

    algo.rgbMapGetColors = function()
    {
      if (algo.presetIndex === 1)
      {
        var colorArray = new Array();
        colorArray = [ 0xFFFF00, 0xFF0000, 0x000040, 0xFF0000 ];
        return colorArray
      }
      else if (algo.presetIndex === 2)
      {
        var colorArray = new Array();
        colorArray = [ 0x5571FF, 0x00FFFF, 0xFF00FF, 0xFFFF00 ];
        return colorArray
      }
      else if (algo.presetIndex === 3)
      {
        var colorArray = new Array();
        colorArray = [ 0x003AB9, 0x02EAFF ];
        return colorArray
      }
      else if (algo.presetIndex === 4)
      {
        if (util.colorArray.length <= 0)
        {
          // No user defined colors set, return default
          var colorArray = new Array();
          colorArray = [ 0x00FF00, 0xFFAA00, 0x0000FF, 0xFFFF00, 0xFFFFFF ];
          return colorArray
        }
        return util.colorArray;
      }
      else
      {
        // Either presetIndex === 0 or an invalid presetIndex
        var colorArray = new Array();
        colorArray = [ 0xFF0000, 0x00FF00, 0x0000FF ];
        return colorArray
      }
    }

    algo.rgbMap = function(width, height, rgb, step)
    {
      if (util.initialized === false)
      {
        util.initialize();
      }

      // set a scaling value
      var size = algo.presetSize / 2;
      // create a more uniform speed control
      var speed = Math.pow(100, (algo.stepsize / 50));
      algo.bstepcount += (speed / 500);
      // A rolling step count for the noise function
      algo.bstepcount = (algo.bstepcount % 256);
      // keep the patten square
      var square = (width > height) ? width : height;

      var map = new Array(height);
      for (var y = 0; y < height; y++)
      {
        map[y] = new Array();

        for (var x = 0; x < width; x++)
        {
          var nx = x / square;  // Normalize nx & ny to 0 - 1
          var ny = y / square;
          var n = util.noise(size * nx, size * ny, algo.bstepcount);
          var gradStep = Math.round(Math.pow(n, (algo.ramp / 10)) * util.gradientData.length);
          map[y][x] = util.gradientData[gradStep];
        }
      }

      return map;
    };

    algo.rgbMapStepCount = function(width, height)
    {
      return 2; // This make no difference to the script ;-)
    };

    // Development tool access
    testAlgo = algo;

    return algo;
  }
)();
