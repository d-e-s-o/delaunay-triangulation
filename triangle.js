// triangle.js

/***************************************************************************
 *   Copyright (C) 2012-2024 Daniel Mueller (deso@posteo.net)              *
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
 * @date 06.05.2012
 *
 * This file contains the Triangle class.
 */


/**
 * This variable is used to assign each triangle an unique index.
 */
//DEBUG: var triangleIndex = 0;


/**
 * This function creates a new triangle object. Each such object is formed by three points--its
 * forming points--and contains the distance of its circumcenter to each of the points as well as
 * references to the three neighboring triangles in order to allow for local searches.
 * @param points ([Point]) array of the three forming points to create the triangle from
 * @param neighbors ([Triangle]) array of three the neighboring triangles
 */
function Triangle(points, neighbors)
{
  //DEBUG: this.index     = triangleIndex++;

  this.points    = points.concat([]);
  this.neighbors = neighbors.concat([]);
}

/**
 * @return (Point) center of this triangle
 */
Triangle.prototype.getCenter = function()
{
  if (this.center == null) {
    this.center = calculateCenter(this.points);
  }
  return this.center;
}

/**
 * @return (Point) circumcenter of this triangle
 */
Triangle.prototype.getCircumcenter = function()
{
  if (this.circumcenter == null) {
    this.circumcenter = calculateCircumcentre(this.points);
  }
  return this.circumcenter;
}

/**
 * @return (Number) radius of this triangle's circumcircle
 */
Triangle.prototype.getRadius = function()
{
  if (this.radius == null) {
    this.radius = calculateDistanceSquarePlane(this.getCircumcenter(), this.points[0]);
  }
  return this.radius;
}

/**
 * @param index (Number) index of new point to set
 * @param point (Point) new point to set at the given index
 */
Triangle.prototype.setPoint = function(index, point)
{
  //DEBUG: assert(index != null);
  //DEBUG: assert(point != null);
  //DEBUG: assert(0 <= index && index < this.points.length);

  this.points[index] = point;

  // invalidate cached values
  this.center       = null;
  this.circumcenter = null;
  this.radius       = null;
}

/**
 * @param point (Point) point for which to calculate the distance to this triangle's circumcenter
 * @return (Number) square of distance of the given point to this triangle's circumcenter
 */
Triangle.prototype.distanceToCircumcenter = function(point)
{
  return calculateDistanceSquarePlane(this.getCircumcenter(), point);
}

/**
 * @param point (Point)
 * @return (Number)
 */
Triangle.prototype.distanceToCenter = function(point)
{
  return calculateDistanceSquarePlane(this.getCenter(), point);
}

/**
 * @param point (Point)
 * @return (Boolean) true if this triangle contains the given point, false if not
 */
Triangle.prototype.containsPoint = function(point)
{
  return isPointInTriangle(this, point);
}

/**
 * @return (String) textual representation of this triangle
 */
Triangle.prototype.toString = function()
{
  var string = this.points[0].toString();

  for (var i = 1; i < this.points.length; i++) {
    string += " " + this.points[i].toString();
  }
  return string;

  //DEBUG: var string = "" + this.index + ":";

  //DEBUG: for (var i = 0; i < this.points.length; i++) {
  //DEBUG:   string += " " + this.points[i].toString();
  //DEBUG: }

  //DEBUG: for (var i = 0; i < this.neighbors.length; i++) {
  //DEBUG:   var neighbor = this.neighbors[i];

  //DEBUG:   string += " " + (neighbor != null ? neighbor.index : neighbor);
  //DEBUG: }
  //DEBUG: return string;
}

/**
 * @param points ([Point]) array of three points for which to calculate the circumcenter
 * @return (Point) circumcenter of the given three points
 */
function calculateCircumcentre(points)
{
  //DEBUG: assert(points != null);
  //DEBUG: assert(points.length == 3);
  //DEBUG: assert(points.indexOf(null) < 0);

  var x1 = points[0].x;
  var y1 = points[0].y;
  var z1 = points[0].z;

  var x2 = points[1].x;
  var y2 = points[1].y;
  var z2 = points[1].z;

  var x3 = points[2].x;
  var y3 = points[2].y;
  var z3 = points[2].z;

  // Calculate the x (call it u here) and y (call it v) coordinates of
  // the circumcenter. This formula (and the other math below) was
  // derived using maxima for solving the following system of linear
  // equations (and a bit of post-processing):
  // r^2  = (x1 - u)^2 + (y1 - v)^2
  // r^2  = (x2 - u)^2 + (y2 - v)^2
  // r^2  = (x3 - u)^2 + (y3 - v)^2
  //
  // (%i1) expand(solve([r^2=(x1-u)^2+(y1-v)^2, r^2=(x2-u)^2+(y2-v)^2, r^2=(x3-u)^2+(y3-v)^2], [u, v, r]));
  //
  // Use grind(%o) or string(%o) to make result somewhat more appealing
  // to our use case. Squares can be eliminated via:
  //
  //   s@\([a-z0-9]\+\)\^2@(\1*\1)@g

  var u = -((y2-y1)*(y3*y3)+(-(y2*y2)+(y1*y1)-(x2*x2)+(x1*x1))*y3+y1*(y2*y2)+(-(y1*y1)+(x3*x3)-(x1*x1))*y2+((x2*x2)-(x3*x3))*y1)/((2*x2-2*x1)*y3+(2*x1-2*x3)*y2+(2*x3-2*x2)*y1);
  var v =  ((x2-x1)*(y3*y3)+(x1-x3)*(y2*y2)+(x3-x2)*(y1*y1)+(x2-x1)*(x3*x3)+((x1*x1)-(x2*x2))*x3+x1*(x2*x2)-(x1*x1)*x2)/((2*x2-2*x1)*y3+(2*x1-2*x3)*y2+(2*x3-2*x2)*y1);

  /// @todo comparing floats using '==' is probably not the best idea...
  if (!(points[0].z == points[1].z && points[1].z == points[2].z)) {
    // Having these two values we calculate the parameters r and s of
    // the plane equations.
    // u = x1 + r*x2 + s*x3 and v = y1 + r*y2 + s*y3
    var r = -(-x1*y3+u*y3+x3*(y1-v))/(x3*y2-x2*y3);
    var s =  (-x1*y2+u*y2+x2*(y1-v))/(x3*y2-x2*y3);

    // And using these two values we can actually calculate the z value
    // (called w here).
    var w = z1 + r * z2 + s * z3;
  } else {
    var w = points[0].z;
  }
  // Trivial, isnt it?
  return new Point(u, v, w);
}

/**
 * @param points ([Point]) array of points
 * @return (Point) center (centroid) of the given point set
 */
function calculateCenter(points)
{
  //DEBUG: assert(points != null);

  var x = 0.0;
  var y = 0.0;
  var z = 0.0;
  var n = points.length;

  for (var i = 0; i < n; i++)
  {
    x += points[i].x;
    y += points[i].y;
    z += points[i].z;
  }
  return new Point(x / n, y / n, z / n);
}

/**
 * @param triangle (Triangle) some triangle
 * @param point (Point) some point
 * @return true if the given point is contained in the triangle, false if not
 */
function isPointInTriangle(triangle, point)
{
  //DEBUG: assert(triangle != null);
  //DEBUG: assert(point    != null);
  //DEBUG: assert(triangle.points.length == 3);

  var x = point.x;
  var y = point.y;

  var x1 = triangle.points[0].x;
  var y1 = triangle.points[0].y;
  var x2 = triangle.points[1].x;
  var y2 = triangle.points[1].y;
  var x3 = triangle.points[2].x;
  var y3 = triangle.points[2].y;

  // @todo This formula is pretty much the same as in the last part of
  //       the circumcenter calculation in point.js (except that this
  //       one does an origin correction) - perhaps combine them?
  var u = -(x*(y3-y1)+x1*(y-y3)+x3*(y1-y))/(x1*(y3-y2)+x2*(y1-y3)+x3*(y2-y1))
  var v =  (x*(y2-y1)+x1*(y-y2)+x2*(y1-y))/(x1*(y3-y2)+x2*(y1-y3)+x3*(y2-y1))

  return (u >= 0.0) && (v >= 0.0) && (u + v <= 1.0);
}
