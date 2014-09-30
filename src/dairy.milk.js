/*
  Calculate milk yield and solids adjusted for parity requiring estimates for parameters of Wood's lactation curve.

  REFERENCES

  Wood, P.D.P. 1980.
  Breed variations in the shape of the lactation curve of cattle and their implications for efficiency,
  Animal Science, Volume 31, Issue 02, 1980, pp 133-141

  Tyrrell, H.F. et al. 1965.
  Prediction of the Energy Value of Cow's Milk,
  Journal of Dairy Science, Volume 48, Issue 9, 1215 - 1223

  DLG-Information 1/2006.
  Schätzung der Futteraufnahme bei der Milchkuh,
  DLG-Arbeitskreis Futter und Fütterung

  LICENSE

  Copyright 2014 Jan Vaillant   <jan.vaillant@zalf.de>
  Copyright 2014 Lisa Baldinger <lisa.baldinger@boku.ac.at>

  Distributed under the MIT License. See accompanying file LICENSE or copy at http://opensource.org/licenses/MIT

  Any publication for which this file or a derived work is used must include an a reference to the article:

  Baldinger, L., Vaillant, J., Zollitsch, W., Rinne, M. (2014) SOLID-DSS - Eine online-Anwendung zur verbesserten 
  Abstimmung von Grundfutterangebot und -bedarf auf biologisch wirtschaftenden Low Input Milchviehbetrieben.
  In: Wiesinger, K., Cais, K., Obermaier, S. (eds), Angewandte Forschung und Beratung für den ökologischen Landbau in 
  Bayern: Öko-Landbau-Tag 2014 am 9. April 2014 in Triesdorf; Tagungsband. LfL, Freising-Weihenstephan, pp. 19-22.
*/
 
var dairy = dairy || {};

dairy.milk = (function () {

var pow = Math.pow
  , exp = Math.exp
  ;

function is_null_or_undefined (x) {
  return x === null || x === undefined;
}

/* 
  DLG (1/2006), Tabelle 7
  
  Typical lactation milk yield data per yield level [day, milk yield]. May be used to estimate Wood's lactation curve 
  parameters (e.g. with lmfit).
*/
var data = {
  '6500': [
    [20 , 29],
    [40 , 30],
    [60 , 28],
    [100, 25],
    [150, 22],
    [200, 19],
    [250, 15],
    [300, 13],
    [350, 12]
  ],
  '7500': [
    [20 , 32],
    [40 , 33],
    [60 , 32],
    [100, 29],
    [150, 26],
    [200, 22],
    [250, 18],
    [300, 15],
    [350, 13]
  ],
  '8500': [
    [20 , 36],
    [40 , 37],
    [60 , 36],
    [100, 32],
    [150, 28],
    [200, 25],
    [250, 21],
    [300, 17],
    [350, 15]
  ],
  '9500': [
    [20 , 39],
    [40 , 40],
    [60 , 39],
    [100, 36],
    [150, 32],
    [200, 28],
    [250, 24],
    [300, 19],
    [350, 16]
  ],
  '10500': [
    [20 , 42],
    [40 , 44],
    [60 , 43],
    [100, 39],
    [150, 35],
    [200, 31],
    [250, 27],
    [300, 21],
    [350, 18]
  ],
  '11500': [
    [20 , 45],
    [40 , 48],
    [60 , 47],
    [100, 43],
    [150, 38],
    [200, 35],
    [250, 30],
    [300, 24],
    [350, 21]
  ]
};

/*
  Wood (1980)

  Prediction of milk yield adjusted for parity. Parameter adjustment (b & c) from p.137, table 4.

  Milk production potential (a parameter per parity) is scaled proportionally subject to the cow's size (BW / MBW).

  milk  [kg]      Milk yield in week n
  a     [-]       Scale factor 
  b     [-]       Shape constant
  c     [-]       Shape constant
  n     [week]    Week of lactation
  p     [#]       Parity, defaults to parity > 2
  BW    [kg]      Actual body weight
  MBW   [kg]      Mature body weight
*/

var milk = function (a, b, c, n, p, BW, MBW) {

  var milk = 0;

  // if (is_null_or_undefined(scale))
  //   scale = 0.75;

  if (p === 1)
    milk = BW / MBW * a * pow(n, b - 0.0374) * exp((c + 0.0092) * n);
  else if (p === 2)
    milk = BW / MBW * a * pow(n, b - 0.0253) * exp((c + 0.0000) * n);
  else /* defaults to parity > 2 */
    milk = a * pow(n, b + 0.0460) * exp((c - 0.0052) * n);

  return milk; 

};

/*
  Calculate Wood a parameter for fat.

  We don't want to mess around with integrating incomplete gamma functions. Therefore we approximate with a numeric
  integration and calculate the a parameter from 

    fat_average = a * (integrate pow(n, b) * exp(c * n) for n from 0 to 305/7) / 305/7
    a = fat_average / ((integrate pow(n, b) * exp(c * n) for n from 0 to 305/7) / 305/7)

  If we calculate a here we only need % fat as an input parameter which is usually available.

  fat_a   [%]     Wood fat scale parameter
  fat_avg [%]     fat average
  p       [#]     Parity, defaults to parity > 2
  n_mx    [week]  Week of maximum milk yield
*/

var fat_a = function (fat_avg, p, n_mx) {

  return fat_avg / fat_avg_305(1, p, n_mx);

};

/*
  Calculate Wood a parameter for protein.

  We don't want to mess around with integrating incomplete gamma functions. Therefore we approximate with a numeric
  integration and calculate the a parameter from 

    protein_average = a * (integrate pow(n, b) * exp(c * n) for n from 0 to 305/7) / 305/7
    a = protein_average / ((integrate pow(n, b) * exp(c * n) for n from 0 to 305/7) / 305/7)

  If we calculate a here we only need % protein as an input parameter which is usually available.

  protein_a   [%]     Wood protein scale parameter
  protein_avg [%]     protein average
  p           [#]     Parity, defaults to parity > 2
  n_mx        [week]  Week of maximum milk yield
*/

var protein_a = function (protein_avg, p, n_mx) {

  return protein_avg / protein_avg_305(1, p, n_mx);

};

/*
  Wood (1980)

  Prediction of milk fat adjusted for parity. Parameter adjustment (b & c) from p.137, table 4. It is assumed that the 
  fat minimum occurs six weeks after milk yield peaks. 

  fat   [%]     Percent milk fat in week n
  a     [-]     Scale factor
  n     [week]  Week of lactation
  p     [#]     Parity, defaults to parity > 2
  n_mx  [week]  Week of maximum milk yield
*/

var fat = function (a, n, p, n_mx) {

  var fat = 0
    , b = -0.1230 /* shape constant */
    , c = 0.0104  /* shape constant */
    ;  

  if (p === 1)
    b += 0.0168;
  else if (p === 2)
    b += 0.0320;
  else /* defaults to parity > 2 */
    b += -0.0078;

  /* adjust for week of milk peak */
  c = -(b / (4 + n_mx));
  b = -((6 + n_mx) * c);

  fat = a * pow(n, b) * exp(c * n);

  return fat; 

};

/*
  Wood (1980)

  Prediction of milk protein adjusted for parity. Parameter adjustment (b & c) from p.137, table 4. It is assumed that 
  the protein minimum occurs six weeks after milk yield peaks. 

  protein [%]     Percent milk protein in week n
  a       [-]     Scale factor
  n       [week]  Week of lactation
  p       [#]     Parity, defaults to parity > 2
  n_mx    [week]  Week of maximum milk yield
*/

var protein = function (a, n, p, n_mx) {

  var protein = 0
    , b = -0.1274 /* shape constant */
    , c = 0.0107  /* shape constant */
    ;

  if (p === 1)
    b += 0.0200;
  else if (p === 2)
    b += 0.0025;
  else /* defaults to parity > 2 */
    b += -0.0136;

  /* adjust for week of milk peak */
  c = -(b / (4 + n_mx));
  b = -((6 + n_mx) * c);

  protein = a * pow(n, b) * exp(c * n);

  return protein; 

};

/*
  Wood (1980)

  Day of maximum milk yield: x/dx (a * x^(b-1) * exp(c * x) * (b + c*x)) = 0 -> -b/c

  d_mx  [day]   day max milk 
  b     [-]     Shape constant
  c     [-]     Shape constant
  p     [#]     Parity, defaults to parity > 2

*/

var d_mx = function (b, c, p) {

  /* in weeks */
  var n_mx = 0;

  if (p === 1)
    n_mx = -((b - 0.0374) / (c + 0.0092));
  else if (p === 2)
    n_mx = -((b - 0.0253) / (c + 0.0000));
  else /* defaults to parity > 2 */
    n_mx = -((b + 0.0460) / (c - 0.0052));

  return n_mx * 7; 

};

/*
  305 days milk yield.

  milk_305  [kg]      Total milk yield in 305 days
  a         [-]       Scale factor 
  b         [-]       Shape constant
  c         [-]       Shape constant
  p         [#]       Parity, defaults to parity > 2
  scale     [kg kg-1] Scale initial milk yield of heifers as pc of cows of parity > 2 (default 0.75)
*/

var milk_305 = function (a, b, c, p, scale) {

  var milk_305 = 0;

  for (var day = 1; day < 306; day++)
    milk_305 += milk(a, b, c, day / 7, p, scale);

  return milk_305;

};

/*
  Average 305 days milk fat percent.

  fat_avg_305 [%]     Average fat yield
  a           [-]     Scale factor
  p           [#]     Parity, defaults to parity > 2
  n_mx        [week]  Week of maximum milk yield
*/

var fat_avg_305 = function (a, p, n_mx) {

  var fat_avg_305 = 0;

  for (var day = 1; day < 306; day++)
     fat_avg_305 += fat(a, day / 7, p, n_mx);

  return fat_avg_305 / 305;

};

/*
  Average 305 days milk protein percent.

  protein_avg_305 [%]     Average protein yield
  a               [-]     Scale factor
  p               [#]     Parity, defaults to parity > 2
  n_mx            [week]  Week of maximum milk yield
*/

var protein_avg_305 = function (a, p, n_mx) {

  var protein_avg_305 = 0;

  for (var day = 1; day < 306; day++)
     protein_avg_305 += protein(a, day / 7, p, n_mx);

  return protein_avg_305 / 305;

};

/*
  Tyrrell (1965)

  Energy corrected milk. Corrected to F_target and P_target.

  ECM       [kg]  Energy corrected milk
  F_target  [%]   ECM fat target  
  P_target  [%]   ECM protein target
  F         [%]   Fat in milk
  P         [%]   Protein in milk
  M         [kg]  Milk
*/

var ECM = function (F_target, P_target, F, P, M) {
  
  /* E [kcal lb-1] energy of one lb milk, Table 4, eq. 2 */
  var E_target = 40.72 * F_target + 22.65 * P_target + 102.77
    , E = 40.72 * F + 22.65 * P + 102.77
    ;

  var ECM =  M * E / E_target;

  return ECM;

};

return {
    milk: milk
  , fat: fat
  , fat_a: fat_a
  , protein: protein
  , protein_a: protein_a
  , d_mx: d_mx
  , milk_305: milk_305
  , fat_avg_305: fat_avg_305
  , protein_avg_305: protein_avg_305
  , ECM: ECM
  , data: data
};

}());
