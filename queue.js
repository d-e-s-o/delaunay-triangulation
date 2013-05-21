// queue.js

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
 *
 * This file contains a priority queue class. It maintains a sorted list of elements, the last of
 * which is the one that is smaller than all others (in term of some comparison function).
 */


/**
 * @param compare function comparing two elements
 */
function Queue(compare)
{
  this.elements = [];
  this.compare  = compare;
}

/**
 * @param element (Object) element to insert
 */
Queue.prototype.insert = function(element)
{
  var index = searchBinary(this.elements, element, this.compare);

  this.elements.splice(index, 0, element);
}

/**
 * @return (Object) object that was just removed
 */
Queue.prototype.pop = function()
{
  //DEBUG: assert(this.elements.length > 0);

  return this.elements.pop();
}

/**
 * @return (Boolean) true if the list is empty, false otherwise
 */
Queue.prototype.isEmpty = function()
{
  return this.elements.length == 0;
}

/**
 * @param elements ([Object]) some array of objects
 * @param element (Object) some object
 * @param compare (Function) a comparison function taking two objects as parameters
 * @return (Number) index at which to insert the given element in order to preserve correct ordering
 */
function searchBinary(elements, element, compare)
{
  var begin = 0;
  var end   = elements.length;
  var i     = 0;
  var j     = 0;

  if (elements.length <= 0) {
    return 0;
  }

  // only continue search if the area spans more than one entry
  while (true) {
    j = i;
    i = Math.floor(begin + (end - begin) / 2);

    var c = compare(element, elements[i]);

    if (c > 0) {
      begin = i;
    } else if (c < 0) {
      end = i;
    } else {
      return i;
    }

    if (i == j) {
      return c < 0 ? i : i + 1;
    }
  }
}

//DEBUG: function testSearchBinary()
//DEBUG: {
//DEBUG:   var compare = function(n1, n2) { return n1 - n2; }
//DEBUG:   var array1  = [0, 2, 4, 6, 8];
//DEBUG:   var array2  = [2];
//DEBUG:
//DEBUG:   assert(searchBinary(array1, -1, compare) == 0);
//DEBUG:   assert(searchBinary(array1, 1,  compare) == 1);
//DEBUG:   assert(searchBinary(array1, 3,  compare) == 2);
//DEBUG:   assert(searchBinary(array1, 5,  compare) == 3);
//DEBUG:   assert(searchBinary(array1, 7,  compare) == 4);
//DEBUG:   assert(searchBinary(array1, 9,  compare) == 5);
//DEBUG:   assert(searchBinary(array2, 1,  compare) == 0);
//DEBUG:   assert(searchBinary(array2, 3,  compare) == 1);
//DEBUG: }
