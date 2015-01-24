# dairy.js

dairy.js is a JavaScript library covering routines to simulate dairy cow herds for both productive cows and young stock.

## Features

  * milk yield and solids
  * requirements (different systems: DE, FI, FR, GB)
  * feed evaluation (different systems: DE, FI, FR, GB)
  * intake (INRA)
  * growth and mobilization
  * grouping
  * herd structure
  * diet (LP/glpk.js)
  
Examples tested with the latest (09.2014) Firefox & Chrome browser are available at http://jvail.github.io/dairy.js/. We welcome any contribution to the library (e.g. adding other ruminants like sheep and/or other evaluation systems).

## Scope & Limitations

The library was initially developed to be used in a DSS to simulate low-input and organic dairy herds. Therefore some parts (e.g. mobilization&reconstitution) might not be suitable for highly productive cows. Since the DSS's application is located somewhere inbetween science&extension the code contains many empirical functions which are - by nature - limited in scope.  

Potential use cases range from simulation, decision support, education, rapid model prototyping or scientific modeling in the field of agriculture. We tried to keep the code structure as simple as possible to make it easy to re-use, modify only parts and use them in any environment (web, web-worker, Node.js).

## References

Vaillant, J. and Baldinger, L. 2014.
[dairy.js - an open-source JavaScript library for simulation of dairy cow herds and rapid model prototyping.](https://github.com/jvail/dairy.js/raw/master/doc/Vaillant_Poster_LiveM_Bilbao.pdf)
Poster presentation at the International Livestock Modelling and Research Colloquium, 14-16 October, Bilbao, Spain.
 
Baldinger, L., Vaillant, J., Zollitsch, W. and Rinne, M. 2014.
Making a decision support system for dairy farmers usable throughout Europe - the challenge of feed evaluation.
Oral presentation at the International Livestock Modelling and Research Colloquium, 14-16 October, Bilbao, Spain.

## License

Distributed under the MIT License. See accompanying file LICENSE.

## Acknowledgements

We gratefully acknowledge funding from the European Community´s 7th Framework Programme (FP7/2007-2013) under the grant 
agreement number FP7-266367 (Sustainable organic and low input dairying).
