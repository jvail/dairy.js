/*
  Energy and protein requirements according to a selection of evaluation systems (DE, FI, GB, FR).

  REFERENCES

  NRC (National Research Council). 2001. Nutrient requirements of dairy cattle. Seventh edition. National Academy
  Press, Washington, D.C. USA

  GfE [Society of Nutrition Physiology] 2001. Empfehlungen zur Energie- und Nährstoffversorgung der Milchlühe und
  Aufzuchtrinder [Recommendations on the energy and nutrient supply for dairy cows and heifers] DLG-Verlag, Frankfurt/
  Main, Germany.

  AFRC (Agricultural Food and Research Council), 1993. Energy and Protein Requirements of Ruminants. An advisory
  manual prepared by the AFRC Technical Committee on Responses to Nutrients. CAB International, Wallingford, UK.

  Dong, L.F., T. Yan, C.P. Ferris, and D.A. McDowell. 2014. Comparison of energy utilisation and energetic efficiency
  of dairy cows under different input systems. In: The proceedings of the 65th Conference of European Association of
  Animal Production. p. 395, Copenhagen, Denmark.

  MTT 2006. Rehutaulukot ja ruokintasuositukset [Feed tables and feeding recommendations]. Agrifood Research Finland,
  Jokioninen, Finland. Updated version available online at:
  https://portal.mtt.fi/portal/page/portal/Rehutaulukot/feed_tables_english/nutrient_requirements/Ruminants

  Sjaunja, L.-O., L. Baevre, L. Junkarinen, J. Pedersen, and J. Setala. 1990. A Nordic proposal for an energy corrected
  milk (ECM) formula. Pages 156–157 in Proc. 27th Biennial Session of the International Committee for Animal Recording.
  Paris, France.

  Tyrell, H.F. and Reid, J.T., 1965. Prediction of the energy value of cow´s milk. Journal of Dairy Science 48,
  1215-1223.

  Feed into Milk Consortium, 2004. Feed into Milk. A new applied feeding system for dairy cows. An advisory manual.
  Ed. C. Thomas. Nottingham University Press, UK.

  Agabriel, J. (ed.) (2010). Alimentation des bovins, ovins et caprins. Besoins des animaux - Valeurs
  des aliments. Tables INRA 2010. Editions Quae, France.

  Jarrige, Robert (ed.) (1989). Ruminant nutrition: recommended allowances and feed tables. John Libbey Eurotext,France.

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

  Because all equations are based on US-American Mcal NEL, both the basic maintenance requirements and all additions
  will be calculated, and then the sum of all additions will be expressed in % of the basic requirements. So the
  output of this calculation is the addition in %, which is then used in the national requirements to upscale the
  energy requirements for maintenance accordingly.

  activity  [ME ME-1] additional maintenance requirements as fraction of total requirements
  BW        [kg]      body weight
  f         [kg kg-1] fraction pasture in diet 
  d         [km]      distance between barn and pasture
  d_v       [m]       vertical distance between barn and pasture or on pasture  
*/

var activity = function (BW, f, d, d_v) {

  var maintenance = 0.08 * pow(BW, 0.75)
    , walking = 0.00045 * BW * d
    , grazing = 0.002 * BW * f
    , hilly = 0.00003 * BW * d_v * 4
    ;

  return (walking + grazing + hilly) / maintenance;

};

/*
  GfE (2001)
  
  Nutrient requirements of dairy cows according to GfE.

  Energy is expressed in MJ NEL (net energy lactation) and protein is expressed in uCP (utilizable crude protein at the
  duodenum, the German abbreviation is nXP).

  Because DMI is predicted according to GrazeIn, the unit of IC (intake capacity) is UEL. For calculating the German
  protein requirements, IC is used as if it was expressed in kg, which means that an average fill value of 1 is assumed.
*/

var de = (function () {

  /*
    maintenance [{NEL, uCP}]        Adjusted for share of forages in diet (by AFBI)
    BW          [kg]                Body weight
    DMI         [kg]                Dry matter intake (if unknow assume IC ~ DMI @ FV = 1)
    f           [kg (DM) kg-1 (DM)] Share of forage in diet
  */

  var maintenance = function (BW, DMI, f) {

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
  */

  var production = function (milk, fat, protein) {

    var NEL = milk * (0.38 * fat + 0.21 * protein + 0.95 + 0.1)
      , uCP = milk * protein * 10 * 2.1
      ;

    return {
        E: NEL
      , P: uCP
    };

  };

  /*
    GfE (2001) eqs 1.4.5, 2.2.2

    Equation for energy requirement for gestation taken from GfE (2001) equation 1.4.5. Equation for protein requirement
    for gestation taken from GfE (2001) equation 2.2.2.

    The equation for energy requirements summarizes the energetic value of the developed tissue in the uterus and the
    foetus (0.044 * e^(0.0165*d)) and the developed tissue of the udder (0.8 and 1.5 MJ, respectively) and then
    multiplies with 5.71 to get the requirement. (Assuming an efficiency of using energy for gestation of 17.5%.)

    GfE recommends to link the protein requirements of dry cows not to the N requirement of the cow but to the N
    requirement of the ruminal microbes: uCP supply for dry cows should be a minimum of 1080 [g day-1] during 42-21 days
    before calving and 1170 uCP [g day-1] during the last 21 days before calving, respectively.

    gestation [{NEL, uCP}]
    WG        [week]        Week of gestation (1-40)
    DIM       [day]         Days in milk (assume cow dry if zero)
  */

  var gestation = function (WG, DIM) {

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

  };

  /*
    GfE (2001)

    Equations for energy mobilization and weight gain taken from GfE (2001) page 22 and 23, respectively. Equation for
    protein mobilization taken from GfE (2001) chapter 2.1.1.3.
   
    The GfE does not give information in which stages of lactation mobilization and reconstitution of body reserves is
    to be expected. 80-85% of the energy content of body reserves is assumed to be used for milk production.

    Mobilization of protein at the beginning of lactation is not included in calculations. Net protein content of 1 kg
    body weight gain is assumed to be 138 g if body weight of the cow exceeds 550 kg and daily body weight gain is less
    than 500 g. Multiplication with 2.3 results from assuming an efficiency of using absorbed amino acid N of 70%, an
    absorbability of amino acid N of 85% and a proportion of amino acid N of non-ammonia-N in chyme of 73%.

    weight  [{NEL, uCP}]
    BWC     [kg]          body weight change
   */

  var weight = function (BWC) {

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
  MTT (2006)

  Nutrient requirements of dairy cows according to the Finnish system of feed evaluation and requirements. Latest print
  version using "feed values" instead of ME, which is used now.

  Energy is expressed in MJ ME (metabolisable energy) and protein is expressed in g MP (metabolisable protein).
*/

var fi = (function () {

  /*
    MTT (2006)

    All equations for energy requirements taken from website, chapter "Energy requirements of dairy cows".
    All equations for protein requirements taken from website, chapter "Protein requirements of dairy cows".

    maintenance [{ME, MP}]          adjusted for share of forages in diet (acc. to AFBI, see explanation above)
    BW          [kg]                body weight
    DMI         [kg]                Dry matter intake (if unknow assume IC ~ DMI @ FV = 1)
    f           [kg (DM) kg-1 (DM)] share of forage in diet
  */

  var maintenance = function (BW, DMI, f) {

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

  };

  /*
    MTT (2006)

    ECM is calculated according to Sjaunja et al. (1990)

    production  [{ME, MP}]  
    milk        [kg]
    fat         [%]
    protein     [%]

    TODO: there is a correction equation for energy intake!
    jv: Hm, I would argue that we do not need it if use INRA intake. Because feed interaction is covered there, isn't it?
      On the other hand that might mean that we also have to remove ME from gb maint. requirements????
  */

  var production = function (milk, fat, protein) {
  
    var ECM = milk * (383 * fat + 242 * protein + 783.2) / 3140
      , ME = 5.15 * ECM
      , MP = (1.47 - 0.0017 * ECM) * (milk * protein * 10 /* to g kg-1 */)
      ;

    return {
        E: ME
      , P: MP
    };

  };

  /*
    MTT (2006)

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
    MTT (2006)

    weight [{ME, MP}]
    BWC    [kg]       body weight change
  */

  var weight = function (BWC) {

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

  Nutrient requirements of dairy cows according to the British system of feed evaluation and requirements.

  Energy is expressed in MJ ME (metabolisable energy) and protein is expressed in g MP (metabolisable protein). Feed
  into Milk (FiM) recommends adding a 5 % safety margin to the total energy and protein requirements. This is not 
  included in the following equations.
*/

var gb = (function () {

  /*
    Instead of the original FiM equation to calculate energy requirements for maintenance, the equations produced by
    SOLID Task 3.3 (Dong et al. 2014, see above) are used. In this case, incorporating the new AFBI equations in a TOTAL
    way is appropriate, because they were developed within the British system of feed evaluation and requirements.

    Assuming an average fill value of 1, the IC (FV) value produced by GrazeIn is used instead of DMI (kg)

    maintenance [{ME, MP}]          Adjusted for share of forages in diet (by AFBI)
    BW          [kg]                Body weight
    DMI         [kg]                Dry matter intake (if unknow assume IC ~ DMI @ FV = 1)
    ME_total    [MJ kg-1 (DM)]      Energy supply of the total diet
    f           [kg (DM) kg (DM)]   Share of forage in diet (optional)
    fat         [kg d-1]            Amount of fat supplied by the total diet
    ME_ferm     [MJ kg-1 (DM)]      Energy contribution of fermentation acids in the feeds, sum of the total diet
  */

  var maintenance = function (BW, DMI, ME_total, f, fat, ME_ferm) {

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
  */

  var production = function (milk, fat, protein) {

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

  };

  /*
    Equation for energy requirement for gestation taken from FiM (2004) p. 16 and accompanying CD p., adapted from
    AFRC (1993) equations 70, 71, 72

    Equation for protein requirement for gestation taken from FiM (2004) p. 24 and accompanying CD p. 16, adapted from
    AFRC (1993), equations 109 and 110. The efficiency of utilizing MP for pregnancy is assumed to be 0.85.

    gestation [{ME, MP}]
    WG        [week]      Week of gestation (1-40)
  */

  var gestation = function (WG) {

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
  */

  var weight = function (BWC) {

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
  
  Energy and protein requirements according to the French system of feed evaluation and requirements. Energy is
  expressed as UFL (unité fourragere lait) and protein is expressed as g PDI, true protein.

  Information about energy mobilization is taken from Jarrige (1989).
*/

var fr = (function () {

  /*
    Agabriel (2010) eqs. 2.7, 2.16, Dong (2014)

    Energy requirements for maintenance adjusted for forage proportion acc. to Dong et al. (2014), see above.

    maintenance [{UFL, PDI}]      Adjusted for share of forages in diet (by AFBI)
    BW          [kg]              Body weight
    DMI         [kg]              Dry matter intake (if unknow assume IC ~ DMI @ FV = 1)
    f           [kg (DM) kg (DM)] Share of forage in diet
  */

  var maintenance = function (BW, DMI, f) {

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

  };

  /*
    Agabriel (2010) eqs. 2.9, 2.18

    production  [{UFL, PDI}]  
    milk        [kg]          Milk yield in kg raw milk
    fat         [%]           Milk fat content
    protein     [%]           Milk protein content
  */

  var production = function (milk, fat, protein) {

    /* % to g kg-1 */
    fat *= 10;
    protein *= 10;

    var UFL = milk * (0.44 + (0.0055 * (fat - 40)) + (0.0033 * (protein - 31)));
    var PDI = (milk * protein) / 0.64;

    return {
        E: UFL
      , P: PDI
    };

  };

  /*
    Agabriel (2010) eqs. 2.14, 2.19

    gestation   [{UFL, PDI}]  
    WG          [week]        Week of gestation (1-40)
    WB          [kg]          Birthweight of calf
  */

  var gestation = function (WG, WB) {

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

  };

  /*
    Energy requirement and supply for and from weight change taken from Jarrige (1989) p. 75.

    Protein supply from weight change taken from Agabriel (2010) p. 31, paragraph below eq. 2.24.

    The French system does not include protein requirements for reconstitution of body reserves.

    mobilization  [{UFL, PDI}]  
    BWC           [kg]          body weight change
    WL            [week]        week of lactation
  */

  var weight = function (BWC, WL) {

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
