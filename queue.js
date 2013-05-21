// queue.js

/***************************************************************************
 *   Copyright (C) 2012-2013 Daniel Mueller (deso@posteo.net)              *
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
 * This file contains a priority queue class. It is implemented as a
 * binary heap using a user supplied comparison function for ordering
 * elements. A special property useful for easing (and thereby speeding
 * up) index calculations is leaving the first element of the array used
 * for implementing the heap untouched such that the actual first heap
 * element is located at index one.
 */


/**
 * @param compare function comparing two elements
 */
function Queue(compare)
{
  this.elements = [null];
  this.compare  = compare;
}

/**
 * @param element (Object) element to insert
 */
Queue.prototype.insert = function(element)
{
  var size = this.elements.length;
  this.elements.push(element);
  this.cascadeUp(size);
}

/**
 * @return (Object) object that was just removed
 */
Queue.prototype.pop = function()
{
  //DEBUG: assert(this.elements.length > 1);

  // The first element we are interested in is located at index 1; we
  // replace it with the last element and then we cascade that down.
  var value = this.elements[1];
  this.elements[1] = this.elements.pop();
  this.cascadeDown(1);
  return value;
}

/**
 * @return (Boolean) true if the list is empty, false otherwise
 */
Queue.prototype.isEmpty = function()
{
  //DEBUG: assert(this.elements.length >= 1);
  return this.elements.length <= 1;
}


/**
 * @param index (Number) index of element for which to calculate the
 *        parent index
 * @return (Number) index of parent element for element with given index
 */
function parentIndex(index)
{
  return Math.floor(index / 2);
}

/**
 * @param index (Number) index of element for which to calculate the
 *        left child index
 * @return (Number) index of left child element for element with given
 *         index
 */
function leftChildIndex(index)
{
  return index * 2;
}

/**
 * @param index (Number) index of element for which to calculate the
 *        right child index
 * @return (Number) index of right child element for element with given
 *         index
 */
function rightChildIndex(index)
{
  return index * 2 + 1;
}

/**
 * @param lhs (Number) index of first element
 * @param rhs (Number) index of second element
 * @return (Boolean) true if the first element is smaller than the last
 *         one
 */
Queue.prototype.less = function(lhs, rhs)
{
  //DEBUG: assert(0 < lhs && lhs < this.elements.length);
  //DEBUG: assert(0 < rhs && rhs < this.elements.length);
  return this.compare(this.elements[lhs], this.elements[rhs]) < 0;
}

/**
 * @param lhs (Number) index of first object to swap with second
 * @param rhs (Number) index of second object to swap with first
 */
Queue.prototype.swap = function(lhs, rhs)
{
  //DEBUG: assert(0 < lhs && lhs < this.elements.length);
  //DEBUG: assert(0 < rhs && rhs < this.elements.length);

  var element = this.elements[lhs];
  this.elements[lhs] = this.elements[rhs];
  this.elements[rhs] = element;
}

/**
 * @param index (Number) index of element to cascade up
 */
Queue.prototype.cascadeUp = function(index)
{
  //DEBUG: assert(0 < index && index < this.elements.length);

  while (index > 1) {
    var p = parentIndex(index);

    if (this.less(index, p)) {
      this.swap(index, p);
      index = p;
    } else {
      break;
    }
  }
}

/**
 * @param index (Number)
 */
Queue.prototype.cascadeDown = function(index)
{
  var size = this.elements.length - 1;

  while (true) {
    var left_child  = leftChildIndex(index);
    var right_child = rightChildIndex(index);
    var min_child;

    if (right_child <= size) {
      // If the right child index is valid then the left child index is
      // valid as well.
      min_child = this.less(left_child, right_child)
                ? left_child : right_child;
    } else if (left_child <= size) {
      min_child = left_child;
    } else {
      break;
    }

    if (!this.less(index, min_child)) {
      this.swap(min_child, index);
      index = min_child;
    } else {
      break;
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
