dairy.js
========

dairy.js is a JavaScript library covering routines to simulate dairy cow herds for both productive cows and 
(still under development) young stock:

  * milk yield and solids
  * requirements (different systems)
  * feed evaluation (different systems)
  * intake (INRA)
  * growth and mobilization
  * grouping
  * herd structure
  * diet (simple LP)

Potential use cases range from simulation, decision support, rapid model prototyping or scientific modeling in the field of agriculture.
We tried to keep the code structure as simple as possible to make it easy to re-use, modify only parts and use them in any environment (web, web-worker, node). The naming of variables, functions and parameters sometimes seems odd: We tried to use (if possible and readable) the naming used in the original publication in order to make it as easy as possible to track errors and compare the implementation with the original math. This results unfortunately in mixing several conventions (camel case, underline, acronyms etc.).

We welcome any contribution to the library (e.g. adding other ruminants like sheep and goats). Please use the structure and coding style established and provide a maximum of transparency about the source of code and models you implemented and what you might have changed.

Any publication for which dairy.js or a derived work is used must include an a reference to the article:

Baldinger, L., Vaillant, J., Zollitsch, W., Rinne, M. (2014) SOLID-DSS - Eine online-Anwendung zur verbesserten 
Abstimmung von Grundfutterangebot und -bedarf auf biologisch wirtschaftenden Low Input Milchviehbetrieben.
In: Wiesinger, K., Cais, K., Obermaier, S. (eds), Angewandte Forschung und Beratung für den ökologischen Landbau in 
Bayern: Öko-Landbau-Tag 2014 am 9. April 2014 in Triesdorf; Tagungsband. LfL, Freising-Weihenstephan, pp. 19-22.

##LICENSE

Distributed under the MIT License. See accompanying file LICENSE or copy at http://opensource.org/licenses/MIT

##ACKNOWLEDGEMENTS

We gratefully acknowledge funding from the European Community´s 7th Framework Programme (FP7/2007-2013) under the grant 
agreement number FP7-266367 (Sustainable organic and low input dairying).
