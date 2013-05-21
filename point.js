// point.js

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
 * @date 06.05.2012
 */


/**
 * This function creates a simple point for use in 3D space.
 * @param x (Number) x coordinate of point
 * @param y (Number) y coordinate of point
 * @param z (Number) z coordinate of point
 */
function Point(x, y, z)
{
  this.x = x;
  this.y = y;
  this.z = z;
}

/**
 * @return (String) textual representation of this point
 */
Point.prototype.toString = function()
{
  return "(" + this.x.toPrecision(4) + "|" + this.y.toPrecision(4) + "|" + this.z.toPrecision(4) + ")";
}

/**
 * @param p1 (Point) some point
 * @param p2 (Point) some point
 * @return (Number) square of distance between the two points projected
 *         into the x-y plane (z coordinate is ignored)
 * @note for most code used here we only compare distances, so it does
 *       not matter if we return a squared distance in both cases or
 *       take the square root; as the latter is an expensive operation
 *       this function does not use it
 * @note although we are working in R3, i.e., in three dimensions, lots
 *       of operations actually project the stuff into the x-y plane -
 *       which is exactly what we do here as well
 */
function calculateDistanceSquarePlane(p1, p2)
{
  //DEBUG: assert(p1 != null);
  //DEBUG: assert(p2 != null);

  var x = p2.x - p1.x;
  var y = p2.y - p1.y;

  return x * x + y * y;
}
