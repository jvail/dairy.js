/*
  Feed intake of cows and young stock is predicted according to the French fill value system described in Agabriel (2010).

  The general functional principal of the INRA fill value system is as follows: The sum of all fill values of the feeds
  equals the intake capacity of the animal. While the intake capacity of the animals is based on animal-related
  parameters, the fill values of the feeds are based on feed-related parameters.

  Although not mentioned in Delagarde et al. (2011), we assume that the feed intake restrictions that apply for
  grazing dairy cows also apply for grazing heifers, because they are based on non-nutritional factors linked to sward
  availability and grazing management, not on nutritional factors linked to animal characteristics.

  The prediction of feed intake at grazing uses a simplified GrazeIn algorithm.

  GrazeMore, "Improving sustainability of milk production systems in the European Union through increasing reliance on
  grazed pasture" was an EU research project that ran from 2000-2004. It involved the development of a grazing decision
  support system to assist farmers in improving the use of grazed grass for milk production. In order to build the DSS,
  a European herbage growth prediction model and a European herbage intake prediction model were produced. Therefore
  GrazeIn is the only currently available intake prediction for grazing cows that is based on European data.

  The feed intake prediction in GrazeIn is based on the French INRA fill unit system and adapted to grazing dairy cows.
  The authors argue that because European cows don´t graze all year long and are often supplemented, a general model of
  intake is needed rather than one specialized on indoor feeding or grazing.

  Because GrazeIn in based on the INRA fill value system, in some cases equations from Agabriel (2010) are used.

  Fill values (FV) for cows are expressed in the unit LFU, lactating fill unit (UEL, unite encombrement lait) and CFU,
  cattle fill unit (UEB, unite encombrement bovin) for young stock.

  REFERENCES

  Faverdin, P., Baratte, C., Delagarde, R. and Peyraud, J.L. 2011. GrazeIn: a model of herbage intake and milk production
  for grazing dairy cows. 1. Prediction of intake capacity, voluntary intake and milk production during lactation. Grass
  and Forage Science 66(1):29-44.

  Delagarde, R., Faverdin, P., Baratte, C. and Peyraud, J.L. 2011a. GrazeIn: A model of herbage intake and milk production
  for grazing dairy cows. 2. Prediction of intake under rotational and continuously stocked grazing management. Grass and
  Forage Science 66(1):45–60.

  Agabriel, J. (2010). Alimentation des bovins, ovins et caprins. Besoins des animaux - Valeurs des aliments. Tables INRA
  2010. Editions Quae, France.

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

  TODO

  - PLPOT in IC and GSR: is it zero for dry cows or still PLPOT?
*/
 
var dairy = dairy || {};

dairy.intake = (function () {

var exp = Math.exp
  , log = Math.log
  , pow = Math.pow
  , min = Math.min
  , Σ = function (a) {
      var sum = 0;
      for (var i = 0, is = a[0].length; i < is; i++)
        sum += a[0][i] * a[1][i];
      return sum;
    }
  ;

function is_null_or_undefined (x) {
  return x === null || x === undefined;
}


/*
  TODO: Funktion rätselhaft, da DMI = Fs + Cs + HI_g

  DMI   [kg]  dry matter intake
  Fs    [kg]  array of feeds
  FVs_f [LFU] array of forage fill values
  Cs    [kg]  array of concentrates
  Cs_f  [LFU] array of concentrate fill values
  FV_h  [LFU] herbage fill value 
  HI_r  [-]   relative herbage intake (0-1)
  HI_g  [kg]  herbage intake at grazing
*/

var DMI = function (Fs, FVs_f, Cs, FVs_c, FV_h, HI_r, HI_g) {

  var DMI = 0
    , DMI_f = Σ([Fs, FVs_f])
    , DMI_c = Σ([Cs, FVs_c])
    ;

  DMI = DMI_f + DMI_c + (FV_h/HI_r * HI_g);

  return DMI;

};

/*
  Agabriel (2010), eqs. 2.3 & 4.5

  Equation to calculate the intake capacity.
  
  The intake capacity of the cow is not calculated acc. to Faverdin et al. (2011), because the appearance of MPprot
  (potential milk production modified by protein intake) is problematic since protein intake is unkown at the time of
  feed intake prediction. Instead, the previous Agabriel (2010) version is used:

  In GrazeIn, Pl_pot represents the potential milk yield of a cow, not the actual milk yield. This is done in order
  to avoid milk yield driving feed intake (pull-situation). In SOLID-DSS, values for milk yield are taken from the
  lactation curves modelled within the herd model. These lactation curves are based on input by the user, and thereby
  represent average milk yields instead of actual ones, so they can be interpreted as a potential under the given
  circumstances.

  IC    [LFU or CFU]  intake capacity ~ DMI @ FV = 1
  BW    [kg]          body weight
  PLPOT [kg day-1]    milk yield, potential
  BCS   [-]           body condition score (1-5)
  WL    [week]        week of lactation
  WG    [week]        week of gestation (0-40)
  AGE   [month]       age in month
  p     [#]           parity
*/

var IC = function (BW, PLPOT, BCS, WL, WG, AGE, p) {

  var IC = 0;

  if (p > 0) { /* cows */

    IC = (13.9 + (BW - 600) * 0.015 + PLPOT * 0.15 + (3 - BCS) * 1.5) * IL(p, WL) * IG(WG) * IM(AGE);
  
  } else if (p === 0) { /* young stock */

    if (BW <= 150)
      IC = 0.039 * pow(BW, 0.9) + 0.2;
    else if (150 < BW <= 290)
      IC = 0.039 * pow(BW, 0.9) + 0.1;
    else
      IC = 0.039 * pow(BW, 0.9);

  }

  return IC;

}; 

/*
  Agabriel (2010) eq. 2.3f

  The equation for the index of lactation. .

  IL  [-]     index lactation (0-1)
  p   [#]     parity
  WL  [week]  week of lactation
*/

var IL = function IL(p, WL) {

  /* if cow is dry IL = 1 */
  var IL = 1;

  if (p === 1 && WL > 0)
    IL = 0.6 + (1 - 0.6) * (1 - exp(-0.16 * WL));
  else if (p > 1 && WL > 0)
    IL = 0.7 + (1 - 0.7) * (1 - exp(-0.16 * WL));

  return IL;

};

/*
  Agabriel (2010) eq. 2.3f

  The equation for the index of gestation.
  
  IG  [-]     index gestation (0-1)
  WG  [week]  week of gestation (0-40)
*/

var IG = function (WG) {

  return 0.8 + 0.2 * (1 - exp(-0.25 * (40 - WG)));  

};

/*
  Agabriel (2010) eq. 2.3f

  The equation for the index of maturity.
  
  IM  [-]     index maturity (0-1)
  AGE [month] month
*/

var IM = function (AGE) {

  return -0.1 + 1.1 * (1 - exp(-0.08 * AGE));

};

/*
  Agabriel (2010), Table 8.1.

  The general equation for calculating forage fill values.

  The QIL and QIB values are calculated in feed.evaluation, details see there.
  
  FV_f  [LFU or CFU kg-1 (DM)] forage fill value (is LFU for cows and CFU for young stock)
  QIX   [g kg-1]               ingestibility in g per kg metabolic live weight (is QIL for cows and QIB for young stock)               
  p     [#]                    parity
*/

var FV_f = function (QIX, p) {

  if (p > 0) /* cows */
    return 140 / QIX;
  else       /* young stock */
    return 95 / QIX

};

/*
  Faverdin et al. (2011) eq. 11
  
  Equation for calculating concentrate fill value.

  One of the factors influencing the concentrate fill value is the fill value of the forage base.
  Because the total diet is unknown prior to the allocation of feeds, the weighted mean of the FV of all available
  forages for the group of cows and the time period in question is used for FV_fr.

  FV_c  [LFU or CFU kg-1 (DM)] concentrate fill value (lactating fill unit, unite encombrement lait)
  FV_fs [LFU]                  weighted FV of forages in ration
  GSR   [-]                    global substitution rate (0-1)
*/

var FV_c = function (FV_fs, GSR) {

  return FV_fs * GSR;

};

/*
  Equation to estimate the fill value of forages in a diet from the cow's requirements prior to ration optimization.
  This is based on the fact that on average a feed's fill value will descrease with increasing energy content. The 
  estimated FV_fs is used to calculate a concentrate fill value (see FV_cs). We need it if we what to keep the diet LP 
  linear.
  The regression was calculated from all forages available in Agabriel 2010. Details and R script in ../doc/FV_f.

  FV_fs_diet  [LFU or CFU kg-1 (DM)] Estimated fill value of forages in diet
  E_fs        [UFL]           Total energy content of forages in diet
  FV_fs       [LFU]           Total fill values of forages in diet
  p           [#]             parity
*/

var FV_fs_diet = function (E_fs, FV_fs, p) {

  if (p > 0)
    return -0.489 * E_fs / FV_fs + 1.433;
  else
    return -0.783 * E_fs / FV_fs + 1.688;

};

/*
  Estimate an average concentrate fill value. We assume that requirements are met i.e. cows with BWC >= 0 have a zero
  energy balance. 

  TODO: 
    - simplify to an equation?
    - use this as a better estimate of DMI instead of DMI = IC (FV ~ 1)?

  FV_cs_diet  [LFU kg-1 (DM)] estimated fill value of concentrates in diet
  E_req       [UFL]           Energy requirements of a cow (in UFL!)
  IC          [LFU]           Intake capacity of a cow
  c_mx        [kg kg-1]       Maximum fraction (DM) of concentrates in diet (optional, defaults to 0.5 which is the 
                              range the INRA system is applicable)
  PLPOT       [kg day-1]      milk yield, potential
  p           [#]             parity
  BWC         [kg]            body weight change       
*/

var FV_cs_diet = function (E_req, IC, c_mx, PLPOT, p, BWC) {

  var FV_cs_diet = 0;

  if (is_null_or_undefined(c_mx) || c_mx > 0.5)
    c_mx = 0.5;
      
  var c = 0       /* fraction of conc. in diet [kg (DM) kg-1 (DM)] */
    , c_kg = 0    /* kg conc. in diet */
    , E_f = E_req /* energy requirements covered by forage */
    , IC_f = IC   /* IC covered by forage */
    , c_fvs = []  /* store conc. fill values */
    , c_fv = 0    /* estimated conc. fill value */
    , f_fv = 0    /* estimated forage fill value */
    , s = 0       /* substitution rate */
    ;

  /* fixed to a max. UFL / UEL value observed in feeds */
  if (E_f / IC_f > 1.15)
    E_f = E_req = IC_f * 1.15;  

  while (true) {

    /* staring from a diet with zero kg conc. we add conc. till we reach c_mx */
    f_fv = FV_fs_diet(E_f, IC_f, p);
    s = GSR(c_kg, DEF(E_f, IC_f), PLPOT, p, BWC, f_fv);
    c_fv = f_fv * s;
    c = c_kg / (IC_f / f_fv + c_kg);

    if (c >= c_mx)
      break;

    c_fvs.push(c_fv);

    /* add concentrate to the diet */
    c_kg += 0.5;
    /* we assume the concentrate's UFL content is 1.05. In fact the result is not very sensitive to UFL of conc. */
    E_f = E_req - c_kg * 1.05;
    IC_f = IC - c_kg * c_fv;

  }

  /* average */
  FV_cs_diet = c_fvs.reduce(function (a, b, i, array) { return a + b / array.length; }, 0);

  return FV_cs_diet;

};

/*
  Agabriel (2010) eq. 2.25

  DEF is the average energy density of the forages in the diet, which is calculated as the weighted mean of all
  available forages for the group of cows and the time period in question.

  DEF     [UFL LFU-1 or CFU-1]    average energy density of the forages in the diet (can be slightly higher than 1)
  UFL_fs  [UFL kg-1 (DM)]         sum of the energy contents of all available forages
  FV_fs   [LFU or CFU kg-1 (DM)]  sum of the fill values of all available forages
*/

var DEF = function (UFL_fs, FV_fs) {

  return UFL_fs / FV_fs;

};

/*
  Agabriel (2010) eq. 2.26 &  Table 1.2

  Both in Agabriel (2010) and in GrazeIn, concentrate fill values not only vary with the fill value of the forage base,
  but also with the amount of concentrates, the milk yield of the cow and the energy balance of the cow, which are
  all incorporated into the calculation of the global substitution rate (GSR). Consequently, concentrate fill values
  and feed intake are calcalated iteratively until the system converges.
  In SOLID-DSS, no iterative calculation is possible because all fill values must stay constant when the linear
  programming starts to allocate feeds. Therefore the simplified version of calculating GSR that can be found in
  Agabriel (2010) was chosen. According to this version, there is one calculation fo GSR when cows are not mobilizing,
  and a different calculation when cows are mobilizing.

  For QI_c, the maximum of concentrates the user is willing to feed is used, because we assume that those cows that are
  mobilizing will receive the maximum concentrate supplementation.
  
  For dairy heifers, the global substitution rate also depends on the fill value of the forage base. Agabriel (2010)
  doesn´t supply equations for calculating GSR, but gives a Table (1.2) with discrete values. Based on these values, a
  linear regression for the calculation of GSR was produced which is valid for fill values of the forage base between
  0.95 and 1.4 and which assumes a concentrate proportion of 15%. The coefficient of determination of the linear
  regression is 0.99.

  TODO: replace BWC with something like "energy balance of the cow is negative"

  GSR   [-]                   global substitution rate (0-1)
  QI_c  [kg (DM)]             total amount of concentrates that are fed
  DEF   [UFL LFU-1 or CFU-1]  average energy density of the forages in the diet (can be slightly higher than 1)
  PLPOT [kg day-1]            milk yield, potential
  p     [#]                   parity
  BWC   [kg]                  body weight change
  FVF   [CFU kg-1]            forage fill value in diet (only needed if p = 0 i.e. youg stock)          
*/

var GSR = function (QI_c, DEF, PLPOT, p, BWC, FVF) {

  var GSR = 1
    , GSR_zero = 0.55
    , d = (p > 1 ? 1.10 : 0.96)
    ;

  if (p === 0 && !is_null_or_undefined(FVF)) { /* young stock */

    GSR = 1.765 - 1.318 * FVF;

  } else { /* cows */

    /* should be larger 0 (dry cows have a pot. milk yield as well) */
    if (PLPOT <= 0)
      PLPOT = 1;

    GSR_zero = d * pow(PLPOT, -0.62) * exp(1.32 * DEF);

    if (BWC < 0) /* energy balance of the cow is negative, irrespective of the reason */
      GSR = -0.43 + 1.82 * GSR_zero + 0.035 * QI_c - 0.00053 * PLPOT * QI_c;
    else
      GSR = GSR_zero;
  
  }

  return GSR;

};

/*
  Herbage intake prediction with GrazeIn:
  IC, FV_h -> HI_v
  H -> VI_max
  TAP, VI_max -> HI_r_tap 
  
  Continuous grazing:
  H -> HI_r_ssh
  HI_r_ssh, HI_v -> HI_G1
  HI_r_tap, HI_r_ssh, HI_v -> HI_G2
  HI_G1, HI_G2 -> HI_G


  Rotational grazing:
  A, HM_2, HGR, RT, NCow -> HA_2
  HA_2, HI_v -> HA_r -> HI_r_ha
  HI_r_ha, HI_v -> HI_G1
  HI_r_tap, HI_r_ha, HI_v -> HI_G2
  HI_G1, HI_G2 -> HI_G
*/


/*
  HI_rg [kg (DM) day-1] herbage intake when grazing is rotational
  IC    [LFU or CFU]    intake capacity ~ DMI @ FV = 1
  FV_h  [LFU]           fill value herbage
  A     [m2]            total area of paddock
  H     [cm]            sward surface height
  HM_2  [kg (DM) ha-1]  pre-grazing herbage mass above 2 cm ground level
  HGR   [kg (DM) ha-1]  daily herbage growth rate
  RT    [day]           residence time in the paddock
  NCow  [#]             number of cows in the herds  
  
*/
 
var HI_rg = function (IC, FV_h, H, HM_2, HGR, RT, NCow, TAP) {

  var HI_v_ = HI_v(IC, FV_h)
    , HA_2_ = HA_2(A, HM_2, HGR, RT, NCow)
    , HA_r_ = HA_r(HA_2_, HI_v_)
    , HI_r_ha_ = HI_r_ha(HA_r_)
    , VI_max_ = VI_max(H)
    , HI_r_tap_ = HI_r_tap(TAP, VI_max_)
    , HI_G1_ = HI_G1(HI_v_, HI_r_ha_)
    , HI_G2_ = HI_G2(HI_v_, HI_r_tap_, HI_r_ha_)
    ;

  return HI_g(HI_G1_, HI_G2_);

};

/*
  HI_cg [kg (DM) day-1] herbage intake when grazing is continuous
  IC    [LFU or CFU]    intake capacity ~ DMI @ FV = 1
  FV_h  [LFU]           fill value herbage
  A     [m2]            total area of paddock
  H     [cm]            sward surface height
  HM_2  [kg (DM) ha-1]  pre-grazing herbage mass above 2 cm ground level
  HGR   [kg (DM) ha-1]  daily herbage growth rate
  RT    [day]           residence time in the paddock
  NCow  [#]             number of cows in the herds  
  
*/
 
var HI_cg = function (IC, FV_h, H, TAP) {

  var HI_v_ = HI_v(IC, FV_h)
    , VI_max_ = VI_max(H)
    , HI_r_tap_ = HI_r_tap(TAP, VI_max_)
    , HI_r_ssh_ = HI_r_ssh(H)
    , HI_G1_ = HI_G1(HI_v_, HI_r_ssh_)
    , HI_G2_ = HI_G2(HI_v_, HI_r_tap_, HI_r_ssh_)
    ;

  return HI_g(HI_G1_, HI_G2);

};


/*
  Delagarde et al. (2011) eq. 13
  Equation for relative herbage intake limited by allowance when grazing is rotational.

  When cows are not grazing, all necessary calculations are hereby completed and the feed intake restriction is:
  IC = sum of fill values of forages and concentrates multiplied with their amount (or share in the diet)
  When cows are grazing, their herbage intake can be restricted by sward availability or by time at grazing.
  For calculating the restriction caused by sward availability, there are two different calculations, one for rotational
  and one for continuous grazing.

  HI_r_ha [-] relative herbage intake limited by herbage allowance when grazing is rotational (0-1)
  HA_r    [-] relative herbage allowance
*/
 
var HI_r_ha = function (HA_r) {

  return 1.08 * (1 - exp(-1.519 * HA_r));

};

/*
  Delagarde et al. (2011) eq. 15

  Equation for calculating herbage intake restricted by sward availability when grazing is continuous.

  HI_r_ssh  [-]   relative herbage intake limited by sward surface height when grazing is continuous (0-1)
  H         [cm]  sward surface height measured with a sward stick
*/

var HI_r_ssh = function (H) {

  return -1 + 0.5 * H - 0.233 * log(1 + exp(2 * H - 7.38)) - 0.033 * log(1 + exp(H - 11));

};

/*
  Delagarde et al. (2011) eq. 17

  Herbage intake can also be restricted by time at pasture. If this is the case, it does not matter if grazing is
  rotational or continuous.

  VI_max    [kg or LFU] maximum voluntary intake depending on available forage TODO: unit of VI_max
  H         [cm]        sward surface height
*/

var VI_max = function (H) {

  return 0.058 + 0.0062 * (H - log(1 + exp(H - 22.9)));

};

/*
  Delagarde et al. (2011) eq. 16

  Equation for relative herbage intake limited by time at pasture.
  
  HI_r_tap  [-]         relative herbage intake limited by time at pasture (0-1)
  TAP       [h day-1]   time at pasture
  VI_max    [kg or LFU] maximum voluntary intake depending on available forage TODO: unit of VI_max
*/

var HI_r_tap = function (TAP, VI_max) {

  var HI_r_tap = 1;

  if (TAP <= 20)
    HI_r_tap = (VI_max * TAP) - (VI_max - 0.008) * log(1 + exp(TAP - (0.845 / (VI_max - 0.008))));

  return HI_r_tap;

};

/*
  The theoretical, maximum intake of herbage when nothing is supplemented and there is no restriction whatsoever can be
  calculated by dividing the intake capacity with the fill value of herbage.

  HI_v  [kg (DM) day-1] voluntary herbage intake
  IC    [LFU]           intake capacity
  FV_h  [LFU]           fill value herbage
*/

var HI_v = function (IC, FV_h) {

  return IC / FV_h; 

};

/*
  Delagarde et al. (2011) eq. 14

  Equation for herbage allowance above 2 cm taken.

  In GrazeIn, the available herbage mass is defined as everything above 2 cm above ground, because it is assumed that
  cows cannot graze the 2 cm closest to the ground.

  HA_2  [kg (DM) ha-1]  herbage allowance above 2 cm
  A     [m2]            total area of paddock
  HM_2  [kg (DM) ha-1]  pre-grazing herbage mass above 2 cm ground level
  HGR   [kg (DM) ha-1]  daily herbage growth rate
  RT    [day]           residence time in the paddock
  NCow  [#]             number of cows in the herds           
*/

var HA_2 = function (A, HM_2, HGR, RT, NCow) {

  return A * (HM_2 + (0.5 * HGR * RT)) / (1000 * RT * NCow);

};

/*
  Delagarde et al. (2011) eq. 12

  Equation for relative herbage allowance taken.

  The relative herhage allowance can be calculated by dividing the available herbage mass above 2 cm above ground with
  the voluntary herbage intake of the cow.

  HA_r  [-]             relative herbage allowance
  HA_2  [kg (DM) ha-1]  herbage allowance above 2 cm
  HI_v  [kg (DM) day-1] voluntary herbage intake
*/

var HA_r = function (HA_2, HI_v) {

  return  HA_2 / HI_v;

};

/*
  Delagarde et al. (2011) eqs. 22,24

  HI_G1   [kg (DM)] intake from grazing (limited by availability)
  HI_v    [kg (DM)] voluntary herbage intake
  HI_r    [-]       HI_r_ha (rotational) or HI_r_ssh (continuously)
*/

var HI_G1 = function (HI_v, HI_r) {

  return  HI_v * HI_r;

};

/*
  Delagarde et al. (2011) eqs. 23,25

  HI_G2     [kg (DM)] intake from grazing (limited by time at pasture)
  HI_v      [kg (DM)] voluntary herbage intake
  HI_r_tap  [-]       relative herbage intake limited by time at pasture (0-1)
  HI_r      [-]       HI_r_ha (rotational) or HI_r_ssh (continuously)
*/

var HI_G2 = function (HI_v, HI_r_tap, HI_r) {

  return  HI_v * HI_r_tap * HI_r;

};

/*
  Delagarde et al. (2011) eq. 21

  HI_G     [kg (DM)] intake from grazing
  HI_G1    [kg (DM)] herbage intake (limited by limited by availability)
  HI_G2    [kg (DM)] herbage intake (limited by limited by time at pasture)
*/

var HI_G = function (HI_G1, HI_G2) {

  return  min(HI_G1, HI_G2);

};

return {

    DMI: DMI
  , IC: IC
  , FV_f: FV_f
  , FV_c: FV_c
  , FV_fs_diet: FV_fs_diet
  , FV_cs_diet: FV_cs_diet
  , GSR: GSR
  , DEF: DEF
  , HI_rg: HI_rg 
  , HI_cg: HI_cg 

};

}());
