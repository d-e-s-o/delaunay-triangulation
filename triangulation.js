// triangulation.js

/***************************************************************************
 *   Copyright (C) 2012 Daniel Mueller (deso@posteo.net)                   *
 *                                                                         *
 *   This program is free software: you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation, either version 3 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   You should have received a copy of the GNU General Public License     *
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>. *
 ***************************************************************************/

/**
 * @author Daniel Mueller
 * @date 07.05.2012
 *
 * This file provides the functionality for creating a Delaunay
 * triangulation of a given point set. It does so using an incremental
 * insertion algorithm, which means that it possible to insert new
 * points into the triangulated net at any time. The whole algorithm is
 * implemented for points in 3D space.
 *
 * The algorithm is implemented (mostly) as proposed by Adrian Bowyer in
 * his paper 'Computing Dirichlet Tessellations' (1981).
 *
 * Data structure:
 * - net of triangles, each contains references to the neighboring
 *   triangles
 * - the net is represented simply by a single root node, which is
 *   basically the triangle that contained the last point that was
 *   inserted (for improved locality)
 * - constraints:
 *   - the points in each triangle are given in clockwise order
 *   - neighbor[0] is the one that is adjacent to points[0] and points[1]
 *   - neighbor[1] is the one that is adjacent to points[1] and points[2]
 *   - neighbor[2] is the one that is adjacent to points[2] and points[0]
 *
 * Algorithm:
 * - an initial triangle is formed that _must_ contain all points to be
 *   added in the future (with unlimited precision values this is easily
 *   achievable, with the fixed precision stuff provided by javascript
 *   one has to pre-calculate these values or use known upper bounds for
 *   the edge points) and comprises the initial root triangle of the net
 * - upon insertion of a new point the triangle that contains this point
 *   is searched in the net of triangles (there must always be one!) -
 *   this is done using the A*-search algorithm using the distance from
 *   the new point to the closest of each triangles forming points,
 *   i.e., the one with the minimum distance to this point, as the
 *   performance measure
 * - the found triangle is split into three by incorporation of the new
 *   point
 * - the newly created triangles are checked for the Delaunay condition:
 *   - the circumcircle of each triangle only contains the points in the
 *     triangle itself, none of its neighbors
 * - if this condition is violated, it will be fixed by flipping the
 *   edges of the two triangles under consideration
 *   - only if a violation was detected, the search for other violated
 *     triangles continues for neighbors that are farther away than the
 *     previous one
 *
 * Assumptions:
 * - no two points to insert lie above each other, i.e., no two points
 *   differ only in their z coordinate
 *
 * @see Triangle
 * @see Point
 *
 * @note When a point that is to be inserted lies right on the edge of
 *       an existing triangle the result looks a bit weired, i.e., it
 *       seems as if there is a connection to a non existing point,
 *       however, there are still three triangles created; one could
 *       think about only creating two triangles in this case - but I
 *       guess this does not make that much sense.
 */



/**
 * Delaunay-Triangulation
 * @param min_x (Number) minimum x value of all future points to be inserted
 * @param max_x (Number) maximum x value of all future points to be inserted
 * @param min_y (Number) minimum y value of all future points to be inserted
 * @param max_y (Number) maximum y value of all future points to be inserted
 */
function Delaunay(min_x, max_x, min_y, max_y)
{
  //DEBUG: assert(min_x != null);
  //DEBUG: assert(max_x != null);
  //DEBUG: assert(min_y != null);
  //DEBUG: assert(max_y != null);

  // We need an initial triangle that contains all future points to be
  // inserted; the algorithm is as follows:
  // - the values passed in can be used to create a rectangle that
  //   contains all points
  // - we calculate the center of this rectangle (center_x and center_y)
  // - we also calculate the side lengths of this rectangle (rectangle_a
  //   and rectangle_b)
  // - we want to get the radius of the cirumcircle of the rectangle,
  //   i.e., the distance from the center to one of its forming points
  // - this radius is not only the radius of the rectangle's
  //   circumcircle, but also the radius of the incircle of the
  //   containing triangle
  // - this triangle is an equilateral triangle, i.e., all sides are of
  //   equal length
  // - we can calculate its side length as well as its height
  // - from that we create the three points forming the initial triangle
  var slack       = 1.5;
  var center_x    = (min_x + max_x) / 2;
  var center_y    = (min_y + max_y) / 2;
  var rectangle_a = max_x - min_x;
  var rectangle_b = max_y - min_y;
  var radius      = Math.sqrt(rectangle_a*rectangle_a + rectangle_b*rectangle_b) / 2;
  var side        = 6.0 * radius * slack / Math.sqrt(3.0);
  var height      = side * Math.sqrt(3.0) / 2;

  this.point1 = new Point(center_x - side/2, center_y - radius, 0);
  this.point2 = new Point(center_x,          center_y + height, 0);
  this.point3 = new Point(center_x + side/2, center_y - radius, 0);

  // Form an initial triangle that is meant to contain all points that
  // might be inserted later on.
  this.root   = new Triangle([this.point1, this.point2, this.point3], [null, null, null]);
  this.search = 0;
}

/**
 * @param points ([Point]) new points to insert
 * @see Delaunay.getTriangles
 */
Delaunay.prototype.insert = function(points)
{
  //DEBUG: assert(points != null);
  //PROFILE: console.profile();

  for (var i = 0; i < points.length; i++) {
    // Take a point out of the array, search for a triangle whose
    // circumcenter contains this point. There has to be at least one
    // triangle that contains the given point, because on initialization
    // we created a triangle that has to contain all points to be
    // inserted in the future.
    var point    = points[i];
    var triangle = findContainingTriangle(this.search++, this.root, point);

    if (triangle != null) {
      // replace the found triangle with new ones based on the deleted one
      this.root = splitTriangle(triangle, point);
    } else {
      console.log("no triangle contains the given point: " + point.toString());
    }
  }

  //PROFILE: console.profileEnd();
  //DEBUG: console.log("done");
}

/**
 * @return ([Triangle]) array of triangles triangulated so far
 */
Delaunay.prototype.getTriangles = function()
{
  return this.collectTriangles(this.search++, this.root);
}

/**
 * This method iteratively collects all triangulated triangles.
 * @param search (Number) current search identifier
 * @param root (Triangle) root triangle to start collection at
 * @return ([Triangle]) array of all triangulated triangles
 * @note it is important to not make this method work recursively but
 *       iteratively, as the recursion depth can be significant for
 *       large triangle counts, causing stack overflows
 */
Delaunay.prototype.collectTriangles = function(search, root)
{
  var triangles = [];

  // first we need to search for a valid root triangle to add to the list
  this.addRoot(search, triangles, root);

  // we then expand triangles in the list and add all their neighbors
  for (var i = 0; i < triangles.length; i++) {
    this.addNeighbors(search, triangles, triangles[i]);
  }
  return triangles;
}

/**
 * This method recursively searches for a triangle to start the triangle
 * collection with.
 * @param search (Number) current search identifier
 * @param triangles ([Triangle]) array of triangles to add the found
 *        root triangle to
 * @param root (Triangle) some triangle to start the search for a valid
 *        root triangle at
 * @return (Boolean) true if a valid root was added to 'triangles',
 *         false if not
 * @note in contrast to a recursive version of collectTriangles employed
 *       before, the recursion depth for this method should be bounded
 */
Delaunay.prototype.addRoot = function(search, triangles, root)
{
  if (this.addTriangle(search, triangles, root)) {
    return true;
  }

  if (root != null) {
    for (var i = 0; i < root.neighbors.length; i++) {
      var neighbor = root.neighbors[i];

      if (neighbor != null &&
          neighbor.search != search &&
          this.addRoot(search, triangles, neighbor)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * @param search (Number) current search identifier
 * @param triangles ([Triangle]) array of triangles to which to add the
 *        given triangle's neighbors
 * @param triangle (Triangle) triangle whose neighbors to add to
 *        'triangles'
 */
Delaunay.prototype.addNeighbors = function(search, triangles, triangle)
{
  //DEBUG: assert(triangle != null);

  for (var i = 0; i < triangle.neighbors.length; i++) {
    this.addTriangle(search, triangles, triangle.neighbors[i]);
  }
}

/**
 * @param search (Number) current search identifier
 * @param triangles ([Triangle]) array of triangles to which 'triangle'
 *        is to be added
 * @param triangle (Triangle) triangle to add to 'triangles'
 * @return (Boolean) true if 'triangle' was added to 'triangles', false
 *         if not
 */
Delaunay.prototype.addTriangle = function(search, triangles, triangle)
{
  if (triangle != null && triangle.search != search) {
    triangle.search = search;

    // ignore all triangles that contain one of the initial forming points
    if (triangle.points.indexOf(this.point1) < 0 &&
        triangle.points.indexOf(this.point2) < 0 &&
        triangle.points.indexOf(this.point3) < 0) {
      triangles.push(triangle);
      return true;
    }
  }
  return false;
}

/**
 * This function compares two triangles, 'triangle1' and 'triangle2',
 * based on a given point 'point'. The point acts as a reference and the
 * triangle that contains the forming point that is closest to the given
 * point is considered to be the smaller of the two triangles.
 * @param point (Point) point to compare the given triangles to
 * @param triangle1 (Triangle) first triangle
 * @param triangle2 (Triangle) second triangle
 * @return (Number) value less than 0 if triangle1 is "less" than
 *         triangle2, value greater than 0 if it is "greater", or 0 if
 *         both are equal
 */
function compareTriangles(point, triangle1, triangle2)
{
  //DEBUG: assert(point != null);
  //DEBUG: assert(triangle1 != null);
  //DEBUG: assert(triangle2 != null);
  return minimalDistance(point, triangle1) - minimalDistance(point, triangle2);
}

/**
 * This function calculates the distance of the given point to the
 * closest of the given triangle's forming points.
 * @param point (Point) a point
 * @param triangle (Triangle) a triangle
 * @return (Number) distance from 'point' to the closest of 'triangle's
 *         forming points
 */
function minimalDistance(point, triangle)
{
  //DEBUG: assert(triangle != null);

  var minimal = calculateDistanceSquarePlane(point, triangle.points[0]);

  for (var i = 1; i < triangle.points.length; i++) {
    var distance = calculateDistanceSquarePlane(point, triangle.points[i]);

    if (distance < minimal) {
      distance = minimal;
    }
  }
  return minimal;
}

/**
 * This function searches the triangle net spanned by 'root' for a
 * triangle that contains the given point 'point'.
 * @param search (Number) current search identifier
 * @param root (Triangle) some triangle to start the search at
 * @param point (Point) some point
 * @return (Triangle) triangle which contains the given point or null if
 *         none was found @note the search is performed using the
 *         A*-algorithm
 */
function findContainingTriangle(search, root, point)
{
  //DEBUG: assert(search != null);
  //DEBUG: assert(point  != null);

  if (!(root != null && root.search != search)) {
    return null;
  }

  var queue;

  queue = new Queue(function(x, y){ return compareTriangles(point, x, y) });
  queue.insert(root);

  while (!queue.isEmpty()) {
    // get next triangle that is closest to 'point' and check it
    var triangle = queue.pop();

    // if it contains the point we are done obviously
    if (triangle.containsPoint(point)) {
      return triangle;
    }

    // otherwise we expand it, i.e., add all valid neighbors as possible candidates to check
    for (var i = 0; i < triangle.neighbors.length; i++) {
      var neighbor = triangle.neighbors[i];

      if (neighbor != null && neighbor.search != search) {
        neighbor.search = search;
        queue.insert(neighbor);
      }
    }
  }
  return null;
}

/**
 * @param triangle (Triangle) triangle that is to be replaced by the
 *        newly created triangles
 * @param point (Point) point that is to be inserted into the triangle
 *        net
 * @return (Triangle) one of the newly created triangles that should
 *         serve as the new root
 */
function splitTriangle(triangle, point)
{
  //DEBUG: assert(triangle != null);
  //DEBUG: assert(point    != null);

  // Copy the arrays in order to not modify any data that might be used
  // later.
  var points    = triangle.points.concat([]);
  var neighbors = triangle.neighbors.concat([]);

  // First create three new triangles out of the given one, each spanned
  // by three different points given.
  var triangle1 = new Triangle([points[0], points[1], point    ], [null, null, null]);
  var triangle2 = new Triangle([point,     points[1], points[2]], [null, null, null]);
  var triangle3 = new Triangle([points[0], point,     points[2]], [null, null, null]);

  // Next set the neighboring triangles:
  // - each of the three is neighbor to the other two newly created ones
  // - each of the three is also neighbor to the nearest of the
  //   neighbors of the given triangle
  triangle1.neighbors[0] = neighbors[0];
  triangle1.neighbors[1] = triangle2;
  triangle1.neighbors[2] = triangle3;
  replaceNeighbor(triangle1.neighbors[0], triangle, triangle1);

  triangle2.neighbors[0] = triangle1;
  triangle2.neighbors[1] = neighbors[1];
  triangle2.neighbors[2] = triangle3;
  replaceNeighbor(triangle2.neighbors[1], triangle, triangle2);

  triangle3.neighbors[0] = triangle1;
  triangle3.neighbors[1] = triangle2;
  triangle3.neighbors[2] = neighbors[2];
  replaceNeighbor(triangle3.neighbors[2], triangle, triangle3);

  // It is possible that the delaunay condition of adjacent triangles is
  // now violated - find and fix these ones.
  findAndFixViolatedTriangles(triangle1);
  findAndFixViolatedTriangles(triangle2);
  findAndFixViolatedTriangles(triangle3);

  return triangle1;
}

/**
 * This function replaces old neighbor 'oldNeighbor' in 'triangle' with
 * the new neighbor 'newNeighbor'.
 * @param triangle (Triangle)
 * @param oldNeighbor (Triangle)
 * @param newNeighbor (Triangle)
 */
function replaceNeighbor(triangle, oldNeighbor, newNeighbor)
{
  //DEBUG: assert(oldNeighbor != null);

  if (triangle != null) {
    var index = triangle.neighbors.indexOf(oldNeighbor);
    //DEBUG: assert(index >= 0);

    triangle.neighbors[index] = newNeighbor;
  }
}

/**
 * This function searches the neighbors of 'triangle' and checks wether
 * each of their points fulfils the Delaunay condition. If one violates
 * it, this is corrected.
 * @param first (Triangle) the initial triangle
 * @param triangle (Triangle) the triangle to check
 */
function findAndFixViolatedTriangles(triangle)
{
  //DEBUG: assert(triangle != null);

  for (var i = 0; i < triangle.neighbors.length; ) {
    var neighbor = triangle.neighbors[i];

    if (neighbor != null && investigateAndFixTriangle(triangle, neighbor)) {
      // We just fixed a triangle. The neighborhood might have changed
      // so we start all over.
      findAndFixViolatedTriangles(neighbor);
      i = 0;
    } else {
      i++;
    }
  }
}

/**
 * @param triangle (Triangle) some triangle
 * @param neighbor (Triangle) some neighbor of the given triangle
 * @return (Boolean) true if the given triangle did not fulfil the
 *         Delaunay condition and was fixed, false if everything was
 *         okay
 */
function investigateAndFixTriangle(triangle, neighbor)
{
  //DEBUG: assert(triangle != null);
  //DEBUG: assert(neighbor != null);
  //DEBUG: assert(triangle.neighbors[0] == neighbor ||
  //DEBUG:        triangle.neighbors[1] == neighbor ||
  //DEBUG:        triangle.neighbors[2] == neighbor);

  for (var i = 0; i < neighbor.points.length; i++) {
    var distance = triangle.distanceToCircumcenter(neighbor.points[i]);
    var radius   = triangle.getRadius();

    // @note It is important to compare the values using some slack
    //       value and not use '<' operator directly, because due to the
    //       calculations performed before and the values having only
    //       limited precision, we might run into problems otherwise as
    //       points might be detected as contained within the
    //       circumcenter but actually are not.
    if (strictlyLessThan(distance, radius)) {
      // Fix it.
      flip(triangle, neighbor);
      return true;
    }
  }
  return false;
}

/**
 * @param x (Number) some number
 * @param y (Number) some number
 * @return (Boolean) true if 'x' is strictly less (with some slack) than
 *         'y', false otherwise
 */
function strictlyLessThan(x, y)
{
  return x + 0.00001 * Math.abs(x) < y;
}

/**
 * This function flips the shared edge of the two given triangles.
 * Although this appears to be a trivial matter at first glance it is
 * highly complex due to the data structure employed. In order to
 * understand this you will probably have to use pen and paper ;)
 * @param triangle1 (Triangle) first triangle
 * @param triangle2 (Triangle) second triangle
 */
function flip(triangle1, triangle2)
{
  // Each triangle is made up of three points and in this case two of
  // them are shared, because the triangles must have a common edge --
  // we search for the indices of the points that are *not* shared
  // between the two.
  var index1 = findNotContainedPoint(triangle1.points, triangle2.points);
  var index2 = findNotContainedPoint(triangle2.points, triangle1.points);

  //DEBUG: assert(index1 != null);
  //DEBUG: assert(index2 != null);
  //DEBUG: assert(0 <= index1 && index1 <= 2);
  //DEBUG: assert(0 <= index2 && index2 <= 2);

  //DEBUG: console.log("flipping: " + triangle1 + " with " + triangle2);

  var swapIndex1 = (index1 + 1) % 3;
  var swapIndex2 = findRemainingIndex(triangle2.points, triangle2.points[index2], triangle1.points[swapIndex1]);

  // The actual edge flip is pretty simple.
  triangle1.setPoint(swapIndex1, triangle2.points[index2]);
  triangle2.setPoint(swapIndex2, triangle1.points[index1]);

  // Backup the neighbors of the triangles (actually we only need
  // oldNeighbors1 but for orthogonality we copy both).
  var oldNeighbors1 = triangle1.neighbors.concat([]);
  var oldNeighbors2 = triangle2.neighbors.concat([]);

  // Calculate the indices of the neighbors that need to be updated.
  var index11 = (swapIndex1 + 2) % 3;
  var index12 = swapIndex1;
  var index21 = (swapIndex2 + 2) % 3;
  var index22 = swapIndex2;

  // Fix the references to (and from) other neighboring triangles.
  replaceNeighbor(triangle1.neighbors[index11], triangle1, triangle2);
  triangle1.neighbors[index11] = triangle2;
  triangle1.neighbors[index12] = oldNeighbors2[index2];

  replaceNeighbor(triangle2.neighbors[index21], triangle2, triangle1);
  triangle2.neighbors[index21] = triangle1;
  triangle2.neighbors[index22] = oldNeighbors1[index1];

  //DEBUG: console.log("done:     " + triangle1 + " with " + triangle2);
}

/**
 * This function can be used to search for an element in the first array
 * that is not part of the second array.
 * @param points1 ([Point]) some array of points
 * @param points2 ([Point]) some array of points
 * @return (Number) index of found element in first array that was not
 *         found in the second one or null if none such element was
 *         found
 */
function findNotContainedPoint(points1, points2)
{
  //DEBUG: assert(points1.length == 3);
  //DEBUG: assert(points2.length == 3);

  for (var i = 0; i < points1.length; i++) {
    var index = points2.indexOf(points1[i]);

    if (index < 0) {
      return i;
    }
  }
  return null;

  //DEBUG: var result = null;

  //DEBUG: for (var i = 0; i < points1.length; i++) {
  //DEBUG:   var index = points2.indexOf(points1[i]);

  //DEBUG:   if (index < 0) {
  //DEBUG:     assert(result == null);
  //DEBUG:     result = i;
  //DEBUG:   }
  //DEBUG: }
  //DEBUG: return result;
}

/**
 * @param points ([Point]) some array of (three) points
 * @param point1 (Point) some point
 * @param point2 (Point) some point
 * @return (Number) first index of element that does neither equal
 *         'point1' nor 'point2'
 */
function findRemainingIndex(points, point1, point2)
{
  //DEBUG: assert(points != null);
  //DEBUG: assert(point1 != null);
  //DEBUG: assert(point2 != null);
  //DEBUG: assert(points.length == 3);

  for (var i = 0; i < points.length; i++) {
    if (points[i] != point1 && points[i] != point2) {
      return i;
    }
  }
  return null;
}
