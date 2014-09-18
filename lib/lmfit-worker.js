importScripts('lmfit.js');

onmessage = function (evt) {

    var data = evt.data;  
    data.f = function(t, p) {
      return p[0] * Math.pow(t, p[1]) * Math.exp(p[2] * t);
    };
    data.t = new Float64Array(data.t);
    data.y = new Float64Array(data.y);
    data.par = new Float64Array(data.par);

    //var ret = lmfit.fit(evt.data);

    postMessage(Module.fit(data).params);

};
