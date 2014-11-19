/*
  Feed intake of calves and heifers is predicted according to the French fill value system described in Agabriel (2010).

  The general functional principal of the INRA fill value system is as follows: The sum of all fill values of the feeds
  equals the intake capacity of the animal. While the intake capacity of the heifer is based on animal-related
  parameters, the fill values of the feeds are based on feed-related parameters.

  Although not mentioned in Delagarde et al. (2011), we assume that the feed intake restrictions that apply for
  grazing dairy cows also apply for grazing heifers, because they are based on non-nutritional factors linked to sward
  availability and grazing management, not on nutritional factors linked to animal characteristics.

  REFERENCES

  Agabriel, J. (2010). Alimentation des bovins, ovins et caprins. Besoins des animaux - Valeurs des aliments. Tables
  INRA 2010. Editions Quae, France.

  Delagarde R, Faverdin P, Baratte C, Peyraud JL. (2011a). GrazeIn: A model of herbage intake and milk production for
  grazing dairy cows. 2. Prediction of intake under rotational and continuously stocked grazing management. Grass and
  Forage Science 66: 45–60.

  Fill values (FV) are expressed in the unit UEB, unite encombrement bovin

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
 
var youngstock = youngstock || {};

youngstock.intake = (function () {

  var exp = Math.exp
    , log = Math.log
    , pow = Math.pow
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
    Agabriel (2010), equation 4.5

    Equation for calculating the intake capacity.
    
    IC    [UEB]       intake capacity ~ DMI @ FV = 1
    BW    [kg]        body weight
  */

  var IC = function (BW) {

    var IC = 0;

    if(BW < 150)
    IC = 0.039 * pow (BW, 0.9) + 0.2
    else if (150 < BW < 290)
    IC = 0.039 * pow (BW, 0.9) + 0.1
    else
    IC = 0.039 * pow (BW, 0.9);

    return IC;

  }; 

  /*
    Agabriel (2010), Table 8.1.

    The general equation for calculating forage fill values.

    The QIB-values are calculated in feed.evaluation, details see there.
    
    FV_f  [UEB kg-1 (DM)] forage fill value (unite encombrement bovin)
    QIB   [g kg-1]        ingestibility in g per kg metabolic live weight                
  */

  var FV_f = function (QIB) {

    return 95 / QIB;

  };

  /*
    Agabriel (2010) Table 8.1
    
    Equation for calculating the concentrate fill value.

    The concentrate fill value depends on the fill value of the forage base.
    Because the total diet is unknown prior to the allocation of feeds, the weighted mean of the FV of all available
    forages for the group of heifers and the time period in question is used for FV_fs.

    FV_c  [UEB kg-1 (DM)] concentrate fill value (unite encombrement bovin)
    FV_fs [UEB]           weighted FV of forages in ration
    GSR   [-]             global substitution rate (0-1)
  */

  var FV_c = function (FV_fs, GSR) {

    return FV_fs * GSR;

  };

  /*
    Baldinger et. al. (xxxx) eq. x

    Equation to estimate the fill value of forages in a diet from the heifer´s requirements prior to ration
    optimization. This is based on the fact that on average a feed's fill value will decrease with increasing energy
    content. The estimated FV_fs is used to calculate a concentrate fill value (see FV_cs). We need it if we want to
    keep the diet LP linear.
    The regression was calculated from all forages available in Agabriel 2010 (r^2 = XXX, n = 643).

    FV_fs_diet  [UEB kg-1 (DM)] Estimated fill value of forages in diet
    E_fs        [UFL]           Total energy content of forages in diet
    FV_fs       [UEB]           Total fill values of forages in diet

    TODO: Diese Gleichung nochmal für UEB machen
  */

  var FV_fs_diet = function (E_fs, FV_fs) {

    return XXX;

  };

  /*
    Agabriel (2010) Table 1.2

    For dairy heifers, the global substitution rate depends on the fill value of the forage base. Agabriel (2010)
    doesn´t supply equations for calculating GSR, but gives a Table (1.2) with discrete values. Based on these values,
    a linear regression for the calculation of GSR was produced which is valid for fill values of the forage base
    between 0.95 and 1.4 and which assumes a concentrate proportion of 15%. The coefficient of determination of the
    linear regression is 0.99.

    GSR         [-]               Global substitution rate (0-1)
    FV_fs_diet  [UEB kg-1 (DM)]   Estimated fill value of forages in diet   

  */

  var GSR = function (FV_fs_diet) {

    var GSR = 0
      ;

    GSR = 1.765 - 1.318 * FV_fs_diet
      ;

    return GSR;

  };

  /*
    Delagarde et al. (2011) eq. 13

    Although not mentioned in Delagarde et al. (2011), we assume that the feed intake restrictions that apply for
    grazing dairy cows also apply for grazing heifers, because they are based on non-nutritional factors linked to sward
    availability and grazing management, not on nutritional factors linked to animal characteristics.

    Equation for relative herbage intake limited by allowance when grazing is rotational.

    When heifers are not grazing, all necessary calculations are hereby completed and the feed intake restriction is:
    DMI = sum of fill values of forages and concentrates multiplied with their amount (or share in the diet)
    When heifers are grazing, their herbage intake can be restricted by sward availability or by time at grazing.
    For calculating the restriction caused by sward availability, there are two different calculations, one for
    rotational and one for continuous grazing.

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
    H         [cm]        sward surface height measured with a sward stick
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
    The theoretical, maximum intake of herbage when nothing is supplemented and there is no restriction whatsoever can
    be calculated by dividing the intake capacity with the fill value of herbage.

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
    cattle cannot graze the 2 cm closest to the ground.

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
    the voluntary herbage intake of the heifer.

    HA_r  [-]             relative herbage allowance
    HA_2  [kg (DM) ha-1]  herbage allowance above 2 cm
    HI_v  [LFU]           voluntary herbage intake
  */

  var HA_r = function (HA_2, HI_v) {

    return  HA_2 / HI_v;

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

  };

}());
