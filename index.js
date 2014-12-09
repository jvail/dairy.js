$(function () {

  initUI(run);

  var pow = Math.pow
    , exp = Math.exp
    , woodParams = []
    , herdParams = {}
    , lacdata = null
    , herd = {}
    , dryCows = []
    , colors = ['#336699', '#FF9900', '#CC0000', '#336600', '#FF3399', '#A6FF00', '#8C19A3', '#00AAE6', '#5CF22C', '#FF6600', '#806600', '#0057D9']
    , results = []
    , lmfitWorker = new Worker('./lib/lmfit-worker.js')
    , simple_statistics = ss
    , DAYS_IN_MONTH = 30.5
    , E_unit = 'NEL'
    , P_unit = 'uCP'
    , diets = []
    , violation = []
    ;

    /* index and header for result array used to create csv output */
    var index = ['age', 'age_days', 'parity', 'dpp', 'milk', 'fat', 'protein', 'ic', 'bw', 'bwc', 'E', 'P', 'group', 'dry'];
    var header = [
      'age [month]', 'age [days]', 'parity', 'days p.p.', 'milk [kg]', 'fat [%]', 
      'protein [%]', 'intake capacity [fill units]', 'body weight [kg]', 'body weight changes [kg]', E_unit + ' [MJ]', P_unit + ' [g]', 'group', 'dry'
    ];


    var GLP_MIN = 1;  /* minimization */
    var GLP_MAX = 2;  /* maximization */

    /* kind of structural variable: */
    var GLP_CV  = 1;  /* continuous variable */
    var GLP_IV  = 2;  /* integer variable */
    var GLP_BV  = 3;  /* binary variable */

    /* type of auxiliary/structural variable: */
    var GLP_FR  = 1;  /* free (unbounded) variable */
    var GLP_LO  = 2;  /* variable with lower bound */
    var GLP_UP  = 3;  /* variable with upper bound */
    var GLP_DB  = 4;  /* double-bounded variable */
    var GLP_FX  = 5;  /* fixed variable */

    var GLP_MSG_OFF = 0;  /* no output */
    var GLP_MSG_ERR = 1;  /* warning and error messages only */
    var GLP_MSG_ON  = 2;  /* normal output */
    var GLP_MSG_ALL = 3;  /* full output */
    var GLP_MSG_DBG = 4;  /* debug output */

    /* solution status: */
    var GLP_UNDEF  = 1;  /* solution is undefined */
    var GLP_FEAS   = 2;  /* solution is feasible */
    var GLP_INFEAS = 3;  /* solution is infeasible */
    var GLP_NOFEAS = 4;  /* no feasible solution exists */
    var GLP_OPT    = 5;  /* solution is optimal */
    var GLP_UNBND  = 6;  /* solution is unbounded */

  /* Wood lactation function */
  function wood(t, p) {

    return p[0] * pow(t, p[1]) * exp(p[2] * t);
  
  }

  function readSettings() {

    var feedIDs = [];
    $('#feeds-p input:checked').each(function (i, v) {

      feedIDs.push(Number($(this).attr('data-id')));

    });

    /* set units */
    var evalSys = $('#eval-sys option:selected').val();
    if (evalSys === 'de') {
      E_unit = 'NEL';
      P_unit = 'uCP';
    } else if (evalSys === 'fi') {
      E_unit = 'ME';
      P_unit = 'MP';
    } else if (evalSys === 'fr') {
      E_unit = 'UFL';
      P_unit = 'PDI';
    } else if (evalSys === 'gb') {
      E_unit = 'ME';
      P_unit = 'MP';
    }

    /* update header */
    header = [
      'age [month]', 'age [days]', 'parity', 'days p.p.', 'milk [kg]', 'fat [%]', 
      'protein [%]', 'intake capacity [fill units]', 'body weight [kg]', 'body weight changes [kg]', E_unit + ' [MJ]', 
      P_unit + ' [g]', 'group', 'dry'
    ];

    return {
        lacdata: $('textarea').val()
      , fat: ui.fat.spinner('value') 
      , protein: ui.protein.spinner('value') 
      , BW: ui.bw.spinner('value')
      , CI: ui.ci.spinner('value')
      , AC: ui.ac.spinner('value')
      , FC: ui.fc.spinner('value') / 100 /* to fraction */
      , SB: ui.sb.spinner('value') / 100 /* to fraction */
      , YC: ui.yc.spinner('value') / 100 /* to fraction */
      , RR: ui.rr.spinner('value') / 100 /* to fraction */
      , DP: ui.dp.spinner('value') / (DAYS_IN_MONTH / 7) /* to month */
      , HS: ui.hs.spinner('value')
      , WC: ui.wc.spinner('value') / 100 /* to fraction */
      , CC: ui.cc.spinner('value') / 100 /* to fraction */
      , noGroups: ui.noGroups.spinner('value')
      , evalSys: $('#eval-sys option:selected').val()
      , dualBreed: $('#dual-check').prop('checked')
      , feedIDs: feedIDs
      , max_concentrates: 0.40
      , RNB: { 
            lb: parseFloat($('#rnb-lb option:selected').val())
          , ub: parseFloat($('#rnb-ub option:selected').val()) 
        }
      , fixed_FV_c: true
    };

  }


function feedEvaluation() {

  var feeds = feed.feeds;

  for (var i = 0, is = feeds.length; i < is; i++) {

    var f = feeds[i];

    /* DE */
    var de = {};
    de.GE = feed.evaluation.de.GE(f.CP, f.EE, f.CF, f.OM);
    de.ME = feed.evaluation.de.ME(f.CP, f.EE, f.EED, f.CF, f.CFD, f.OM, f.OMD);
    de.E = feed.evaluation.de.E_f(de.ME, de.GE);    
    de.P = feed.evaluation.de.uCP(de.ME, f.CP);
    de.RNB = feed.evaluation.de.RNB(f.CP, de.P);

    /* FI */
    var fi = {};
    if (f.type === 'concentrate')
      fi.E = feed.evaluation.fi.E_c(f.CP, f.CPD, f.CF, f.CFD, f.EE, f.EED, f.NFE, f.NFED);
    else
      fi.E = feed.evaluation.fi.E_f(f.OMD, f.OM, f.type);

    /* GB */
    var gb = {};
    if (f.type === 'concentrate')
      gb.E = feed.evaluation.gb.E_c(f.OM, f.OMD, false);
    else
      gb.E = feed.evaluation.gb.E_f(f.OM, f.OMD, f.type === 'fresh' || f.type === 'hay');

    /* FR */
    var fr = {};
    if (f.type === 'concentrate') {
      fr.E = feed.evaluation.fr.E_c(f.OMD, f.OM, f.CP, f.EE, f.CF, f.NDF, f.ash, f.delta_C1, 1, 1);
      fr.QIL = undefined;
      fr.FV = undefined; /* concentrate fill value is property of cow */
    } else { 
      /* TODO: add feed level adjustment -> recalculate when feed level parameters (req_m, req_t) are available */ 
      fr.E = feed.evaluation.fr.E_f(f.OMD, f.OM, f.CP, f.CF, f.type, f.DM / 10, f.delta_FR1_QIL, null, true, 1, 1); 
      fr.QIL = feed.evaluation.fr.QIL(f.OMD, f.CP, f.DM, f.type, f.delta_FR1_QIL, f.delta_S1, f.delta_H1_QIL, f.delta_S2_QIL, f.delta_H2_QIL);
      fr.FV = dairy.intake.FV_f(fr.QIL);
    }

    f.de = de;
    f.fi = fi;
    f.gb = gb;
    f.fr = fr;

  }

}

  function calcCowProperties(settings) {

    //console.log('calcCowProperties');

    var MBW = settings.BW
      , CI = settings.CI
      , DP = settings.DP
      , fat = settings.fat
      , protein = settings.protein
      , evalSys = settings.evalSys
      , AC = settings.AC
      , WC = settings.WC
      , WB = dairy.body.weightAtBirth(MBW)
      , type = settings.dualBreed ? 'dual' : 'milk'
      , f = settings.CC === 0 ? 1 : 0.5
      ;

    // console.log(settings);


    for (var c = 0, cs = herd.cows.length; c < cs; c++) {
      
      var cow = herd.cows[c];
      cow.req = {
          de: {}
        , fi: {}
        , gb: {}
        , fr: {}
      };

      cow.d_mx = dairy.milk.d_mx(woodParams[1], woodParams[2], cow.P);
      cow.BW = dairy.body.BW(cow.DPP, cow.d_mx, cow.AGE_days, CI, MBW, AC, WB, WC, type);
      cow.BWC = dairy.body.BWC(cow.DPP, cow.d_mx, cow.AGE_days, CI, MBW, AC, WB, WC, type);
      cow.BCS = dairy.body.BCS(cow.DPP, CI, DP * 7, cow.P, cow.d_mx);
      cow.BW_c = dairy.body.BW_c(cow.DPP, cow.AGE_days, MBW, AC, WB, WC);

      /* independ of eval. system */
      cow.PLPOT = dairy.milk.milk(woodParams[0], woodParams[1], woodParams[2], cow.DPP / 7, cow.P, cow.BW_c, MBW);
      cow.milk = cow.isDry ? 0 : cow.PLPOT;
      var fat_a = dairy.milk.fat_a(fat, cow.P, cow.d_mx / 7);     
      var protein_a = dairy.milk.protein_a(protein, cow.P, cow.d_mx / 7);      
      cow.fat = cow.isDry ? 0 : dairy.milk.fat(fat_a, cow.DIM / 7, cow.P, cow.d_mx / 7); 
      cow.protein = cow.isDry ? 0 : dairy.milk.protein(protein_a, cow.DIM / 7, cow.P, cow.d_mx / 7);
      cow.milk305 = dairy.milk.milk_305(woodParams[0], woodParams[1], woodParams[2], cow.P, cow.BW_c, MBW); 

      // console.log('wrong_fat: ' + fat + '; avg: ' + dairy.milk.fat_avg_305(fat, cow.P, cow.d_mx / 7));
      // console.log('new_fat: ' + fat + '; avg: ' + dairy.milk.fat_avg_305(fat_a, cow.P, cow.d_mx / 7));
      // console.log('fat_a: ' + fat_a);
      // console.log('protein: ' + protein + '; avg: ' + dairy.milk.protein_avg_305(protein_a, cow.P, cow.d_mx / 7));    

      cow.IC = dairy.intake.IC(cow.BW, cow.milk, cow.BCS, cow.DIM / 7, cow.DG / 7, cow.AGE_days / DAYS_IN_MONTH, cow.P);

      cow.req.fi = {
          main: dairy.requirements.fi.main(cow.BW, cow.IC, f, cow.P)
        , prod: cow.isDry ? ({ E: 0, P: 0 }) : (dairy.requirements.fi.prod(cow.milk, cow.fat, cow.protein, cow.P))
        , gest: dairy.requirements.fi.gest(cow.DG / 7, cow.P)
        , weit: dairy.requirements.fi.weit(cow.BWC, cow.P)
        , total: { E: 0, P: 0 }
      }

      cow.req.fi.total.E = cow.req.fi.main.E + cow.req.fi.prod.E + cow.req.fi.gest.E + cow.req.fi.weit.E;
      cow.req.fi.total.P = cow.req.fi.main.P + cow.req.fi.prod.P + cow.req.fi.gest.P + cow.req.fi.weit.P;

      /* just an initial guess TODO: remove feed level adjustment */
      var ME_total = 195;

      cow.req.gb = {
          main: dairy.requirements.gb.main(cow.BW, cow.IC, ME_total, f, null, null, cow.BWC, cow.P)
        , prod: cow.isDry ? ({ E: 0, P: 0 }) : (dairy.requirements.gb.prod(cow.milk, cow.fat, cow.protein, cow.P))
        , gest: dairy.requirements.gb.gest(cow.DG / 7, MBW, cow.P)
        , weit: dairy.requirements.gb.weit(cow.BWC, cow.P)
        , total: { E: 0, P: 0 }
      }

      cow.req.gb.total.E = cow.req.gb.main.E + cow.req.gb.prod.E + cow.req.gb.gest.E + cow.req.gb.weit.E;
      cow.req.gb.total.P = cow.req.gb.main.P + cow.req.gb.prod.P + cow.req.gb.gest.P + cow.req.gb.weit.P;

      /* recalculate with cow.req.total.E as ME_total */
      cow.req.gb.main = dairy.requirements.gb.main(cow.BW, cow.IC, cow.req.gb.total.E, f, null, null, cow.BWC, cow.P);
      cow.req.gb.total.E = cow.req.gb.main.E + cow.req.gb.prod.E + cow.req.gb.gest.E + cow.req.gb.weit.E;
      cow.req.gb.total.P = cow.req.gb.main.P + cow.req.gb.prod.P + cow.req.gb.gest.P + cow.req.gb.weit.P;

      cow.req.fr = {
          main: dairy.requirements.fr.main(cow.BW, cow.IC, f, cow.P)
        , prod: cow.isDry ? ({ E: 0, P: 0 }) : (dairy.requirements.fr.prod(cow.milk, cow.fat, cow.protein, cow.P))
        , gest: dairy.requirements.fr.gest(cow.DG / 7, WB, cow.P)
        , weit: dairy.requirements.fr.weit(cow.BWC, cow.DPP / 7, cow.P)
        , total: { E: 0, P: 0 }
      }

      cow.req.fr.total.E = cow.req.fr.main.E + cow.req.fr.prod.E + cow.req.fr.gest.E + cow.req.fr.weit.E;
      cow.req.fr.total.P = cow.req.fr.main.P + cow.req.fr.prod.P + cow.req.fr.gest.P + cow.req.fr.weit.P;

      cow.req.de = {
          main: dairy.requirements.de.main(cow.BW, cow.IC, f, cow.P)
        , prod: cow.isDry ? ({ E: 0, P: 0 }) : (dairy.requirements.de.prod(cow.milk, cow.fat, cow.protein, cow.P))
        , gest: dairy.requirements.de.gest(cow.DG / 7, cow.DIM, cow.P)
        , weit: dairy.requirements.de.weit(cow.BWC, cow.BW, cow.P)
        , total: { E: 0, P: 0 }
      }

      cow.req.de.total.E = cow.req.de.main.E + cow.req.de.prod.E + cow.req.de.gest.E + cow.req.de.weit.E;
      cow.req.de.total.P = cow.req.de.main.P + cow.req.de.prod.P + cow.req.de.gest.P + cow.req.de.weit.P;

      cow.FV_c = dairy.intake.FV_cs_diet(cow.req.fr.total.E, cow.IC, settings.CC, cow.PLPOT, cow.P, cow.BWC);

    }

  }


  function run() {

    ui.spinner.spin($('.bx-viewport')[0]);
    $('#download').hide();

    var settings = readSettings();
    // console.log(settings);
    woodParams = [];
    herd = null;
    diets = [];
    violation = [];
    lacdata = { t: [], y: [] };

    /* parse lactation data */
    var lines = settings.lacdata.trim().split('\n')
      , sep = (lines[0].indexOf(';') > 0) ? ';' : '\t'
      ;
    for (var l = 0, ls = lines.length; l < ls; l++) {
      var line = lines[l].split(sep);
      lacdata.t[l] = parseFloat(line[0]);
      lacdata.y[l] = parseFloat(line[1]);
    }

    /* chained workers: lmfit -> ration */
    lmfitWorker.onmessage = function (evt) {

        console.log(evt.data);

      if (typeof evt.data === 'string') {

        // console.log(evt.data);
      
      } else if (typeof evt.data === 'object') {

        woodParams = evt.data;

        herd = dairy.herd.get({    
            ageFirstCalving: settings.AC
          , femaleCalfRate: settings.FC
          , stillBirthRate: settings.SB
          , youngStockCullRate: settings.YC
          , replacementRate: settings.RR
          , calvingInterval: settings.CI
          , herdSize: settings.HS
          , dryPeriode: settings.DP
        });

        // console.log(herd);

        calcCowProperties(settings);

        /* we group only non-dry */
        var nonDryCows = [];
        for (var c = 0, cs = herd.cows.length; c < cs; c++) {
          var cow = herd.cows[c];
          cow.E_density = cow.req[settings.evalSys].total.E / cow.IC;  
          cow.P_density = cow.req.de.total.P / cow.IC;
          if (!cow.isDry)
            nonDryCows.push(cow);
        }

        var groupOptions = {
            k: settings.noGroups
          , runs: 15
          , normalize: true
          , xAttribute: 'E_density'
          , yAttribute: 'P_density'
        };

        var sum = dairy.group.get(nonDryCows, groupOptions);
        // console.log('group dif sum: ' + sum);

        var dietOptions =  {
            RNB_ub: settings.RNB.ub
          , RNB_lb: settings.RNB.lb
          , conc_mx: settings.CC
          , eval_sys: settings.evalSys
          , cb: afterDiet
        };

        var selectedFeeds = feed.feeds.filter(function (a) { return settings.feedIDs.indexOf(a.id) > -1; } );

        // console.log(dietOptions);
        // console.log(selectedFeeds);

        /* calc diet for average cow per group */
        for (var k = 0; k < settings.noGroups; k++) {

          var avgCow = herd.cows.reduce(function (a, b, i, ar) {

            var length = ar.filter(function(a) { return a.k === k; }).length;

            if (b.k === k) {
              a.IC += b.IC / length;
              a.FV_c += b.FV_c / length;
              a.req.fi.total.E += b.req.fi.total.E / length;
              a.req.de.total.E += b.req.de.total.E / length;
              a.req.de.total.P += b.req.de.total.P / length;
              a.req.gb.total.E += b.req.gb.total.E / length;
              a.req.fr.total.E += b.req.fr.total.E / length;
            }

            return a;

          }, { IC: 0, FV_c: 0, req: { fi: { total: { E: 0 } }, de: { total: { E: 0, P: 0} }, gb: { total: { E: 0 } }, fr: { total: { E: 0 }} }});

          // console.log(avgCow);
          dairy.diet.get(avgCow, selectedFeeds, dietOptions);

        }

      }

    }

    lmfitWorker.postMessage({    
        f: {}
      , n: 3 
      , par: [17.0, 0.149, -0.034] /* lmfits needs an initial guess */
      , m: lacdata.t.length
      , t: lacdata.t
      , y: lacdata.y
    });

  }

  var afterDiet = function (result) {

    // console.log(result);
    var diet = [];

    var vars = result.result.vars;

    violation.push({E: { s: vars.sE , d: vars.dE }, P: { s: vars.sP , d: vars.dP }});

    for (var prop in vars) {
      if (vars.hasOwnProperty(prop)) {
        if (prop.indexOf('F_') === 0) { /* is feed var */
          diet.push([Number(prop.split('_')[1]), vars[prop]]);
        }       
      }
    }
    diets.push(diet);

    if (diets.length === ui.noGroups.spinner('value')) {
      draw();
      createResults();
      ui.spinner.stop();
    }

  };

  function draw() {

    var settings = readSettings();

    drawLac(settings);
    drawHerd(settings);
    drawGroup(settings);
    drawDiets();
    drawViolation();

    var noGroups =  settings.noGroups;

    var data = {
        fat: [
            { label: 'parity 1', data: [], points: { show: true }, lines: { show: true } }
          , { label: 'parity 2', data: [], points: { show: true }, lines: { show: true } }
          , { label: 'parity >2', data: [], points: { show: true }, lines: { show: true } }
        ]
      , protein: [
            { label: 'parity 1', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity 2', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity >2', data: [], points: { show: true }, lines: { show: true }  }
        ]
      , IC: [
            { label: 'parity 1', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity 2', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity >2', data: [], points: { show: true }, lines: { show: true }  }
        ]
      , BW: [
            { label: 'parity 1', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity 2', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity >2', data: [], points: { show: true }, lines: { show: true }  }
        ]
      , BWC: [
            { label: 'parity 1', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity 2', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity >2', data: [], points: { show: true }, lines: { show: true }  }
        ]
      , reqE: [
            { label: 'parity 1', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity 2', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity >2', data: [], points: { show: true }, lines: { show: true }  }
        ]
      , reqP: [
            { label: 'parity 1', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity 2', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity >2', data: [], points: { show: true }, lines: { show: true }  }
        ]
      , groupVsAge: [
            { label: 'parity 1', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity 2', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'parity >2', data: [], points: { show: true }, lines: { show: true }  }
          , { label: 'dry group', data: [], points: { show: true }, lines: { show: true }  }
        ]
    };

    for (var c = 0, cs = herd.cows.length; c < cs; c++) {
      var cow =  herd.cows[c];
      data.fat[(cow.P > 2) ? 2 : cow.P - 1].data[c] = [cow.DPP, cow.fat];
      data.protein[(cow.P > 2) ? 2 : cow.P - 1].data[c] = [cow.DPP, cow.protein];
      data.IC[(cow.P > 2) ? 2 : cow.P - 1].data[c] = [cow.DPP, cow.IC];
      data.BW[(cow.P > 2) ? 2 : cow.P - 1].data[c] = [cow.DPP, cow.BW];
      data.BWC[(cow.P > 2) ? 2 : cow.P - 1].data[c] = [cow.DPP, cow.BWC];
      data.reqE[(cow.P > 2) ? 2 : cow.P - 1].data[c] = [cow.DPP, cow.req[settings.evalSys].total.E];
      data.reqP[(cow.P > 2) ? 2 : cow.P - 1].data[c] = [cow.DPP, cow.req[settings.evalSys].total.P];
      if (cow.isDry)
        data.groupVsAge[3].data.push([cow.AGE_days, noGroups + 1]);
      else
        data.groupVsAge[(cow.P > 2) ? 2 : cow.P - 1].data.push([cow.AGE_days, cow.k + 1]);
    }

    //console.log(data);

    $.plot($('#fat-plot'), data.fat, { colors: colors, grid: { borderWidth: 0 } } ); 
    $.plot($('#protein-plot'), data.protein, { colors: colors, grid: { borderWidth: 0 } } ); 
    $.plot($('#ic-plot'), data.IC, { colors: colors, grid: { borderWidth: 0 } } ); 
    $.plot($('#bw-plot'), data.BW, { colors: colors, grid: { borderWidth: 0 } } ); 
    $.plot($('#bwc-plot'), data.BWC, { colors: colors, grid: { borderWidth: 0 } } ); 
    $.plot($('#reqe-plot'), data.reqE, { 
      colors: colors, 
      grid: { borderWidth: 0 },
      yaxis: {
        tickFormatter: function(v, axis) {
          return  v + ' ' + E_unit;
        }
      }
    }); 
    $.plot($('#reqp-plot'), data.reqP, { 
      colors: colors, 
      grid: { borderWidth: 0 },
      yaxis: {
        tickFormatter: function(v, axis) {
          return  v + ' ' + P_unit;
        }
      }
    }); 
    $.plot($('#gr-vs-age-plot'), data.groupVsAge, {
      yaxis: {
        ticks: noGroups
      },
      colors: colors, 
      grid: {
        borderWidth: 0
      }
    }); 

  }

  function drawLac(settings) {

    var data = [{ label: 'Milk yield data', data: [], points: { show: true } }];
    for (var i = 0, is = lacdata.t.length; i < is; i++)
      data[0].data[i] = [lacdata.t[i] * 7, lacdata.y[i]];

    if (woodParams.length > 0) {
      data[1] = { label: 'Fitted lactation curve', data: [], lines: { show: true } };
      for (var t = 1, ts = Math.round(settings.CI * DAYS_IN_MONTH); t < ts; t++)
        data[1].data[t] = [t, wood(t / 7, woodParams)];
    }

    var options = {
      grid: {
        borderWidth: 0
      },
      colors: colors
    };

    $.plot($('#milk-plot'), data, options);    

  }

  function drawHerd(settings) {

    if (woodParams.length != 3)
      return;

    var data = [
        { label: 'parity 1', data: [], points: { show: true, radius: 3, symbol: 'circle' }, lines: { show: true }  }
      , { label: 'parity 2', data: [], points: { show: true, radius: 3, symbol: 'circle'  }, lines: { show: true }  }
      , { label: 'parity >2', data: [], points: { show: true, radius: 3, symbol: 'circle'  }, lines: { show: true }  }
    ];
   
    for (var c = 0, cs = herd.cows.length; c < cs; c++) {
      var cow = herd.cows[c];
      data[(cow.P > 2) ? 2 : cow.P - 1].data.push([cow.DPP, cow.milk]);
      data[(cow.P > 2) ? 2 : cow.P - 1].data.push([cow.DPP, cow.milk]);
    }

    //console.log(data);
    var options = {
      grid: {
        borderWidth: 0
      },
      colors: colors
    };

    //console.log(herd.cowsPerLac);

    $.plot($('#herd-plot'), data, options);
    $.plot($('#parity-plot'), [[
        ['parity 1', Math.round(herd.cowsPerLac[0] / settings.HS * 100)], 
        ['parity 2', Math.round(herd.cowsPerLac[1] / settings.HS * 100)], 
        ['parity >2', Math.round(herd.cowsPerLac[2] / settings.HS * 100)],
        ['heifers bought, monthly', Math.round(herd.heifersBought / settings.HS * 100)],
        ['heifers sold, monthly', Math.round(herd.heifersSold / settings.HS * 100)]
      ]], 
      {
        series: {
          bars: {
            show: true,
            barWidth: 0.6,
            align: "center"
          }
        },
        xaxis: {
          mode: "categories",
          tickLength: 0
        },
        colors: colors,
        grid: {
          borderWidth: 0
        }
      }
    );  

  }

  function drawGroup(settings) {

    var data = [];
    for (var g = 0, gs = settings.noGroups; g < gs; g++)
      data[g] = { label: 'Cows in group ' + (g + 1), data: [], points: { show: true } };

    for (var c = 0, cs = herd.cows.length; c < cs; c++) {
      var cow = herd.cows[c];
      if (!cow.isDry)
        data[cow.k].data.push([cow.x, cow.y]);
    }

    var options = {
      xaxis: {
        ticks: 5,
        tickFormatter: function (v) {
          return v.toFixed(1);
        }
      },
      yaxis: {
        tickFormatter: function (v) {
          return v.toFixed(1);
        }
      },
      grid: {
        borderWidth: 0
      },
      colors: colors
    };

    $.plot($('#group-plot'), data, options);    

  }

  function drawDiets() {

    var data = [];

    diets[0].forEach(function (feed, i) {
        if (!data[i])
          data[i] = [];
      diets.forEach(function (diet, j) {
        data[i][j] = [j, diet[i][1]];
      });
    });

    $.plot($('#diet-plot'), data,
      {
        series: {
          stack: 0,
          bars: {
            show: true,
            barWidth: 0.6
          }
        },
        xaxis: {
          mode: "categories",
          tickLength: 0
        },
        grid: { hoverable: true },
      }
    ); 

    $("#diet-plot").unbind("plothover");

    $("#diet-plot").bind("plothover", function (event, pos, item) {

      if (item) {

        $("#tooltip").html(feed.feeds.filter(function (e) { return e.id === diets[0][item.seriesIndex][0]; } )[0].name)
          .css({top: item.pageY+5, left: item.pageX+5})
          .fadeIn(200)
      } else {
        $("#tooltip").hide();
      }

    }); 

  }


  function drawViolation() {

    var data = [
        { label: 'energy', data: [], bars: { show: true, barWidth: 0.6 }  }
      , { label: 'protein', data: [], bars: { show: true, barWidth: 0.6 }  }
    ];

    violation.forEach(function (group, i) {

      data[0].data.push([i, (group.E.s === 0 ? -group.E.d : group.E.s) * 100]);
      data[1].data.push([i, (group.P.s === 0 ? -group.P.d : group.P.s) * 100]);

    });

    var options = {
      grid: {
        borderWidth: 0
      },
      colors: colors,
      xaxis: {
        mode: "categories",
        tickLength: 0
      }
    };

    $.plot($('#violation-plot'), data, options);  

  }

  function createResults() {

    var settings = readSettings();

    results = [];

    herd.cows.sort(function (a, b) {
      return a.AGE_days - b.AGE_days;
    });

    for (var c = 0, cs = herd.cows.length; c < cs; c++) {
      var cow = herd.cows[c];
      var row = [];
      results[c] = row;
      row[index.indexOf('age')] = cow.AGE;
      row[index.indexOf('age_days')] = cow.AGE_days;
      row[index.indexOf('parity')] = cow.P;
      row[index.indexOf('dpp')] = cow.DPP;
      row[index.indexOf('milk')] = cow.milk;
      row[index.indexOf('fat')] = cow.fat;
      row[index.indexOf('protein')] = cow.protein;
      row[index.indexOf('ic')] = cow.IC;
      row[index.indexOf('bw')] = cow.BW;
      row[index.indexOf('bwc')] = cow.BWC;
      row[index.indexOf('E')] = cow.req[settings.evalSys].total.E;
      row[index.indexOf('P')] = cow.req[settings.evalSys].total.P;
      row[index.indexOf('group')] = cow.isDry ? settings.noGroups : cow.k;
      row[index.indexOf('dry')] = cow.isDry;
    }

    $('#download').show();

  };


  $('#download').click(function (event) {
    var csv = '';
      csv += header.join(';') + '\n';
    for (var r = 0, rs = results.length; r < rs; r++) {
      csv += results[r].join(';') + '\n';
    }

    window.location.href = 'data:text/csv;base64,' + btoa(csv);

  });

  /* calculate system specific energy and protein values */
  feedEvaluation();
  /* initial run */
  run();

});
