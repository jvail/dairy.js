/*
  Body condition score, mobilization and body weight.

  REFERENCES

  Metzner, M, Heuwieser, W. und W. Klee, 1993. Die Beurteilung der Körperkondition (body condition scoring) im 
  Herdenmanagement. Der praktische Tierarzt 11, 991–998

  Friggens NC, Ingvartsen KL and Emmans GC 2004. Prediction of body lipid change in pregnancy and lactation.
  Journal of Dairy Science 87, 988–1000.

  Johnson IR (2008). Biophysical pasture model documentation: model documentation for DairyMod, EcoMod and the SGS 
  Pasture Model. (IMJ Consultants: Dorrigo, NSW) (http://imj.com.au/gmdocs/)

  Wright, Russel 1984. Estimation in vivo of the chemical composition of the bodies of mature cows.

  LICENSE

  Copyright 2014 Jan Vaillant   <jan.vaillant@zalf.de>
  Copyright 2014 Lisa Baldinger <lisa.baldinger@boku.ac.at>

  Distributed under the MIT License. See accompanying file LICENSE or copy at http://opensource.org/licenses/MIT

  Any publication for which this file or a derived work is used must include an a reference to at least one source:

  Vaillant, J. and Baldinger, L. 2014. 
  dairy.js - an open-source JavaScript library for simulation of dairy cow herds and rapid model prototyping.
  Poster presentation at the International Livestock Modelling and Research Colloquium, 14-16 October, Bilbao, Spain.

  Baldinger, L., Vaillant, J., Zollitsch, W. and Rinne, M. 2014.
  Making a decision support system for dairy farmers usable throughout Europe - the challenge of feed evaluation.
  Oral presentation at the International Livestock Modelling and Research Colloquium, 14-16 October, Bilbao, Spain.

  TODO:
  - reference for "DAYS_ZERO_MOBILIZATION_AFTER_MILK_PEAK"
  - improve BCS function
  - implement either "full" Friggens approach or investigate how to "reasonably" relate mobilization, day max milk, day
    min milk solids, day of conception ...
*/

var dairy = dairy || {};

dairy.body = (function () {

var pow = Math.pow
  , log = Math.log
  , exp = Math.exp
  , DAYS_IN_MONTH = 30.5
  , DAYS_ZERO_MOBILIZATION_AFTER_MILK_PEAK = 55
  ;

/*
  Metzner et. al. (1993)

  We assume BCS of BCS_max during dry period and a minimum BCS at day d_mx + 55.
  BCS is everywhere expressed on a six point scale.

  BCS     [-]     body condition score
  DIM     [day]   days in milk
  CI      [month] calving interval in month
  DP      [day]   dry period in days
  d_mx    [day]   day milk peaks
*/
 
var BCS = function (DIM, CI, DP, d_mx) {

      /* BCS maximum */
  var BCS_max = 3.5
      /* BCS minimum */
    , BCS_min = 3.0
      /* calving interval in days */
    , CI_d = CI * DAYS_IN_MONTH
    , BCS = BCS_max
    , BWC_0 = DAYS_ZERO_MOBILIZATION_AFTER_MILK_PEAK + d_mx
    ;

  if (DIM <= BWC_0)
    BCS = BCS_max - ((BCS_max - BCS_min) / BWC_0) * DIM; 
  else if (DIM <= CI_d - DP) 
    BCS = BCS_min +  ((BCS_max - BCS_min) / (CI_d - DP - BWC_0)) * (DIM - BWC_0);

  return BCS;

};

/*
  Johnson (2008) eq. 7.8a

  W       [kg]      weight of cow or young stock at day age
  age     [day]     age in days
  age_c1  [month]   age first calving
  W_b     [kg]      weight of calf at birth 
  W_c1    [kg kg-1] fraction (recommended) of mature body weight at first calving
  W_m     [kg]      weight of mature cow 
*/

var W = function (age, age_c1, W_b, W_c1, W_m) {

  var W = 0;

  /* make sure W_c1 < 1 */
  W_c1 = (W_c1 >= 1) ? 0.99 : W_c1;

  /* growth parameter (solve W_m * W_c1 = W_m - (W_m - W_b) * exp(-k * age) for k) */
  var k = log((W_b - W_m) / (W_m * (W_c1 - 1))) / (age_c1 * DAYS_IN_MONTH);

  W = W_m - (W_m - W_b) * exp(-k * age);

  /* make sure mature body weight is reached at some point (W_m is an asymptote) */ 
  // W = (W >= W_m - 1) ? W_m : W; // TODO: round ?

  return W;

};

/*
  Johnson IR (2005 & 2008), eq. 7.6

  Calf birth weight.

  W_b [kg]  weight of calf at birth
  W_m [kg]  weight of mature cow
*/

var W_b = function (W_m) {

  var W_b = 0
      /* parameters for cattle, table 7.3 */
    , c_b = -2
    , m_b = 0.066
    ;

  W_b = c_b + m_b * W_m;

  return W_b;

};

/*
  Wright, Russel (1984b) table 2, Wright, Russel (1984a) table 1 

  Mobilization of body fat in early lactation.

  TODO:
    - body lipid change to body weight change conversion?

  W_mob [kg]    mobilized body fat
  W_m   [kg]    mature body weight
  type  [enum]  cow type (milk or dual)
*/

var W_mob = function (W_m, type) {

  var W_mob = 0
    , b_1 = (type === 'dual' ? 52.3 : 84.2)
    , BCS_mx = 3.5
    , BCS_mn = 3.0
    , W_ref = (type === 'dual' ? 542 : 560)
    ;
    
  W_mob = b_1 * (BCS_mx - BCS_mn) * W_m / W_ref;

  return W_mob;

};

/*  
  Friggens et. al. (2004)

  Body weight change of young stock and cows (dry or lactating). Simplified version of Friggens' approach.

  We assume that..

  * the day of zero mobilization is 55 days after milk peaks (d_0).
  * either the cow mobilizes or gains weight, there is no longer period w/o weight change.
  * a mature cow gains after d_0 the same amout of body weight she lost till day d_0.
  * a growing cow will additionally gain the total body weight she should gain according to growth (W) function within
    the total lactaion after d_0 (i.e. she will not grow during mobilization but compensate those "losses", "non-gains").

  TODO:
  - fat vs body weight (tissue). fat === body weight ?

  BWC     [kg d-1]  body weight change
  DPP     [day]     days post partum 
  d_mx    [day]     day milk peaks
  age     [day]     cow's age in days
  CI      [m]       calving interval in month
  W_m     [kg]      mature body weight
  age_c1  [month]   age first calving
  W_b     [kg]      weight of calf at birth 
  W_c1    [kg kg-1] fraction (recommended) of mature body weight at first calving
  type    [enum]    cow type (milk or dual)
*/

var BWC = function (DPP, d_mx, age, CI, W_m, age_c1, W_b, W_c1, type) {

  var BWC = 0;

  /* month to days */
  CI = CI * DAYS_IN_MONTH;

  /* day of zero mobilization */
  var d_0 = d_mx + DAYS_ZERO_MOBILIZATION_AFTER_MILK_PEAK;

  if (age < age_c1 * DAYS_IN_MONTH) { /* young stock */

    BWC = W(age, age_c1, W_b, W_c1, W_m) - W(age - 1, age_c1, W_b, W_c1, W_m);

  } else { /* cows */

    /* body weight mobilized [kg] */
    var mob = W_mob(W(age - DPP, age_c1, W_b, W_c1, W_m), type);
  
    if (DPP < d_0) { /* cow is mobilizing */

      BWC = (2 * DPP * mob / pow(d_0, 2)) - (2 * mob / d_0);
    
    } else if (DPP > d_0) { /* cow is gaining weight */

      /* total growth in between two calvings */
      G = W(age - DPP + CI, age_c1, W_b, W_c1, W_m) - W(age - DPP, age_c1, W_b, W_c1, W_m);

      /* growth weight gain at day age */
      dG = 2 * G / pow(CI - d_0, 2) * (DPP - d_0);

      /* weight gain reconstitution at day age */
      dW_mob = 2 * mob / pow(CI - d_0, 2) * (DPP - d_0);

      BWC = dG + dW_mob;

    }
  }

  return BWC;

};

/*  
  Friggens et. al. (2004)

  Body weight change of young stock and cows (dry or lactating).

  BW      [kg]      body weight at day age
  DPP     [day]     days post partum 
  d_mx    [day]     day milk peaks
  age     [day]     cow's age in days
  CI      [m]       calving interval in month
  W_m     [kg]      mature body weight
  age_c1  [month]   age first calving
  W_b     [kg]      weight of calf at birth 
  W_c1    [kg kg-1] fraction (recommended) of mature body weight at first calving
  type    [enum]    cow type (milk or dual)
*/

var BW = function (DPP, d_mx, age, CI, W_m, age_c1, W_b, W_c1, type) {

  var BW = 0;

  /* month to days */
  CI = CI * DAYS_IN_MONTH;

  /* day of zero mobilization */
  var d_0 = d_mx + DAYS_ZERO_MOBILIZATION_AFTER_MILK_PEAK;

  if (age < age_c1 * DAYS_IN_MONTH) { /* young stock */

    BW = W(age, age_c1, W_b, W_c1, W_m);

  } else { /* cows */

    /* body weight mobilized [kg] */
    var mob = W_mob(W(age - DPP, age_c1, W_b, W_c1, W_m), type);
  
    /* body weight at begin of lactation */
    BW = W(age - DPP, age_c1, W_b, W_c1, W_m);
  
    /* integral from 0 to DPP */
    if (DPP < d_0) /* cow is mobilizing */
      BW -= 2 * mob * (d_0 * DPP - pow(DPP, 2) / 2) / pow(d_0, 2);
    else
      BW -= mob;
    
    if (DPP > d_0) { /* cow is beyond d_0 */

      /* total growth in between two calvings */
      G = W(age - DPP + CI, age_c1, W_b, W_c1, W_m) - W(age - DPP, age_c1, W_b, W_c1, W_m);

      /* integral growth weight gain */
      BW += G * pow(d_0 - DPP, 2) / pow(d_0 - CI, 2);
      // BW += (2 * G * (pow(DPP, 2) / 2 - d_0 * DPP) / pow(CI - d_0, 2));

      /* integral weight gain reconstitution at day age */
      BW += mob * pow(d_0 - DPP, 2) / pow(d_0 - CI, 2);
      // BW += (2 * mob * (pow(DPP, 2) / 2 - d_0 * DPP) / pow(CI - d_0, 2));

    }
  }

  return BW;

};

/*  
  Body weight at calving

  BW_c    [kg]      body weight at calving
  DPP     [day]     days post partum 
  age     [day]     cow's age in days
  W_m     [kg]      mature body weight
  age_c1  [month]   age first calving
  W_b     [kg]      weight of calf at birth 
  W_c1    [kg kg-1] fraction (recommended) of mature body weight at first calving
*/

var BW_c = function (DPP, age, W_m, age_c1, W_b, W_c1) {

  return W(age - DPP, age_c1, W_b, W_c1, W_m);

};

return {

    BWC: BWC
  , weightChange: BWC
  , BW: BW  
  , weight: BW
  , BW_c: BW_c  
  , weightAtCalving: BW_c
  , BCS: BCS
  , conditionScore: BCS
  , W: W
  , weightPotential: W
  , WB: W_b
  , weightAtBirth: W_b

};

}());
