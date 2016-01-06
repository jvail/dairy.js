/*
  Simple, deterministic herd structure model

  LICENSE

  Copyright 2014 Jan Vaillant   <jan.vaillant@zalf.de>
  Copyright 2014 Lisa Baldinger <lisa.baldinger@boku.ac.at>

  Distributed under the MIT License. See accompanying file LICENSE or copy at http://opensource.org/licenses/MIT

  Any publication for which this file or a derived work is used must include an a reference to:

  Vaillant, J. and Baldinger, L. 2016. 
  Application note: An open-source JavaScript library to simulate dairy cows and young stock,
  their growth, requirements and diets.
  Computers and Electronics in Agriculture, Volume 120, January 2016, Pages 7–9
  
  TODO
  
    - add calving pattern option (seasonal)
    - add parity 4 (>3) to output
*/

var dairy = dairy || {};

dairy.herd = (function () {

var pow = Math.pow
  , round = Math.round
  , floor = Math.floor
  , ceil = Math.ceil
  , IT_MIN = 1e2 /* min iterations */
  , IT_MAX = 1e6 /* max. iterations */
  , WEEKS_IN_MONTH = 30.5 / 7
  ;

/* constant parameters with default values */
var cons = {
    ageFirstCalving: 24
  , femaleCalfRate: 0.47
  , stillBirthRate: 0.07
  , youngStockCullRate: 0.155
  , replacementRate: 0.30
  , calvingInterval: 12.0
  , herdSize: 100
  , gestationPeriod: 9.0
  , dryPeriode: 2.0
};  

/* variables */
var vars = {
    /* stores cow object of cows of same age in month per index 
      age is month after first calving 
      {
          no:   no. of cows
        , lac:  lactation no.
        , dry:  if cow is dry
        , WG:   week of gestation
        , WL:   week of lactation  
      } */
    cows: []
    /* no. of young stock per age month since birth */
  , young: []
    /* no. of cows */
  , noCows: 0
  , heifersBought: []
  , heifersSold: []
  , lac: []
  , sim: []
};

/* 
  run simulation until herd structure does not change anymore (or no. cows equals zero)
  returns an array of with young stock count per age month and cows with
  
  lac [#]     lactation no.
  dry [bool]  if cow is dry
  WG  [#]     week of gestation
  WL  [#]     week of lactation
  age [month]

  initialize parameters (object)

  ageFirstCalving     [month]
  femaleCalfRate      [-]     fraction female calfes of all calves born
  stillBirthRate      [-]     fraction of dead born calves
  youngStockCullRate  [-]     fraction of young stock that do not make it to 1st lactation
  replacementRate     [-]     fraction of cows replaced each year
  calvingInterval     [month] month inbetween clavings
  herdSize            [#]     no. of cows in herd
  gestationPeriod     [month] length gestation period
  dryPeriode          [month] length dry period
*/

var get = function (options) {

  /* overwrite default default values if provided and valid */
  for (var prop in options) {
    if (options.hasOwnProperty(prop))
      cons[prop] = (typeof options[prop] === 'number' && !isNaN(options[prop])) ? options[prop] : cons[prop];
  }

  /* reset values */
  vars.cows = [];
  vars.young = [];
  vars.noCows = 0;
  vars.heifersBought = [];
  vars.heifersSold = [];
  vars.sim = [];

  /* varriable shortcuts */
  var ci = cons.calvingInterval
    , hs = cons.herdSize
    , dp = cons.dryPeriode
    , gp = cons.gestationPeriod
    , sb = cons.stillBirthRate
    , yc = cons.youngStockCullRate
    , fc = cons.femaleCalfRate
    , ac = cons.ageFirstCalving
    , rr = cons.replacementRate
    , cows = vars.cows
    , young = vars.young
    , converged = false
    , its = 0 /* no. iterations */
    ;

  /* initialize cow array with some meaningfull values to have a starting point
    cows at age ageFirstCalving + m within calving interval. eqal distribution of status througout calvingInterval */
  var l = 0;
  while (l < 4) { /* just set cows up to lactation 4 (could be any) */ 
    
    for (var m = 0; m < ci; m++) {
      cows[m + l * (ci - 1)] = { 
          no: (hs / ci) / 4 /* devide by 4 because we only initialize for cows till fourth lactation */
        , lac: l + 1
        , dry: (m >= ci - dp) ? true : false
        , WG: (m >= ci - gp) ? (ci - gp) * WEEKS_IN_MONTH : 0
        , WL: (m >= ci - dp) ? 0 : m * WEEKS_IN_MONTH
        , age: ac + ci * (l - 1) + m
      };
      vars.noCows += (hs / ci) / 4;
    }

    l++;
  }

  /* Initialize young stock array. Apply death rate equally distributed as compound interest: 
    K_interest = K_start * (1 + p / 100)^n <=> p / 100 = (K_interest / K_start)^(1/n) - 1
    K_start = (hs / ci) *  (1 - sb) * fc */
  young[0] = (hs / ci) *  (1 - sb) * fc * pow(1 - yc, 1 / ac);
  for (var m = 1; m < ac; m++)
    young[m] = young[m - 1] * pow(1 - yc, 1 / ac); /* no. young stock per age month */

  /* loop until converged i.e. avg. lactation within herd with no. cows equals herd size does not change anymore.
    Each iteration step equals one month */
  while (!converged) {

    /* remove culled young stock */
    for (var y = 0, ys = young.length; y < ys; y++)
      young[y] = young[y] * pow(1 - yc, 1 / ac);

    /* replacement per month; add newly replaced animals to the beginning of the array
      all age classes within herd are equally replaced */

    var newFemaleCalves = 0;
    if (young[young.length - 1] > 0 ) { // heifers available
      /* add new calves to young cattle */
      /* from heifers */
      newFemaleCalves += young[ac - 1] * (1 - sb) * fc;
      /* from cows */
    }

    vars.noCows = 0;
    /* start at age group previously c = 0 */
    for (var c = 0, cs = cows.length; c < cs; c++) {

      var cow = cows[c];

      if (cow.no > 0) {

        /* replacement */
        cow.no = cow.no * (1 - (rr / 12)) // avg monthly replacement
        cow.age++;

        // update pregnancy, dry ...
        if (!cow.dry) {
          cow.WL += WEEKS_IN_MONTH;
          if (cow.WG > 0) {
            cow.WG += WEEKS_IN_MONTH;
          } else {
            if (cow.WL > (ci - gp) * WEEKS_IN_MONTH)
            cow.WG = WEEKS_IN_MONTH;
          }
          /* check if now dry */
          if (cow.WL > (ci - dp) * WEEKS_IN_MONTH) {
            cow.WL = 0;
            cow.dry = true;
          }
        } else { // dry cows
          cow.WG += WEEKS_IN_MONTH;
          /* check if cow calved */
          if (cow.WG > gp * WEEKS_IN_MONTH) {
            newFemaleCalves += cow.no * (1 - sb) * fc;
            cow.lac += 1;
            cow.dry = false;
            cow.WG = 0;
            cow.WL = 0;
          }
        }

      }

      vars.noCows += cow.no;

    } // cows loop

    /* no. available heifers form young stock */
    var noHeifers = young.pop();
    /* move only the no. of heifers that are needed to keep/reach total herdSize */
    var noHeifersToHerd = (vars.noCows < hs) ? ((hs - vars.noCows < noHeifers) ? (hs - vars.noCows) : noHeifers) : 0;
    vars.heifersSold.unshift(noHeifers - noHeifersToHerd);
    
    var noHeifersBought = 0;
    if (noHeifersToHerd < hs - vars.noCows) {
      noHeifersToHerd = hs - vars.noCows;
      noHeifersBought = hs - vars.noCows + noHeifersToHerd;
    }
    vars.heifersBought.unshift(noHeifersBought);

    cows.unshift({
        no: noHeifersToHerd
      , lac: 1
      , dry: false
      , WG: 0
      , WL: 0
      , age: ac
    });

    vars.noCows += noHeifersToHerd;

    /* add new female calves at beginning of array and apply culling rate */
    young.unshift(newFemaleCalves * pow(1 - yc, 1 / ac));

    /* calculate cows per lactation */
    vars.lac = [];
    for (var c = 0, cs = cows.length; c < cs; c++) {
      if (!vars.lac[cows[c].lac - 1]) 
        vars.lac[cows[c].lac - 1] = 0;
      vars.lac[cows[c].lac - 1] += cows[c].no;
    }  

    var lacSum = 0;
    /* calculate avg. lactation */
    for (var l = 0, ls = vars.lac.length; l < ls; l++) {
      lacSum += vars.lac[l] * (l + 1);
    }

    /* debug max. lac 20 */
    for (var l = 0; l < 20; l++) {
      if (!vars.sim[l])
        vars.sim[l] = [];
      var no = vars.lac[l];
      vars.sim[l].push(no ? no : 0);
    }

    if ((its > IT_MIN && round(vars.noCows) === hs && Math.round(avg_lac * 1e6) === round(lacSum / vars.noCows * 1e6)) 
      || its > IT_MAX || round(vars.noCows) === 0 || isNaN(vars.noCows)) {
      converged = true;
    }

    var avg_lac = lacSum / vars.noCows;
    its++;

  } /* simulation loop */

  var herd = {
      cowsPerLac: []
    , cows: []
    , sim: vars.sim
    , heifersBought: round(vars.heifersBought[0])
    , heifersSold: round(vars.heifersSold[0])
    , young: []
  };

  /* add young stock */
  for (var i = 0, is = vars.young.length; i < is; i++)
    herd.young.push({ age: i + 1, no: round(vars.young[i]) });

  /* we need only cows of parity 1, 2 or >2. Code below as option? */
  // var sum = 0;
  // for (var l = 0, ls = vars.lac.length; l < ls; l++) {
  //   if (sum === hs)
  //     break;
  //   if (sum + ceil(vars.lac[l]) > hs)
  //     herd.cowsPerLac[l] = hs - sum;
  //   else  
  //     herd.cowsPerLac[l] = ceil(vars.lac[l]);
  //   sum += herd.cowsPerLac[l]; 
  // }

  herd.cowsPerLac[0] = round(vars.lac[0]);
  herd.cowsPerLac[1] = round(vars.lac[1]);
  herd.cowsPerLac[2] = hs - (herd.cowsPerLac[0] + herd.cowsPerLac[1]);

  for (var l = 0, ls = herd.cowsPerLac.length; l < ls; l++) {
    
    var DPP_increment = ci * 30.5 / ((herd.cowsPerLac[l] === 1) ? Math.random() * ci : herd.cowsPerLac[l]);
    var DPP = DPP_increment * 0.5;
    
    for (var c = 0, cs = herd.cowsPerLac[l]; c < cs; c++) {
    
      herd.cows.push({
          DPP: round(DPP)
        , isDry: (DPP > 30.5 * (ci - dp)) ? true : false  
        , DIM: (DPP > 30.5 * (ci - dp)) ? 0 : round(DPP)  
        , DG: (DPP - 30.5 * (ci - gp) > 0) ? round(DPP - 30.5 * (ci - gp)) : 0 
        , AGE: round(ac + l * ci + DPP / 30.5) 
        , AGE_days: round((ac + l * ci) * 30.5 + DPP) 
        , P: l + 1
      });

      DPP += DPP_increment;

    }

  }

  return herd;

};

return {
  get: get
};

}());
