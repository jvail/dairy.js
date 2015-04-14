/*
  Energy and protein requirements according to a selection of evaluation systems (DE, FI, GB, FR).

  REFERENCES
  
  AFRC (Agricultural Food and Research Council). 1993. Energy and protein requirements of ruminants. An advisory
  manual prepared by the AFRC Technical Committee on Responses to Nutrients. CAB International, Wallingford, UK.
  
  Agabriel, J. 2010. Alimentation des bovins, ovins et caprins. Besoins des animaux - Valeurs des aliments. Tables INRA
  2010. Editions Quae, France.
  
  Dong, L.F., Yan, T., Ferris, C.P. and McDowell, D.A. 2014. Comparison of energy utilisation and energetic efficiency
  of dairy cows under different input systems. In: Proceedings of the 65th Conference of European Association of
  Animal Production. p. 395, Copenhagen, Denmark.
  
  Feed into Milk Consortium. 2004. Feed into Milk. A new applied feeding system for dairy cows. An advisory manual.
  Ed. Thomas, C. Nottingham University Press, UK.
  
  GfE [Society of Nutrition Physiology] 2001. Empfehlungen zur Energie- und Nährstoffversorgung der Milchkühe und
  Aufzuchtrinder [Recommendations on the energy and nutrient supply for dairy cows and heifers]. DLG-Verlag, Frankfurt/
  Main, Germany.
  
  Jarrige, R. 1989. Ruminant nutrition: recommended allowances and feed tables. John Libbey Eurotext, France.
  
  MTT. 2006. Rehutaulukot ja ruokintasuositukset [Feed tables and feeding recommendations]. Agrifood Research Finland,
  Jokioninen, Finland.
  
  MTT 2014. Rehutaulukot ja ruokintasuositukset [Feed tables and feeding recommendations] [online]. Agrifood
  Research Finland, Jokioinen. Accessed last on November 20, 2014, available at:
  https://portal.mtt.fi/portal/page/portal/Rehutaulukot/feed_tables_english

  NRC (National Research Council). 2001. Nutrient requirements of dairy cattle. 7th edition. National Academy Press,
  Washington, D.C. USA.

  Sjaunja, L.-O., Baevre, L., Junkarinen, L., Pedersen, J. and Setala, J. 1990. A Nordic proposal for an energy corrected
  milk (ECM) formula. In: in Proceedings of the 27th Biennial Session of the International Committee for Animal Recording.
  Paris, France. p. 156-157.

  Tyrrell, H.F. and Reid, J.T. 1965. Prediction of the energy value of cow's milk. Journal of Dairy Science 48(9):
  1215-1223.

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
*/

var dairy = dairy || {};

dairy.requirements = (function () {

var log = Math.log
  , LN10 = Math.LN10
  , exp = Math.exp
  , pow = Math.pow
  , log10 = function (x) { 
      return log(x) / LN10; 
    }
  , WEEKS_IN_MONTH = 30.5 / 7
  , WEEKS_GESTATION_PERIOD = 40
  ;

function is_null_or_undefined (x) {
  return x === null || x === undefined;
}

/*
  NRC (2001) p. 18 ff, AFRC (1993) p. 159

  Adjustment of maintenance requirements for energy needed for grazing activity:

  In comparison to cows housed indoors, cows that are grazing have a higher energy requirement for maintenance. The
  increase is a function of the distance walked, the topography of the pasture, and the body weight of the cow.
  Of the feed evaluation systems of Germany, France, UK and Finland, both the French and the British system offer a
  simple activity-related addition to the energy requirements for maintenance. Because SOLID-DSS will deal with a lot
  of grazing cows, the more detailed energy addition for grazing offered by the NRC was chosen.

  Energy requirement for maintenance when grazing =
      Basic maintenance requirement
    + extra requirement for walking
    + extra requirement for grazing
    + extra requirement for hilly pastures

  Regarding the extra requirement for hilly pastures, we chose to use the original version by AFRC (1993) that NRC is
  quoting on page 21, because it can cover differing slopes.

  NRC (2001) expresses the basic maintenance requirements of dairy heifers in Mcal NEM, but the extra requirements are
  calculated using the same equations as for the dairy cows, which are expressed in Mcal NEL. Because the NRC (2001)
  assumes that NEL and NEM are equivalent (in this case), both the basic maintenance requirements and all additions will
  be calculated as described by the NRC, and then the sum of all additions will be expressed in % of the basic
  requirement. So the output of this calculation is the addition in %, which is then used in the national requirements
  to upscale the energy requirements for maintenance accordingly.

  activity  [ME ME-1] additional maintenance requirements as fraction of total requirements
  BW        [kg]      body weight
  f         [kg kg-1] fraction pasture in diet 
  d         [km]      distance between barn and pasture
  d_v       [m]       vertical distance between barn and pasture or on pasture  
*/

var activity = function (BW, f, d, d_v) {

  var SBW = BW * 0.96 /* shrunk body weight (equation taken from NRC (2001) p. 234) */
    , maintenance = 0.08 * pow(SBW, 0.75)
    , walking = 0.00045 * BW * d
    , grazing = 0.002 * BW * f
    , hilly = 0.00003 * BW * d_v * 4
    ;

  return (walking + grazing + hilly) / maintenance;

};

/*
  GfE (2001)
  
  Nutrient requirements of dairy cows and young stock according to GfE.

  cows

  Energy is expressed in MJ NEL (net energy lactation) and protein is expressed in uCP (utilizable crude protein at the
  duodenum, the German abbreviation is nXP).

  Because DMI is predicted according to GrazeIn, the unit of IC (intake capacity) is UEL. For calculating the German
  protein requirements, IC is used as if it was expressed in kg, which means that an average fill value of 1 is assumed.

  young stock

  Energy is expressed in MJ ME (metabolizable energy) and protein is expressed in g uCP (utilizable crude protein at the
  duodenum, the German abbreviation is nXP).

  Because DMI is predicted according to GrazeIn, the unit of IC (intake capacity) is UEB. For calculating the German
  protein requirements, IC is used as if it was expressed in kg, which means that an average fill value of 1 is assumed.
*/

var de = (function () {

  /*
    maintenance [{NEL or ME, uCP}]  Adjusted for share of forages in diet (by AFBI) if p > 0
    BW          [kg]                Body weight
    DMI         [kg]                Dry matter intake (if unknow assume IC ~ DMI @ FV = 1)
    f           [kg (DM) kg-1 (DM)] Share of forage in diet
    p           [#]                 parity
  */

  var maintenance = function (BW, DMI, f, p) {

    if (p > 0) { /* cows */
      /*
        Dong et. al. (2014)

        The equation for the energy requirements for maintenance was formulated using a regression method (feeding at
        different energy levels and extrapolating to an energy balance of zero). (eq. 1.4.1)

        Energy requirements for maintenance are adjusted to forage proportion based on results from SOLID Task 3.3,
        conducted by AFBI:

        AFBI derived estimates of energy utilization by dairy cows on high forage diets. Using a database of calorimetric
        chamber experiments, the effects of total energy intake and diet quality forage proportion and contents of energy,
        protein and fibre on the energy requirements for maintenance and on the efficiency of using energy for maintenance
        and lactation were evaluated.

        The energy requirement for maintenance was found to be influenced by forage proportion:

        forage proportion < 30% -->   ME_m, MJ british = 0.65 * LW^0.75 ; k_l = 0.62
        forage proportion 30%-99% --> ME_m, MJ british = 0.68 * LW^0.75 ; k_l = 0.62
        forage proportion = 100% -->  ME_m, MJ british = 0.74 * LW^0.75 ; k_l = 0.62

        No influence of forage proportion on the efficiency of using energy for milk production (k_l) was found.
        
        Within an energy evaluation system, energy evaluation and energy requirements form a unit, and energy requirements
        are a unit of maintenance requirements and k_l:
        energy system = energy evaluation + maintenance requirement + k_l

        Therefore the AFBI-results cannot be ABSOLUTELY incorporated in a system of energy evaluation and requirement
        different from the British system, and the incorporation will be in RELATIVE terms.

        The equation for protein requirements for maintenance (equations 2.1.1, 2.1.2, 2.1.3, 2.1.5) summarizes the
        endogenous N losses via urine (5.9206 * log10 BW - 6.76), feces (2.19 * DMI) and skin (0.018 * BW^0.75),
        transforms that into protein (*6.25) and then multiplies with 2.1 to get the uCP requirement. (Assuming an
        efficiency of using absorbed amino acid N of 75%, an absorbability of amino acid N of 85% and a proportion of
        amino acid N of non-ammonia-N in chyme of 73%.)
      */

      var NEL = 0.293 * pow(BW, 0.75)
        , uCP = ((5.9206 * log10(BW) - 6.76) + (2.19 * DMI) + (0.018 * pow(BW, 0.75))) * 6.25 * 2.1
        ;
   
      if (f) {
        if (f < 0.3)
          NEL = 0.280 * pow(BW, 0.75);
        else if (f >= 0.3 && f <= 0.99)
          NEL = 0.293 * pow(BW, 0.75);
        else
          NEL = 0.319 * pow(BW, 0.75);
      }

      return {
          E: NEL
        , P: uCP
      };

    } else {

      /*
        Equation for energy requirement for maintenance taken from GfE (2001) p. 27, chapter 1.5.1

        The protein requirement for maintenance is calculated with the same equations as for the dairy cows. The only
        difference is that the efficiency of using absorbed amino acid N is 70% for heifers instead of 75% for dairy cows.
        The equation (equations 2.1.1, 2.1.2, 2.1.3, 2.1.5) summarizes the endogenous N losses via urine (5.9206 *
        log10 BW - 6.76), feces (2.19 * DMI) and skin (0.018 * BW^0.75), transforms that into protein (*6.25) and then
        multiplies with 2.3 to get the uCP requirement. (Assuming an efficiency of using absorbed amino acid N of 70%, an
        absorbability of amino acid N of 85% and a proportion of amino acid N of non-ammonia-N in chyme of 73%.)
      */

      var ME = 0.530 * pow(BW, 0.75)
        , uCP = ((5.9206 * log10(BW) - 6.76) + (2.19 * DMI) + (0.018 * pow(BW, 0.75))) * 6.25 * 2.3;
        ;

      return {
          E: ME
        , P: uCP
      };

    }

  };

  /*
    GfE (2001) eqs. 1.4.3, 2.1.5

    Equation for energy requirement for milk production taken from GfE (2001) equation 1.4.3. Equation for protein 
    requirement for milk production taken from GfE (2001) equation 2.1.5.

    The multiplication with 2.1 in the protein requirement equation is again a result of assuming an efficiency of using
    absorbed amino acid N of 75%, an absorbability of amino acid N of 85% and a proportion of amino acid N of
    non-ammonia-N in chyme of 73%.

    production  [{NEL, uCP}]  
    milk        [kg]
    fat         [%]
    protein     [%]
    p           [#]           parity
  */

  var production = function (milk, fat, protein, p) {

    if (p > 0) {
    
      var NEL = milk * (0.38 * fat + 0.21 * protein + 0.95 + 0.1)
        , uCP = milk * protein * 10 * 2.1
        ;

      return {
          E: NEL
        , P: uCP
      };

    } else {
      
      return {
          E: 0
        , P: 0
      };      
    
    }

  };

  /*
    GfE (2001) eqs 1.4.5, 2.2.2, Jeroch (2008) p. 410

    cows

    Equation for energy requirement for gestation taken from GfE (2001) equation 1.4.5. Equation for protein requirement
    for gestation taken from GfE (2001) equation 2.2.2.

    The equation for energy requirements summarizes the energetic value of the developed tissue in the uterus and the
    foetus (0.044 * e^(0.0165*d)) and the developed tissue of the udder (0.8 and 1.5 MJ, respectively) and then
    multiplies with 5.71 to get the requirement. (Assuming an efficiency of using energy for gestation of 17.5%.)

    GfE recommends to link the protein requirements of dry cows not to the N requirement of the cow but to the N
    requirement of the ruminal microbes: uCP supply for dry cows should be a minimum of 1080 [g day-1] during 42-21 days
    before calving and 1170 uCP [g day-1] during the last 21 days before calving, respectively.

    young stock 

    GfE (2001) doesn´t mention additional energy and protein requirements for gestation. For energy, the recommendation
    from Jeroch (2008), who recommends adding extra energy during the last 6 weeks of gestation, was implemented.

    GfE (2001) doesn´t give information on protein requirement for gestation, rather the requirement for gestation is
    included in the requirement for body weight gain.

    gestation [{NEL or ME, uCP}]
    WG        [week]              Week of gestation (1-40)
    DIM       [day]               Days in milk (assume cow dry if zero)
    p         [#]                 parity
  */

  var gestation = function (WG, DIM, p) {

    if (p > 0) {

      var NEL = 0
        , uCP = 0
        ;

      if (WG > 0) {

        if (WEEKS_GESTATION_PERIOD - WG < 3)
          NEL = ((0.044 * exp(0.0165 * WG * 7)) + 1.5) * 5.71;
        else if (WEEKS_GESTATION_PERIOD - WG < 8)
          NEL = ((0.044 * exp(0.0165 * WG * 7)) + 0.8) * 5.71;
        else
          NEL = ((0.044 * exp(0.0165 * WG * 7)) + 0.0) * 5.71;
        
        uCP = (1.9385 * exp(0.0108 * WG * 7)) * 6.25 * 2.3;

        /* minimum recommended protein requirements for dry cows */
        if (DIM === 0) { 

          if (uCP < 1170 && WG > WEEKS_GESTATION_PERIOD - 3)
            uCP = 1170;
          else if (uCP < 1080 && WG > WEEKS_GESTATION_PERIOD - 6)
            uCP = 1080;

        }

      }
      
      return {
          E: NEL
        , P: uCP
      };

    } else {

      var ME = 0
        , uCP = 0
        ;

      if (WG > 0) {

        if (WEEKS_GESTATION_PERIOD - WG < 3)
          ME = 30;
        else if (WEEKS_GESTATION_PERIOD - WG < 6)
          ME = 20;

      }
      
      return {
          E: ME
        , P: uCP
      };

    }

  };

  /*
    GfE (2001)

    cows

    Equations for energy mobilization and weight gain taken from GfE (2001) page 22 and 23, respectively. Equation for
    protein mobilization taken from GfE (2001) chapter 2.1.1.3.
   
    The GfE does not give information in which stages of lactation mobilization and reconstitution of body reserves is
    to be expected. 80-85% of the energy content of body reserves is assumed to be used for milk production.

    Mobilization of protein at the beginning of lactation is not included in calculations. Net protein content of 1 kg
    body weight gain is assumed to be 138 g if body weight of the cow exceeds 550 kg and daily body weight gain is less
    than 500 g. Multiplication with 2.3 results from assuming an efficiency of using absorbed amino acid N of 70%, an
    absorbability of amino acid N of 85% and a proportion of amino acid N of non-ammonia-N in chyme of 73%.

    young stock

    Equation for energy requirements for body weight gain taken from GfE (2001) p. 28 equ. 1.5.1

    Information on protein requirement for body weight gain taken from GfE (2001) p. 48 and 50

    Both the energy and protein requirements for body weight gain are based on the net energy and protein retention of
    the heifer. GfE (2001) doesn´t supply equations for the calculation of energy and protein retention, but gives a
    Table (1.5.1) with discrete values depending on body weigth and body weight gain. Based on these discrete values
    from Table 1.5.1, linear regressions for the calculation of energy and protein retention were produced which are
    valid for heifers with body weights between 150 and 550 kg and body weight gains between 400 and 800 g per day, and
    which had coefficients of determination of 0.94 (energy) and 0.92 (protein).    

    TODO:
    - Die GfE gibt zwei Untergrenzen für die Proteinversorgung der Aufzuchtrinder an: die Proteinzufuhr soll 12 g XP
    MJ-1 ME nicht unterschreiten, und die Ration soll mindestens 9 % XP enthalten. Blöderweise geben sie diese
    Empfehlungen in Rohprotein an, nicht in uCP. Können wir (zum. eines davon) das trotzdem irgendwie einbauen?

    weight  [{NEL or ME, uCP}]
    BWC     [kg]                body weight change
    BW      [kg]                body weight
    p       [#]                 parity
   */

  var weight = function (BWC, BW, p) {

    if (p > 0) {

      var NEL = 0
        , uCP = 0
        ;

      if (BWC < 0) {
        NEL = BWC * 20.5;
      } else {
        NEL = BWC * 25.5;
        uCP = BWC * 317.4;
      }

      return {
          E: NEL
        , P: uCP
      };

    } else {

      var ME = 0
        , uCP = 0
          /* RE [MJ] energy retention, expressed in MJ per day */
        , RE = -10.729 + BW * 0.02059 + BWC * 17.8868
          /* RN [g] protein retention, expressed in g per day */
        , RN = 61.1959 - BW * 0.08728 + BWC * 89.8389
        ;

      ME = RE * 2.5;
      uCP = RN * 2.3;

      return {
          E: ME
        , P: uCP
      };

    }

  };

  return {
      main: maintenance
    , prod: production
    , gest: gestation
    , weit: weight
    , actv: activity
  };

}());

/*
  MTT (2014)

  cows

  Nutrient requirements of dairy cows according to the Finnish system of feed evaluation and requirements. Latest print
  version using "feed values" instead of ME, which is used now. The last description of the Finnish system of feed evaluation
  published in print is MTT (2006). Since then all updates have been published online, hereafter quoted as MTT (2014). 

  Energy is expressed in MJ ME (metabolisable energy) and protein is expressed in g MP (metabolisable protein).

  young stock

  Nutrient requirements of dairy heifers according to the Finnish system of feed evaluation and requirements.
  The latest print version still used "feed values" instead of ME, which is used now.

  Energy is expressed in MJ ME (metabolisable energy) and protein is expressed in g MP (metabolisable protein).

  MTT doesn´t mention an energy addition due to grazing for the heifers, but the NRC approach as described above will be
  used nonetheless.
*/

var fi = (function () {

  /*
    MTT (2014)

    cows

    All equations for energy requirements taken from website, chapter "Energy requirements of dairy cows".
    All equations for protein requirements taken from website, chapter "Protein requirements of dairy cows".

    young stock

    Information taken from website, chapter "Energy requirements of growing heifers".

    The MTT website provides a Table which gives the sum of the energy requirements of heifers for maintenance and
    growth. The original equations (separated into requirements for maintenance and growth) which were used to calculate
    the energy requirements were provided by Rinne (2014), who states that the equations used for young cattle ME
    requirements in Finland are based on AFRC (1990) and were modified by Mikko Tuori (University of Helsinki, 1955) and
    further by Arto Huuskonen (MTT Agrifood Research Finland, 2010).

    For the protein requirements for maintenance and growth, MTT only provides a Table for heifers smaller than 200 kg
    (see website, chapter "Protein requirements of growing cattle"). From the values in this Table, a linear regression
    for calculating protein requirements depending on body weight and body weight change was produced, which is valid
    for heifers with body weights between 100 and 200 kg and body weight gains between 0.5 and 1.6 kg per day, and which
    had a coefficient of determination of 0.99. 
    For all heifers heavier than 200 kg, protein intake is assumed to be adequate if the protein balance in the rumen
    (PBV) of the total diet is not lower than -10 g per kg feed. In SOLID-DSS, the PBV values will not be used. Instead,
    Rinne (2014) recommended to use a minimum recommendation of 90 g CP in the total diet.
    k_m (efficiency of using ME for maintenance) is assumed as 0.712.

    TODO:
  - Wie bauen wir die Mindestempfehlung von 90 g XP in der Gesamtration für die heifers > 200 kg ein?

    maintenance [{ME, MP}]          adjusted for share of forages in diet (acc. to AFBI, see explanation above)
    BW          [kg]                body weight
    DMI         [kg]                Dry matter intake (if unknow assume IC ~ DMI @ FV = 1)
    f           [kg (DM) kg-1 (DM)] share of forage in diet
    BWC         [kg]                body weight change
    type        [enum]              type of cow, dairy or dual (purpose)
    p           [#]                 parity 
  */

  var maintenance = function (BW, DMI, f, BWC, type, p) {

    if (p > 0) {

      var ME = 0.515 * pow(BW, 0.75)
        , MP = 1.8 * pow(BW, 0.75) + 14 * DMI
        ;

      if (f) {
        if (f < 0.3)
          ME = 0.492 * pow(BW, 0.75);
        else if (f >= 0.3 && f <= 0.99)
          ME = 0.515 * pow(BW, 0.75);
        else
          ME = 0.560 * pow(BW, 0.75);
      }

      return {
          E: ME
        , P: MP
      };

    } else {

      var ME = (0.53 * pow(BW / 1.08, 0.67) + 0.0071 * BW ) / 0.712
        , MP = -36.3373 + BW * 0.8879 + BWC * 247.1739
        ;

      ME = (type === 'dual') ? ME * 0.9 : ME;

      /*if (BW > 200)
        XP should be at least 90 g*/

      return {
          E: ME
        , P: MP
      };

    }

  };

  /*
    MTT (2014)

    ECM is calculated according to Sjaunja et al. (1990)

    production  [{ME, MP}]  
    milk        [kg]
    fat         [%]
    protein     [%]
    p           [#]

    TODO: there is a correction equation for energy intake!
    jv: Hm, I would argue that we do not need it if use INRA intake. Because feed interaction is covered there, isn't it?
      On the other hand that might mean that we also have to remove ME from gb maint. requirements????
  */

  var production = function (milk, fat, protein, p) {
  
    if (p > 0) {

      var ECM = milk * (383 * fat + 242 * protein + 783.2) / 3140
        , ME = 5.15 * ECM
        , MP = (1.47 - 0.0017 * ECM) * (milk * protein * 10 /* to g kg-1 */)
        ;

      return {
          E: ME
        , P: MP
      };

    } else {

      return {
          E: 0
        , P: 0
      };

    }

  };

  /*
    MTT (2014)

    According to Rinne (2014), the energy and protein requirements for young stock gestation are calculated similar to 
    the older cows.

    gestation [{ME, MP}] 
    WG        [1-40]      week of gestation
  */

  var gestation = function (WG) {

    var ME = 0
      , MP = 0
      ;

    if (WG > 0) {
      if (WG / WEEKS_IN_MONTH > 8) {
        ME = 34.0;
        MP = 205.0;
      } else if (WG / WEEKS_IN_MONTH > 7) {
        ME = 19.0;
        MP = 135.0;
      } else if (WG / WEEKS_IN_MONTH > 6) {
        ME = 11.0;
        MP = 75.0;
      }
    }
    
    return {
        E: ME
      , P: MP
    };

  };

  /*
    MTT (2014)

    young stock 

    The equation for calculating the energy requirements for weight gain is not provided on the website, but was
    supplied by Rinne (2014), details see above. k_f, the efficiency of using ME for body weight gain, is assumed as
    0.474.

    The protein requirement for body weight gain is included in the requirements for maintenance, details see above.

    weight [{ME, MP}]
    BWC    [kg]       body weight change
    BW     [kg]       body weight
    type   [enum]     type of cow, dairy or dual (purpose)
    p      [#]        parity 
  */

  var weight = function (BWC, BW, type, p) {

    if (p > 0) {

      var ME = 0
        , MP = 0
        ;

      if (BWC < 0) {
        ME = BWC * 28.0;
        MP = BWC * 138.0;
      } else {
        ME = BWC * 34.0;
        MP = BWC * 233.0;
      }

      return {
          E: ME
        , P: MP
      };

    } else {

      var ME = (((4.1 + 0.0332 * BW - 0.000009 * BW * BW) / (1 - 0.1475 * BWC)) * 1.15 * BWC) / 0.474
        , MP = 0
        ;

      ME = (type === 'dual') ? ME * 0.9 : ME;

      return {
          E: ME
        , P: MP
      };

    }

  };

  /* FOR THE SAKE OF COMPLETENESS: fi energy correction

    The Finnish nutrient requirements for dairy cows includes a correction equation for energy intake, which in SOLID-DSS
    is probably not usable, because it requires knowledge of the total diet when calculating intake. (Which in SOLID-DSS
    is calculated before diets are formulated.) However, we want to estimate feed intake according to the Finnish equation
    and correct it using their correction equation after the solver has produced the diets and then check to see how big
    the difference between the Finnish energy intake and the energy intake based on the results from the solver is.

    The last description of the Finnish system of feed evaluation published in print is MTT (2006). Since then all updates
    have been published online, quoted as MTT (2014).

    Energy values of feeds are expressed in Finnish MJ ME, details see feed.evaluation.js

    REFERENCES

    MTT 2006. Rehutaulukot ja ruokintasuositukset (Feed tables and feeding recommendations). Agrifood Research Finland,
    Jokioninen, Finland, 84 p.

    MTT 2014. Rehutaulukot ja ruokintasuositukset (Feed tables and feeding recommendations) [online]. Agrifood
    Research Finland, Jokioinen. Accessed last on November 20, 2014, available at:
    https://portal.mtt.fi/portal/page/portal/Rehutaulukot/feed_tables_english


    Estimation of feed intake according to MTT (2014)

    In Finland, feed intake of dairy cows is estimated using the energy requirements and an average diet energy
    concentration, assuming that energy supply is adequate and the cow is neither mobilizing nor reconstituting body
    reserves.

    f_intake  [kg (DM)]       Estimated feed intake, kg DM
    ME_req    [MJ ME]         Total energy requirements of a cow per day
    ME_avg    [MJ kg-1 (DM)]  Average energy concentration of the total diet
  */

  var f_intake = function (ME_req, ME_avg) {

    return ME_req / ME_avg;

  };

  /*
    Calculation of corrected energy intake according to MTT (2014)

    The Finnish feed evaluation system uses constant energy values for feeds and doesn´t take associative effects of feeds
    and effects of feeding level into account. As a remedy, the energy intake of the cow is corrected in order to consider
    effects of increased dry matter intake, high energy diets and diets with low crude protein concentration. 

    f_intake_corr [MJ ME]        Corrected energy intake
    f_intake      [kg (DM)]      Estimated feed intake, kg DM
    ME_avg        [MJ kg-1 (DM)] Average energy concentration of the total diet
    CP_avg        [g kg-1 (DM)]  Average crude protein concentration of the total diet
  */

  var f_intake_corr = function (f_intake, ME_avg, CP_avg) {

    return f_intake * ME_avg - (-56.7 + 6.99 * ME_avg + 1.621 * f_intake - 0.44595 * CP_avg + 0.00112 * CP_avg * CP_avg);
    
  };  

  return {
        main: maintenance
      , prod: production
      , gest: gestation
      , weit: weight
      , actv: activity
    };

}());

/*
  FiM (2004), AFRC (1993)

  cows

  Nutrient requirements of dairy cows according to the British system of feed evaluation and requirements.

  Energy is expressed in MJ ME (metabolisable energy) and protein is expressed in g MP (metabolisable protein). Feed
  into Milk (FiM) recommends adding a 5 % safety margin to the total energy and protein requirements. This is not 
  included in the following equations.

  young stock

  While the energy and protein requirements of the dairy cows are calculated as described in Feed into Milk (FiM 2004),
  FiM doesn´t mention heifers, therefore all information about the energy and protein requirements of dairy heifers is
  taken from AFRC (1993).

  Energy is expressed in MJ ME (metabolisable energy) and protein is expressed in g MP (metabolisable protein).

  AFRC doesn´t mention an activity addition because of grazing for the dairy heifers, but the NRC approach as described
  above will be used nonetheless.
*/

var gb = (function () {

  /*
    cows

    Instead of the original FiM equation to calculate energy requirements for maintenance, the equations produced by
    SOLID Task 3.3 (Dong et al. 2014, see above) are used. In this case, incorporating the new AFBI equations in a TOTAL
    way is appropriate, because they were developed within the British system of feed evaluation and requirements.

    Assuming an average fill value of 1, the IC (FV) value produced by GrazeIn is used instead of DMI (kg)

    young stock

    AFRC (1993) doesn´t differentiate between the energy requirements for maintenance, growth and gestation, instead
    a Table giving the total energy and protein requirements for growing heifers depending on body weight, daily weight
    gain and (for energy requirement only) energy density of the diet is supplied (Table 5.5)
    Based on the values from Table 5.5, linear regressions for calculating energy and protein requirements for
    maintenance and body weight gain depending on body weight, body weight gain and energy density of the diet were
    produced which are valid for heifers with body  weight between 100 and 600 kg and body weight gains between 0.5 and
    1.0 kg per day, and which had coefficients of determination of 0.98 (energy) and 0.99 (protein).

    Assuming an average fill value of 1, the IC (FV) value produced by GrazeIn is used instead of DMI (kg)    

    maintenance [{ME, MP}]          Adjusted for share of forages in diet (by AFBI)
    BW          [kg]                Body weight
    DMI         [kg]                Dry matter intake (if unknow assume IC ~ DMI @ FV = 1)
    ME_total    [MJ kg-1 (DM)]      Energy supply of the total diet
    f           [kg (DM) kg (DM)]   Share of forage in diet (optional)
    fat         [kg d-1]            Amount of fat supplied by the total diet
    ME_ferm     [MJ kg-1 (DM)]      Energy contribution of fermentation acids in the feeds, sum of the total diet
    BWC         [kg]                body weight change
    p           [#]                 parity
  */

  var maintenance = function (BW, DMI, ME_total, f, fat, ME_ferm, BWC, p) {

    if (p > 0) {

      /* ME_fat [MJ kg-1 (DM)] energy contribution of oils and fat in the feeds, sum of the total diet.
        If fat is not available we assume 3.5% fat in ration i.e. the average in relevant fresh forages */
      if (is_null_or_undefined(fat))
        var ME_fat = 0.035 * 35;
      else
        var ME_fat = 35 * fat;

      /* ME_ferm is the energy contribution of the fermentation acids, so this part only applies to silage. When the 
        amounts of fermentation acids are not know, an average value of 0.10 * ME is used.
        If ME_ferm is not available we assume 10% fermentation acids in silage, and 6.5 kg silage in the diet, with an
        energy content of 11.2 MJ ME */
      if (is_null_or_undefined(ME_ferm))
        ME_ferm = 6.5 /* kg (DM) silage */ * 11.2 /* ME kg-1 */ * 0.1 /* fraction of fermentation acids kg-1 */;

      var ME = 0.68 * pow(BW, 0.75)

        /*
          FiM (2004) p. 23f, NRC (2001) p. 18ff

          The equation for protein requirements for maintenance summarizes the endogenous N losses via urine (4.1 *W^0.5),
          hair and scurf (0.3 * W^0.6) and feces (metabolic fecal protein, MFP = 30 * DMI). Also an adjustment is included
          for the fraction of intestinally indigestible rumen-synthesized microbial protein that is degraded from the hind
          gut and absorbed as ammonia (0.5 * ((DMTP/0.8) - DMTP). FiM adopted these four equations from NRC (2001).

          Endogenous protein supply at the intestine is estimated to be about 15% of NAN flow, and the efficiency of
          synthesis of endogenous protein from MP is assumed to be 0.67. The net effect of endogenous protein is modeled
          with the term 2.34*DMI.

          DMTP (digestible microbial true protein, g d-1) is calculated acc. to equation 3.19 in FiM (2004):

          DMTP = 0.6375 * MCP

          MCP = microbial crude protein, g d-1

          MCP is calculated acc. to AFRC (1993) page 16:

          MCP, g d-1 = 11 * FME

          FME = fermentable metabolisable energy, MJ kg-1 DM = ME - ME_fat - ME_ferm
        */

        , DMTP = 0.6375 * 11 * (ME_total - ME_fat - ME_ferm)
        , MP = 4.1 * pow(BW, 0.5) + 0.3 * pow(BW, 0.6) + 30.0 * DMI - 0.5 * ((DMTP / 0.8) - DMTP) + 2.34 * DMI
        ;

      if (f) {
        if (f < 0.3)
          ME = 0.65 * pow(BW, 0.75);
        else if (f >= 0.3 && f <= 0.99)
          ME = 0.68 * pow(BW, 0.75);
        else
          ME = 0.74 * pow(BW, 0.75);
      }

      return {
          E: ME
        , P: MP
      };

    } else {
          /* TODO: exclude feed level adjustment in SOLID-DSS. Use 11 MJ ME/kg TM instead of ME_total / DMI */
      var ME = 22.2136 - ME_total / DMI * 3.3290 + BW * 0.1357 + BWC * 48.5855
        , MP = 80.7936 + BW * 0.3571 + BWC * 223.1852
        ;

      return {
          E: ME
        , P: MP
      };

    }

  };

  /*
    AFRC (1993), Tyrell (1965)

    The energy requirements for milk production are not calculated acc. to FiM (2004), because FiM calculates energy 
    requirements for maintenance and milk production together and uses an efficiency of using energy for lactation (k_l)
    that changes with increasing energy intake. Because in SOLID-DSS energy requirements for maintenance are calculated
    acc. to Dong et al. (2014), energy requirements for milk production cannot be calculated acc. to FiM (2004).

    The k_l value of 0.62 is taken from Dong et al. (2014). The equation for calculating the energy value of milk is
    taken from Tyrell and Reid (1965), which is used both by AFRC (1993) and FiM (2004).

    production  [{ME, MP}]  
    milk        [kg]
    fat         [%]
    protein     [%]
    p           [#]         parity
  */

  var production = function (milk, fat, protein, p) {

    if (p > 0) {

      var energy_value_of_milk = 0.0376 * fat * 10.0 + 0.0209 * protein * 10.0 + 0.948 /* fat and protein in g per kg */
        , ME = (milk * energy_value_of_milk) / 0.62

        /*
          ARFC (1993) eqs. 87, 88

          The crude protein of milk contains 0.95 true protein. The efficiency of utilization of absorbed amino acids for 
          milk protein synthesis is assumed to be 0.68.
        */

        , MP = (milk * protein * 10.0 * 0.95 ) / 0.68 /* protein in g per kg */
        ;

      return {
          E: ME
        , P: MP
      };

    } else {

      return {
          E: 0
        , P: 0
      };

    }

  };

  /*
    Equation for energy requirement for gestation taken from FiM (2004) p. 16 and accompanying CD p., adapted from
    AFRC (1993) equations 70, 71, 72

    Equation for protein requirement for gestation taken from FiM (2004) p. 24 and accompanying CD p. 16, adapted from
    AFRC (1993), equations 109 and 110. The efficiency of utilizing MP for pregnancy is assumed to be 0.85.

    gestation [{ME, MP}]
    WG        [week]      Week of gestation (1-40)
    p         [#]         parity
  */

  var gestation = function (WG, p) {

    if (p > 0) {

      var ME = 0
        , MP = 0
          /* EGU (FiM 2004) = E_t (AFRC 1993) = energy retention in the gravid foetus */
        , EGU = exp(((151.665 - (151.64 * exp(-0.0000576 * WG * 7)))) * 2.30258)
          /* TtT (FiM 2004) = TP_t (AFRC 1993) = net protein retention for pregnancy to produce a 40 kg calf */
        , TtT = 1000 * exp(log(10) * (3.707 - (5.698 * exp(-0.00262 * WG * 7))))   
        ;

      if (WG > 0) {

        if (WG * 7 >= 250)
          ME = EGU * (0.0201 * exp(-0.0000576 * WG * 7)) / 0.133;

        MP = TtT * (0.03437 * exp(-0.00262 * WG * 7)) / 0.85;
      
      }

      return {
          E: ME
        , P: MP
      };

    } else {

      return {
          E: 0
        , P: 0
      };

    }

  };

  /*
    FiM (2004) eqs. 2.2, 2.3, AFRC (1993) eqs. 114, 115

    Equation for energy supply from weight loss and gain from FiM (2004).

    Feed into Milk does not give any information in which stages of lactation mobilization and reconstitution of body
    reserves is to be expected. For weight loss, an efficiency of utilizing mobilized body protein for milk production
    of 1.0 is assumed. The net energy value of 1 kg live weight gain is assumed to be 19.3 MJ, and the efficiency of 
    utilizing ME for weight gain is assumed to be 65%. This equation is different from AFRC (1993), where older 
    equations based on castrated males of medium-sized cattle breeds were used.

    Equation for protein supply from weight loss and gain from AFRC (1993).

    The net protein content of empty body weight change is 150 g / kg, which is equivalent to 138 g kg-1 live weight
    gain. The efficiency of utilizing MP for weight gain is assumed to be 0.59, and 138 / 0.59 = 233. The efficiency of
    utilizing MP for pregnancy is assumed to be 0.85.

    weight  [{ME, MP}]
    BWC     [kg]        body weight change
    p       [#]         parity
  */

  var weight = function (BWC, p) {

    if (p > 0) {

      var ME = 0
        , MP = 0
        ;

      if (BWC < 0) {
        ME = 19.3 * BWC * 0.78;
        MP = BWC * 138.0;
      } else {
        ME = 19.3 * BWC / 0.65
        MP = BWC * 233.0;
      }

      return {
          E: ME
        , P: MP
      };

    } else {

      return {
          E: 0
        , P: 0
      };

    }

  };

  /*
    AFRC (1993)
    
    The calculation of energy required for activity is the same as in AFRC 1993. We do not use this function but add 
    it for the sake of completeness. Adjustment for activity is done with equations from NRC.

    activity_   [{ME, MP}]
    BW          [kg]        Body weight
    DMI         [kg]        Total dry matter intake
    ME_intake   [MJ]        Total intake of ME
  */

  var activity_ = function (BW, DMI, ME_intake) {

    var MP = 0
      /* efficiency of utilization of ME for maintenance */
      , k_m = 0.019 * (ME_intake / DMI) + 0.503
      , ME =  (0.0013 * BW) / k_m
      ;

    return {
        E: ME
      , P: MP
    };

  };

  return {
      main: maintenance
    , prod: production
    , gest: gestation
    , weit: weight
    , actv: activity
  };

}());

/*
  Agabriel, J. (ed.) (2010)

  cows
  
  Energy and protein requirements according to the French system of feed evaluation and requirements. Energy is
  expressed as UFL (unité fourragere lait) and protein is expressed as g PDI, true protein.

  Information about energy mobilization is taken from Jarrige (1989).

  young stock

  Energy and protein requirements according to the French system of feed evaluation and requirements.

  Agabriel (2010) mostly refers to Jarrige (1988) with regard to the energy and protein requirements for dairy heifers,
  therefore most of the references are from Jarrige (1989).

  Energy is expressed as UFL (unité fourragere lait) and protein is expressed as g PDI (true protein).

  INRA doesn´t mention an activity addition due to grazing for heifers, but the NRC approach as described
  above will be used nonetheless.

  The energy and protein requirements for gestation are not calculated separately, but are included in the
  requirements for growth.
*/

var fr = (function () {

  /*
    Agabriel (2010) eqs. 2.7, 2.16, Dong (2014)

    cows

    Energy requirements for maintenance adjusted for forage proportion acc. to Dong et al. (2014), see above.

    young stock

    Equation for energy requirement for maintenance taken from Agabriel (2010) p. 94, 95 and Table 5.1.
    Equation for protein requirement for maintenance taken from Agabriel (2010) p. 94.
    For calculating k_m and k_l according to Agabriel (2010) Table 8.1, q (ME/GE) is assumed to be 0.57.

    maintenance [{UFL, PDI}]      Adjusted for share of forages in diet (by AFBI)
    BW          [kg]              Body weight
    DMI         [kg]              Dry matter intake (if unknow assume IC ~ DMI @ FV = 1)
    f           [kg (DM) kg (DM)] Share of forage in diet
    p           [#]               parity
  */

  var maintenance = function (BW, DMI, f, p) {

    if (p > 0) {

      var UFL = 0.041 * pow(BW, 0.75)
        , PDI = 3.25 * pow(BW, 0.75)
        ;

      if (f) {
        if (f < 0.3)
          UFL = 0.039 * pow(BW, 0.75); /* k_l = 0.60 */
        else if (f >= 0.3 && f <= 0.99)
          UFL = 0.041 * pow(BW, 0.75);
        else
          UFL = 0.045 * pow(BW, 0.75);
      }

      return {
          E: UFL
        , P: PDI
      };

    } else {

          /* k_m [0-1] efficency of using ME for maintenance */
      var k_m = 0.287 * 0.57 + 0.554
          /* k_l [0-1] efficency of using ME for lactation TODO: (0.57-0.57)? */
        , k_l = 0.60 + 0.24 * (0.57-0.57)
        , UFL = (((90 * pow(BW, 0.75)) * k_l ) / k_m) / 1700
        , PDI = 3.25 * pow(BW, 0.75)
        ;

      return {
          E: UFL
        , P: PDI
      };

    }

  };

  /*
    Agabriel (2010) eqs. 2.9, 2.18

    production  [{UFL, PDI}]  
    milk        [kg]          Milk yield in kg raw milk
    fat         [%]           Milk fat content
    protein     [%]           Milk protein content
    p           [#]           parity
  */

  var production = function (milk, fat, protein, p) {

    if (p > 0) {

      /* % to g kg-1 */
      fat *= 10;
      protein *= 10;

      var UFL = milk * (0.44 + (0.0055 * (fat - 40)) + (0.0033 * (protein - 31)));
      var PDI = (milk * protein) / 0.64;

      return {
          E: UFL
        , P: PDI
      };

    } else {

      return {
          E: 0
        , P: 0
      };      

    }

  };

  /*
    Agabriel (2010) eqs. 2.14, 2.19

    gestation   [{UFL, PDI}]  
    WG          [week]        Week of gestation (1-40)
    WB          [kg]          Birthweight of calf
    p           [#]           parity
  */

  var gestation = function (WG, WB, p) {

    if (p > 0) {

      var UFL = 0
        , PDI = 0
        ;

      if (WG > 0) {
        UFL = 0.00072 * WB * exp(0.116 * WG);
        PDI = 0.07 * WB * exp(0.111 * WG);
      }

      return {
          E: UFL
        , P: PDI
      };

    } else {

      return {
          E: 0
        , P: 0
      };      

    }

  };

  /*
    cows

    Energy requirement and supply for and from weight change taken from Jarrige (1989) p. 75.

    Protein supply from weight change taken from Agabriel (2010) p. 31, paragraph below eq. 2.24.

    The French system does not include protein requirements for reconstitution of body reserves.

    young stock

    Equation for calculating energy requirement for growth taken from Agabriel (2010) p. 95 and equation 5.1

    Equation for calculating protein requirement for growth taken from Jarrige (1989) p.

    Both the energy and protein requirements for growth depend on the composition of the body weight gain, and the
    parameters GLIP and GPROT represent the daily gain of fat and protein, respectively. GLIP and GPROT are calculated
    using a model originally published by Robelin and Daenicke (1980), which is used in an updated form in Agabriel
    (2010). For use in SOLID-DSS, the animal category "early maturing heifer" (génisses précoces en croissance) was
    chosen, and the growth model is valid for such heifers with body weights between 200 and 480 kg.

    For calculating k_l and k_f according to Agabriel (2010) Table 8.1, q (ME/GE) is assumed to be 0.57.

    k_PDI values were taken from Jarrige (1989) Table 9.3

    weight  [{UFL, PDI}]  
    BW      [kg]          body weight
    BWC     [kg]          body weight change
    WL      [week]        week of lactation
    p       [#]           parity
  */

  var weight = function (BW, BWC, WL, p) {

    if (p > 0) {
    
      var UFL = 0
        , PDI = 0
        ;

      if (BWC < 0) {
        /* 3.5 = 4.5 * 0.8; 80 % of the energy content of body reserves is used for milk production */
        UFL = BWC * 3.5;
      } else {
        UFL = BWC * 4.5;
      }

      if (BWC < 0 && WL <= 8)
        PDI = 40 * UFL;

      return {
          E: UFL
        , P: PDI
      };

    } else {

          /* EBW [kg] empty body weight, Agabriel (2010) p. 96 equation 5.9, with C_0 = 0.482 and C_1 = 1.096 */
      var EBW = 0.482 * pow(BW, 1.096)
          /*LIP [kg] lipid content of the body weight, Agabriel (2010) p. 96 equation 5.13*/
        , LIP = 0.001 * pow(EBW, (1.883))
          /*FFBW[kg] fat free body weight*/
        , FFBW = BW - LIP
          /*PROT [kg] protein content of the body weight, Agabriel (2010) p. 97 equation 5.14*/
        , PROT = 0.1436 * pow(FFBW, (1.0723))
          /* EBWC [kg] empty body weight change, Agabriel (2010) p. 97 equation 5.16, with C_1 = 1.096 */
        , EBWC = (EBW / BW) * 1.096 * BWC
          /* GLIP [kg] daily gain of fat, Agabriel (2010) p. 97 equation 5.17, with B_0 = 0.001 and B_1 = 1.883 */
        , GLIP = 0.001 * 1.883 * pow(EBW, (1.883-1)) * EBWC
          /*FFBWC [kg] fat free body weight change*/
        , FFBWC = BWC - GLIP
          /* GPROT [kg] daily gain of protein */
        , GPROT = PROT / FFBW * FFBWC * 1.0723
          /* RE [Mcal day-1] energy retention */
        , RE = 5.48 * GPROT + 9.39 * GLIP
          /* k_l [0-1] efficency of using ME for lactation */
        , k_l = 0.60 + 0.24 * (0.57-0.57)
          /* k_f [0-1] efficency of using ME for growth */
        , k_f = 0.78 * 0.57 + 0.006
          /* k_PDI [0-1] efficency of using PDI for growth */
        , k_PDI = 0
        , UFL = ((RE * k_l) / k_f ) / 1.7
        , PDI = 0
        ;

      if (BW <= 400)
        k_PDI = 0.68;
      else if (400 < BW <= 600)
        k_PDI = 0.53;
      else
        k_PDI = 0.28;

      PDI = (GPROT * 1000) / k_PDI;

      return {
          E: UFL
        , P: PDI
      };

    }

  };

  /*
    Agabriel (2010) eqs. 2.8, 2.17 

    Implemented for the sake of completeness: We use our own growth function.

    growth  [{UFL, PDI}]  
    AGE     [month]       age of the cow
  */

  var growth = function (AGE) {

    var UFL = 3.25 - 0.08 * AGE
      , PDI = 422 - 10.4 * AGE
      ;

    return {
        E: UFL
      , P: PDI
    };

  };

  return {
      main: maintenance
    , prod: production
    , gest: gestation
    , weit: weight
    , actv: activity
  };

}());

return {
    de: de
  , fi: fi
  , gb: gb
  , fr: fr
};

}());
