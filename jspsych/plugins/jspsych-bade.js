/*
Description: jsPsych plugin for a Bias Against Disconfirmatory Evidence (BADE) task
Preferably load p5.min.js in the main experiment page (otherwise it will be downloaded from cdnjs.cloudflare.com when the trial begins)

Author: Justin Sulik
Contact:
 justin.sulik@gmail.com
 twitter.com/justinsulik
 github.com/justinsulik
 justinsulik.com


 to do:
 allow decision option after each stage (cf. veckenstedt et al 2011)
*/


jsPsych.plugins["bade"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "bade",
    parameters: {
      scenarios: {
        type: jsPsych.plugins.parameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEYCODE, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: [],
        pretty_name: 'Scenario data',
        description: 'An array of scenario data to be presented one-by-one'
      },
      explanations: {
        type: jsPsych.plugins.parameterType.STRING,
        default: [],
        pretty_name: 'Explanations',
        description: 'An array of explanations to be rated by participants'
      },
      explanation_types: {
        type: jsPsych.plugins.parameterType.STRING,
        default: ['lure1', 'lure2', 'absurd', 'true'],
        pretty_name: 'Explanation types',
        description: 'An array of explanation types. Intended to allow these labels to be saved along with the other data, instead of at a later merge'
      },
      scale_type: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'slider',
        pretty_name: 'Rating type',
        description: 'How will participants provide their ratings? Default: slider. Alternatives: pie-chart, ranking'
      },
      force_norm: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: false,
        pretty_name: 'Force norming',
        description: 'If true, ratings must sum to the maximum on the scale (e.g. if a 1-10 scale, ratings across 4 explanations must sum to 10)'
      },
      scale_labels: {
        type: jsPsych.plugins.parameterType.STRING,
        default: [
          'extremely\nimprobable',
          '\nimprobable',
          'somewhat\nimprobable',
          'as probable\nas not',
          'somewhat\nprobable',
          '\nprobable',
          'extremely\nprobable'],
        pretty_name: 'Scale labels',
        description: 'How is the rating scale labelled? To increase the number of ticks without including extra labels, just use additional empty strings'
      },
      shuffle_explanations: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: true,
        pretty_name: 'Shuffle explanations',
        description: 'If true, shuffle the order of the given explanations, else display them in the order provided in trial.explanations'
      },
      rate_priors: {
        type: jsPsych.plugins.parameterType.BOOLEAN,
        default: true,
        pretty_name: 'Rate priors',
        description: 'If true, participants rate credibility of explanations before being given any scenario data. Note that this can get overridden by rating_type below'
      },
      rating_type: {
        type: jsPsych.plugins.parameterType.STRING,
        default: 'posterior',
        pretty_name: 'Type of rating',
        description: 'If "posterior", participants are asked to rate how likely the explanations are to be true, given the data'+
        'if "explain", participants are asked to rate how well the explanations explain the data'+
        'if "plausibility", they are asked to rate how plausible the explanations are'
      },
      trial_number: {
        type: jsPsych.plugins.parameterType.INT,
        default: 0,
        pretty_name: 'Trial number',
        description: 'Integer tracking which BADE scenario is being used'
      },
      character_name: {
        type: jsPsych.plugins.parameterType.STRING,
        default: undefined,
        pretty_name: 'Character name',
        description: "If defined, use the character's name in the rating instructions in order to be clear that the scenario presents more info about the same person"
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // check if p5 script is loaded
    if (window.p5){
        console.log('p5 already loaded...');
    } else {
      $.ajax({
          url: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.5.16/p5.min.js",
          dataType: "script",
          success: function() {
            console.log("p5 loaded...");
          }
      });
    }

/*
trial variables and functions
*/
    var trial_data = {
      trial_number: trial.trial_number,
      confidence: {},
      rts: {},
    };

    var canContinue = true;
    var originalOrder = [];
    var instructions;
    var currentSketch;

    var nameString = '';
    if( trial.character_name ){
      nameString = ' about ' + trial.character_name + ' ';
    }



    if( trial.rating_type == 'posterior'){
      instructions = {
        0: 'Read the sentences below. Click on the bars underneath each statement to rate <b>how likely</b> you think it is to be <b>true</b>, then click "Next"',
        1: 'You will shortly be shown information'+nameString+' in the box above, that will help you decide how probable the statements below are. Click "Next" for the first piece of information.',
        2: 'Given this new information'+nameString+' above, rate how <b>probable</b> the statements below are now, then click "Next"',
        3: 'Given this new information'+nameString+' above, rate how <b>probable</b> the statements below are now, then click "Next"',
      };
    } else if(trial.rating_type == 'explain' ){
      trial.rate_priors = false;
      instructions = {
        1: 'You will shortly be shown more information'+nameString+' in the box above. You will have to decide how well the statements below <b>explain</b> the scenario above. Click "Next" for the first piece of information.',
        2: 'Given this new information'+nameString+' above, rate how well the statements below <b>explain</b> the above scenario now, then click "Next"',
        3: 'Given this new information'+nameString+' above, rate how well the statements below <b>explain</b> the above scenario now, then click "Next"'
      };

    } else if(trial.rating_type == 'plausibility' ){
      instructions = {
        0: 'Read the sentences below. Click on the bars underneath each statement to rate how <b>plausible</b> you think it is, then click "Next"',
        1: 'You will shortly be shown more information'+nameString+' in the box above. You will have to use the scenario to decide how <b>plausible</b> the explanations below are. Click "Next" for the first piece of information.',
        2: 'Given this new information'+nameString+' above, rate how <b>plausible</b> you find the statements below now, then click "Next"',
        3: 'Given this new information'+nameString+' above, rate how <b>plausible</b> you find the statements below now, then click "Next"'
      };

    }


    function shuffle(unshuffled){
      // shuffle an array
      var shuffled = [];
      var N = unshuffled.length;
      for( var i = 0; i < N; i++ ){
        var index = Math.floor(Math.random() * (unshuffled.length));
        var newValue = unshuffled[index];
        shuffled.push(newValue);
        unshuffled.splice(index, 1);
      }
      return shuffled;
    }

/*
trial setup
*/

    // shuffle order of explanations

    trial.explanations.forEach(function(e,i){
      originalOrder.push(i);
    });
    var explanationOrder = shuffle(originalOrder);

    // set up basic html

    var html = '<style id="jspsych-BADE-css"></style>';
    html += '<div id="scenarioContainer" class="container"><div id="scenarioContent" class="top text content"></div></div>';
    html += '<div id="instructionsContainer" class="container"><div id="instructionsContent" class="top text"></div></div>';
    html += '<div id="buttonContainer" class="container"><div id="buttonContent" class="top "></div></div>';
    html += '<div id="explanationContainer" class="container"><div id="explanationContent" class="bottom content"></div></div>';

    display_element.innerHTML = html;

    // style that doesn't depend on content

    $('.container').css({
      'width': '800px',
    });
    $('.content').css({
      'display': 'flex',
      'flex-direction': 'column',
      'height': '100%',
      'width': '100%',
      'font-size': '14px',
      'font-weight': '200'
    });
    $('#instructionsContainer').css({
      'height': '70px',
      'line-height': '1.4',
      'margin-top': '10px',
    });
    $('#instructionsContent').css({
      'font-size': '17px',
    });
    $('#scenarioContainer').css({
      'height': '200px',
      'border': '1px solid white'
    });
    $('#scenarioContent').css({
      'font-size': '18px',

    });
    $('#explanationContainer').css('height', '350px');
    $('#buttonContainer').css({'height': '25px'});

    // style that depends on content

    var cssString = '.content.bottom > div {flex: 1 1 auto;}';
    cssString += '.invisible {display: none;}';
    cssString += '.explanation.flexbox > p {line-height: 50%;}';
    $('#jspsych-BADE-css').html(cssString);

    // add content

    trial.scenarios.forEach(function(e,i){
      $('#scenarioContent').append(
        '<p class="scenario text invisible" id="s'+i+'">'+e+'</p>'
      );
    });

    explanationOrder.forEach(function(e,i){
      var p = '<p class="explanation text e'+e+'">'+trial.explanations[e]+'</p>';
      var slider = '<div class="explanation slider" id="slider_e'+e+'"></div>';
      $('#explanationContent').append(
        '<div class="explanation flexbox" id="e'+e+'">'+p+slider+'</div>'
      );
    });

    $('#buttonContent').html('<button>Next</button>');

    $( '.explanation.flexbox' ).mouseenter( function(){
      if(trialStage != 1) {
        $( this ).css('background', '#EFF5FB');
        $( this ).attr('over', true);
      }
    }).mouseleave( function(){
      $( this ).css('background', 'white');
      $( this ).attr('over', false);
    });

    var trialStage;
    if( trial.rate_priors ){
      trialStage = 0;
    } else {
      $('#scenarioContainer').css('border', '1px solid #A9D0F5');
      trialStage = 1;
    }

    $('#instructionsContent').html(instructions[trialStage]);


/*
 p5 pseudo-classes
*/

    // A slider for giving a graded confidence estimate
    // Can be forced to constant sum [to do...]
    function Scrollbar(sketch, xPosition, yPosition, sliderWidth, sliderHeight, explNo, explOrder){

      this.sketch = sketch;
      this.explNo = explNo;
      this.explOrder = explOrder;
      this.overThumb = false;
      this.overTrack = false;
      this.thumbCreated = false;
      this.thumbColor = 70;
      this.thumbX = 0;
      this.background = 200;
      this.sliderWidth = sliderWidth;
      this.offset = sketch.offset;

      sketch.tickInterval = sliderWidth/(trial.scale_labels.length-1);

      this.display = function() {

        sketch.rectMode(sketch.RADIUS);

        // labels
        if( sketch.over ){
          this.label();
        }

        // track
        sketch.fill(this.background);
        sketch.stroke(200);
        sketch.rect(sketch.width*xPosition, sketch.height*yPosition, sliderWidth/2, sliderHeight/2);

        // thumb
        if( this.thumbCreated ){
          sketch.fill(this.thumbColor);
          sketch.stroke(40);
          sketch.rect(this.thumbX,sketch.height*yPosition, 5, 8, 3, 3, 3, 3);
        }

      };

      this.label = function() {
        trial.scale_labels.forEach(function(e,i){
          var tickX = sketch.offset+i*sketch.tickInterval;
          var tickY = sketch.height*yPosition-sliderHeight/2;
          sketch.stroke(110);
          sketch.line(tickX,tickY,tickX,tickY-5);
          sketch.textSize(10);
          sketch.fill(40);
          sketch.strokeWeight(0);
          sketch.textAlign(sketch.CENTER);
          sketch.text(e, tickX, tickY-22);
          sketch.strokeWeight(1);
        });
      };

      this.updateThumb = function() {
          this.thumbX = sketch.mouseX;
      };

      this.overTrack = function(){
        if( sketch.mouseX > sketch.offset & sketch.mouseX < sketch.offset+sliderWidth ){
          return true;
        } else {
          return false;
        }
      };

      this.move = function() {
        if( sketch.over & this.overTrack() ){
          this.updateThumb();

          if( !this.thumbCreated  & sketch.mouseY > 20 & sketch.mouseY < 60){
            this.thumbCreated = true;
          }
        }
      };

      this.drag = function() {
        if( sketch.over & this.overTrack() & currentSketch == this.explNo ){
          this.updateThumb();
        }
      };
    }

/*
Inputs
*/
    // add sliders

    var sliders = {};

    explanationOrder.forEach(function(e,i){
      let sliderObject = {
        id: e,
        order: i,
        sketch: new p5(function( sketch ) {
          // var slider;
          var canvas;
          var backgroundColor;

          sketch.setup = function(){
            backgroundColor = 'white';
            sketch.offset = 27; //allow space on either end of slider track
            sketch.trackwidth = 600;
            sketch.over = false;
            canvas = sketch.createCanvas(sketch.trackwidth+sketch.offset*2, 50);
            sketch.background(backgroundColor);
            sketch.id = e;
            sketch.slider = new Scrollbar(sketch, 0.5,0.7, sketch.trackwidth, 8, e, i);
          };

          sketch.draw = function(){

            sketch.focus();

            backgroundColor = function(){
              if(sketch.over & trialStage != 1){
                return sketch.color('#EFF5FB');
              }else{
                return sketch.color('white');
              }
            };

            sketch.background(backgroundColor());


            if(trialStage != 1){
              sketch.slider.display();
            }
          };

          sketch.focus = function() {
            var over = $('#e'+sketch.id).attr('over');
            if( over == 'true' ){
              sketch.over = true;
            } else {
              sketch.over = false;
            }
          };

          sketch.mouseDragged = function() {
                sketch.slider.drag();
          };

          sketch.mouseClicked = function() {
              sketch.slider.move();
          };

          sketch.mousePressed = function() {
              if(sketch.over){
                currentSketch = sketch.id;
              }
              sketch.slider.move();
          };

        }, 'slider_e'+e)
      };
      sliders[e] = sliderObject;
    });


    // record start time once sliders created

    var start_time = Date.now();
    var timeSinceClicked = Date.now();

    // add button

    $("#buttonContainer").on("click", "button", function(e){

      var canContinue = function(){
        if( trialStage == 1 ){
          return true;
        } else {
          var clicked = 0;
          for( var i = 0; i < trial.explanations.length; i++ ){
            if( sliders[i].sketch.slider.thumbCreated ){
              clicked+=1;
            }
          }
          if( clicked == trial.explanations.length ){
            return true;
          } else {
            return false;
          }
        }
      };

      var saveResponses = function(){
        var responseStage = Math.max(0,trialStage-1);
        var end_time = Date.now();
        var rt = end_time-start_time;
        trial_data.rts[responseStage] = rt;
        var responses = {};
        for( var i = 0; i < trial.explanations.length; i++ ){
          var slider = sliders[i].sketch.slider;
          var dataRating = ((slider.thumbX-slider.offset)/slider.sliderWidth).toFixed(2);
          var dataId =  sliders[i].sketch.id;
          var explanationType = trial.explanation_types[dataId];
          responses[explanationType] = dataRating;
        }
        trial_data.confidence[responseStage] = responses;
      };

      if( trialStage < trial.scenarios.length + 1 ){

        if( canContinue() ){
          $('#scenarioContainer').css('border', '1px solid #A9D0F5');
          if( trialStage != 1) {
            saveResponses();
          }
          $('#s'+(trialStage-1)).toggleClass("invisible");
          trialStage+=1;

          $('#instructionsContent').css("display", "none");
          $('#instructionsContent').html(instructions[Math.min(trialStage,3)]);
          $('#instructionsContent').fadeIn(150);
        } else {
          alert("Please rate the probability of each statement by clicking on the bars below the statement. You can drag to adjust. Check that you've rated all of them.");
        }


        // add data
      } else {
        // clear display
        saveResponses();

        console.log(trial_data);
        display_element.innerHTML = '';
        // end trial
        jsPsych.finishTrial(trial_data);
      }

    });



  };

  return plugin;
})();
