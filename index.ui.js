(function () {

  this.initUI = function (run_function) {

    this.ui = {
        spinner: new Spinner()
      , slider: $('#bxslider').bxSlider({
          slideWidth: 900,
          minSlides: 1,
          maxSlides: 1,
          slideMargin: 10,
          infiniteLoop: false,
          hideControlOnEnd: true
        })
      , fat: $('#fat-spinner').spinner({
          min: 3.0,
          max: 5.5,
          step: 0.1,
          start: 4.2,
          numberFormat: 'n'
        })
      , protein: $('#protein-spinner').spinner({
          min: 2.5,
          max: 5.0,
          step: 0.1,
          start: 3.4,
          numberFormat: 'n'
        })
      , bw: $('#bw-spinner').spinner({
          min: 550,
          max: 750,
          step: 10,
          start: 650,
          numberFormat: 'n'
        })
      , ci: $('#ci-spinner').spinner({
          min: 12,
          max: 15,
          step: 1,
          start: 13,
          numberFormat: 'n'
        })
      , ac: $('#ac-spinner').spinner({
          min: 24,
          max: 28,
          step: 1,
          start: 24,
          numberFormat: 'n'
        })
      , fc: $('#fc-spinner').spinner({
          min: 45,
          max: 50,
          step: 1,
          start: 47,
          numberFormat: 'n'
        })
      , sb: $('#sb-spinner').spinner({
          min: 5,
          max: 10,
          step: 1,
          start: 7,
          numberFormat: 'n'
        })
      , yc: $('#yc-spinner').spinner({
          min: 5,
          max: 20,
          step: 1,
          start: 7,
          numberFormat: 'n'
        })
      , rr: $('#rr-spinner').spinner({
          min: 20,
          max: 40,
          step: 1,
          start: 30,
          numberFormat: 'n'
        })
      , dp: $('#dp-spinner').spinner({
          min: 4,
          max: 10,
          step: 1,
          start: 8,
          numberFormat: 'n'
        })
      , hs: $('#hs-spinner').spinner({
          min: 30,
          max: 500,
          step: 10,
          start: 50,
          numberFormat: 'n'
        })
      , noGroups: $('#gr-spinner').spinner({
          min: 2,
          max: 5,
          step: 1,
          start: 5,
          numberFormat: 'n'
        })
      , p1: $('#p1-spinner').spinner({
          min: 75,
          max: 90,
          step: 5,
          start: 75,
          numberFormat: 'n'
        })
      , wc: $('#wc-spinner').spinner({
          min: 75,
          max: 90,
          step: 5,
          start: 85,
          numberFormat: 'n'
        })
      , cc: $('#cc-spinner').spinner({
          min: 0,
          max: 50,
          step: 5,
          start: 40,
          numberFormat: 'n'
        })
    };

    $('.section-link').click(function () {

      $('.section-link.active').removeClass('active');
      $(this).addClass('active');

      $('.section').each(function () {
        $(this).addClass('hidden');
      });

      $($(this).attr('href')).removeClass('hidden');

      /* result link clicked */
      if ($(this).attr('href') === '#section-3') {
        run_function();
      }

      return false;

    });

    $(document).tooltip();

    $('#lac-select').change(function () {

      var level = $('#lac-select option:selected').val();
      var csv = '';

      if (level == 0) {
csv = '1;17.3\n\
2;27.65\n\
3;28.14\n\
4;27.69\n\
5;30.35\n\
6;29\n\
7;28.07\n\
8;28.16\n\
9;27.2\n\
10;26.21\n\
11;26.03\n\
12;25.6\n\
13;25.49\n\
14;24.31\n\
15;24.31\n\
16;24.54\n\
17;24.29\n\
18;24.42\n\
19;24.24\n\
20;24.84\n\
21;23.43\n\
22;22.86\n\
23;22.1\n\
24;22.4\n\
25;21.49\n\
26;20.43\n\
27;19.7\n\
28;18.03\n\
29;18.49\n\
30;18.2\n\
31;15.84\n\
32;13.49\n\
33;12.67\n\
34;12.68\n\
35;13.45\n\
36;12.89\n\
37;13.4\n\
38;14.37\n\
39;13.7\n\
40;12.19\n\
41;11.13\n\
42;10.47';
      
      } else {

        var data = dairy.milk.data[level];
        for (var i = 0, is = data.length; i < is; i++)
          csv += Math.round(data[i][0] / 7) + ';' + data[i][1] + '\n';
      }
      
      $('textarea').val(csv);

    });    


    /* add feed check boxes */
    feed.feeds.sort(function (a, b) { 
      if (a.type < b.type)
         return -1;
      if (a.type > b.type)
        return 1;
      return 0;
    });
    for (var i = 0, is = feed.feeds.length; i < is; i++) {
      var f = feed.feeds[i];
      if (i > 0 && feed.feeds[i - 1].type != f.type)
        $('#feeds-p').append('<p><label style="font-weight: bold;">'+f.type+'</label></p>');
      else if (i === 0)
        $('#feeds-p').append('<p><label style="font-weight: bold;"">'+f.type+'</label></p>');

      var checked = '';
      if ([17, 29, 39, 58].indexOf(f.id) > -1)
        checked = 'checked';
      // var checked = 'checked';

      $('#feeds-p').append('<p style="display: inline; white-space: nowrap;"><input type="checkbox" id="feed_'+f.id+'" data-id="'+f.id+'" '+checked+'>');
      $('#feeds-p').append('<label style="display: inline;"" for="feed_'+f.id+'">'+f.name+'</label></p>');

    }

    $("<div id='tooltip'></div>").css({
      position: "absolute",
      display: "none",
      border: "1px solid #fdd",
      padding: "2px",
      "background-color": "#fee",
      opacity: 0.80
    }).appendTo("body");

  };

}(this));
