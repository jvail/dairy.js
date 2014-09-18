/*
  Dairy diet calculation.

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

dairy.diet = (function () {

var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function'
  , ENVIRONMENT_IS_WEB = typeof window === 'object'
  , ENVIRONMENT_IS_WORKER = typeof importScripts === 'function'
  , glpk = null
  , callback = function (result) {};
  ;

/* GLPK 4.53 constants */
var GLP_MIN = 1  /* minimization */
  , GLP_MAX = 2  /* maximization */

    /* kind of structural variable: */
  , GLP_CV  = 1  /* continuous variable */
  , GLP_IV  = 2  /* integer variable */
  , GLP_BV  = 3  /* binary variable */

    /* type of auxiliary/structural variable: */
  , GLP_FR  = 1  /* free (unbounded) variable */
  , GLP_LO  = 2  /* variable with lower bound */
  , GLP_UP  = 3  /* variable with upper bound */
  , GLP_DB  = 4  /* double-bounded variable */
  , GLP_FX  = 5  /* fixed variable */

  , GLP_MSG_OFF = 0  /* no output */
  , GLP_MSG_ERR = 1  /* warning and error messages only */
  , GLP_MSG_ON  = 2  /* normal output */
  , GLP_MSG_ALL = 3  /* full output */
  , GLP_MSG_DBG = 4  /* debug output */

    /* solution status: */
  , GLP_UNDEF  = 1  /* solution is undefined */
  , GLP_FEAS   = 2  /* solution is feasible */
  , GLP_INFEAS = 3  /* solution is infeasible */
  , GLP_NOFEAS = 4  /* no feasible solution exists */
  , GLP_OPT    = 5  /* solution is optimal */
  , GLP_UNBND  = 6  /* solution is unbounded */
  ;

if (ENVIRONMENT_IS_NODE) {
  glpk = require('./lib/glpk.js');
} else if (ENVIRONMENT_IS_WEB) {
  glpk = new Worker('./lib/glpk.js');
  glpk.onmessage = function (evt) {

    if (typeof evt.data === 'object')
      callback(evt.data);
    else
      console.log(evt.data);

  };
}

var get = function (cow, feeds, options) {

  callback = options.cb;

  var RNB_ub = options.RNB_ub
    , RNB_lb = options.RNB_lb
    , conc_mx = options.conc_mx /* should not be larger than 0.5 */
    , eval_sys = options.eval_sys
    , LP = {
        name: name,
        objective: {
          direction: GLP_MAX,
          name: 'obj',
          vars: []
        },
        subjectTo: [],
        bounds: []
      }
    ;

  LP.objective.vars.push({
    name: 'dE',
    coef: -10 
  });

  LP.objective.vars.push({
    name: 'sE',
    coef: -10 
  });

  LP.objective.vars.push({
    name: 'dP',
    coef: -1 
  });

  LP.objective.vars.push({
    name: 'sP',
    coef: -1 
  });

  var subjectTo = [];

  var E_const = {
    name: 'E',
    vars: [ 
      { name: 'dE', coef:  1 },
      { name: 'sE', coef: -1 },
    ],
    bnds: { type: GLP_FX, ub: 1.0, lb: 1.0 } 
  }; 

  var P_const = {
    name: 'P',
    vars: [ 
      { name: 'dP', coef:  1 },
      { name: 'sP', coef: -1 },
    ],
    bnds: { type: GLP_FX, ub: 1.0, lb: 1.0 } 
  }; 

  var RNB_bnd_type = -1;
  if (RNB_lb === RNB_ub)
    RNB_bnd_type = GLP_FX;
  else if (RNB_lb === -Infinity && RNB_ub === Infinity)
    RNB_bnd_type = GLP_FR;
  else if (RNB_lb === -Infinity && RNB_ub < Infinity)
    RNB_bnd_type = GLP_UP;
  else if (RNB_lb > -Infinity && RNB_ub === Infinity)
    RNB_bnd_type = GLP_LO;
  else if (RNB_lb != -Infinity && RNB_ub != Infinity)
    RNB_bnd_type = GLP_DB;

  var RNB_const = {
    name: 'RNB',
    vars: [],
    bnds: { 
      type: RNB_bnd_type,
      ub: RNB_ub,
      lb: RNB_lb 
    } 
  };

  var IC_const = {
    name: 'IC',
    vars: [],
    bnds: { type: GLP_FX, ub: cow.IC, lb: cow.IC } 
  };

  var CC_const = {
    name: 'CC',
    vars: [],
    bnds: { type: GLP_UP, ub: 0, lb: 0 } 
  };

  /* add selected feeds */
  for (var f = 0, fs = feeds.length; f < fs; f++) {

    var feed = feeds[f];

    if (conc_mx === 0 && feed.type === 'concentrate')
      continue;

    E_const.vars.push({
      name: 'F_' + feed.id,
      coef: feed[eval_sys].E / cow.req[eval_sys].total.E
    });

    P_const.vars.push({
      name: 'F_' + feed.id,
      coef: feed.de.P / cow.req.de.total.P
    });

    RNB_const.vars.push({
      name: 'F_' + feed.id,
      coef: feed.de.RNB
    });

    if (feed.type === 'concentrate') {

      IC_const.vars.push({
        name: 'F_' + feed.id,
        coef: cow.FV_c
      });

      CC_const.vars.push({
        name: 'F_' + feed.id,
        coef: (1 - conc_mx) / conc_mx
      });

    } else {

      IC_const.vars.push({
        name: 'F_' + feed.id,
        coef: feed.fr.FV
      });

      CC_const.vars.push({
        name: 'F_' + feed.id,
        coef: -1
      });

    }

  }    

  subjectTo.push(E_const);
  subjectTo.push(P_const);
  subjectTo.push(RNB_const);
    subjectTo.push(IC_const);
  if (conc_mx > 0)
    subjectTo.push(CC_const);

  LP.subjectTo = subjectTo;

  if (ENVIRONMENT_IS_NODE)
    return glpk.solve(LP, GLP_MSG_ALL);
  else if (ENVIRONMENT_IS_WEB && typeof callback === 'function')
    return glpk.postMessage({ lp: LP, msg_lev: GLP_MSG_DBG });
  else
    return null;

};

return {
  get: get
};

}());
