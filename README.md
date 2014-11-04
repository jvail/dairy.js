# dairy.js

dairy.js is a JavaScript library covering routines to simulate dairy cow herds for both productive cows and young stock.

## Features

  * milk yield and solids
  * requirements (different systems)
  * feed evaluation (different systems)
  * intake (INRA)
  * growth and mobilization
  * grouping
  * herd structure
  * diet (simple LP)
  
Examples tested with the latest (09.2014) Firefox & Chrome browser are available at http://jvail.github.io/dairy.js/.

## Scope & Limitations

The library was initially developed to be used in a DSS to simulate low-input and organic dairy herds. Therefore some parts might not be suitable for highly productive cows (e.g. mobilization&reconstitution). Since the DSS's application is located somewhere inbetween science&extension the code contains many empirical functions which are - by nature - limited in scope.  

Potential use cases range from simulation, decision support, education, rapid model prototyping or scientific modeling in the field of agriculture. We tried to keep the code structure as simple as possible to make it easy to re-use, modify only parts and use them in any environment (web, web-worker, Node.js). We welcome any contribution to the library (e.g. adding other ruminants like sheep and goats).

## References

Baldinger, L., Vaillant, J., Zollitsch, W., Rinne, M. (2014) SOLID-DSS - Eine online-Anwendung zur verbesserten 
Abstimmung von Grundfutterangebot und -bedarf auf biologisch wirtschaftenden Low Input Milchviehbetrieben.
In: Wiesinger, K., Cais, K., Obermaier, S. (eds), Angewandte Forschung und Beratung für den ökologischen Landbau in 
Bayern: Öko-Landbau-Tag 2014 am 9. April 2014 in Triesdorf; Tagungsband. LfL, Freising-Weihenstephan, pp. 19-22.

## License

Distributed under the MIT License. See accompanying file LICENSE.

## Acknowledgements

We gratefully acknowledge funding from the European Community´s 7th Framework Programme (FP7/2007-2013) under the grant 
agreement number FP7-266367 (Sustainable organic and low input dairying).
