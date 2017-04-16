delaunay-triangulation
======================

This project provides the functionality for creating a [Delaunay
Triangulation][delaunay] of a given point set. It does so using an
incremental insertion algorithm, which means that it possible to insert
new points into the triangulated net at any time. The whole algorithm is
implemented for points in 3D space but the provided [visualization
applet][applet] works in the plane (i.e., with `z = 0`).

The algorithm is implemented (mostly) as proposed by Adrian Bowyer in
his paper ['Computing Dirichlet Tessellations'][bowyer] (1981).


The Algorithm
-------------

- an initial triangle is formed that *must* contain all points to be
  added in the future and comprises the initial root triangle of the net
- upon insertion of a new point the triangle that contains this point
  is searched in the net of triangles (there must always be one!) --
  this is done using the A*-search algorithm using the distance from
  the new point to the closest of each triangles forming points,
  i.e., the one with the minimum distance to this point, as the
  performance measure
- the found triangle is split into three by incorporation of the new
  point
- the newly created triangles are checked for the Delaunay condition:
  - the circumcircle of each triangle only contains the points in the
    triangle itself, none of its neighbors
- if this condition is violated, it will be fixed by flipping the
  edges of the two triangles under consideration
  - only if a violation was detected, the search for other violated
    triangles continues for neighbors that are farther away than the
    previous one


[delaunay]: https://en.wikipedia.org/wiki/Delaunay_triangulation
[applet]: https://rawgit.com/d-e-s-o/delaunay-triangulation/master/index.html
[bowyer]: https://doi.org/10.1093/comjnl/24.2.162
