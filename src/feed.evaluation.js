/*
  The energetic value of feeds is described using four different country-specific systems of feed evaluation, the
  German, Finnish, British and French system.

  Energy is the first limiting factor for the performance of a dairy cow, apart from feed intake capacity, therefore
  the accuracy of the energetic evaluation of the feeds is of great importance for the accuracy of SOLID-DSS as a whole.
  Offering several different systems of energy evaluation also improves the usability of SOLID-DSS. This first version
  of SOLID-DSS includes the above mentioned four systems of energy evaluation, but adding further systems is desirable.

  For the protein evaluation of feeds, only the German uCP system is used.

  Generally speaking, the protein value of a feed is related to the degradability of the protein in the rumen, the
  content of amino acids in the undegraded crude protein and the digestibility of the amino acids in the undegraded
  dietary protein. Internationally, there is a trend towards sophisticated systems of protein evaluation that take the
  dynamics of feed digestion into account and describe the nitrogen metabolism in the gastro-intestinal tract of
  ruminants.

  The British system of protein evaluation, for example, is one of those sophisticated systems, requring digestibility
  parameters analysed with in vitro and NIRS methods.

  The diet model of SOLID-DSS is used in conjunction with the plant growth models. Unfortunately none of the plant
  growth models available today can supply the data needed to characterize feeds according to the British system of
  protein evaluation.

  That is why the German uCP system, which is the simplest out of the four above-mentioned country-specific systems of
  feed evaluation, is used for all countries in SOLID-DSS. Even though the amount of utilizable protein at the
  duodenum is defined as the sum of ruminally undegraded protein and microbial protein, the uCP content of a feed is
  calculated with simple empirical equations.

  In a comparison between the German uCP system with the Finnish system and the NRC (2001), using data from US
  production experiments, Schwab et al. (2005) found that the German uCP system predicted milk protein yield as well or
  even better than the NRC and Finnish system, despite being much simpler. The fact that the German uCP system performed
  well in comparison with more sophisticated systems, despite its simplicity, encourages its use for SOLID-DSS.

  Feed intake is predicted according to GrazeIn, a system based on the fill value system of INRA (Agabriel 2010). In
  order to calculate the fill values of the forages, the parameters QIL (for dairy cows) and QIB (for dairy heifers)
  are calculated, see below.

  REFERENCES

  Agabriel, J. 2010. Alimentation des bovins, ovins et caprins. Besoins des animaux - Valeurs des aliments. Tables
  INRA 2010. Editions Quae, France.
  
  Feed into Milk 2004. Feed into Milk. A new applied feeding system for dairy cows. An advisory manual.
  Ed. C. Thomas. Nottingham University Press, UK.
  
  GfE [Society of Nutrition Physiology] 2001. Empfehlungen zur Energie- und Nährstoffversorgung der Milchkühe und
  Aufzuchtrinder [Recommendations on the energy and nutrient supply for dairy cows and heifers] DLG-Verlag, Frankfurt/
  Main, Germany.
  
  Lebzien, P., Voigt, J., Gabel, M. und Gädeken, D. 1996. Zur Schätzung der Menge an nutzbarem Rohprotein am Duodenum
  von Milchkühen. [On the estimation of utilizable crude protein at the duodenum of dairy cows] Journal of Animal
  Physiology and Animal Nutrition 76:218-223.
  
  MTT 2006. Rehutaulukot ja ruokintasuositukset (Feed tables and feeding recommendations). Agrifood Research Finland,
  Jokioninen, Finland, 84 p.
  
  MTT 2014. Rehutaulukot ja ruokintasuositukset (Feed tables and feeding recommendations) [online]. Agrifood
  Research Finland, Jokioinen. Accessed last on November 20, 2014, available at:
  https://portal.mtt.fi/portal/page/portal/Rehutaulukot/feed_tables_english
  
  Schwab, G.C., Huhtanen, P., Hunt, C.W. and Hvelplund, T. 2005. Nitrogen requirements of cattle. Pages 13-70 in
  Pfeffer, E., and Hristov, A.N. (ed.). Nitrogen and Phosphorus Nutrition of Cattle. CABI Publishing, Wallingford, UK.

  Tran, G. et Sauvant, D. 2002. Page 22 in Sauvant D., Perez J.-M. et Tran G. (eds.) Tables de composition et de
  valeur nutritive des matières premières destinées aux animaux d´élevage: porcs, volailles, bovins, ovins, caprins,
  lapins, chevaux, poissons. Paris, Inra-AFZ, France, 301 p.

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

var feed = feed || {};

feed.evaluation = (function () {

/*
  The German system of feed evaluation is described in GfE (2001)

  Energy is expressed in MJ net energy lactation (NEL)

  Protein is expressed in g utilizable crude protein at the duodenum (uCP)
*/

var de = (function () {

  /*
    Equation for calculating gross energy (GE) taken from GfE (2001) equation 1.1.1

    GE  [MJ kg-1 (DM)]  gross energy
    CP  [g kg-1 (DM)]   crude protein, e.g. 235   
    EE  [g kg-1 (DM)]   ether extracts, e.g. 43
    CF  [g kg-1 (DM)]   crude fibre, e.g. 172
    OM  [g kg-1 (DM)]   organic matter, e.g. 905
  */

  var GE = function (CP, EE, CF, OM) {

    return 0.0239 * CP + 0.0398 * EE + 0.0201 * CF + 0.0175 * (OM - EE - CP - CF);
    
  };

  /*
    Equation for calculating metabolizable energy (ME) taken from GfE (2001) equation 1.1.2

    ME  [MJ kg-1 (DM)]  metabolizable energy
    CP  [g kg-1 (DM)]   crude protein, e.g. 235   
    EE  [g kg-1 (DM)]   ether extracts, e.g. 43
    EED [kg kg-1]       digestibility of ether extracts, e.g. 0.61
    CF  [g kg-1 (DM)]   crude fibre, e.g. 172
    CFD [kg kg-1]       digestibility of crude fiber, e.g. 0.81
    OM  [g kg-1 (DM)]   organic matter, e.g. 905
    OMD [kg kg-1]       digestibility of organic matter, e.g. 0.84
  */

  var ME = function (CP, EE, EED, CF, CFD, OM, OMD) {

    var ME = 0;    

    /*contents of digestible ether extracts, digestible crude fiber and digestible organic matter [g kg-1 (DM)]*/
    var dEE = EE * EED;
    var dCF = CF * CFD;
    var dOM = OM * OMD;

    /* metabolizable energy [MJ kg-1 (DM)], e.g. 12.0 */
    ME = 0.0312 * dEE + 0.0136 * dCF + 0.0147 * (dOM - dEE - dCF) + 0.00234 * CP;

    return ME;
    
  };

  /*
    Equation for calculating the metabolizability (q) taken from  GfE (2001) page 17

    Equation for calculating net energy for lactation (NEL) taken from GfE (2001) equation 1.3.1

    NEL [MJ kg-1 (DM)]  net energy for lactation, e.g. 7.04
    ME  [MJ kg-1 (DM)]  metabolizable energy
    GE  [MJ kg-1 (DM)]  gross energy
  */

  var NEL = function (ME, GE) {

    var NEL = 0;

    /*the metabolizability is the factor between GE and ME, e.g. 64*/
    var q = ME / GE * 100;

    /* net energy for lactation [MJ kg-1 (DM)]*/
    NEL = 0.6 * (1 + 0.004 * (q - 57)) * ME;

    return NEL;

  };

  /*
    Equation for calculating utilizable crude protein at the duodenum (uCP) taken from GfE (2001) Table 2.1.1, equation
    1a, originally published by Lebzien et al. (1996). (In the above mentioned comparison between different systems of
    protein evaluation done by Schwab et al. (2005), equation 1a was used as well.)

    uCP [g kg-1 (DM)]   utilizable crude protein
    ME  [MJ kg-1 (DM)]  metabolizable energy
    CP  [g kg-1 (DM)]   crude protein
  */

  var uCP = function (ME, CP) {

    return 8.76 * ME + 0.36 * CP; 
    
  };


  /*
    Apart from satisfying the cow´s requirement of uCP, the German system also calculates the ruminal nitrogen balance
    in order to ensure an adequate supply of ruminally available protein for the ruminal microbes.

    Equation for calculating the ruminal nitrogen balance (RNB) taken from GfE (2001) page 45

    RNB [g kg-1 (DM)] ruminal nitrogen balance, e.g. 4
    CP  [g kg-1 (DM)] crude protein, e.g. 235
    uCP [g kg-1 (DM)] utilizable crude protein, e.g. 220
  */

  var RNB = function (CP, uCP) {

    return (CP - uCP) / 6.25; 
    
  };

  return {
      GE: GE
    , ME: ME
    , E_f: NEL
    , E_c: NEL
    , uCP: uCP
    , RNB: RNB
  };

}());

var fi = (function () {

  /*
    The last description of the Finnish system of feed evaluation published in print is MTT (2006). Since then all
    updates have been published online, hereafter quoted as MTT (2014). 

    Equations for calculating the energy contents of forages taken from the sub-site "Energy value, ruminants" of
    MTT (2014)

    Energy is expressed in MJ metabolizable energy (ME)

    ME_f  [MJ kg-1 (DM)]      metabolizable energy content of a forage, e.g. 11.4 
    OM    [g kg-1 (DM)]       organic matter, e.g. 915
    OMD   [kg kg-1]           digestibility of organic matter, e.g. 0.78
    type  [enum]              grasssilage (default), hay, straw, wholecropsilage

    TODO: Im finnischen System gibts eine correction equation for energy intake, die auf der supply-Seite angewendet
    wird. Das ist noch zu klären ob und wie wir das anwenden.
  */

  var ME_f = function (OMD, OM, type) {

    /* In the MTT feed tables, the content of digestible organic matter in dry matter is called D-value, but because
    using the same terminology in all country-specific systems makes SOLID-DSS less susceptible to errors, the term dOM
    is used instead [g kg-1 (DM)]*/
    var dOM = OM * OMD;

    /* grass silage and other feeds */
    var ME_f = 0.016 * dOM;

    /*in Finland, maize silage is not commonly used. However, in case of using maize silage, the equation for wholecrop
    cereal silages can be used for maize silage as well. Consequently, the equation for maize silage is the same as the
    one for whole crop silages.*/

    if (type === 'hay')
      ME_f = 0.0169 * dOM - 1.05;
    if (type === 'maizesilage')
      ME_f = 0.0155 * dOM;
    else if (type === 'straw')
      ME_f = 0.014 * dOM;
    else if (type === 'wholecropsilage')
      ME_f = 0.0155 * dOM;

    return ME_f;    

  };

  /*
    Equations for calculating the energy contents of concentrates taken from the sub-site "Energy value, ruminants" of
    MTT (2014)

    Energy is expressed in MJ metabolizable energy (ME)
    
    The feed table included in SOLID-DSS gives the NfE digestibility of the feeds, but the plant growth models in
    SOLID-DSS don´t supply the digestibility of NfE, therefore the following calculation is mainly given for reasons of
    completeness.

    ME_c  [MJ kg-1 (DM)]      metabolizable energy of a concentrate, e.g. 12.2
    CP    [g kg-1 (DM)]       crude protein content, e.g. 125
    CPD   [kg kg-1]           digestibility of crude protein, e.g. 0.71
    CF    [g kg-1 (DM)]       crude fibre, e.g. 103
    CFD   [kg kg-1]           digestibility of crude fiber, e.g. 0.30
    EE    [g kg-1 (DM)]       ether extract content, e.g. 60
    EED   [kg kg-1]           digestibility of ether extracts, e.g. 0.84
    NFE   [g kg-1 (DM)]       nitrogen free extracts, e.g. 500
    NFED  [kg kg-1]           digestibility of nitrogen free extracts, e.g. 0.83
  */

  var ME_c = function (CP, CPD, CF, CFD, EE, EED, NFE, NFED) {

    var dCP = CP * CPD;
    /*content of digestible crude protein*/
    var dEE = EE * EED;
    /*content of digestible ether extracts*/
    var dCF = CF * CFD;
    /*content of digestible crude fiber*/
    var dNFE = NFE * NFED;
    /*content of digestible nitrogen free extracts*/

    var ME_c = (15.2 * dCP + 34.2 * dEE + 12.8 * dCF + 15.9 * dNFE) * 1e-3;

    return ME_c;    

  };

  return {
      E_f: ME_f
    , E_c: ME_c
  };

}());

var gb = (function () {

  /*
    The British system of feed evaluation is described in Feed into Milk (2004)

    Energy is expressed in MJ metabolisable energy (ME)

    Only the energy values of forages are calculated, the energy values of concentrates are taken from the feed table
    that comes with SOLID-DSS. The reason is that the plant growth models can´t supply the parameters NCGD and AHEE,
    which are needed for the calculation of the energy content of concentrates. NCGD is the neutral detergent cellulase
    plus gammanase digestibility, which is a modified version of Van Soest´s NDF. AHEE is the acid hydrolysed ether
    extract, meaning that before ether extraction the feed is hydrolysed with hydrochloric acid.

    ME              [MJ kg-1 (DM)]  metabolizable energy, e.g. 12.8
    OM              [g kg-1 (DM)]   organic matter, e.g. 911
    OMD             [kg kg-1]       digestibility of organic matter, e.g. 0.88
    is_grass_or_hay [bool]
  */

  var ME_f = function (OM, OMD, is_grass_or_hay) {

    /* In Feed into Milk, the content of digestible organic matter in dry matter is called DOMD, expressed in %, so the
    equation is ME = 0.16 * DOMD. Because using the same terminology in all country-specific systems makes SOLID-DSS less
    susceptible to errors, the term dOM is used instead [g kg-1 (DM)], so the equation is ME = 0.016 * dOM*/
    var dOM = OM * OMD;

    var ME_f = 0.016 * dOM;

    if (is_grass_or_hay)
      ME_f = 0.015 * dOM;

    return ME_f;

  };

  return {
      E_f: ME_f
    , E_c: ME_f
  };

}());

var fr = (function () {

  /*
    The French system of feed evaluation is described in Agabriel (2010)

    Energy is expressed in unité fourragére lait (UFL). One UFL equals the net energy for lactation of 1 kg standard
    barley.

    Equations for calculating energy values (UFL) of forages taken from Agabriel (2010) Tables 8.1, 8.8 and 8.9.

    In order to provide values for feeding level (L), the requirements (req_m, req_t) according to the French system are
    used, details see dairy.requirements.
  
    UFL_f   [UFL kg-1 (DM)] energy content of a forage, e.g. 0.89
    OMD     [kg kg-1]       digestibility of organic matter, e.g. 0.72
    OM      [?]
    CP      [g kg-1 (DM)]   crude protein content, e.g. 134
    CF      [g kg-1 (DM)]   crude fibre content, e.g. 296
    type    [enum]          simplified INRA calculation; maize or grass silage
    DM      [%]             dry matter content
    delta_F1
    pH      []              pH of grass silage
    wilted  [bool]          grasssilage wilted (true) or grassilage short cut and directly ensiled 
    req_m   [UFL]           maintenance requirements
    req_t   [UFL]           total requirements
  */

  var UFL_f = function (OMD, OM, CP, CF, type, DM, delta_F1, pH, wilted, req_m, req_t) {

    var UFL_f = 0
        /* default in case grass silage pH is not available */
      , pH = pH || 4.8
      ;

    /*contents of crude protein and crude fibre in organic matter, g kg-1 OM*/
    var CP_o = CP / OM * 1000;
    var CF_o = CF / OM * 1000;

 /* gross energy [kcal kg-1 (OM)] content per kg organic matter of fresh fodder, hay and haylage */
    var GE_o = 4531 + 1.735 * CP_o + delta_F1;
    if (type === 'freshsorghum') {
      GE_o = 4478 + 1.265 * CP_o;
    } else if (type === 'freshmaize') {
      GE_o = 4487 + 2.019 * CP_o;
    } else if (type === 'maizesilage') {
      if (DM <= 30)
        GE_o = 1.02 * (4487 + 2.019 * CP_o);
      else
        GE_o = 4487 + 2.019 * CP_o + 25;    
    } else if (type === 'grassilage') {
      if (wilted)
        GE_o = 1.03 * (3910 + 2.45 * CP_o + 169.9 * pH)
      else
        GE_o = 3910 + 2.45 * CP_o + 169.9 * pH;
    } else if (type === 'dehydrated alfalfa') {
      GE_o = 4618 + 2.051 * CP_o;
    }

    /*
    delta_F1  []  feed material correction coefficient:
                    grasses = -71
                    clover, sainfoin, grass from mountainous areas, hay from leys and whole crops = -11
                    fresh alfalfa and fresh fodder and hay from permanent grassland = + 82
    */

    /*For the remaining steps of the energy calculation, GE is needed on dry matter basis*/
    var GE = (GE_o * OM) / 1000;

    /* digestibility of energy [%] in fresh grasses and legumes, e.g. 68
    In INRA the values for OMD are in %, e.g. 80. Because using the same terminology in all country-specific systems
    makes SOLID-DSS less susceptible to errors, OMD is used in kg kg-1, just like in the other systems. Consequently,
    the French equations for dE (%) were adjusted.*/
    var dE = 0.957 * (OMD * 100) - 0.068;
    if (type === 'freshmaize')
      dE = 0.997 * (OMD * 100) - 2.53;
    if (type === 'maizesilage')
      dE = 1.001 * (OMD * 100) - 2.86;
    if (type === 'grasssilage')
      dE = 1.0263 * (OMD * 100) - 5.723;
    if (type === 'dehydrated alfalfa')
      dE = 1.003 * (OMD * 100) - 3.00;
    if (type === 'straw')
      dE = 0.985 * (OMD * 100) - 2.949;
    else if (type === 'hay')
      dE = 0.985 * (OMD * 100) - 2.556;

    /* feeding level, e.g. 1.5 */
    var L = req_t / req_m;

    /*energy losses due to urine excretion and gaseous losses products of digestion = the energy loss between digestible
    energy (DE) and metabolizable energy (ME), e.g. 0.81*/
    var ME_DE = (84.17 - 0.0099 * CF_o - 0.0196 * CP_o + 2.21 * L) / 100;

    /* ME [kcal kg-1 (DM)], e.g. 2536 */
    var ME = GE * (dE/100) * ME_DE;

    /* efficiency of utilizing metabolizable energy for milk production = energy lost as heat, e.g. 0.60*/
    var k_l = 0.463 + 0.24 * ME / GE;

    /*net energy for lactation, NEL [kcal kg-1 (DM)], e.g. 1512*/
    var NEL = ME * k_l;

    /*UFL_f kg-1 DM, e.g. 0.89*/
    UFL_f = ME * k_l / 1700;

    return UFL_f;

  };

  /*
    Equations for calculating energy values (UFL) of concentrates taken from Agabriel (2010) Tables 8.1, 8.8 and 8.9.

    UFL_c     [kg-1 (DM)]     energy content of a concentrate
    OMD       [kg kg-1]       digestibility of organic matter, e.g. 0.72
    OM        [?]
    CP        [g kg-1 (DM)]   crude protein, e.g. 111
    EE        [g kg-1 (DM)]   ether extracts, e.g. 67
    CF        [g kg-1 (DM)]   crude fibre, e.g. 135
    NDF       [g kg-1 (DM)]   neutral detergent fibre, e.g. 336
    ash       [g kg-1 (DM)]   ash, e.g. 30
    req_m     [UFL]           maintenance requirements
    req_t     [UFL]           total requirements
    delta_C1  []              feed material group correction coefficient taken from Tran et Sauvant (2002)

    corn gluten meal = 308
    alfalfa protein concentrate = 248
    wheat distillery by-products, wheat gluten feed, maize bran, rice bran = 138
    full fat rapeseed, full fat linseed, full-fat cottonseed, cottonseed meal = 116
    oats, wheat milling by-products, corn gluten feed and other maize starch by-products, maize feed
    flour, sorghum = 75
    dehydrated grass, straw = 46
    barley = 36
    linseed meal, palm kernel meal, full fat soybean, soybean meal, sunflower meal, sunflower seed = -46
    cassava = -55
    faba bean, lupin, pea = -87
    sugar beet pulp, molasses, vinasse, potato pulp = -103
    whey = -177
    soybean hulls = -231
    all others = 0
  */

  var UFL_c = function (OMD, OM, CP, EE, CF, NDF, ash, delta_C1, req_m, req_t) {

    var UFL_c = 0;

    /*contents of crude protein and crude fibre in organic matter, g kg-1 OM*/
    var CP_o = CP / OM * 1000;
    var CF_o = CF / OM * 1000;

    /* gross energy content per kg dry matter [kcal kg-1 DM]*/
    var GE = 4134 + 1.473 * CP + 5.239 * EE + 0.925 * CF - 4.44 * ash + delta_C1;


    /* digestibility of energy [%], e.g. 72
    In INRA the values for OMD are in %, e.g. 80. Because using the same terminology in all country-specific systems
    makes SOLID-DSS less susceptible to errors, OMD is used in kg kg-1, just like in the other systems. Consequently,
    the French equations for dE (%) were adjusted.*/
    var dE = (OMD * 100) - 3.94 + 0.0104 * CP + 0.0149 * EE + 0.0022 * NDF - 0.0244 * ash;

    /* feeding level, e.g. 1 */
    var L = req_t / req_m;

    /*energy losses due to urine excretion and gaseous losses products of digestion = the energy loss between digestible
    energy (DE) and metabolizable energy (ME), e.g. 0.83*/
    var ME_DE_ratio = (84.17 - 0.0099 * CF_o - 0.0196 * CP_o + 2.21 * L) / 100

    /* ME [kcal kg (DM)], e.g. 2818 */
    var ME = GE * (dE / 100) * ME_DE_ratio;

    /* efficiency of utilizing metabolizable energy for milk production = energy lost as heat, e.g. 0.61*/
    var k_l = 0.463 + 0.24 * ME / GE;

    /*net energy for lactation, NEL [kcal kg-1 (DM)], e.g. 1709*/
    var NEL = ME * k_l;

    /*UFL_c kg-1 DM, e.g. 1.01*/
    UFL_c = NEL / 1700;

    return UFL_c;

  };

  /*
    In SOLID-DSS, feed intake is predicted according to GrazeIn (details see dairy.intake). For the calculation of the
    fill values of forages, the parameters QIL (for dairy cows) and QIB (for dairy heifers) are required.

    Equations for calculating QIL and QIB are taken from Agabriel (2010), Table 8.14.
    
    In GrazeIn, OMD is called dOM and is expressed in %, e.g. 72. Because using the same terminology in all country-
    specific systems makes SOLID-DSS less susceptible to errors, OMD is used in kg kg-1 (e.g. 0.72), just like in the
    other systems. Consequently, the equations for QIL and QIB were adjusted.

    The one expection is straw, for which Agabriel (2010) doesn´t supply an equation for calculating the fill value.
    Therefore linear regressions for the fill values of straw depending on OMD were produced based on data from the
    feed tables in Agabriel (2010) and expressed as QIL = ... and QIB = ... The linear regressions are valid for OMD
    values between 0.42 and 0.68 and fill values between 1.00 and 1.60 (QIL) and 1.07 and 2.00 (QIB). The coefficients
    of determination of the regressions are 0.23 (QIL) and 0.23 (QIB).

    QIL       [g kg-1]      ingestibility in g per kg metabolic live weight, dairy cows
    QIB       [g kg-1]      ingestibility in g per kg metabolic live weight, heifers
    OMD       [kg kg-1]     digestibility of organic matter, e.g. 0.72
    CP        [g kg-1 (DM)] crude protein content, e.g. 235
    DM        [g kg-1]      dry matter content
    type      [enum]        type of forage (fresh, silage, hay, maizesilage)
    delta_FR1 []           species adjustment parameter fresh:
                              cows (QIL)
                                perm. grassland = 0
                                grasses = -3.7
                                legumes = 1.0
                              young stock (QIB)
                                perm. grassland = 0
                                grasses = -1.6
                                legumes = 4.1
    delta_S1  []            species adjustment parameter silages:
                              cows (QIL)
                                perm. grassland = 0
                                grasses = -1.4
                                legumes = 2.8
                              young stock (QIB)
                                perm. grassland = 0
                                grasses = -1.9
                                legumes = 2.8
    delta_H1  []            species adjustment parameter hay:
                              cows (QIL)
                                perm. grassland = 0
                                grasses = -0.9
                                legumes = 2.6
                              young stock (QIB)
                                perm. grassland = 0
                                grasses = -1.4
                                legumes = 3.4
    delta_S2  []            technical adjustment parameter silage:
                              cows (QIL)
                                unwilted & w/o additives = -10.1
                                unwilted & w additives = -0.8
                                wilted = 1.6
                                haylage = 0
                              young stock (QIB)
                                unwilted & w/o additives = -9.9
                                unwilted & w additives = -0.9
                                wilted = 1.9
                                haylage = 0
    delta_H2  []            technical adjustment parameter hay:
                              cows (QIL)
                                ventilated = 6.6
                                wilted in sun & good weather = 5.5
                                wilted in sun = 0
                              young stock (QIB)
                                ventilated = 6.6
                                wilted in sun & good weather = 5.2
                                wilted in sun = 0
  */

  var QIL = function (OMD, CP, DM, type, delta_FR1, delta_S1, delta_H1, delta_S2, delta_H2) {

    var QIL = 0;

    if (type === 'fresh')
      QIL = 66.3 + 0.655 * (OMD * 100) + 0.098 * CP + 0.626 * (DM / 10) + delta_FR1;
    else if (type === 'grasssilage')
      QIL = 99.3 + 0.167 * (OMD * 100) + 0.128 * CP + delta_S1 + delta_S2;
    else if (type === 'hay')
      QIL = 82.4 + 0.491 * (OMD * 100) + 0.114 * CP + delta_H1 + delta_H2;
    else if (type === 'maizesilage')
      QIL = -76.4 + 2.39 * (OMD * 100) + 1.44 * (DM / 10);
    else if (type === 'straw')
      QIL = 140 / (1.938 - 0.013 * (OMD * 100)); 
    else 
      QIL = 66.3 + 0.655 * (OMD * 100) + 0.098 * CP + 0.626 * (DM / 10);

    return QIL;

  };

  var QIB = function (OMD, CP, DM, type, delta_FR1, delta_S1, delta_H1, delta_S2, delta_H2) {

    var QIB = 0;

    if (type === 'fresh')
      QIB = 6.44 + 0.782 * (OMD * 100) + 0.112 * CP + 0.679 * (DM / 10) + delta_FR12;
    else if (type === 'grasssilage')
      QIB = 47 + 0.228 * (OMD * 100) + 0.148 * CP + delta_S12 + delta_S22;
    else if (type === 'hay')
      QIB = 30.3 + 0.559 * (OMD * 100) + 0.132 * CP + delta_H12 + delta_H22;
    else if (type === 'maizesilage')
      QIB = -45.49 + 1.34 * (OMD * 100) + 1.15 * (DM / 10);
    else if (type === 'straw')
      QIB = 95 / (2.380 - 0.018 * (OMD * 100)); 
    else 
      QIB = 6.44 + 0.782 * (OMD * 100) + 0.112 * CP + 0.679 * (DM / 10);

    return QIB;

  };

  return {
      E_f: UFL_f
    , E_c: UFL_c
    , QIL: QIL
    , QIB: QIB
  };

}());

return {
    de: de
  , fi: fi
  , gb: gb
  , fr: fr
};

}());
