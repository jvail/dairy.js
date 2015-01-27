/*
  Dairy cow grouping.

  It creates groups a such that the total deviation of energy and protein requirements relative to the cow's intake 
  capacity from the groups average is minimized (similar to McGilliard 1983). In the resulting groups animals in each 
  group require a "similar" energy and protein density of the ration. The results of each run slightly defer depending on
  the inital guess of k-means. Therefore it runs several times and returns the best result.

  REFERENCES

  McGilliard, M.L., Swisher, J.M. and James, R.E. 1983. Grouping lactating cows by nutritional requirements for feeding.
  Journal of Dairy Science 66(5):1084-1093.

  k-means.js implementation from https://github.com/cmtt/kmeans-js

  LICENSE

  Copyright 2014 Jan Vaillant   <jan.vaillant@zalf.de>
  Copyright 2014 Lisa Baldinger <lisa.baldinger@boku.ac.at>

  Distributed under the MIT License. See accompanying file LICENSE or copy at http://opensource.org/licenses/MIT

  Any publication for which this file or a derived work is used must include an a reference to at least one source:

  Vaillant, J. and Baldinger, L. 2014. 
  dairy.js - an open-source JavaScript library for simulation of dairy cow herds and rapid model prototyping.
  Poster presentation at the International Livestock Modelling and Research Colloquium, 14-16 October, Bilbao, Spain.

  Baldinger, L., Vaillant, J., Zollitsch, W. and Rinne, M. 2014.
  Making a decision support system for dairy farmers usable throughout Europe - the challenge of feed evaluation.
  Oral presentation at the International Livestock Modelling and Research Colloquium, 14-16 October, Bilbao, Spain.

  TODO

  - implement different strategies e.g. (req. intake capacity-1, absolute requirements, days in milk)
*/

var dairy = dairy || {};

dairy.group = (function () {

var round = Math.round
  , floor = Math.floor
  , random = Math.random
  , log = Math.log
  , pow = Math.pow
  , sqrt = Math.sqrt
  , distance =  function(a, b) {
      return sqrt(pow(a.x - b.x, 2) + pow(a.y - b.y, 2));
    }
    /* TODO: refactor original code from cmtt kmeans.. */
  , sortBy = function (a, b, c) {
      c = a.slice();
      return c.sort(function (d, e) {
        d = b(d);
        e = b(e);
        return (d < e ? -1 : d > e ? 1 : 0);
      })
    }
  ;


/* returns total of squared differences */ 

var sumSquaredDifferences = function (points, centroids) {

  var sum = 0
    , ps = points.length
    ;

  for (var p = 0; p < ps; p++) {
    var point = points[p]
      , centroid = centroids[point.k]
      , dif_x = pow(point.x - centroid.x, 2)
      , dif_y = pow(point.y - centroid.y, 2)
      ;
    sum += dif_x + dif_y;
  }

  return sum;

};

/* nomalize (0-1) data. Coordinates in original data are altered */

var doNormalize = function (points) {

  var ps = points.length;

  /* get minimum and maximum x */
  points.sort(function (a, b) {
    return a.x - b.x;
  });

  var x_min = points[0].x;
  var x_max = points[ps - 1].x;

  /* get minimum and maximum y */
  points.sort(function (a, b) {
    return a.y - b.y;
  });

  var y_min = points[0].y;
  var y_max = points[ps - 1].y;

  /* normalize */
  for (var p = 0; p < ps; p++) {
    var point = points[p];
    point.x = (point.x - x_min) / (x_max - x_min);
    point.y = (point.y - y_min) / (y_max - y_min);
  }

};

/* k-means++ initialization from https://github.com/cmtt/kmeans-js */

var kmeansplusplus = function (points, ks) {

  var ps = points.length;

  /* determine the amount of tries */
  var D = []
    , ntries = 2 + round(log(ks))
    , centroids = []
    ;

  /* Choose one center uniformly at random from the data points. */
  var p0 = points[floor(random() * ps)];

  centroids.push({
      x: p0.x
    , y: p0.y
    , k: 0
  });

  /* For each data point x, compute D(x), the distance between x and the nearest center that has already been chosen. */
  for (i = 0; i < ps; ++i)
    D[i] = pow(distance(p0, points[i]), 2);

  var Dsum = D.reduce(function(a, b) {
    return a + b;
  });

  /* Choose one new data point at random as a new center, using a weighted probability distribution where a point x is 
    chosen with probability proportional to D(x)2. (Repeated until k centers have been chosen.) */
  for (k = 1; k < ks; ++k) {

    var bestDsum = -1, bestIdx = -1;

    for (i = 0; i < ntries; ++i) {
      var rndVal = floor(random() * Dsum);

      for (var n = 0; n < ps; ++n) {
        if (rndVal <= D[n]) {
          break;
        } else {
          rndVal -= D[n];
        }
      }

      var tmpD = [];
      for (var m = 0; m < ps; ++m) {
        cmp1 = D[m];
        cmp2 = pow(distance(points[m], points[n]), 2);
        tmpD[m] = cmp1 > cmp2 ? cmp2 : cmp1;
      }

      var tmpDsum = tmpD.reduce(function(a, b) {
        return a + b;
      });

      if (bestDsum < 0 || tmpDsum < bestDsum) {
        bestDsum = tmpDsum, bestIdx = n;
      }
    }

    Dsum = bestDsum;

    var centroid = {
        x: points[bestIdx].x
      , y: points[bestIdx].y
      , k: k
    };

    centroids.push(centroid);

    for (i = 0; i < ps; ++i) {
      cmp1 = D[i];
      cmp2 = pow(distance(points[bestIdx], points[i]), 2);
      D[i] = cmp1 > cmp2 ? cmp2 : cmp1;
    }
  }

  /* sort descending if x is energy density */
  centroids.sort(function (a, b) {
    return b.x - a.x;
  });
  
  /* set k === index */
  for (var c = 0, cs = centroids.length; c < cs; c++)
    centroids[c].k = c;

  return centroids;

};

var kmeans = function (points, centroids) {

  var converged = false
    , ks = centroids.length
    , ps = points.length
    ;

  while (!converged) {
    
    var i;
    converged = true;

    /* Prepares the array of sums. */
    var sums = [];
    for (var k = 0; k < ks; k++)
      sums[k] = { x: 0, y: 0, items: 0 };

    /* Find the closest centroid for each point. */
    for (var p = 0; p < ps; ++p) {

      var distances = sortBy(centroids, function (centroid) {
          return distance(centroid, points[p]);
        });

      var closestItem = distances[0];
      var k = closestItem.k;

      /* When the point is not attached to a centroid or the point was attached to some other centroid before,
        the result differs from the previous iteration. */
      if (typeof points[p].k  !== 'number' || points[p].k !== k)
        converged = false;

      /* Attach the point to the centroid */
      points[p].k = k;

      /* Add the points' coordinates to the sum of its centroid */
      sums[k].x += points[p].x;
      sums[k].y += points[p].y;

      ++sums[k].items;
    }

    /* Re-calculate the center of the centroid. */
    for (var k = 0; k < ks; ++k) {
      if (sums[k].items > 0) {
        centroids[k].x = sums[k].x / sums[k].items;
        centroids[k].y = sums[k].y / sums[k].items;
      }
      centroids[k].items = sums[k].items;
    }
  }

};

var get = function (data, options) {

  var ks = options.k
    , runs = options.runs
    , normalize = options.normalize
    , xAttribute = options.xAttribute
    , yAttribute = options.yAttribute
    , points = data
    , result = []
    ;

  if (typeof xAttribute === 'string' && xAttribute.length > 0
    && typeof yAttribute === 'string' && yAttribute.length > 0) {
    /* prepare data: add x, y property */
    for (var p = 0, ps = data.length; p < ps; p++) {
      points[p].x = data[p][xAttribute];
      points[p].y = data[p][yAttribute];
    }  
  }

  if (normalize)
    doNormalize(points);

  for (var run = 0; run < runs; run++) {  

    /* stores result of each run */
    result[run] = { centroids: [], sum: Infinity };
    
    /* inital guess */
    var centroids = kmeansplusplus(points, ks);

    /* store initial centroids from kmeans++ in order to re-run */
    for(var k = 0; k < ks; k++) {
      result[run].centroids[k] = { 
        x: centroids[k].x, 
        y: centroids[k].y
      }
    } 

    /* run kmeans */
    kmeans(points, centroids);

    /* calculate differences */
    result[run].sum = sumSquaredDifferences(points, centroids);
 
  }

  /* find best result */
  result.sort(function (a, b) {
    return a.sum - b.sum; 
  });

  /* re-use initial centroids produced by kmeans++ from best run */
  centroids = [];
  for (var k = 0; k < ks; k++) {
    var centroid = {
        x: result[0].centroids[k].x
      , y: result[0].centroids[k].y
      , k: k
    };
    centroids[k] = centroid;
  }

  /* run again with best initial centroids */
  kmeans(points, centroids);

  return sumSquaredDifferences(points, centroids);

};

return {
  get: get
};

}());
